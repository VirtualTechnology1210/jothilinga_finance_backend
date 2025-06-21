const { roles, reports, permissions } = require("../models");
const { Op } = require("sequelize");

module.exports = getPermissionsMatrix = async (req, res) => {
  try {
    // Fetch all roles
    const allRoles = await roles.findAll({
      attributes: ["id", "roleName"],
      where: {
        roleName: {
          [Op.notIn]: ["developer", "superadmin"], // Exclude multiple roles
        },
      },
      raw: true,
    });

    // Fetch all reports
    const allReports = await reports.findAll({
      attributes: ["id", "reportName"],
      raw: true,
    });

    // Fetch permissions
    const allPermissions = await permissions.findAll({
      attributes: ["roleId", "reportId", "view"],
      raw: true,
    });

    // Create a matrix structure
    const matrix = allReports.map((report) => {
      const row = { reportId: report.id, reportName: report.reportName };
      allRoles.forEach((role) => {
        const permission = allPermissions.find(
          (perm) => perm.roleId === role.id && perm.reportId === report.id
        );
        row[role.roleName] = permission ? permission.view : false;
      });
      return row;
    });

    res.status(200).json({ roles: allRoles, matrix });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
