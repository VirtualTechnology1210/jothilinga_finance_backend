"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Insert report and fetch the inserted ID
      await queryInterface.bulkInsert(
        "reports",
        [
          {
            reportName: "jlgInsuranceReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      const [report] = await queryInterface.sequelize.query(
        `SELECT id FROM reports WHERE reportName = 'jlgInsuranceReport'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Fetch roles
      const roles = await queryInterface.sequelize.query(
        `SELECT id, roleName FROM roles`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!Array.isArray(roles) || !Array.isArray([report])) {
        throw new Error("Failed to fetch roles or report.");
      }

      // Prepare permissions
      const permissionEntries = roles.map((role) => ({
        roleId: role.id,
        reportId: report.id,
        view: role.roleName === "superadmin" || role.roleName === "developer",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Insert permissions
      await queryInterface.bulkInsert("permissions", permissionEntries, {
        transaction,
      });

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get the report ID for 'jlgInsuranceReport'
      const [report] = await queryInterface.sequelize.query(
        `SELECT id FROM reports WHERE reportName = 'jlgInsuranceReport'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!report) {
        throw new Error("Report not found.");
      }

      // Delete only permissions linked to this report
      await queryInterface.bulkDelete(
        "permissions",
        { reportId: report.id },
        { transaction }
      );

      // Delete the report
      await queryInterface.bulkDelete(
        "reports",
        { id: report.id },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
