// const {
//   member_details,
//   proposed_loan_details,
//   receipts,
//   member_business_details,
//   emi_charts,
//   sequelize,
// } = require("../models");
// const { Sequelize, Op } = require("sequelize");
// const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

// module.exports = getFutureDemandReportData = async (req, res) => {
//   try {
//     const { id, fromDate, toDate, includeMonthlyBreakdown } = req.query;

//     if (!id) {
//       return res.status(400).json({ error: "ID is required" });
//     }

//     // Use the utility function
//     const fieldManagerIds = await getFieldManagerRecords({
//       userId: id,
//     });

//     // Step 1: Fetch collection report data with proposed loan details
//     const futureDemandReportData = await member_details.findAll({
//       where: {
//         loanType: "Business Loan",
//         branchManagerStatus: "disbursed",
//         fieldManagerId: {
//           [Op.in]: fieldManagerIds,
//         },
//       },
//       include: [
//         {
//           model: member_business_details,
//           as: "businessDetails",
//         },
//         {
//           model: proposed_loan_details,
//           as: "proposedLoanDetails",
//         },
//         {
//           model: receipts,
//           as: "receiptsDetails",
//         },
//       ],
//     });

//     const managerAndBranchData = await sequelize.query(
//       `SELECT 
//           mc.id as fieldManagerId, 
//           b.branchName, 
//           b.branchCode, 
//           d.divisionName,
//           d.divisionCode,
//           r.regionName,
//           r.regionCode,
//           mc.username,
//           mc.employeeName 
//         FROM manager_credentials mc
//         LEFT JOIN branch b ON mc.branchId = b.id
//         LEFT JOIN division d ON b.divisionId = d.id
//         LEFT JOIN region r ON d.regionId = r.id
//         WHERE mc.id IN (:fieldManagerIds)`,
//       {
//         type: sequelize.QueryTypes.SELECT,
//         replacements: {
//           fieldManagerIds: fieldManagerIds,
//         },
//       }
//     );

//     // Extract loan IDs from the fetched data
//     const loanIdsArray = futureDemandReportData.map(loan => loan.id);

//     let emiChartMap = {};

//     if (loanIdsArray.length > 0) {
//       const emiChartsData = await emi_charts.findAll({
//         where: {
//           memberId: { [Op.in]: loanIdsArray },
//         },
//         attributes: ['memberId', 'emiChart'],
//       });

//       emiChartsData.forEach(row => {
//         try {
//           const parsedEmiChart = typeof row.emiChart === "string"
//             ? JSON.parse(row.emiChart)
//             : row.emiChart;
//           emiChartMap[row.memberId] = parsedEmiChart;
//         } catch (error) {
//           console.error(`Error parsing EMI chart for loan ${row.memberId}:`, error);
//           emiChartMap[row.memberId] = [];
//         }
//       });
//     }

//     const formatToValidDate = (dateObj) => {
//       if (!dateObj) return null;
//       try {
//         const date = new Date(dateObj);
//         if (isNaN(date.getTime())) {
//           console.error("Invalid date detected:", dateObj);
//           return null;
//         }
//         return date.toISOString().split('T')[0];
//       } catch (error) {
//         console.error("Error formatting date:", error, "Original value:", dateObj);
//         return null;
//       }
//     };

//     const filterEmiDatesInRange = (emiDetails, fromDate, toDate) => {
//   if (!emiDetails || !Array.isArray(emiDetails)) {
//     return [];
//   }

//   const startDate = fromDate ? new Date(fromDate) : null;
//   const endDate = toDate ? new Date(toDate) : null;

//   return emiDetails.filter(emi => {
//     try {
//       if (!emi.emiDate) return false;
      
//       const emiDate = new Date(emi.emiDate);
//       if (isNaN(emiDate.getTime())) {
//         return false;
//       }
      
//       // If no date range provided, include all EMIs
//       if (!startDate && !endDate) {
//         return true;
//       }
      
//       // Check if EMI date is within range
//       const isAfterStart = !startDate || emiDate >= startDate;
//       const isBeforeEnd = !endDate || emiDate <= endDate;
      
//       return isAfterStart && isBeforeEnd;
//     } catch (error) {
//       console.error("Error processing EMI date:", error);
//       return false;
//     }
//   });
// };

//     const calculateEmiMonthsPaid = (disbursementDate) => {
//       if (!disbursementDate) return 0;
//       const currentDate = new Date();
//       const disbursedDate = new Date(disbursementDate);
//       const monthsDiff = Math.max(0, Math.floor((currentDate - disbursedDate) / (1000 * 60 * 60 * 24 * 30)));
//       return monthsDiff;
//     };

//     // Prepare a map to track loan cycles per customerId
//     const loanCycleMap = {};

    

//     let combinedData = [];

//     futureDemandReportData.forEach((loan) => {
//       const managerBranch = managerAndBranchData.find(
//         (mb) => mb.fieldManagerId === loan.fieldManagerId
//       ) || {};

//       // Calculate loan cycle
//       const customerId = loan.customerId;
//       if (!loanCycleMap[customerId]) {
//         loanCycleMap[customerId] = 1;
//       } else {
//         loanCycleMap[customerId] += 1;
//       }

//       // Get EMI details for this loan
//       const emiDetails = emiChartMap[loan.id] || [];
//       const emiMonthsPaid = calculateEmiMonthsPaid(loan.branchManagerStatusUpdatedAt);

//       const baseLoanData = {
//         ...loan.toJSON(),
//         branchName: managerBranch.branchName || null,
//         branchCode: managerBranch.branchCode || null,
//         divisionName: managerBranch.divisionName || null,
//         divisionCode: managerBranch.divisionCode || null,
//         regionName: managerBranch.regionName || null,
//         regionCode: managerBranch.regionCode || null,
//         username: managerBranch.username || null,
//         employeeName: managerBranch.employeeName || null,
//         loanCycle: loanCycleMap[customerId],
//         emiMonthsPaid,
//       };

//       if (includeMonthlyBreakdown === 'true') {
//         // Filter EMI details based on date range
//         const filteredEmis = filterEmiDatesInRange(emiDetails, fromDate, toDate);
        
//         // Only include this member if they have EMIs in the date range
//         if (filteredEmis.length > 0) {
//           filteredEmis.forEach(emi => {
//             const formattedEmiDate = formatToValidDate(emi.emiDate);
            
//             combinedData.push({
//               ...baseLoanData,
//               emiDate: formattedEmiDate,
//               emiMonth: emi.month,
//               principalAmount: emi.principalAmount || 0,
//               interestAmount: emi.interestAmount || 0,
//               emiAmount: emi.emiAmount || 0,
//               outstandingBalance: emi.remainingPrincipal || 0,
//             });
//           });
//         }
        
//       } else {
//         // For non-breakdown mode, find the next EMI in the date range
//         const nextEmiIndex = Math.min(emiMonthsPaid, emiDetails.length - 1);
//         const currentEmiData = emiDetails[nextEmiIndex] || emiDetails[0] || {};
//         const emiDate = currentEmiData.emiDate ? formatToValidDate(currentEmiData.emiDate) : null;
        
//         // Check if this EMI falls within the date range
//         const emiInRange = !fromDate && !toDate ? true : 
//           (emiDate && 
//            (!fromDate || emiDate >= formatToValidDate(fromDate)) && 
//            (!toDate || emiDate <= formatToValidDate(toDate)));
        
//         if (emiInRange) {
//           combinedData.push({
//             ...baseLoanData,
//             emiDate: emiDate,
//             emiMonth: currentEmiData.month || null,
//             principalAmount: currentEmiData.principalAmount || 0,
//             interestAmount: currentEmiData.interestAmount || 0,
//             emiAmount: currentEmiData.emiAmount || 0,
//             outstandingBalance: currentEmiData.remainingPrincipal || 0,
//           });
//         }
//       }
//     });



//     res.status(200).json(combinedData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Internal Server Error",
//       details: error.message,
//     });
//   }
// };


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

module.exports = getFutureDemandReportData = async (req, res) => {
  try {
    const { id, fromDate, toDate, includeMonthlyBreakdown } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const fieldManagerIds = await getFieldManagerRecords({ userId: id });

    const futureDemandReportData = await member_details.findAll({
      where: {
        loanType: "Business Loan",
        branchManagerStatus: "disbursed",
        fieldManagerId: { [Op.in]: fieldManagerIds },
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
        replacements: { fieldManagerIds },
      }
    );

    const loanIdsArray = futureDemandReportData.map(loan => loan.id);
    let emiChartMap = {};
    let receiptsMap = {}; // NEW: Map to store receipt data

    if (loanIdsArray.length > 0) {
      // Fetch EMI Charts
      const emiChartsData = await emi_charts.findAll({
        where: { memberId: { [Op.in]: loanIdsArray } },
        attributes: ['memberId', 'emiChart'],
      });

      emiChartsData.forEach(row => {
        try {
          const parsedEmiChart = typeof row.emiChart === "string" 
            ? JSON.parse(row.emiChart) 
            : row.emiChart;
          emiChartMap[row.memberId] = parsedEmiChart;
        } catch (error) {
          console.error(`Error parsing EMI chart for loan ${row.memberId}:`, error);
          emiChartMap[row.memberId] = [];
        }
      });

      // NEW: Fetch all receipts for these loans (including future collections)
      console.log(`Fetching receipts for loans...`);
      
      const receiptsData = await receipts.findAll({
        where: {
          memberId: { [Op.in]: loanIdsArray },
          // Include both Paid and Pending to capture partial payments
          status: { [Op.in]: ["Paid", "Pending"] },
          // Get all receipts, not just within date range
          receivedAmount: { [Op.gt]: 0 }
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

      // Build receipts map
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

    // Fixed date formatting function for EMI dates
    const formatEmiDate = (emiDateStr) => {
      if (!emiDateStr) return null;
      try {
        const date = new Date(emiDateStr);
        if (isNaN(date.getTime())) return null;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error("Error formatting EMI date:", error, "Original:", emiDateStr);
        return null;
      }
    };

    const isDateInRange = (dateStr, fromDate, toDate) => {
      if (!dateStr) return false;
      if (!fromDate && !toDate) return true;
      
      try {
        const checkDate = new Date(dateStr);
        if (isNaN(checkDate.getTime())) return false;
        
        const start = fromDate ? new Date(fromDate) : null;
        const end = toDate ? new Date(toDate) : null;
        
        const afterStart = !start || checkDate >= start;
        const beforeEnd = !end || checkDate <= end;
        
        return afterStart && beforeEnd;
      } catch (error) {
        return false;
      }
    };

    // NEW: Function to calculate received amount for specific EMI
    const calculateReceivedAmountForEmi = (memberId, emiDate, emiAmount) => {
      const memberReceipts = receiptsMap[memberId] || [];
      const emiDateObj = new Date(emiDate);
      
      // Find payments that match this specific EMI
      const matchingPayments = memberReceipts.filter(payment => {
        // Method 1: Exact EMI date match
        if (payment.emiDate) {
          const paymentEmiDate = new Date(payment.emiDate);
          if (!isNaN(paymentEmiDate.getTime()) && paymentEmiDate.getTime() === emiDateObj.getTime()) {
            return true;
          }
        }
        
        // Method 2: Amount and reasonable time window match
        const collectedDate = new Date(payment.collectedDate);
        const daysDifference = Math.abs((collectedDate - emiDateObj) / (1000 * 60 * 60 * 24));
        const amountMatch = Math.abs(payment.emiAmount - emiAmount) < 1;
        
        return amountMatch && daysDifference <= 60;
      });
      
      // Sum up all matching payments
      const totalReceived = matchingPayments.reduce((sum, payment) => sum + payment.receivedAmount, 0);
      
      return {
        receivedAmount: Math.round(totalReceived * 100) / 100,
        
        paymentCount: matchingPayments.length,
        matchingPayments: matchingPayments,
        isFullyPaid: totalReceived >= emiAmount,
        isPartiallyPaid: totalReceived > 0 && totalReceived < emiAmount,
        isUnpaid: totalReceived === 0,
        outstandingAmount: Math.round((emiAmount - totalReceived) * 100) / 100,
        collectionEfficiency: emiAmount > 0 ? Math.round((totalReceived / emiAmount) * 10000) / 100 : 0
      };
    };

    const calculateEmiMonthsPaid = (disbursementDate) => {
      if (!disbursementDate) return 0;
      const currentDate = new Date();
      const disbursedDate = new Date(disbursementDate);
      const monthsDiff = Math.max(0, Math.floor((currentDate - disbursedDate) / (1000 * 60 * 60 * 24 * 30)));
      return monthsDiff;
    };

    const loanCycleMap = {};
    let combinedData = [];

    futureDemandReportData.forEach((loan) => {
      const managerBranch = managerAndBranchData.find(
        (mb) => mb.fieldManagerId === loan.fieldManagerId
      ) || {};

      const customerId = loan.customerId;
      loanCycleMap[customerId] = (loanCycleMap[customerId] || 0) + 1;

      const emiDetails = emiChartMap[loan.id] || [];
      const emiMonthsPaid = calculateEmiMonthsPaid(loan.branchManagerStatusUpdatedAt);

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
        loanCycle: loanCycleMap[customerId],
        emiMonthsPaid,
      };

      if (includeMonthlyBreakdown === 'true') {
        // Include all EMIs within date range with received amounts
        emiDetails.forEach(emi => {
          const formattedDate = formatEmiDate(emi.emiDate);
          
          if (formattedDate && isDateInRange(formattedDate, fromDate, toDate)) {
            // NEW: Calculate received amount for this EMI
            const emiAmount = parseFloat(emi.emiAmount || 0);
            const paymentInfo = calculateReceivedAmountForEmi(loan.id, formattedDate, emiAmount);
            
            combinedData.push({
              ...baseLoanData,
              emiDate: formattedDate,
              emiMonth: emi.month || null,
              principalAmount: parseFloat(emi.principalAmount || 0),
              interestAmount: parseFloat(emi.interestAmount || 0),
              emiAmount: emiAmount,
              outstandingBalance: parseFloat(emi.remainingPrincipal || 0),
              
              // NEW: Payment information
              receivedAmount: paymentInfo.receivedAmount,
              outstandingAmount: paymentInfo.outstandingAmount,
              collectionEfficiency: paymentInfo.collectionEfficiency,
              paymentStatus: paymentInfo.isFullyPaid ? 'Fully Paid' : 
                           paymentInfo.isPartiallyPaid ? 'Partially Paid' : 'Not Paid',
              isFullyPaid: paymentInfo.isFullyPaid,
              isPartiallyPaid: paymentInfo.isPartiallyPaid,
              isUnpaid: paymentInfo.isUnpaid,
              paymentCount: paymentInfo.paymentCount,
              
              // Additional helpful fields
              needsCollection: paymentInfo.outstandingAmount > 0,
              collectionPriority: paymentInfo.isUnpaid ? 'High' : 
                                 paymentInfo.isPartiallyPaid ? 'Medium' : 'Low'
            });
          }
        });
      } else {
        // Get current/next EMI based on months paid with received amounts
        const currentEmiIndex = Math.max(0, Math.min(emiMonthsPaid, emiDetails.length - 1));
        const currentEmi = emiDetails[currentEmiIndex];
        
        if (currentEmi) {
          const formattedDate = formatEmiDate(currentEmi.emiDate);
          
          if (formattedDate && isDateInRange(formattedDate, fromDate, toDate)) {
            // NEW: Calculate received amount for this EMI
            const emiAmount = parseFloat(currentEmi.emiAmount || 0);
            const paymentInfo = calculateReceivedAmountForEmi(loan.id, formattedDate, emiAmount);
            
            combinedData.push({
              ...baseLoanData,
              emiDate: formattedDate,
              emiMonth: currentEmi.month || null,
              principalAmount: parseFloat(currentEmi.principalAmount || 0),
              interestAmount: parseFloat(currentEmi.interestAmount || 0),
              emiAmount: emiAmount,
              outstandingBalance: parseFloat(currentEmi.remainingPrincipal || 0),
              
              // NEW: Payment information
              receivedAmount: paymentInfo.receivedAmount,
              outstandingAmount: paymentInfo.outstandingAmount,
              collectionEfficiency: paymentInfo.collectionEfficiency,
              paymentStatus: paymentInfo.isFullyPaid ? 'Fully Paid' : 
                           paymentInfo.isPartiallyPaid ? 'Partially Paid' : 'Not Paid',
              isFullyPaid: paymentInfo.isFullyPaid,
              isPartiallyPaid: paymentInfo.isPartiallyPaid,
              isUnpaid: paymentInfo.isUnpaid,
              paymentCount: paymentInfo.paymentCount,
              
              // Additional helpful fields
              needsCollection: paymentInfo.outstandingAmount > 0,
              collectionPriority: paymentInfo.isUnpaid ? 'High' : 
                                 paymentInfo.isPartiallyPaid ? 'Medium' : 'Low'
            });
          }
        }
      }
    });

    // Add summary information
    const summary = {
      totalEMIs: combinedData.length,
      fullyPaidEMIs: combinedData.filter(item => item.isFullyPaid).length,
      partiallyPaidEMIs: combinedData.filter(item => item.isPartiallyPaid).length,
      unpaidEMIs: combinedData.filter(item => item.isUnpaid).length,
      totalDemandAmount: Math.round(combinedData.reduce((sum, item) => sum + item.emiAmount, 0) * 100) / 100,
      totalReceivedAmount: Math.round(combinedData.reduce((sum, item) => sum + item.receivedAmount, 0) * 100) / 100,
      totalOutstandingAmount: Math.round(combinedData.reduce((sum, item) => sum + item.outstandingAmount, 0) * 100) / 100,
      overallCollectionEfficiency: 0
      
    };

    if (summary.totalDemandAmount > 0) {
      summary.overallCollectionEfficiency = Math.round((summary.totalReceivedAmount / summary.totalDemandAmount) * 10000) / 100;
    }

    res.status(200).json({
      success: true,
      data: combinedData,
      summary: summary
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};