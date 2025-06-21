"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class insurance_receipts extends Sequelize.Model {
    static associate(models) {
      // define association here
      insurance_receipts.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "insuranceReceipts", // Alias for the relationship
      });
    }
  }

  insurance_receipts.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
      },
      managerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      disbursionDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      insuranceAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      receivedAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      collectedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "insurance_receipts",
      freezeTableName: true,
    }
  );

  return insurance_receipts;
};
