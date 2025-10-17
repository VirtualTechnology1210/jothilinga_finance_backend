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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });
    
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
          fieldManagerIds: fieldManagerIds,
        },
      }
    );

    // Helper function to get EMI details for a specific EMI date
    const getEmiDetailsForDate = (emiChartData, emiDate) => {
      if (!emiChartData || !emiDate) {
        return { principalAmount: null, interestAmount: null };
      }

      try {
        // Parse the emiChart JSON data
        const emiChart = typeof emiChartData === 'string' 
          ? JSON.parse(emiChartData) 
          : emiChartData;
        
        // Find the EMI entry that matches the receipt's EMI date
        const emiEntry = emiChart.find(entry => {
          // Compare dates (you might need to adjust date comparison based on your date format)
          const entryDate = new Date(entry.emiDate).toDateString();
          const receiptDate = new Date(emiDate).toDateString();
          return entryDate === receiptDate;
        });

        return {
          principalAmount: emiEntry ? emiEntry.principalAmount : null,
          interestAmount: emiEntry ? emiEntry.interestAmount : null
        };
      } catch (error) {
        console.error('Error parsing EMI chart data:', error);
        return { principalAmount: null, interestAmount: null };
      }
    };

    // Prepare a map to track loan cycles per customerId
    const loanCycleMap = {};

    // Step 3: Combine the data
    const combinedData = [];
    collectionReportData.forEach((loan) => {
      const managerBranch =
        managerAndBranchData.find(
          (mb) => mb.fieldManagerId === loan.fieldManagerId
        ) || {};

      // Calculate loan cycle based on customerId
      const customerId = loan.customerId; // Assuming customerId is available in the loan record
      if (!loanCycleMap[customerId]) {
        loanCycleMap[customerId] = 1; // Start the loan cycle at 1
      } else {
        loanCycleMap[customerId] += 1; // Increment the loan cycle
      }

      // Get the loan data in a plain object
      const loanData = loan.toJSON();

      // Get EMI chart data for this loan
      const emiChartData = loanData.fk_member_details_hasMany_emi_charts_memberId && loanData.fk_member_details_hasMany_emi_charts_memberId.length > 0 
        ? loanData.fk_member_details_hasMany_emi_charts_memberId[0].emiChart 
        : null;

      // If there are receipts, map each receipt to include the loan data
      if (loanData.receiptsDetails && loanData.receiptsDetails.length > 0) {
        loanData.receiptsDetails.forEach((receipt) => {
          // Get principal and interest amounts for this specific EMI date
          const { principalAmount, interestAmount } = getEmiDetailsForDate(
            emiChartData, 
            receipt.emiDate
          );

          combinedData.push({
            ...loanData, // Include all loan data
            receiptEmiDate: receipt.emiDate,
            receiptEmiAmount: receipt.emiAmount,
            receivedAmount: receipt.receivedAmount,
            receiptDescription: receipt.description,
            collectedDate: receipt.collectedDate,
            collectionApproval:
              receipt.fk_receipts_hasOne_bl_collection_approval_receiptId ||
              null,
            // Add principal and interest amounts from EMI chart
            principalAmount: principalAmount,
            interestAmount: interestAmount,
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
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};