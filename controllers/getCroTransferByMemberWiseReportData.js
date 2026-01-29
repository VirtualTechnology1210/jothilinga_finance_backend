const {
  manager_credentials,
  member_cro_transfer_history,
  member_details,
  proposed_loan_details,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getCroTransferByMemberWiseReportData = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });

    if (!fieldManagerIds || fieldManagerIds.length === 0) {
      return res.status(404).json({ error: "No field managers found" });
    }

    const tranferHistory = await member_cro_transfer_history.findAll({
      include: [
        {
          model: member_details,
          as: "fk_member_cro_transfer_history_belongsTo_member_details_memberId",
          where: {
            fieldManagerId: {
              [Op.in]: fieldManagerIds, // Filter by IDs
            },
          },
          include: [
            {
              model: proposed_loan_details,
              as: "proposedLoanDetails",
            },
          ],
        },
        {
          model: manager_credentials,
          as: "fk_member_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId",
        },
        {
          model: manager_credentials,
          as: "fk_member_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId",
        },
      ],
    });

    if (!tranferHistory || tranferHistory.length === 0) {
      return res.status(404).json({ error: "No transfer history found" });
    }

    // Get the unique fieldManagerIds from transfer history
    const validFieldManagerIds = [
      ...new Set(
        tranferHistory.map(
          (ld) =>
            ld?.fk_member_cro_transfer_history_belongsTo_member_details_memberId
              ?.fieldManagerId
        )
      ),
    ].filter(Boolean);

    // Add this check before the SQL query
    if (!validFieldManagerIds || validFieldManagerIds.length === 0) {
      return res.status(404).json({
        error: "No valid field manager IDs found",
        data: [],
      });
    }

    // Get additional data using raw SQL
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
                WHERE mc.id IN (:fieldManagerIds)`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          fieldManagerIds: validFieldManagerIds.length
            ? validFieldManagerIds
            : [0], // Provide a default value if empty
        },
      }
    );

    // Combine the Sequelize ORM data and raw SQL data, adding loan cycle information
    const combinedData = tranferHistory.map((loan) => {
      const managerBranch =
        managerAndBranchData.find(
          (mb) =>
            mb.fieldManagerId ===
            loan
              ?.fk_member_cro_transfer_history_belongsTo_member_details_memberId
              ?.fieldManagerId
        ) || {};

      return {
        ...loan.toJSON(),
        branchName: managerBranch?.branchName || null,
        branchCode: managerBranch?.branchCode || null,
        divisionName: managerBranch?.divisionName || null,
        divisionCode: managerBranch?.divisionCode || null,
        regionName: managerBranch?.regionName || null,
        regionCode: managerBranch?.regionCode || null,
        username: managerBranch?.username || null,
        employeeName: managerBranch?.employeeName || null,
        fromStaffName:
          loan
            .fk_member_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId
            .employeeName || null,
        fromStaffCode:
          loan
            .fk_member_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId
            .employeeId || null,
        toStaffName:
          loan
            .fk_member_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId
            .employeeName || null,
        toStaffCode:
          loan
            .fk_member_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId
            .employeeId || null,
        transferDate: loan.transferDate,
        memberDetails:
          loan.fk_member_cro_transfer_history_belongsTo_member_details_memberId ||
          {},
        proposedLoanDetails:
          loan.fk_member_cro_transfer_history_belongsTo_member_details_memberId
            .proposedLoanDetails || {},
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
