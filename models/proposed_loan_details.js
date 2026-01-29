"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class proposed_loan_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "memberProposedLoanDetails", // Alias for the relationship
      });
      this.belongsTo(models.funding_agencies, {
        foreignKey: "fundingAgencyId",
        as: "fk_proposed_loan_details_belongsTo_funding_agencies_fundingAgencyId", // Alias for the relationship
      });
    }
  }

  proposed_loan_details.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      applicantName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      coApplicant1: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emiDate: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      loanAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      monthlyEmi: {
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
      houseHoldExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      otherExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      fundingAgencyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ornament_modelNo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ornament_wt: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "proposed_loan_details",
      freezeTableName: true,
    }
  );

  return proposed_loan_details;
};
