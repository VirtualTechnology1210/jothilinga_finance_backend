"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("permissions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reportId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      view: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch all roles
      const roles = await queryInterface.sequelize.query(
        `SELECT id, roleName FROM roles`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Fetch all reports
      const reports = await queryInterface.sequelize.query(
        `SELECT id FROM reports`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Prepare permission entries
      const permissionEntries = [];

      for (const role of roles) {
        for (const report of reports) {
          permissionEntries.push({
            roleId: role.id,
            reportId: report.id,
            view:
              role.roleName === "superadmin" || role.roleName === "developer", // True for 'superadmin' and 'developer', false for others
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // Bulk insert permissions
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("permissions");
  },
};
