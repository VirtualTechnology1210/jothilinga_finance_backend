"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("proposed_loan_details", {
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
    await queryInterface.dropTable("proposed_loan_details");
  },
};
