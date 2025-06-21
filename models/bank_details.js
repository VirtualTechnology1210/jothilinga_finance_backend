"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class bank_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "memberBankDetails", // Alias for the relationship
      });
    }
  }

  bank_details.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      bankName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountNumber: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      ifscCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bankBranch: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "bank_details",
      freezeTableName: true,
    }
  );

  return bank_details;
};
