"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class credit_analysis extends Sequelize.Model {
    static associate(models) {
      // define association here
      credit_analysis.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "member", // Alias for the relationship
      });
    }
  }

  credit_analysis.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      creditOfficerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberTotalIncome: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberTotalMonthlyEMi: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberTotalHouseHoldExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberOtherExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberMonthlyBalanceAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expectedLoanAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rateOfInterest: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      tenureInMonths: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expectedMonthlyEmi: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      eligibility: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      cbReport: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      creditManagerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "credit_analysis",
      freezeTableName: true,
    }
  );

  return credit_analysis;
};
