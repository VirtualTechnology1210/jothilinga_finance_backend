// utils/getFieldManagerRecords.js

const { Sequelize, Op } = require("sequelize");
const { roles, manager_credentials } = require("../../models");

async function getFieldManagerRecords({ userId }) {
  try {
    // Fetch role IDs
    const croRole = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });
    const superadminRole = await roles.findOne({
      where: { roleName: "superadmin" },
    });
    const developerRole = await roles.findOne({
      where: { roleName: "developer" },
    });

    if (!croRole || !superadminRole || !developerRole) {
      throw new Error("Required roles are missing");
    }

    // Fetch branch IDs for the given user ID
    const userRecord = await manager_credentials.findOne({
      where: { id: userId },
    });

    if (!userRecord) {
      throw new Error("User record not found");
    }

    const isSuperadminOrDeveloper = [
      superadminRole.id,
      developerRole.id,
    ].includes(userRecord.roleId);

    const branchIdsString = userRecord.branchId;

    // Fetch field manager records based on role and branch IDs
    const fieldManagerRecords = await manager_credentials.findAll({
      attributes: ["id", "branchId", "username"],
      where: {
        roleId: croRole.id,
        ...(isSuperadminOrDeveloper
          ? {}
          : {
              [Op.and]: Sequelize.where(
                Sequelize.fn(
                  "FIND_IN_SET",
                  Sequelize.col("branchId"),
                  branchIdsString
                ),
                { [Op.gt]: 0 }
              ),
            }),
      },
      raw: true,
    });
    const fieldManagerIds = fieldManagerRecords.map((record) => record.id);

    return fieldManagerIds;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = getFieldManagerRecords;
