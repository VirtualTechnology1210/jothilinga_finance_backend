const {
  member_details,
  proposed_loan_details,
  receipts,
  member_business_details,
  emi_charts,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getDemandVsCollectionReportData = async (req, res) => {
  try {
    const { id, fromDate, toDate } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Both fromDate and toDate are required" });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({ error: "fromDate cannot be later than toDate" });
    }

    console.log(`Generating month-wise report for date range: ${fromDate} to ${toDate}`);

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });
    
    // Fetch loan details
    const loanDetails = await member_details.findAll({
      where: {
        loanType: "Business Loan",
        branchManagerStatus: "disbursed",
        fieldManagerId: {
          [Op.in]: fieldManagerIds,
        },
        // Only include loans that were disbursed before the end date
        branchManagerStatusUpdatedAt: {
          [Op.lte]: endDate
        }
      },
      include: [
        {
          model: member_business_details,
          as: "businessDetails",
        },
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails",
        },
        {
          model: receipts,
          as: "receiptsDetails",
        },
      ],
    });

    // Fetch manager and branch data
    const managerAndBranchData = await sequelize.query(
      `SELECT 
            mc.id as fieldManagerId, 
            b.branchName, 
            b.branchCode, 
            d.divisionName,
            d.divisionCode,
            r.regionName,
            r.regionCode,
            mc.username,
            mc.employeeName 
          FROM manager_credentials mc
          LEFT JOIN branch b ON mc.branchId = b.id
          LEFT JOIN division d ON b.divisionId = d.id
          LEFT JOIN region r ON d.regionId = r.id
          WHERE mc.id IN (:fieldManagerIds)`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          fieldManagerIds: fieldManagerIds,
        },
      }
    );

    const loanIdsArray = loanDetails.map((loan) => loan.id);

    let emiChartMap = {};
    let receiptsMap = {};

    // Fetch EMI charts
    if (loanIdsArray.length > 0) {
      console.log(`Fetching EMI charts for loan IDs:`, loanIdsArray.slice(0, 5));

      const emiChartsData = await emi_charts.findAll({
        where: {
          memberId: { [Op.in]: loanIdsArray },
        },
        attributes: [
          "memberId",
          [sequelize.cast(sequelize.col("emiChart"), "CHAR"), "emiChart"],
        ],
      });

      console.log(`EMI charts fetched: ${emiChartsData.length} records`);

      // Create EMI chart map
      emiChartsData.forEach((row) => {
        try {
          const parsedEmiChart = typeof row.emiChart === "string" 
            ? JSON.parse(row.emiChart) 
            : row.emiChart;

          if (Array.isArray(parsedEmiChart) && parsedEmiChart.length > 0) {
            emiChartMap[row.memberId] = parsedEmiChart;
          } else {
            emiChartMap[row.memberId] = [];
          }
        } catch (error) {
          console.error(`Error parsing EMI chart for loan ${row.memberId}:`, error.message);
          emiChartMap[row.memberId] = [];
        }
      });

      console.log(`Fetching receipts for date range: ${fromDate} to ${toDate}`);
      
      
      const receiptsData = await receipts.findAll({
        // where: {
        //   memberId: { [Op.in]: loanIdsArray },
        //   status: "Paid",
        //   collectedDate: {
        //     [Op.between]: [startDate, endDate]
        //   }
        // },
         where: {
    memberId: { [Op.in]: loanIdsArray },
    // Include both "Paid" and "Pending" statuses to capture partial payments
    status: { [Op.in]: ["Paid", "Pending"] },
    // Ensure we only get records where actual money was received
    receivedAmount: { [Op.gt]: 0 },
    collectedDate: {
      [Op.between]: [startDate, endDate]
    },
        },
        attributes: [
          "memberId",
          "status", 
          "emiAmount",
          "receivedAmount",
          "collectedDate",
          "emiDate"
        ],
        order: [["collectedDate", "ASC"]]
      });

      console.log(`Receipts data fetched: ${receiptsData.length} records`);

      receiptsData.forEach((receipt) => {
        const memberId = receipt.memberId;
        if (!receiptsMap[memberId]) {
          receiptsMap[memberId] = [];
        }
        receiptsMap[memberId].push({
          emiAmount: parseFloat(receipt.emiAmount || 0),
          receivedAmount: parseFloat(receipt.receivedAmount || 0),
          collectedDate: receipt.collectedDate,
          emiDate: receipt.emiDate,
          status: receipt.status
        });
      });
    }

    // NEW: Function to generate month-wise report data
    const generateMonthWiseReportData = (loan) => {
      const emiDetails = emiChartMap[loan.id] || [];
      const paymentsInRange = receiptsMap[loan.id] || [];
      const monthWiseData = [];

      if (!emiDetails || emiDetails.length === 0) {
        return monthWiseData;
      }

      // Process each EMI that falls within the date range
      emiDetails.forEach((emi, index) => {
        const emiDate = new Date(emi.emiDate);
        
        // Check if this EMI date falls within our selected range
        if (emiDate >= startDate && emiDate <= endDate) {
          const emiAmount = parseFloat(emi.emiAmount || 0);
          const emiMonth = emi.month || (index + 1);
          
          
          const correspondingPayments = paymentsInRange.filter(payment => {
            // Try to match by EMI date first
            const paymentEmiDate = payment.emiDate ? new Date(payment.emiDate) : null;
            if (paymentEmiDate && paymentEmiDate.getTime() === emiDate.getTime()) {
              return true;
            }
            
            // If no exact date match, try to match by amount and reasonable time window
            const daysDifference = Math.abs((new Date(payment.collectedDate) - emiDate) / (1000 * 60 * 60 * 24));
            return Math.abs(payment.emiAmount - emiAmount) < 1 && daysDifference <= 60; // Within 60 days
          });

          // Calculate collection for this specific EMI month
          const collectionAmount = correspondingPayments.reduce((sum, payment) => sum + payment.receivedAmount, 0);
          
          // Create month-wise entry
          monthWiseData.push({
            loanId: loan.id,
            emiMonth: emiMonth,
            emiDate: emiDate,
            demandAmount: emiAmount,
            collectionAmount: collectionAmount,
            principalAmount: parseFloat(emi.principalAmount || 0),
            interestAmount: parseFloat(emi.interestAmount || 0),
            remainingPrincipal: parseFloat(emi.remainingPrincipal || 0),
            collectionEfficiency: emiAmount > 0 ? Math.round((collectionAmount / emiAmount) * 10000) / 100 : 0,
            shortfall: Math.round((emiAmount - collectionAmount) * 100) / 100,
            paymentStatus: collectionAmount >= emiAmount ? 'Fully Paid' : 
                          collectionAmount > 0 ? 'Partially Paid' : 'Not Paid',
            correspondingPayments: correspondingPayments,
            isPaid: collectionAmount >= emiAmount,
            isPartiallyPaid: collectionAmount > 0 && collectionAmount < emiAmount,
            isUnpaid: collectionAmount === 0
          });
        }
      });

      return monthWiseData;
    };

    const loanCycleMap = {};
    const reportData = [];

    // Process each loan to generate month-wise data
    loanDetails.forEach((loan) => {
      const managerBranch = managerAndBranchData.find(
        (mb) => mb.fieldManagerId === loan.fieldManagerId
      ) || {};

      const customerId = loan.customerId;
      if (!loanCycleMap[customerId]) {
        loanCycleMap[customerId] = 1;
      } else {
        loanCycleMap[customerId] += 1;
      }

      // Get month-wise data for this loan
      const monthWiseEntries = generateMonthWiseReportData(loan);

      // Create a report row for each EMI month in the date range
      monthWiseEntries.forEach((monthData) => {
        reportData.push({
          
          ...loan.toJSON(),
          
          // Manager and branch details
          branchName: managerBranch.branchName || null,
          branchCode: managerBranch.branchCode || null,
          divisionName: managerBranch.divisionName || null,
          divisionCode: managerBranch.divisionCode || null,
          regionName: managerBranch.regionName || null,
          regionCode: managerBranch.regionCode || null,
          username: managerBranch.username || null,
          employeeName: managerBranch.employeeName || null,
          
         
          loanCycle: loanCycleMap[customerId],
          
          
          agencyName: loan.proposedLoanDetails?.fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId?.agencyName || null,
          
          
          dateRangeFrom: fromDate,
          dateRangeTo: toDate,
          
          // Month-specific data (this is the key change)
          emiMonth: monthData.emiMonth,
          emiDate: monthData.emiDate.toLocaleDateString("en-GB"),
          demandAmount: monthData.demandAmount,
          collectionAmount: monthData.collectionAmount,
          principalAmount: monthData.principalAmount,
          interestAmount: monthData.interestAmount,
          remainingPrincipal: monthData.remainingPrincipal,
          collectionEfficiency: monthData.collectionEfficiency,
          shortfall: monthData.shortfall,
          paymentStatus: monthData.paymentStatus,
          isPaid: monthData.isPaid,
          isPartiallyPaid: monthData.isPartiallyPaid,
          isUnpaid: monthData.isUnpaid,

          
  // Last payment details (for quick access)  
  lastPaymentDate: monthData.correspondingPayments.length > 0 ? 
    monthData.correspondingPayments[monthData.correspondingPayments.length - 1].collectedDate : null,
  
  lastReceivedAmount: monthData.correspondingPayments.length > 0 ? 
    monthData.correspondingPayments[monthData.correspondingPayments.length - 1].receivedAmount : 0,
    
  
  
  
  receivedAmounts: monthData.correspondingPayments.map(p => p.receivedAmount),
  
          
          // Payment details for this specific EMI
          paymentDetails: monthData.correspondingPayments,
          
          // Additional calculated fields
          disbursementDate: loan.branchManagerStatusUpdatedAt 
            ? new Date(loan.branchManagerStatusUpdatedAt).toLocaleDateString("en-GB")
            : null,
          
          // Loan details (same for all months of this loan)
          sanctionedAmount: parseFloat(loan.sanctionedLoanAmountBySanctionCommittee || 0),
          tenureInMonths: loan.proposedLoanDetails?.tenureInMonths || 0,
          rateOfInterest: loan.proposedLoanDetails?.rateOfInterest || 0,
          
          // EMI count for this specific month (always 1)
          emisDueInRange: 1,
          emisPaidInRange: monthData.isPaid ? 1 : 0,
          
          // Status indicators
          hasOverdue: monthData.shortfall > 0,
          isFullyPaid: monthData.collectionAmount >= monthData.demandAmount
        });
      });
    });

    // Calculate summary statistics (now based on month-wise data)
    const summary = {
      reportGenerated: new Date().toISOString(),
      dateRange: { fromDate, toDate },
      totalEMIRows: reportData.length, // Total EMI months in range
      uniqueLoans: [...new Set(reportData.map(row => row.id))].length,
      totalDemandAmount: Math.round(reportData.reduce((sum, row) => sum + row.demandAmount, 0) * 100) / 100,
      totalCollectionAmount: Math.round(reportData.reduce((sum, row) => sum + row.collectionAmount, 0) * 100) / 100,
      totalShortfall: Math.round(reportData.reduce((sum, row) => sum + row.shortfall, 0) * 100) / 100,
      
      // EMI-level statistics (month-wise)
      totalEMIsDue: reportData.length,
      emisPaid: reportData.filter(row => row.isPaid).length,
      emisPartiallyPaid: reportData.filter(row => row.isPartiallyPaid).length,
      emisUnpaid: reportData.filter(row => row.isUnpaid).length,
      
      // Additional month-wise metrics
      totalEMIMonths: reportData.length,
      loansWithEMIsInRange: [...new Set(reportData.map(row => row.id))].length,
      averageEMIAmount: reportData.length > 0 ? Math.round((reportData.reduce((sum, row) => sum + row.demandAmount, 0) / reportData.length) * 100) / 100 : 0,
      
      overallCollectionEfficiency: 0
    };

    // Calculate overall collection efficiency
    if (summary.totalDemandAmount > 0) {
      summary.overallCollectionEfficiency = Math.round((summary.totalCollectionAmount / summary.totalDemandAmount) * 10000) / 100;
    }

    console.log(`Month-wise report generated: ${reportData.length} EMI month rows for ${summary.uniqueLoans} unique loans`);
    console.log(`EMI Status: ${summary.emisPaid} Paid, ${summary.emisPartiallyPaid} Partial, ${summary.emisUnpaid} Unpaid`);
    console.log(`Total Demand: ₹${summary.totalDemandAmount}, Total Collection: ₹${summary.totalCollectionAmount}`);

    res.status(200).json({
      success: true,
      data: reportData,
      summary: summary
    });

  } catch (error) {
    console.error("Error in getDemandVsCollectionReportData:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};