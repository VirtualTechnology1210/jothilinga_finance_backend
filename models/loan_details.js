"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class loan_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "memberLoanDetails", // Alias for the relationship
      });
    }
  }

  loan_details.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      totalloanAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      currentNoOfLoans: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      loanCompanyNames: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      totalmonthlyEmi: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "loan_details",
      freezeTableName: true,
    }
  );

  return loan_details;
};
