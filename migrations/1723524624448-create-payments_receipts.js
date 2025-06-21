"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("payments_receipts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      date: {
        allowNull: true,
        type: Sequelize.DATEONLY,
      },
      narration: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      paymentAmount: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      receiptAmount: {
        allowNull: true,
        type: Sequelize.DOUBLE,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("payments_receipts");
  },
};
