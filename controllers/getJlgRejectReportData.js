const {
  member_details,
  proposed_loan_details,
  receipts,
  member_business_details,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getJlgRejectReportData = async (req, res) => {
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
    const rejectReportData = await member_details.findAll({
      where: {
        loanType: "JLG Loan",
        [Op.or]: [
          { branchManagerStatus: "rejected" },
          { creditOfficerStatus: "rejected" },
          { misStatus: "rejected" },
          { creditManagerStatus: "rejected" },
          { sanctionCommitteeStatus: "rejected" },
        ],
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

    // Deduplicate rejectReportData based on loan id to prevent duplicate records
    const uniqueLoanDetails = Array.from(
      new Map(rejectReportData.map((loan) => [loan.id, loan])).values()
    );

    // Step 3: Combine the data
    const combinedData = uniqueLoanDetails.map((loan) => {
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

      return {
        ...loan.toJSON(), // Convert the Sequelize model instance to a plain object
        branchName: managerBranch.branchName || null,
        branchCode: managerBranch.branchCode || null,
        divisionName: managerBranch.divisionName || null,
        divisionCode: managerBranch.divisionCode || null,
        regionName: managerBranch.regionName || null,
        regionCode: managerBranch.regionCode || null,
        username: managerBranch.username || null,
        employeeName: managerBranch.employeeName || null,
        loanCycle: loanCycleMap[customerId],
      };
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
