"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Insert all reports manually
      await queryInterface.bulkInsert(
        "reports",
        [
          {
            reportName: "jlgCollectionSheetReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Fetch inserted reports
      const insertedReports = await queryInterface.sequelize.query(
        `SELECT id, reportName FROM reports WHERE reportName IN (
          'jlgCollectionSheetReport'
        )`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Fetch roles
      const roles = await queryInterface.sequelize.query(
        `SELECT id, roleName FROM roles`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!Array.isArray(roles) || !Array.isArray(insertedReports)) {
        throw new Error("Failed to fetch roles or reports.");
      }

      // Prepare permissions
      const permissionEntries = [];
      for (const role of roles) {
        for (const report of insertedReports) {
          permissionEntries.push({
            roleId: role.id,
            reportId: report.id,
            view:
              role.roleName === "superadmin" || role.roleName === "developer",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

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
      const reportNames = ["jlgCollectionSheetReport"];

      // Get the report IDs
      const reports = await queryInterface.sequelize.query(
        `SELECT id FROM reports WHERE reportName IN (:reportNames)`,
        {
          replacements: { reportNames },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const reportIds = reports.map((r) => r.id);

      // Delete only permissions related to those reports
      await queryInterface.bulkDelete(
        "permissions",
        {
          reportId: reportIds,
        },
        { transaction }
      );

      // Delete the reports themselves
      await queryInterface.bulkDelete(
        "reports",
        { reportName: reportNames },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
