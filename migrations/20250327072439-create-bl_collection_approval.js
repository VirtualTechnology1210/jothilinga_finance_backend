"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("bl_collection_approval", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      receiptId: {
        type: Sequelize.INTEGER,
        references: { model: "receipts", key: "id" },
      },
      collectionPhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receiptNo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fieldManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      fieldManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fieldManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
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
      misStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      misMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      misStatusUpdatedAt: {
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
    await queryInterface.dropTable("bl_collection_approval");
  },
};
