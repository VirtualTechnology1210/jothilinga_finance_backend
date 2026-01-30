'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add securityDeposit column
    await queryInterface.addColumn('foreclosure_approval', 'securityDeposit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    // Add netPayableAmount column
    await queryInterface.addColumn('foreclosure_approval', 'netPayableAmount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('foreclosure_approval', 'securityDeposit');
    await queryInterface.removeColumn('foreclosure_approval', 'netPayableAmount');
  }
};
