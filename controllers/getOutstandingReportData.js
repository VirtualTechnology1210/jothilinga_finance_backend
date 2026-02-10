const {
  member_details,
  proposed_loan_details,
  member_business_details,
  bank_details,
  receipts,
  emi_charts,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getOutstandingReportData = async (req, res) => {
  try {
    const { id, fromDate, toDate, includeMonthlyBreakdown } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });
    // Fetch data using Sequelize ORM for member_details and proposed_loan_details
    const loanDetails = await member_details.findAll({
      where: {
        loanType: "Business Loan",
        branchManagerStatus: "disbursed",
        loanStatus: { [Op.notIn]: ["foreclosed", "Foreclosed", "Foreclosure", "completed", "Completed"] }, // Exclude foreclosed and completed loans
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
      },
      include: [
        {
          model: member_business_details,
          as: "businessDetails", // Ensure this alias matches the association alias
        },
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails", // Ensure this alias matches the association alias
        },
        {
          model: receipts,
          as: "receiptsDetails", // Ensure this alias matches the association alias
        },
      ],
    });

    // Get additional data using raw SQL for manager_credentials and branch details
    const managerAndBranchData = await sequelize.query(
      `SELECT 
          mc.id as fieldManagerId, 
          mc.branchId, 
          mc.username,
          mc.employeeName,
          b.branchName, 
          b.branchCode, 
          d.divisionName,
          d.divisionCode,
          r.regionName,
          r.regionCode 
        FROM manager_credentials mc
        LEFT JOIN branch b ON mc.branchId = b.id
        LEFT JOIN division d ON b.divisionId = d.id
        LEFT JOIN region r ON d.regionId = r.id
        WHERE mc.id IN (:fieldManagerIds)`, // Use IN clause to fetch data for multiple fieldManagerIds
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          fieldManagerIds: loanDetails.map((ld) => ld.fieldManagerId),
        }, // Pass fieldManagerIds dynamically
      }
    );

    const loanIdsArray = loanDetails.map((loan) => loan.id);

    let emiChartMap = {};
    let receiptsMap = {};

    // Only fetch EMI charts if we have loan IDs
    if (loanIdsArray.length > 0) {
      console.log("Fetching EMI charts for loan IDs:", loanIdsArray);

      const emiChartsData = await emi_charts.findAll({
        where: {
          memberId: { [Op.in]: loanIdsArray },
        },
        attributes: [
          "memberId",
          [sequelize.cast(sequelize.col("emiChart"), "CHAR"), "emiChart"],
        ],
      });

      console.log("EMI charts fetched:", emiChartsData.length, "records");

      // Create a map: loanId -> parsed emiChart array
      emiChartsData.forEach((row) => {
        try {
          console.log(`Processing EMI chart for loan ${row.memberId}, type: ${typeof row.emiChart}`);
          const parsedEmiChart =
            typeof row.emiChart === "string"
              ? JSON.parse(row.emiChart)
              : row.emiChart;

          emiChartMap[row.memberId] = parsedEmiChart;
        } catch (error) {
          console.error(
            `Error parsing EMI chart for loan ${row.memberId}:`,
            error
          );
          emiChartMap[row.memberId] = [];
        }
      });

      // Fetch all receipts data with payment dates for proper sequencing
      const receiptsData = await receipts.findAll({
        where: {
          memberId: { [Op.in]: loanIdsArray },
          status: "Paid" // Only get paid receipts
        },
        attributes: [
          "memberId",
          "status",
          "createdAt",
          "receivedAmount"
        ],
        order: [["createdAt", "ASC"]] // Order by payment date
      });

      console.log("Receipts data fetched:", receiptsData.length, "records");

      // Group receipts by memberId and sort by payment date
      receiptsData.forEach((receipt) => {
        const memberId = receipt.memberId;
        if (!receiptsMap[memberId]) {
          receiptsMap[memberId] = [];
        }
        receiptsMap[memberId].push({
          status: receipt.status,
          paymentDate: receipt.createdAt,
          receivedAmount: receipt.receivedAmount || 0
        });
      });
    }

    // Helper function to calculate cumulative paid amounts using Waterfall method
    const calculateCumulativePaidAmounts = (memberId, emiChart, paidReceipts) => {
      let cumulativePrincipalPaid = 0;
      let cumulativeInterestPaid = 0;
      let totalPaidMonths = 0;
      const paidEmiDetails = [];

      // Calculate total cash collected
      let totalCashCollected = paidReceipts.reduce((sum, r) => sum + parseFloat(r.receivedAmount || 0), 0);

      // Distribute cash against EMI chart (Waterfall)
      if (emiChart && emiChart.length > 0) {
        let remainingCash = totalCashCollected;

        for (let i = 0; i < emiChart.length; i++) {
          const emiData = emiChart[i];
          const principalAmount = parseFloat(emiData.principalAmount || 0);
          const interestAmount = parseFloat(emiData.interestAmount || 0);
          const emiTotal = parseFloat(emiData.emiAmount || 0);

          // Determine how much of this EMI is covered by remainingCash
          let paidForThisEmi = 0;
          let paidInterestForThis = 0;
          let paidPrincipalForThis = 0;
          let isFullyPaid = false;

          if (remainingCash >= emiTotal) {
            // Fully paid
            paidForThisEmi = emiTotal;
            paidInterestForThis = interestAmount;
            paidPrincipalForThis = principalAmount;
            isFullyPaid = true;
            totalPaidMonths++; // Count as fully paid month
          } else if (remainingCash > 0) {
            // Partially paid
            paidForThisEmi = remainingCash;
            // Allocate to Interest first, then Principal
            paidInterestForThis = Math.min(paidForThisEmi, interestAmount);
            paidPrincipalForThis = Math.max(0, paidForThisEmi - paidInterestForThis);
            isFullyPaid = false;
          } else {
            // Not paid at all
            paidForThisEmi = 0;
            paidInterestForThis = 0;
            paidPrincipalForThis = 0;
            isFullyPaid = false;
          }

          cumulativePrincipalPaid += paidPrincipalForThis;
          cumulativeInterestPaid += paidInterestForThis;
          remainingCash -= paidForThisEmi;

          paidEmiDetails.push({
            emiMonth: i + 1,
            principalAmount: principalAmount,
            interestAmount: interestAmount,
            emiAmount: emiTotal,
            paidAmount: paidForThisEmi, // Actual amount paid for this EMI
            isFullyPaid: isFullyPaid,
            dueDate: emiData.emiDate || emiData.dueDate || emiData.date // Store due date for DPD check
          });

          // If we ran out of cash and this EMI wasn't fully paid, we can stop "marking fully paid",
          // but we continue loop to build the full paidEmiDetails structure for DPD check
        }
      }

      return {
        cumulativePrincipalPaid,
        cumulativeInterestPaid,
        totalPaidMonths,
        paidEmiDetails,
        totalCashCollected
      };
    };

    // Helper function to calculate outstanding amounts
    const calculateOutstandingAmounts = (loan, emiDetails, cumulativePayments) => {
      const totalPrincipalDisbursed = parseFloat(loan.sanctionedLoanAmountBySanctionCommittee || 0);
      const totalInterestForLoan = emiDetails.reduce((sum, emi) => sum + parseFloat(emi.interestAmount || 0), 0);

      const outstandingPrincipal = Math.max(0, totalPrincipalDisbursed - cumulativePayments.cumulativePrincipalPaid);
      const outstandingInterest = Math.max(0, totalInterestForLoan - cumulativePayments.cumulativeInterestPaid);

      return {
        totalPrincipalDisbursed,
        totalInterestForLoan,
        outstandingPrincipal,
        outstandingInterest,
        totalOutstanding: outstandingPrincipal + outstandingInterest,
        principalPaidPercentage: totalPrincipalDisbursed > 0 ? (cumulativePayments.cumulativePrincipalPaid / totalPrincipalDisbursed) * 100 : 0,
        interestPaidPercentage: totalInterestForLoan > 0 ? (cumulativePayments.cumulativeInterestPaid / totalInterestForLoan) * 100 : 0
      };
    };

    // Helper function to calculate DPD and overdue amounts based on Waterfall results
    const calculateDPDAndOverdue = (loan, paidEmiDetails) => {
      const currentDate = new Date();
      let overduePrincipal = 0;
      let overdueInterest = 0;
      let firstOverdueDate = null;
      let dpd = 0;
      let bucket = "-";
      let overdueEMIs = 0;

      if (!paidEmiDetails || paidEmiDetails.length === 0) {
        return { dpd: 0, bucket: "-", overduePrincipal: 0, overdueInterest: 0, totalOverdue: 0, firstOverdueDate: null, overdueEMIs: 0 };
      }

      // paidEmiDetails contains ALL EMIs from the chart, with their 'paidAmount' filled in via waterfall
      for (let i = 0; i < paidEmiDetails.length; i++) {
        const emiData = paidEmiDetails[i];
        let emiDueDate = emiData.dueDate ? new Date(emiData.dueDate) : null;

        if (!emiDueDate) continue;

        const isDue = emiDueDate <= currentDate;
        const isFullyPaid = emiData.isFullyPaid;
        const paidAmount = emiData.paidAmount;
        const requiredAmount = emiData.emiAmount;

        if (isDue && !isFullyPaid) {
          // It is due, and we haven't paid it fully
          const remainingForThisEmi = requiredAmount - paidAmount;

          // Estimate P/I split of the overdue amount (simplified: pro-rated or remainder)
          // For reporting, we can just say 'overdue amount', but if we need split:
          // We know how much Interest/Principal was paid. The rest is overdue.
          const interestPaid = Math.min(paidAmount, emiData.interestAmount);
          const principalPaid = Math.max(0, paidAmount - interestPaid);

          overdueInterest += (emiData.interestAmount - interestPaid);
          overduePrincipal += (emiData.principalAmount - principalPaid);

          overdueEMIs++;

          if (!firstOverdueDate) {
            firstOverdueDate = emiDueDate;
            dpd = Math.floor((currentDate - firstOverdueDate) / (1000 * 60 * 60 * 24));
          }
        }
      }

      if (overdueEMIs === 0) {
        dpd = 0;
        bucket = "-";
      } else {
        if (dpd <= 30) bucket = "0-30";
        else if (dpd <= 60) bucket = "31-60";
        else if (dpd <= 60) bucket = "61-90"; // Typo in original? Fixed logically here
        else if (dpd <= 90) bucket = "61-90"; // Correcting
        else if (dpd <= 180) bucket = "91-180";
        else bucket = "180+";
      }

      // Fix bucket ranges
      if (dpd === 0) bucket = "-";
      else if (dpd <= 30) bucket = "0-30";
      else if (dpd <= 60) bucket = "31-60";
      else if (dpd <= 90) bucket = "61-90";
      else if (dpd <= 180) bucket = "91-180";
      else bucket = "180+";

      return {
        dpd,
        bucket,
        overduePrincipal,
        overdueInterest,
        totalOverdue: overduePrincipal + overdueInterest,
        firstOverdueDate: firstOverdueDate ? firstOverdueDate.toLocaleDateString("en-GB") : null,
        overdueEMIs
      };
    };

    // Helper function to generate EMI dates within a range
    const generateEmiDatesInRange = (
      disbursementDate,
      emiDay,
      tenureInMonths,
      fromDate,
      toDate
    ) => {
      if (!disbursementDate || !emiDay || !tenureInMonths) return [];

      const disbursedDate = new Date(disbursementDate);
      const startDate = fromDate ? new Date(fromDate) : new Date();
      const endDate = toDate
        ? new Date(toDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const emiDates = [];
      let currentEmiDate = new Date(disbursedDate);
      currentEmiDate.setDate(emiDay);

      if (disbursedDate.getDate() > emiDay) {
        currentEmiDate.setMonth(currentEmiDate.getMonth() + 1);
      }

      for (let month = 0; month < tenureInMonths; month++) {
        const emiDate = new Date(currentEmiDate);
        emiDate.setMonth(currentEmiDate.getMonth() + month);

        if (emiDate >= startDate && emiDate <= endDate) {
          emiDates.push({ emiDate, emiMonth: month + 1 });
        }
      }

      return emiDates;
    };

    const loanCycleMap = {};
    const combinedData = [];

    // Deduplicate loanDetails based on loan id to prevent duplicate records
    const uniqueLoanDetails = Array.from(
      new Map(loanDetails.map((loan) => [loan.id, loan])).values()
    );

    uniqueLoanDetails.map((loan) => {
      const managerBranch = managerAndBranchData.find((mb) => mb.fieldManagerId === loan.fieldManagerId) || {};
      const customerId = loan.customerId;

      loanCycleMap[customerId] = (loanCycleMap[customerId] || 0) + 1;

      const emiDetails = emiChartMap[loan.id] || [];
      const paidReceipts = receiptsMap[loan.id] || [];

      // Calculate cumulative paid amounts (Waterfall)
      const cumulativePayments = calculateCumulativePaidAmounts(loan.id, emiDetails, paidReceipts);

      // Calculate outstanding amounts
      const outstandingAmounts = calculateOutstandingAmounts(loan, emiDetails, cumulativePayments);

      // Calculate DPD and overdue amounts using the detailed payment allocation
      const dpdAndOverdue = calculateDPDAndOverdue(loan, cumulativePayments.paidEmiDetails);

      const baseLoanData = {
        ...loan.toJSON(),
        branchName: managerBranch.branchName || null,
        branchCode: managerBranch.branchCode || null,
        divisionName: managerBranch.divisionName || null,
        divisionCode: managerBranch.divisionCode || null,
        regionName: managerBranch.regionName || null,
        regionCode: managerBranch.regionCode || null,
        username: managerBranch.username || null,
        employeeName: managerBranch.employeeName || null,
        employeeId: managerBranch.employeeId || null,
        loanCycle: loanCycleMap[customerId],
        emiDetails,
        agencyName: loan.proposedLoanDetails?.fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId?.agencyName || null,

        cumulativePrincipalPaid: cumulativePayments.cumulativePrincipalPaid,
        cumulativeInterestPaid: cumulativePayments.cumulativeInterestPaid,
        totalPaidMonths: cumulativePayments.totalPaidMonths,
        // paidEmiDetails: cumulativePayments.paidEmiDetails, // Optional: exclude to save bandwidth if not needed
        totalCumulativePaid: cumulativePayments.totalCashCollected,

        totalPrincipalDisbursed: outstandingAmounts.totalPrincipalDisbursed,
        totalInterestForLoan: outstandingAmounts.totalInterestForLoan,
        outstandingPrincipal: outstandingAmounts.outstandingPrincipal,
        outstandingInterest: outstandingAmounts.outstandingInterest,
        totalOutstanding: outstandingAmounts.totalOutstanding,

        principalPaidPercentage: Math.round(outstandingAmounts.principalPaidPercentage * 100) / 100,
        interestPaidPercentage: Math.round(outstandingAmounts.interestPaidPercentage * 100) / 100,

        loanCompletionPercentage: Math.round(
          ((cumulativePayments.cumulativePrincipalPaid + cumulativePayments.cumulativeInterestPaid) /
            (outstandingAmounts.totalPrincipalDisbursed + outstandingAmounts.totalInterestForLoan)) * 100 * 100
        ) / 100,

        dpd1: dpdAndOverdue.dpd,
        bucket1: dpdAndOverdue.bucket,
        overduePrincipal: dpdAndOverdue.overduePrincipal,
        overdueInterest: dpdAndOverdue.overdueInterest,
        totalOverdue: dpdAndOverdue.totalOverdue,
        firstOverdueDate: dpdAndOverdue.firstOverdueDate,
        overdueEMIs: dpdAndOverdue.overdueEMIs,

        loanStatus: dpdAndOverdue.dpd === 0 ? "Current" :
          dpdAndOverdue.dpd <= 30 ? "Early Delinquency" :
            dpdAndOverdue.dpd <= 90 ? "Delinquency" : "Default"
      };

      let summaryData = {};
      if (fromDate && toDate) {
        const emiDatesInRange = generateEmiDatesInRange(
          loan.branchManagerStatusUpdatedAt,
          loan.emiDateByBranchManager,
          loan.proposedLoanDetails?.tenureInMonths,
          fromDate,
          toDate
        );

        // Approximate last paid date from receipts
        let lastPaidDate = null;
        if (paidReceipts.length > 0) {
          const lastReceipt = paidReceipts.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
          lastPaidDate = lastReceipt.paymentDate;
        }

        summaryData = {
          lastPaidDate: lastPaidDate ? new Date(lastPaidDate).toLocaleDateString("en-GB") : null,
          emiDatesInRange: emiDatesInRange.length
        };
      }

      let totalEmiAmount = 0;
      if (emiDetails.length > 0) {
        // Just take the standard EMI amount from the first or any entry
        totalEmiAmount = parseFloat(emiDetails[0].emiAmount || 0);
      }

      const emiDataArray = totalEmiAmount > 0 ? [
        {
          emiAmount: totalEmiAmount,
          emiDate: null,
          outstandingBalance: outstandingAmounts.totalOutstanding,
          outstandingPrincipal: outstandingAmounts.outstandingPrincipal,
          outstandingInterest: outstandingAmounts.outstandingInterest,
          cumulativePrincipalPaid: cumulativePayments.cumulativePrincipalPaid,
          cumulativeInterestPaid: cumulativePayments.cumulativeInterestPaid,
          totalPaidMonths: cumulativePayments.totalPaidMonths
        }
      ] : [];

      combinedData.push({
        ...baseLoanData,
        ...summaryData,
        emiData: emiDataArray,
        emiMonthsPaid: cumulativePayments.totalPaidMonths,
        totalEmiAmount: totalEmiAmount,
        emiAmount: totalEmiAmount,
        outstandingBalance: outstandingAmounts.totalOutstanding,
        totalTenure: loan.proposedLoanDetails?.tenureInMonths || 0,
        remainingMonths: Math.max(0, (loan.proposedLoanDetails?.tenureInMonths || 0) - cumulativePayments.totalPaidMonths),
      });
    });

    res.status(200).json({
      success: true,
      data: combinedData,
      summary: {
        totalLoans: loanDetails.length,
        includeMonthlyBreakdown: includeMonthlyBreakdown === "true",
        dateRange: fromDate && toDate ? { fromDate, toDate } : null,
        totalRecords: combinedData.length,
        totalCumulativePrincipalPaid: combinedData.reduce((sum, loan) => sum + (loan.cumulativePrincipalPaid || 0), 0),
        totalCumulativeInterestPaid: combinedData.reduce((sum, loan) => sum + (loan.cumulativeInterestPaid || 0), 0),
        totalPaidEMIs: combinedData.reduce((sum, loan) => sum + (loan.totalPaidMonths || 0), 0),
        totalOutstandingPrincipal: combinedData.reduce((sum, loan) => sum + (loan.outstandingPrincipal || 0), 0),
        totalOutstandingInterest: combinedData.reduce((sum, loan) => sum + (loan.outstandingInterest || 0), 0),
        totalOutstandingAmount: combinedData.reduce((sum, loan) => sum + (loan.totalOutstanding || 0), 0),
        totalPrincipalDisbursed: combinedData.reduce((sum, loan) => sum + (loan.totalPrincipalDisbursed || 0), 0),
        totalInterestExpected: combinedData.reduce((sum, loan) => sum + (loan.totalInterestForLoan || 0), 0),
        averageLoanCompletion: combinedData.length > 0 ? Math.round((combinedData.reduce((sum, loan) => sum + (loan.loanCompletionPercentage || 0), 0) / combinedData.length) * 100) / 100 : 0,
        totalOverdueAmount: combinedData.reduce((sum, loan) => sum + (loan.totalOverdue || 0), 0),
        totalOverdueEMIs: combinedData.reduce((sum, loan) => sum + (loan.overdueEMIs || 0), 0),
        portfolioQuality: {
          current: combinedData.filter(loan => loan.dpd1 === 0).length,
          bucket_0_30: combinedData.filter(loan => loan.bucket1 === "0-30").length,
          bucket_31_60: combinedData.filter(loan => loan.bucket1 === "31-60").length,
          bucket_61_90: combinedData.filter(loan => loan.bucket1 === "61-90").length,
          bucket_91_180: combinedData.filter(loan => loan.bucket1 === "91-180").length,
          bucket_180_plus: combinedData.filter(loan => loan.bucket1 === "180+").length
        },
        averageDPD: combinedData.length > 0 ? Math.round((combinedData.reduce((sum, loan) => sum + (loan.dpd1 || 0), 0) / combinedData.length) * 100) / 100 : 0,
        parPercentage: combinedData.reduce((sum, loan) => sum + (loan.totalPrincipalDisbursed || 0), 0) > 0 ? Math.round((combinedData.reduce((sum, loan) => sum + (loan.totalOverdue || 0), 0) / combinedData.reduce((sum, loan) => sum + (loan.totalPrincipalDisbursed || 0), 0)) * 100 * 100) / 100 : 0
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
