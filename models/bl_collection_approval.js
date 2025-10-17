"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class bl_collection_approval extends Sequelize.Model {
    static associate(models) {
      // define association here
      bl_collection_approval.belongsTo(models.receipts, {
        foreignKey: "receiptId",
        as: "fk_bl_collection_approval_belongsTo_receipts_receiptId", // Alias for the relationship
      });
      bl_collection_approval.hasMany(models.bl_denominations, {
        foreignKey: "blCollectionId",
        as: "fk_bl_collection_approval_hasMany_bl_denominations_blCollectionId", // Alias for the relationship
      });
    }
  }

  bl_collection_approval.init(
    {
      // Define attributes here
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
    },
    {
      sequelize,
      modelName: "bl_collection_approval",
      freezeTableName: true,
    }
  );

  return bl_collection_approval;
};
