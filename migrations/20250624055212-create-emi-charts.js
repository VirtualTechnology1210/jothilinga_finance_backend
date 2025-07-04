"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("emi_charts", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      loanAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      loanDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      emiDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tenureMonths: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      emiChart: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      totalInterest: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("draft", "submitted", "approved", "rejected", "active", "completed"),
        defaultValue: "submitted",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("emi_charts");
  },
};
