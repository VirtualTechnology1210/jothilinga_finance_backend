"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "manager_credentials",
        "employeeName",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "password",
        },
        { transaction } // Ensure this operation is part of the transaction
      );

      await queryInterface.addColumn(
        "manager_credentials",
        "employeeId",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "employeeName",
        },
        { transaction } // Ensure this operation is part of the transaction
      );

      // Update all employeeName to match username and set employeeId as an empty string
      await queryInterface.sequelize.query(
        `UPDATE manager_credentials SET employeeName = username, employeeId = ''`,
        { transaction }
      );

      // Commit the transaction if everything was successful
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("manager_credentials", "employeeName", {
        transaction,
      });
      await queryInterface.removeColumn("manager_credentials", "employeeId", {
        transaction,
      });

      // Commit the transaction if the down migration is successful
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  },
};
