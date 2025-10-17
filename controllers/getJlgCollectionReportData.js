const {
  member_details,
  proposed_loan_details,
  receipts,
  member_business_details,
  center,
  jlg_collection_approval,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getJlgCollectionReportData = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });
    // Step 1: Fetch collection report data with proposed loan details
    const collectionReportData = await member_details.findAll({
      where: {
        loanType: "JLG Loan",
        branchManagerStatus: "disbursed",
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
        {
          model: center,
          as: "fk_member_details_belongsTo_center_centerId",
          include: [
            {
              model: jlg_collection_approval,
              as: "fk_center_hasMany_jlg_collection_approval_centerId",
            },
          ],
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

      // If there are receipts, map each receipt to include the loan data
      if (loanData.receiptsDetails && loanData.receiptsDetails.length > 0) {
        loanData.receiptsDetails.forEach((receipt) => {
          // Get collection approval data that matches the receipt's emiDate
          const collectionApproval =
            loanData.fk_member_details_belongsTo_center_centerId?.fk_center_hasMany_jlg_collection_approval_centerId?.find(
              (approval) => approval.emiDate === receipt.emiDate
            ) || null;

          combinedData.push({
            ...loanData,
            receiptEmiDate: receipt.emiDate,
            receiptEmiAmount: receipt.emiAmount,
            receivedAmount: receipt.receivedAmount,
            receiptDescription: receipt.description,
            collectedDate: receipt.collectedDate,
            branchName: managerBranch.branchName || null,
            branchCode: managerBranch.branchCode || null,
            divisionName: managerBranch.divisionName || null,
            divisionCode: managerBranch.divisionCode || null,
            regionName: managerBranch.regionName || null,
            regionCode: managerBranch.regionCode || null,
            username: managerBranch.username || null,
            employeeName: managerBranch.employeeName || null,
            loanCycle: loanCycleMap[customerId],
            collectionApproval: collectionApproval, // Add collection approval data
          });
        });
      } else {
        // If there are no receipts, include the latest collection approval
        const latestCollectionApproval =
          loanData.fk_member_details_belongsTo_center_centerId
            ?.fk_center_hasMany_jlg_collection_approval_centerId?.[0] || null;

        combinedData.push({
          ...loanData,
          receiptEmiDate: null,
          receiptEmiAmount: null,
          receivedAmount: null,
          receiptDescription: null,
          collectedDate: null,
          branchName: managerBranch.branchName || null,
          branchCode: managerBranch.branchCode || null,
          divisionName: managerBranch.divisionName || null,
          divisionCode: managerBranch.divisionCode || null,
          regionName: managerBranch.regionName || null,
          regionCode: managerBranch.regionCode || null,
          username: managerBranch.username || null,
          employeeName: managerBranch.employeeName || null,
          loanCycle: loanCycleMap[customerId],
          collectionApproval: latestCollectionApproval, // Add collection approval data
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
