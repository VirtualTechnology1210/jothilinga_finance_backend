"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("bl_denominations", "transactionId", {
      type: Sequelize.STRING,  // or Sequelize.INTEGER, depends on your use case
      allowNull: true,         // change to false if required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("bl_denominations", "transactionId");
  },
};
