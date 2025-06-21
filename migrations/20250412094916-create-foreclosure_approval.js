"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("foreclosure_approval", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
      },
      forecloseChargesPercentage: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      forecloseChargesAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      forecloseGstPercentage: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      forecloseGstAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      totalOutstandingAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      totalPayableAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      branchManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      branchManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      branchManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      accountManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      accountManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      accountManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("foreclosure_approval");
  },
};
