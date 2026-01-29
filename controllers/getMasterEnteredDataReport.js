const {
  member_details,
  proposed_loan_details,
  member_business_details,
  bank_details,
  receipts,
  funding_agencies,
  emi_charts,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getMasterReportEnteredData = async (req, res) => {
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
        // branchManagerStatus: "disbursed",
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
      },
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails",
          include: [
            {
              model: funding_agencies,
              as: "fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId",
            },
          ],
        },
        {
          model: member_business_details,
          as: "businessDetails",
        },
        {
          model: bank_details,
          as: "bankDetails",
        },
        {
          model: receipts,
          as: "receiptsDetails",
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
          mc.employeeId,
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
        WHERE mc.id IN (:fieldManagerIds)`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          fieldManagerIds: loanDetails.map((ld) => ld.fieldManagerId),
        },
      }
    );

    console.log("Manager and Branch Data found:", managerAndBranchData.length);
    if (managerAndBranchData.length > 0) {
      console.log("First manager data sample:", managerAndBranchData[0]);
    }

    // Extract loan IDs from the fetched data
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
          console.log(
            `Successfully parsed EMI chart for loan ${row.memberId}, entries: ${parsedEmiChart.length}`
          );
        } catch (error) {
          console.error(
            `Error parsing EMI chart for loan ${row.memberId}:`,
            error
          );
          console.error(`Raw emiChart data:`, row.emiChart);
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
          "createdAt" // Use available fields only
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
          paymentDate: receipt.createdAt
        });
      });

      // Sort receipts by payment date for each member and log for debugging
      Object.keys(receiptsMap).forEach(memberId => {
        receiptsMap[memberId].sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
        console.log(`Member ${memberId} has ${receiptsMap[memberId].length} paid receipts`);
      });
    }

    // Helper function to calculate cumulative paid amounts
    const calculateCumulativePaidAmounts = (memberId, emiChart, paidReceipts, disbursementDate) => {
      let cumulativePrincipalPaid = 0;
      let cumulativeInterestPaid = 0;
      let totalPaidMonths = 0;

      if (!paidReceipts || paidReceipts.length === 0 || !emiChart || emiChart.length === 0) {
        return {
          cumulativePrincipalPaid: 0,
          cumulativeInterestPaid: 0,
          totalPaidMonths: 0,
          paidEmiDetails: []
        };
      }

      const paidEmiDetails = [];

      // Since we don't have emiMonth in receipts, we'll determine EMI months based on:
      // 1. Number of paid receipts = number of EMIs paid
      // 2. Payment dates to ensure sequential EMI payments
      
      totalPaidMonths = paidReceipts.length;

      // Calculate cumulative amounts based on paid EMIs (sequential from first EMI)
      for (let i = 0; i < totalPaidMonths && i < emiChart.length; i++) {
        const emiData = emiChart[i];
        const receipt = paidReceipts[i];
        
        const principalAmount = parseFloat(emiData.principalAmount || 0);
        const interestAmount = parseFloat(emiData.interestAmount || 0);
        
        cumulativePrincipalPaid += principalAmount;
        cumulativeInterestPaid += interestAmount;

        paidEmiDetails.push({
          emiMonth: i + 1,
          principalAmount: principalAmount,
          interestAmount: interestAmount,
          emiAmount: parseFloat(emiData.emiAmount || 0),
          paymentDate: receipt.paymentDate,
          cumulativePrincipal: cumulativePrincipalPaid,
          cumulativeInterest: cumulativeInterestPaid,
          outstandingBalance: parseFloat(emiData.outstandingBalance || 0)
        });
      }

      console.log(`Loan ${memberId} - Total Paid Months: ${totalPaidMonths}, Cumulative Principal: ${cumulativePrincipalPaid}, Cumulative Interest: ${cumulativeInterestPaid}`);

      return {
        cumulativePrincipalPaid,
        cumulativeInterestPaid,
        totalPaidMonths,
        paidEmiDetails
      };
    };

    // Helper function to calculate outstanding amounts
    const calculateOutstandingAmounts = (loan, emiDetails, cumulativePayments) => {
      // Get total principal disbursed (sanctioned amount)
      const totalPrincipalDisbursed = parseFloat(loan.sanctionedLoanAmountBySanctionCommittee || 0);
      
      // Calculate total interest for the entire loan tenure
      const totalInterestForLoan = emiDetails.reduce((sum, emi) => {
        return sum + parseFloat(emi.interestAmount || 0);
      }, 0);
      
      // Calculate remaining outstanding amounts
      const outstandingPrincipal = totalPrincipalDisbursed - cumulativePayments.cumulativePrincipalPaid;
      const outstandingInterest = totalInterestForLoan - cumulativePayments.cumulativeInterestPaid;
      
      // Ensure values don't go below zero
      const remainingPrincipal = Math.max(0, outstandingPrincipal);
      const remainingInterest = Math.max(0, outstandingInterest);
      
      return {
        totalPrincipalDisbursed,
        totalInterestForLoan,
        outstandingPrincipal: remainingPrincipal,
        outstandingInterest: remainingInterest,
        totalOutstanding: remainingPrincipal + remainingInterest,
        // Additional helpful calculations
        principalPaidPercentage: totalPrincipalDisbursed > 0 ? 
          (cumulativePayments.cumulativePrincipalPaid / totalPrincipalDisbursed) * 100 : 0,
        interestPaidPercentage: totalInterestForLoan > 0 ? 
          (cumulativePayments.cumulativeInterestPaid / totalInterestForLoan) * 100 : 0
      };
    };

    // Helper function to calculate DPD and overdue amounts
    const calculateDPDAndOverdue = (loan, emiDetails, cumulativePayments) => {
      const currentDate = new Date();
      let overduePrincipal = 0;
      let overdueInterest = 0;
      let firstOverdueDate = null;
      let dpd = 0;
      let bucket = "-";
      let overdueEMIs = 0;

      if (!emiDetails || emiDetails.length === 0) {
        return {
          dpd: 0,
          bucket: "-",
          overduePrincipal: 0,
          overdueInterest: 0,
          totalOverdue: 0,
          firstOverdueDate: null,
          overdueEMIs: 0
        };
      }

      console.log(`Calculating DPD for loan ${loan.id}:`);
      console.log(`Current Date: ${currentDate.toDateString()}`);
      console.log(`Total Paid Months: ${cumulativePayments.totalPaidMonths}`);
      console.log(`EMI Details Length: ${emiDetails.length}`);

      // Check each EMI using the actual EMI dates from emiChart
      for (let i = 0; i < emiDetails.length; i++) {
        const emiData = emiDetails[i];
        
        // Use the actual EMI date from the emiChart (should be stored in emiData)
        // The emiChart should contain the exact EMI due date for each month
        let emiDueDate = null;
        
        if (emiData.emiDate) {
          emiDueDate = new Date(emiData.emiDate);
        } else if (emiData.dueDate) {
          emiDueDate = new Date(emiData.dueDate);
        } else if (emiData.date) {
          emiDueDate = new Date(emiData.date);
        } else {
          // Fallback: if no date field found, skip this EMI or log warning
          console.warn(`No EMI date found for loan ${loan.id}, EMI index ${i}:`, emiData);
          continue;
        }

        console.log(`EMI ${i + 1}: Due Date = ${emiDueDate.toDateString()}`);
        
        // Check if this EMI is CURRENTLY due and CURRENTLY unpaid
        const isPaid = i < cumulativePayments.totalPaidMonths; // This EMI has been paid
        const isDue = emiDueDate <= currentDate; // This EMI due date has passed
        
        console.log(`EMI ${i + 1}: isPaid = ${isPaid}, isDue = ${isDue}`);
        
        // Only count EMIs that are due but NOT YET PAID
        if (isDue && !isPaid) {
          // This EMI is currently overdue (not paid yet)
          const principalAmount = parseFloat(emiData.principalAmount || 0);
          const interestAmount = parseFloat(emiData.interestAmount || 0);
          
          overduePrincipal += principalAmount;
          overdueInterest += interestAmount;
          overdueEMIs++;
          
          // Set first overdue date for DPD calculation
          if (!firstOverdueDate) {
            firstOverdueDate = new Date(emiDueDate);
            // Calculate days past due from the first CURRENTLY overdue EMI date
            dpd = Math.floor((currentDate - firstOverdueDate) / (1000 * 60 * 60 * 24));
            console.log(`First Overdue EMI: Due Date = ${firstOverdueDate.toDateString()}, DPD = ${dpd}`);
          }
        }
      }

      console.log(`Final DPD Result: ${dpd}, Overdue EMIs: ${overdueEMIs}`);

      // If all due EMIs are paid, DPD should be 0 (even if some were paid late in the past)
      if (overdueEMIs === 0) {
        dpd = 0;
        bucket = "-";
        firstOverdueDate = null;
      } else {
        // Determine bucket based on DPD
        if (dpd <= 30) bucket = "0-30";
        else if (dpd <= 60) bucket = "31-60";
        else if (dpd <= 90) bucket = "61-90";
        else if (dpd <= 180) bucket = "91-180";
        else bucket = "180+";
      }

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

      // Start from the first EMI date
      let currentEmiDate = new Date(disbursedDate);
      currentEmiDate.setDate(emiDay);

      // If disbursement date is after EMI day, move to next month
      if (disbursedDate.getDate() > emiDay) {
        currentEmiDate.setMonth(currentEmiDate.getMonth() + 1);
      }

      // Generate all EMI dates for the loan tenure
      for (let month = 0; month < tenureInMonths; month++) {
        const emiDate = new Date(currentEmiDate);
        emiDate.setMonth(currentEmiDate.getMonth() + month);

        // Only include dates within the selected range
        if (emiDate >= startDate && emiDate <= endDate) {
          emiDates.push({ emiDate, emiMonth: month + 1 });
        }
      }

      return emiDates;
    };

    // Prepare a map to track loan cycles per customerId
    const loanCycleMap = {};

    // Combine the Sequelize ORM data and raw SQL data, adding loan cycle information
    const combinedData = [];

    loanDetails.map((loan) => {
      // Find the corresponding manager and branch data based on fieldManagerId
      const managerBranch =
        managerAndBranchData.find(
          (mb) => mb.fieldManagerId === loan.fieldManagerId
        ) || {};

      const customerId = loan.customerId;
      if (!loanCycleMap[customerId]) {
        loanCycleMap[customerId] = 1;
      } else {
        loanCycleMap[customerId] += 1;
      }

      const emiDetails = emiChartMap[loan.id] || [];
      const paidReceipts = receiptsMap[loan.id] || [];

      // Calculate cumulative paid amounts
      const cumulativePayments = calculateCumulativePaidAmounts(
        loan.id, 
        emiDetails, 
        paidReceipts, 
        loan.branchManagerStatusUpdatedAt
      );

      // Calculate outstanding amounts
      const outstandingAmounts = calculateOutstandingAmounts(loan, emiDetails, cumulativePayments);

      // Calculate DPD and overdue amounts
      const dpdAndOverdue = calculateDPDAndOverdue(loan, emiDetails, cumulativePayments);

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
        agencyName:
          loan.proposedLoanDetails
            ?.fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId
            ?.agencyName || null,
        
        // Add cumulative payment information
        cumulativePrincipalPaid: cumulativePayments.cumulativePrincipalPaid,
        cumulativeInterestPaid: cumulativePayments.cumulativeInterestPaid,
        totalPaidMonths: cumulativePayments.totalPaidMonths,
        paidEmiDetails: cumulativePayments.paidEmiDetails,
        totalCumulativePaid: cumulativePayments.cumulativePrincipalPaid + cumulativePayments.cumulativeInterestPaid,
        
        // Add outstanding amounts
        totalPrincipalDisbursed: outstandingAmounts.totalPrincipalDisbursed,
        totalInterestForLoan: outstandingAmounts.totalInterestForLoan,
        outstandingPrincipal: outstandingAmounts.outstandingPrincipal,
        outstandingInterest: outstandingAmounts.outstandingInterest,
        totalOutstanding: outstandingAmounts.totalOutstanding,
        
        // Add percentage calculations for better insights
        principalPaidPercentage: Math.round(outstandingAmounts.principalPaidPercentage * 100) / 100,
        interestPaidPercentage: Math.round(outstandingAmounts.interestPaidPercentage * 100) / 100,
        
        // Loan completion percentage
        loanCompletionPercentage: Math.round(
          ((cumulativePayments.cumulativePrincipalPaid + cumulativePayments.cumulativeInterestPaid) / 
           (outstandingAmounts.totalPrincipalDisbursed + outstandingAmounts.totalInterestForLoan)) * 100 * 100
        ) / 100,

        // DPD and Overdue information
        dpd1: dpdAndOverdue.dpd,
        bucket1: dpdAndOverdue.bucket,
        overduePrincipal: dpdAndOverdue.overduePrincipal,
        overdueInterest: dpdAndOverdue.overdueInterest,
        totalOverdue: dpdAndOverdue.totalOverdue,
        firstOverdueDate: dpdAndOverdue.firstOverdueDate,
        overdueEMIs: dpdAndOverdue.overdueEMIs,
        
        // Loan status based on DPD
        loanStatus: dpdAndOverdue.dpd === 0 ? "Current" : 
                    dpdAndOverdue.dpd <= 30 ? "Early Delinquency" :
                    dpdAndOverdue.dpd <= 90 ? "Delinquency" : "Default"
      };

      // Always return single record per loan with summary data (no monthly breakdown rows)
      // Calculate additional summary data based on date range if provided
      let summaryData = {};
      
      if (fromDate && toDate) {
        // Calculate EMIs that fall within the date range
        const emiDatesInRange = generateEmiDatesInRange(
          loan.branchManagerStatusUpdatedAt,
          loan.emiDateByBranchManager,
          loan.proposedLoanDetails?.tenureInMonths,
          fromDate,
          toDate
        );

        // Get last paid date
        const lastPaidDate = cumulativePayments.paidEmiDetails.length > 0 
          ? cumulativePayments.paidEmiDetails[cumulativePayments.paidEmiDetails.length - 1].paymentDate
          : null;

        summaryData = {
          lastPaidDate: lastPaidDate ? new Date(lastPaidDate).toLocaleDateString("en-GB") : null,
          emiDatesInRange: emiDatesInRange.length
        };
      }

      // Default behavior - return single record with summary EMI data
      console.log(
        `Processing loan ${loan.id}: emiDetails length: ${emiDetails.length}, totalPaidMonths: ${cumulativePayments.totalPaidMonths}`
      );

      // Calculate total amounts for summary
      let totalEmiAmount = 0;

      if (emiDetails.length > 0) {
        const nextEmiIndex = Math.min(cumulativePayments.totalPaidMonths, emiDetails.length - 1);
        const currentEmiData = emiDetails[nextEmiIndex] || emiDetails[0];

        console.log(`Loan ${loan.id} EMI data:`, currentEmiData);

        totalEmiAmount = currentEmiData.emiAmount || 0;

        console.log(
          `Loan ${loan.id} calculated amounts - EMI: ${totalEmiAmount}, Outstanding: ${outstandingAmounts.totalOutstanding}`
        );
      } else {
        console.log(`No EMI details found for loan ${loan.id}`);
      }

      // Create emiData array with single EMI entry for frontend compatibility
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
        ...summaryData, // Include date range summary data if applicable
        emiData: emiDataArray,
        emiMonthsPaid: cumulativePayments.totalPaidMonths, // Fixed: Use totalPaidMonths instead of date
        totalEmiAmount: totalEmiAmount,
        emiAmount: totalEmiAmount,
        outstandingBalance: outstandingAmounts.totalOutstanding,
        // Add summary statistics
        totalTenure: loan.proposedLoanDetails?.tenureInMonths || 0,
        remainingMonths: Math.max(
          0,
          (loan.proposedLoanDetails?.tenureInMonths || 0) - cumulativePayments.totalPaidMonths
        ),
      });
    });

    // No need to sort by EMI date since we're returning one record per loan
    if (combinedData.length > 0) {
      console.log(
        "- First combined data sample:",
        JSON.stringify(combinedData[0], null, 2)
      );
    }

    res.status(200).json({
      success: true,
      data: combinedData,
      summary: {
        totalLoans: loanDetails.length,
        includeMonthlyBreakdown: includeMonthlyBreakdown === "true",
        dateRange: fromDate && toDate ? { fromDate, toDate } : null,
        totalRecords: combinedData.length,
        
        // Cumulative payments summary
        totalCumulativePrincipalPaid: combinedData.reduce((sum, loan) => sum + (loan.cumulativePrincipalPaid || 0), 0),
        totalCumulativeInterestPaid: combinedData.reduce((sum, loan) => sum + (loan.cumulativeInterestPaid || 0), 0),
        totalPaidEMIs: combinedData.reduce((sum, loan) => sum + (loan.totalPaidMonths || 0), 0),
        
        // Outstanding amounts summary
        totalOutstandingPrincipal: combinedData.reduce((sum, loan) => sum + (loan.outstandingPrincipal || 0), 0),
        totalOutstandingInterest: combinedData.reduce((sum, loan) => sum + (loan.outstandingInterest || 0), 0),
        totalOutstandingAmount: combinedData.reduce((sum, loan) => sum + (loan.totalOutstanding || 0), 0),
        
        // Portfolio summary
        totalPrincipalDisbursed: combinedData.reduce((sum, loan) => sum + (loan.totalPrincipalDisbursed || 0), 0),
        totalInterestExpected: combinedData.reduce((sum, loan) => sum + (loan.totalInterestForLoan || 0), 0),
        averageLoanCompletion: combinedData.length > 0 ? 
          Math.round((combinedData.reduce((sum, loan) => sum + (loan.loanCompletionPercentage || 0), 0) / combinedData.length) * 100) / 100 : 0,

        // DPD and Portfolio Quality summaries
        totalOverdueAmount: combinedData.reduce((sum, loan) => sum + (loan.totalOverdue || 0), 0),
        totalOverdueEMIs: combinedData.reduce((sum, loan) => sum + (loan.overdueEMIs || 0), 0),
        
        // Portfolio quality by buckets
        portfolioQuality: {
          current: combinedData.filter(loan => loan.dpd === 0).length,
          bucket_0_30: combinedData.filter(loan => loan.bucket === "0-30").length,
          bucket_31_60: combinedData.filter(loan => loan.bucket === "31-60").length,
          bucket_61_90: combinedData.filter(loan => loan.bucket === "61-90").length,
          bucket_91_180: combinedData.filter(loan => loan.bucket === "91-180").length,
          bucket_180_plus: combinedData.filter(loan => loan.bucket === "180+").length
        },
        
        // Average DPD across portfolio
        averageDPD: combinedData.length > 0 ? 
          Math.round((combinedData.reduce((sum, loan) => sum + (loan.dpd || 0), 0) / combinedData.length) * 100) / 100 : 0,
        
        // Portfolio at Risk (PAR) percentage
        parPercentage: combinedData.reduce((sum, loan) => sum + (loan.totalPrincipalDisbursed || 0), 0) > 0 ?
          Math.round((combinedData.reduce((sum, loan) => sum + (loan.totalOverdue || 0), 0) / 
                      combinedData.reduce((sum, loan) => sum + (loan.totalPrincipalDisbursed || 0), 0)) * 100 * 100) / 100 : 0
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