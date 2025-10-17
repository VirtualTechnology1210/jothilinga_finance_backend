const {
  member_details,
  manager_credentials,
  roles,
  sequelize,
  member_photos,
  branch,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getAllMemberDetailsByAccountManagerIdAndStatus = async (
  req,
  res
) => {
  const accountManagerId = req.query.accountManagerId;
  const accountManagerStatus = req.query.accountManagerStatus;

  if (!accountManagerId) {
    return res.status(400).json({
      error: "accountManagerId query parameter is required.",
    });
  }

  if (!accountManagerStatus) {
    return res.status(400).json({
      error: "accountManagerStatus query parameter is required.",
    });
  }

  try {
    // Build the `where` clause dynamically
    const whereClause = { accountManagerStatus };

    const amRoleId = await roles.findOne({
      where: { roleName: "Accounts Manager" },
    });

    if (!amRoleId) {
      return res.status(400).json({
        error: "Role 'Accounts Manager' does not exist.",
      });
    }

    const getBranchIds = await manager_credentials.findOne({
      where: {
        id: accountManagerId,
        roleId: amRoleId.id,
      },
    });

    if (!getBranchIds) {
      return res.status(400).json({
        error: "accountManagerId not exist.",
      });
    }

    if (!getBranchIds) {
      return res.status(400).json({
        error: "Branch Manager Id not exist",
      });
    }

    const croRoleId = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });

    if (!croRoleId) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }

    const fieldManagerRecords = await manager_credentials.findAll({
      attributes: ["id", "branchId"],
      where: {
        roleId: croRoleId.id, // Add the roleId condition
      },
      raw: true, // Use raw: true if you only need the results without Sequelize model instances
    });

    const branchIds = fieldManagerRecords.map((record) => record.branchId);

    // Fetch branch names based on branch IDs
    const branchRecords = await branch.findAll({
      attributes: ["id", "branchName"],
      where: {
        id: {
          [Op.in]: branchIds,
        },
      },
      raw: true,
    });

    // Create a map for branch ID to branch name
    const branchMap = branchRecords.reduce((map, branch) => {
      map[branch.id] = branch.branchName;
      return map;
    }, {});

    const fieldManagerIds = fieldManagerRecords.map((record) => record.id);

    // Fetch member details where field manager ID is in the list
    const members = await member_details.findAll({
      where: {
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
        ...whereClause,
      },
      include: [
        {
          model: member_photos,
          as: "memberPhotoDetails", // Ensure this alias matches the association alias
        },
      ],
    });

    const response = {
      list: members.map((member) => {
        const fieldManagerRecord = fieldManagerRecords.find(
          (fm) => fm.id === member.fieldManagerId
        );
        const branchName = branchMap[fieldManagerRecord.branchId];

        return {
          ...member.toJSON(),
          branchName, // Include branch name from the map
          memberPhoto: member.memberPhotoDetails
            ? member.memberPhotoDetails.memberPhoto
            : null,
        };
      }),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
