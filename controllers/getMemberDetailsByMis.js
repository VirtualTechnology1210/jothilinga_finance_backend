const {
  member_details,
  manager_credentials,
  roles,
  sequelize,
  member_photos,
  proposed_loan_details,
  branch,
  funding_agencies,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getMemberDetailsByMis = async (req, res) => {
  const misId = req.query.misId;

  if (!misId) {
    return res.status(400).json({
      error: "misId query parameter is required.",
    });
  }
  const misRoleId = await roles.findOne({
    where: { roleName: "MIS" },
  });

  if (!misRoleId) {
    return res.status(400).json({
      error: "Role 'MIS' does not exist.",
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
    const getBranchIds = await manager_credentials.findOne({
      where: {
        id: misId,
        roleId: misRoleId.id,
      },
    });

    if (!getBranchIds) {
      return res.status(400).json({
        error: "misId not exist.",
      });
    }

    const branchIdsString = getBranchIds.branchId;

    // Create a query that uses FIND_IN_SET to match branch IDs
    const fieldManagerRecords = await manager_credentials.findAll({
      attributes: ["id", "branchId", "username"],
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

    // Exclude misId from req.query
    const queryWithoutMisId = { ...req.query };
    delete queryWithoutMisId.misId;

    // Fetch member details where field manager ID is in the list
    const members = await member_details.findAll({
      where: {
        loanType: req.query.loanType || "",
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
        ...queryWithoutMisId,
      },
      include: [
        {
          model: member_photos,
          as: "memberPhotoDetails", // Ensure this alias matches the association alias
        },
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails", // Ensure this alias matches the association alias
          include: [
            {
              model: funding_agencies,
              as: "fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId", // Ensure this alias matches the association alias
            },
          ],
        },
      ],
    });

    const response = {
      list: members.map((member) => {
        const fieldManagerRecord = fieldManagerRecords.find(
          (fm) => fm.id === member.fieldManagerId
        );
        const branchName = branchMap[fieldManagerRecord.branchId];
        const username = fieldManagerRecord.username;
        const fundingAgencyData =
          member.proposedLoanDetails
            ?.fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId ||
          null;

        return {
          ...member.toJSON(),
          branchName, // Include branch name from the map
          croName: username,
          memberPhoto: member.memberPhotoDetails
            ? member.memberPhotoDetails.memberPhoto
            : null,
          proposedLoanAmount: member.proposedLoanDetails
            ? member.proposedLoanDetails.loanAmount
            : null,
          fundingAgencyData,
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
