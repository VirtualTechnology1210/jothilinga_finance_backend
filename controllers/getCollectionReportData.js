const {
  member_details,
  proposed_loan_details,
  receipts,
  member_business_details,
  bl_collection_approval,
  emi_charts,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getCollectionReportData = async (req, res) => {
  try {
    const { id, fromDate, toDate } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });

    // Construct receipt where clause if dates are provided
    const receiptWhere = {};
    if (fromDate && toDate) {
      const fromDateStart = new Date(fromDate);
      fromDateStart.setHours(0, 0, 0, 0);
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);

      receiptWhere.collectedDate = {
        [Op.between]: [fromDateStart, toDateEnd],
      };
    }

    // Step 1: Fetch collection report data with proposed loan details and EMI charts
    const collectionReportData = await member_details.findAll({
      where: {
        loanType: "Business Loan",
        branchManagerStatus: "disbursed",
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
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
          where: Object.keys(receiptWhere).length > 0 ? receiptWhere : undefined,
          required: Object.keys(receiptWhere).length > 0, // Make it an inner join if filtering by date
          include: [
            {
              model: bl_collection_approval,
              as: "fk_receipts_hasOne_bl_collection_approval_receiptId",
            },
          ],
        },
        {
          model: emi_charts,
          as: "fk_member_details_hasMany_emi_charts_memberId", // Use the correct association alias
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
        replacements: {
          fieldManagerIds: fieldManagerIds.length > 0 ? fieldManagerIds : [0],
        },
      }
    );

    const managerMap = new Map(managerAndBranchData.map(mb => [mb.fieldManagerId, mb]));

    const formatDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        return null;
      }
    };

    // Helper function to calculate EMI month from disbursement date and EMI date
    const calculateEmiMonthFromDates = (disbursementDate, emiDate) => {
      if (!disbursementDate || !emiDate) return null;

      try {
        const disbDate = new Date(disbursementDate);
        const emiDateObj = new Date(emiDate);

        if (isNaN(disbDate.getTime()) || isNaN(emiDateObj.getTime())) return null;

        // Calculate months difference
        const yearDiff = emiDateObj.getFullYear() - disbDate.getFullYear();
        const monthDiff = emiDateObj.getMonth() - disbDate.getMonth();
        const totalMonths = (yearDiff * 12) + monthDiff;

        // EMI month is the number of months after disbursement (minimum 1)
        const emiMonth = Math.max(1, totalMonths);

        return emiMonth;
      } catch (error) {
        console.error('Error calculating EMI month from dates:', error);
        return null;
      }
    };

    // Helper function to get EMI details for a specific EMI date from a pre-parsed chart
    const getEmiDetailsForDate = (emiChart, emiDate, disbursementDate) => {
      // Calculate EMI month from dates as fallback (this always works)
      const calculatedEmiMonth = calculateEmiMonthFromDates(disbursementDate, emiDate);

      // If no emiDate provided, return with calculated month
      if (!emiDate) {
        return { principalAmount: null, interestAmount: null, emiMonth: calculatedEmiMonth };
      }

      // If no EMI chart data, return with calculated month
      if (!Array.isArray(emiChart) || emiChart.length === 0) {
        return { principalAmount: null, interestAmount: null, emiMonth: calculatedEmiMonth };
      }

      try {
        const formattedReceiptDate = formatDate(emiDate);

        // Find the EMI entry that matches the receipt's EMI date
        let emiEntry = null;
        let matchIndex = -1;

        for (let i = 0; i < emiChart.length; i++) {
          const entry = emiChart[i];
          const formattedEntryDate = formatDate(entry.emiDate);

          if (formattedEntryDate === formattedReceiptDate) {
            emiEntry = entry;
            matchIndex = i;
            break;
          }
        }

        // If not found by exact date, try to use the calculated month as index
        if (!emiEntry && calculatedEmiMonth && calculatedEmiMonth >= 1 && calculatedEmiMonth <= emiChart.length) {
          emiEntry = emiChart[calculatedEmiMonth - 1];
          matchIndex = calculatedEmiMonth - 1;
        }

        // If still not found, try day matching
        if (!emiEntry && emiChart.length > 0) {
          const receiptDateObj = new Date(emiDate);
          const receiptDay = receiptDateObj.getDate();
          const receiptMonth = receiptDateObj.getMonth();
          const receiptYear = receiptDateObj.getFullYear();

          for (let i = 0; i < emiChart.length; i++) {
            const entryDate = new Date(emiChart[i].emiDate);
            if (entryDate.getDate() === receiptDay &&
              entryDate.getMonth() === receiptMonth &&
              entryDate.getFullYear() === receiptYear) {
              emiEntry = emiChart[i];
              matchIndex = i;
              break;
            }
          }
        }

        // Determine final emiMonth value
        let finalEmiMonth = calculatedEmiMonth; // Use calculated as default
        if (emiEntry && emiEntry.month) {
          finalEmiMonth = emiEntry.month;
        } else if (matchIndex >= 0) {
          finalEmiMonth = matchIndex + 1;
        }

        return {
          principalAmount: emiEntry ? emiEntry.principalAmount : null,
          interestAmount: emiEntry ? emiEntry.interestAmount : null,
          emiMonth: finalEmiMonth
        };
      } catch (error) {
        console.error('Error fetching EMI details for date:', error);
        return { principalAmount: null, interestAmount: null, emiMonth: calculatedEmiMonth };
      }
    };


    // Prepare a map to track loan cycles per customerId
    const loanCycleMap = {};

    // Deduplicate collectionReportData instances first
    const uniqueLoanInstances = Array.from(
      new Map(collectionReportData.map((loan) => [loan.id, loan])).values()
    );

    // Step 3: Combine the data
    const combinedData = [];
    uniqueLoanInstances.forEach((loan) => {
      const loanData = loan.toJSON();
      const managerBranch = managerMap.get(loanData.fieldManagerId) || {};

      // Calculate loan cycle based on customerId
      const customerId = loanData.customerId;
      if (!loanCycleMap[customerId]) {
        loanCycleMap[customerId] = 1;
      } else {
        loanCycleMap[customerId] += 1;
      }

      // Get EMI chart data for this loan - parse ONCE
      const emiChartsArr = loanData.fk_member_details_hasMany_emi_charts_memberId || [];
      const submittedChart = emiChartsArr.find(chart => chart.status === 'submitted') || emiChartsArr[0];
      let emiChartParsed = [];
      if (submittedChart && submittedChart.emiChart) {
        try {
          emiChartParsed = typeof submittedChart.emiChart === 'string'
            ? JSON.parse(submittedChart.emiChart)
            : submittedChart.emiChart;
        } catch (e) {
          console.error('Error parsing emiChart:', e);
        }
      }

      // Extract receipts details
      const receiptsDetails = loanData.receiptsDetails || [];

      // Remove large nested arrays from loanData object before spreading
      // BUT keep receiptsDetails if it's explicitly needed by some reports
      delete loanData.fk_member_details_hasMany_emi_charts_memberId;

      // If there are receipts, map each receipt to include the loan data
      if (receiptsDetails.length > 0) {
        receiptsDetails.forEach((receipt) => {
          const { principalAmount, interestAmount, emiMonth } = getEmiDetailsForDate(
            emiChartParsed,
            receipt.emiDate,
            loanData.branchManagerStatusUpdatedAt
          );

          combinedData.push({
            ...loanData,
            receiptEmiDate: receipt.emiDate,
            receiptEmiAmount: receipt.emiAmount,
            receivedAmount: receipt.receivedAmount,
            receiptDescription: receipt.description,
            collectedDate: receipt.collectedDate,
            collectionApproval: receipt.fk_receipts_hasOne_bl_collection_approval_receiptId || null,
            principalAmount: principalAmount,
            interestAmount: interestAmount,
            emiMonth: emiMonth,
            branchName: managerBranch.branchName || null,
            branchCode: managerBranch.branchCode || null,
            divisionName: managerBranch.divisionName || null,
            divisionCode: managerBranch.divisionCode || null,
            regionName: managerBranch.regionName || null,
            regionCode: managerBranch.regionCode || null,
            username: managerBranch.username || null,
            employeeName: managerBranch.employeeName || null,
            loanCycle: loanCycleMap[customerId],
          });
        });
      } else {
        // If there are no receipts, still include the loan data with no receipt info
        combinedData.push({
          ...loanData,
          receiptEmiDate: null,
          receiptEmiAmount: null,
          receivedAmount: null,
          receiptDescription: null,
          collectedDate: null,
          collectionApproval: null,
          principalAmount: null,
          interestAmount: null,
          branchName: managerBranch.branchName || null,
          branchCode: managerBranch.branchCode || null,
          divisionName: managerBranch.divisionName || null,
          divisionCode: managerBranch.divisionCode || null,
          regionName: managerBranch.regionName || null,
          regionCode: managerBranch.regionCode || null,
          username: managerBranch.username || null,
          employeeName: managerBranch.employeeName || null,
          loanCycle: loanCycleMap[customerId],
        });
      }
    });

    res.status(200).json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};