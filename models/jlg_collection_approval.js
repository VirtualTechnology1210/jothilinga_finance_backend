"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class jlg_collection_approval extends Sequelize.Model {
    static associate(models) {
      // define association here
      jlg_collection_approval.belongsTo(models.center, {
        foreignKey: "centerId",
        as: "fk_jlg_collection_approval_belongsTo_center_centerId", // Alias for the relationship
      });
      jlg_collection_approval.hasMany(models.jlg_denominations, {
        foreignKey: "jlgCollectionId",
        as: "fk_jlg_collection_approval_hasMany_jlg_denominations_jlgCollectionId", // Alias for the relationship
      });
    }
  }

  jlg_collection_approval.init(
    {
      // Define attributes here
      centerId: {
        type: Sequelize.INTEGER,
        references: { model: "center", key: "id" },
      },
      managerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      emiDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      emiAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      receivedAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      collectionPhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receiptNo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      collectedDate: {
        type: Sequelize.DATE,
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
      modelName: "jlg_collection_approval",
      freezeTableName: true,
    }
  );

  return jlg_collection_approval;
};
