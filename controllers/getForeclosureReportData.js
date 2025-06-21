const {
  member_details,
  proposed_loan_details,
  member_business_details,
  bank_details,
  center,
  foreclosure_approval,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getForeclosureReportData = async (req, res) => {
  try {
    const { id } = req.query;

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
        loanStatus: "foreclosed",
        branchManagerStatus: "disbursed",
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
      },
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails", // Ensure this alias matches the association alias
        },
        {
          model: member_business_details,
          as: "businessDetails", // Ensure this alias matches the association alias
        },
        {
          model: bank_details,
          as: "bankDetails", // Ensure this alias matches the association alias
        },
        {
          model: center,
          as: "fk_member_details_belongsTo_center_centerId",
        },
        {
          model: foreclosure_approval,
          as: "fk_member_details_hasOne_member_foreclosure_approval_memberId",
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

    // Prepare a map to track loan cycles per customerId
    const loanCycleMap = {};

    // Combine the Sequelize ORM data and raw SQL data, adding loan cycle information
    const combinedData = loanDetails.map((loan) => {
      // Find the corresponding manager and branch data based on fieldManagerId
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
        loanCycle: loanCycleMap[customerId], // Add the calculated loan cycle
        foreclosureApproval:
          loan.fk_member_details_hasOne_member_foreclosure_approval_memberId ||
          {}, // Add foreclosure approval data
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
