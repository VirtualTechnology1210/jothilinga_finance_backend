const {
  member_details,
  manager_credentials,
  roles,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getAllMemberDetailsByManagerUsernameAndStatus = async (
  req,
  res
) => {
  const username = req.params.username;
  const queryParams = req.query; // Get all query parameters

  try {
    // Build the `where` clause dynamically
    const whereClause = {};

    // Add the query parameters to the where clause if they exist
    if (queryParams.accountManagerStatus) {
      whereClause.accountManagerStatus = queryParams.accountManagerStatus;
    }
    if (queryParams.creditManagerStatus) {
      whereClause.creditManagerStatus = queryParams.creditManagerStatus;
    }

    const getBranchIds = await manager_credentials.findOne({
      where: {
        username,
      },
    });

    const branchIdsString = getBranchIds.branchId;

    const role = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });

    if (!role) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }

    // Create a query that uses FIND_IN_SET to match branch IDs
    const fieldManagerRecords = await manager_credentials.findAll({
      attributes: ["id"],
      where: {
        roleId: role.id, // Add the roleId condition
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

    const fieldManagerIds = fieldManagerRecords.map((record) => record.id);

    // Fetch member details where field manager ID is in the list
    const memberDetails = await member_details.findAll({
      where: {
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
        ...whereClause,
      },
    });

    res.status(200).json({ list: memberDetails });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
