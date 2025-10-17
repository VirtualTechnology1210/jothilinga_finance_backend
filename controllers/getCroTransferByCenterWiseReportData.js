const {
  manager_credentials,
  center,
  center_cro_transfer_history,
  group,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getCroTransferByCenterWiseReportData = async (req, res) => {
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

    const tranferHistory = await center_cro_transfer_history.findAll({
      include: [
        {
          model: center,
          as: "fk_center_cro_transfer_history_belongsTo_center_centerId",
          where: {
            fieldManagerId: {
              [Op.in]: fieldManagerIds, // Filter by IDs
            },
          },
          include: [
            {
              model: group,
              as: "fk_center_hasMany_group_centerId",
              order: [["createdAt", "ASC"]], // Order by creation date ascending
            },
          ],
        },
        {
          model: manager_credentials,
          as: "fk_center_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId",
        },
        {
          model: manager_credentials,
          as: "fk_center_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId",
        },
      ],
    });

    if (!tranferHistory || tranferHistory.length === 0) {
      return res.status(404).json({ error: "No transfer history found" });
    }

    // Get the unique fieldManagerIds from transfer history
    const validFieldManagerIds = [...new Set(tranferHistory.map(
      (ld) => ld.fk_center_cro_transfer_history_belongsTo_center_centerId?.fieldManagerId
    ))].filter(Boolean);

    // Add this check before the SQL query
    if (!validFieldManagerIds || validFieldManagerIds.length === 0) {
      return res.status(404).json({ 
        error: "No valid field manager IDs found",
        data: [] 
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
          fieldManagerIds: validFieldManagerIds.length ? validFieldManagerIds : [0], // Provide a default value if empty
        },
      }
    );

    // Combine the Sequelize ORM data and raw SQL data, adding loan cycle information
    const combinedData = tranferHistory.map((loan) => {
      const managerBranch = managerAndBranchData.find(
        (mb) => mb.fieldManagerId === loan?.fk_center_cro_transfer_history_belongsTo_center_centerId?.fieldManagerId
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
        centerName: loan?.fk_center_cro_transfer_history_belongsTo_center_centerId?.name || null,
        centerLeaderName:
          loan.fk_center_cro_transfer_history_belongsTo_center_centerId
            .fk_center_hasMany_group_centerId[0]?.leaderName || null,
        centerLeaderContact:
          loan.fk_center_cro_transfer_history_belongsTo_center_centerId
            .fk_center_hasMany_group_centerId[0]?.mobileNumber || null,
        fromStaffName:
          loan
            .fk_center_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId
            .employeeName || null,
        fromStaffCode:
          loan
            .fk_center_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId
            .employeeId || null,
        toStaffName:
          loan
            .fk_center_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId
            .employeeName || null,
        toStaffCode:
          loan
            .fk_center_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId
            .employeeId || null,
        transferDate: loan.transferDate,
        bmMeetingDayOrder:
          loan.fk_center_cro_transfer_history_belongsTo_center_centerId
            .bmMeetingDayOrder || null,
        bmMeetingTime:
          loan.fk_center_cro_transfer_history_belongsTo_center_centerId
            .bmMeetingTime || null,
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
