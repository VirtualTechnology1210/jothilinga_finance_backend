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
            reportName: "jlgFutureDemandReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgLoanDisbursedReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgMasterDataReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgClientProspectReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgOutstandingReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgOverDueReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgParReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgSecurityDepositReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgProcessingChargeReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgCollectionReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgDemandVsCollectionReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgRejectReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            reportName: "jlgInterestReport",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Fetch inserted reports
      const insertedReports = await queryInterface.sequelize.query(
        `SELECT id, reportName FROM reports WHERE reportName IN (
          'jlgFutureDemandReport',
          'jlgLoanDisbursedReport',
          'jlgMasterDataReport',
          'jlgClientProspectReport',
          'jlgOutstandingReport',
          'jlgOverDueReport',
          'jlgParReport',
          'jlgSecurityDepositReport',
          'jlgProcessingChargeReport',
          'jlgCollectionReport',
          'jlgDemandVsCollectionReport',
          'jlgRejectReport',
          'jlgInterestReport'
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
      const reportNames = [
        "jlgFutureDemandReport",
        "jlgLoanDisbursedReport",
        "jlgMasterDataReport",
        "jlgClientProspectReport",
        "jlgOutstandingReport",
        "jlgOverDueReport",
        "jlgParReport",
        "jlgSecurityDepositReport",
        "jlgProcessingChargeReport",
        "jlgCollectionReport",
        "jlgDemandVsCollectionReport",
        "jlgRejectReport",
        "jlgInterestReport",
      ];

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
