"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("credit_analysis", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
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
    await queryInterface.dropTable("credit_analysis");
  },
};
