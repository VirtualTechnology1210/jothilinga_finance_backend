'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add impsCharge column to member_details table
    await queryInterface.addColumn('member_details', 'impsCharge', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    // Add isImpsPaid column to member_details table
    await queryInterface.addColumn('member_details', 'isImpsPaid', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove columns if needed to rollback
    await queryInterface.removeColumn('member_details', 'impsCharge');
    await queryInterface.removeColumn('member_details', 'isImpsPaid');
  }
};
