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

module.exports = getMemberDetailsBySuperadmin = async (req, res) => {
  const superadminId = req.query.superadminId;

  if (!superadminId) {
    return res.status(400).json({
      error: "superadminId query parameter is required.",
    });
  }

  try {
    // Fetch role IDs for "superadmin" and "developer"
    const superadminAndDeveloperRoles = await roles.findAll({
      where: {
        roleName: {
          [Op.or]: ["superadmin", "developer"],
        },
      },
      attributes: ["id"], // Fetch only the IDs
      raw: true,
    });

    const validRoleIds = superadminAndDeveloperRoles.map((role) => role.id);

    const getBranchIds = await manager_credentials.findOne({
      where: {
        id: superadminId,
        roleId: {
          [Op.in]: validRoleIds, // Accept both "superadmin" and "developer"
        },
      },
    });

    if (!getBranchIds) {
      return res.status(400).json({
        error: "superadminId not exist.",
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
      attributes: ["id", "branchId", "username"],
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

    // Exclude superadminId from req.query
    const queryWithoutSuperadminId = { ...req.query };
    delete queryWithoutSuperadminId.superadminId;

    // Fetch member details where field manager ID is in the list
    const members = await member_details.findAll({
      where: {
        loanType: "Business Loan",
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
        ...queryWithoutSuperadminId,
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
              as: "fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId",
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
