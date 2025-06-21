const {
  member_details,
  manager_credentials,
  roles,
  sequelize,
  member_photos,
  branch,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getAllMemberDetailsByBranchManagerIdAndStatus = async (
  req,
  res
) => {
  const branchManagerId = req.query.branchManagerId;
  const branchManagerStatus = req.query.branchManagerStatus;

  if (!branchManagerId) {
    return res.status(400).json({
      error: "branchManagerId query parameter is required.",
    });
  }

  if (!branchManagerStatus) {
    return res.status(400).json({
      error: "branchManagerStatus query parameter is required.",
    });
  }

  const bmRoleId = await roles.findOne({
    where: { roleName: "Branch Manager" },
  });

  if (!bmRoleId) {
    return res.status(400).json({
      error: "Role 'Branch Manager' does not exist.",
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

  try {
    // Build the `where` clause dynamically
    const whereClause = { branchManagerStatus };

    const getBranchIds = await manager_credentials.findOne({
      where: {
        id: branchManagerId,
        roleId: bmRoleId.id,
      },
    });

    if (!getBranchIds) {
      return res.status(400).json({
        error: "branchManagerId not exist.",
      });
    }

    const branchIdsString = getBranchIds.branchId;

    // Create a query that uses FIND_IN_SET to match branch IDs
    const fieldManagerRecords = await manager_credentials.findAll({
      attributes: ["id", "branchId"],
      where: {
        roleId: croRoleId.id, // Add the roleId condition
        [Op.and]: sequelize.where(
          sequelize.fn(
            "FIND_IN_SET",
            sequelize.col("branchId"),
            branchIdsString
          ),
          {
            [Op.gt]: 0, // FIND_IN_SET returns the position of the item, which is > 0 if found
          }
        ),
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
          member_id: member.id,
          memberName: member.memberName,
          memberPhoneNumber: member.phoneNumber,
          appliedDate: member.createdAt.toISOString().split("T")[0],
          creditOfficerMessage: member.creditOfficerMessage,
          branchName, // Include branch name from the map
          memberPhoto: member.memberPhotoDetails
            ? member.memberPhotoDetails.memberPhoto
            : null,
          creditOfficerStatus: member.creditOfficerStatus,
          creditOfficerStatusUpdatedAt: member.creditOfficerStatusUpdatedAt,
          creditOfficerMessage: member.creditOfficerMessage,
          creditManagerStatus: member.creditManagerStatus,
          creditManagerStatusUpdatedAt: member.creditManagerStatusUpdatedAt,
          branchManagerStatus: member.branchManagerStatus,
          branchManagerStatusUpdatedAt: member.branchManagerStatusUpdatedAt,
          accountManagerStatus: member.accountManagerStatus,
          accountManagerStatusUpdatedAt: member.accountManagerStatusUpdatedAt,
          ApplicantionId: member.ApplicantionId,
          fieldManagerMessage: member.fieldManagerMessage,
          creditManagerMessage: member.creditManagerMessage,
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
