"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("loan_details", {
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
    await queryInterface.dropTable("loan_details");
  },
};
