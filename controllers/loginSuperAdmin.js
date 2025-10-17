const {
  manager_credentials,
  roles,
  branch,
  permissions,
  reports,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

module.exports = loginSuperAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { username, password } = req.body;

    const manager = await manager_credentials.findOne({
      where: { username },
      transaction,
    });

    if (!manager) {
      await transaction.rollback();
      // If the user is not found, return an error
      return res.status(404).json({ error: "Invalid username." });
    }

    if (manager.password !== password) {
      await transaction.rollback();
      // If the passwords don't match, return an error
      return res.status(401).json({ error: "Invalid password." });
    }

    // Fetch role IDs for the allowed roles
    const allowedRoles = await roles.findAll({
      where: {
        roleName: {
          [Op.in]: [
            "Branch Manager",
            "Credit Officer",
            "MIS",
            "Credit Manager",
            "Sanction Committee",
            "Accounts Manager",
            "superadmin",
            "developer",
          ],
        },
      },
      transaction,
    });

    const allowedRoleIds = allowedRoles.map((role) => role.id);

    if (!allowedRoleIds.includes(manager.roleId)) {
      await transaction.rollback();
      // If the role is not allowed, return an error
      return res.status(403).json({ error: "Unauthorized role." });
    }

    // Fetch permissions associated with the role
    const rolePermissions = await permissions.findAll({
      where: {
        roleId: manager.roleId,
        view: true, // Assuming we only want to include permissions with view = true
      },
      include: [
        {
          model: reports,
          as: "fk_permissions_belongsTo_reports_reportId",
          attributes: ["id", "reportName"],
        },
      ],
      transaction,
    });
    console.log("rolePermissions: " + JSON.stringify(rolePermissions));

    // Format permissions data to include report names and permission details
    const permissionsData = rolePermissions.map((permission) => ({
      reportId: permission.reportId,
      reportName:
        permission.fk_permissions_belongsTo_reports_reportId.reportName,
      view: permission.view,
    }));

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Login successful.",
      user: {
        id: manager.id,
        username: manager.username,
      },
      userType: allowedRoles.find((role) => role.id === manager.roleId)
        .roleName,
      permissions: permissionsData,
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
