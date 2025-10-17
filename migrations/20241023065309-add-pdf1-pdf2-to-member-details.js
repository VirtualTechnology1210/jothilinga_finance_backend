"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Adding new columns pdf1 and pdf2 to member_details
      await queryInterface.addColumn(
        "member_details",
        "pdf1",
        {
          type: Sequelize.TEXT,
          allowNull: true,
          after: "coApplicantCbReport",
        },
        { transaction } // ensure it's inside the transaction
      );

      await queryInterface.addColumn(
        "member_details",
        "pdf2",
        {
          type: Sequelize.TEXT,
          allowNull: true,
          after: "pdf1",
        },
        { transaction } // ensure it's inside the transaction
      );

      // Commit the transaction if all operations succeed
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction if any operation fails
      await transaction.rollback();
      throw error; // rethrow the error to make sure the migration fails
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Reverting the changes (removing pdf1 and pdf2)
      await queryInterface.removeColumn("member_details", "pdf1", {
        transaction,
      });
      await queryInterface.removeColumn("member_details", "pdf2", {
        transaction,
      });

      // Commit the transaction if all operations succeed
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction if any operation fails
      await transaction.rollback();
      throw error; // rethrow the error to ensure the rollback is handled properly
    }
  },
};
