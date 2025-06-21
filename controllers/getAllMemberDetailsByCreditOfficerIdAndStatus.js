const {
  member_details,
  manager_credentials,
  roles,
  sequelize,
  member_photos,
  branch,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getAllMemberDetailsByCreditOfficerIdAndStatus = async (
  req,
  res
) => {
  const creditOfficerId = req.query.creditOfficerId;
  const creditOfficerStatus = req.query.creditOfficerStatus;

  if (!creditOfficerId) {
    return res.status(400).json({
      error: "creditOfficerId query parameter is required.",
    });
  }

  if (!creditOfficerStatus) {
    return res.status(400).json({
      error: "creditOfficerStatus query parameter is required.",
    });
  }

  try {
    const whereClause = { creditOfficerStatus };

    const coRoleId = await roles.findOne({
      where: { roleName: "Credit Officer" },
    });

    if (!coRoleId) {
      return res.status(400).json({
        error: "Role does not exist.",
      });
    }

    const croRoleId = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });

    if (!croRoleId) {
      return res.status(400).json({
        error: "Role does not exist.",
      });
    }

    const getBranchIds = await manager_credentials.findOne({
      where: {
        id: creditOfficerId,
        roleId: coRoleId.id,
      },
    });

    if (!getBranchIds) {
      return res.status(400).json({
        error: "creditOfficerId not exist.",
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
