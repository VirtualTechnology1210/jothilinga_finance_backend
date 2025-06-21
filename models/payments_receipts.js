"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class payments_receipts extends Sequelize.Model {
    static associate(models) {
      // define association here
    }
  }

  payments_receipts.init(
    {
      // Define attributes here
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
    },
    {
      sequelize,
      modelName: "payments_receipts",
      freezeTableName: true,
    }
  );

  return payments_receipts;
};
