"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("receipts", "upi_payment", {
      type: Sequelize.STRING,  
      allowNull: true,         
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("receipts", "upi_payment");
  },
};
