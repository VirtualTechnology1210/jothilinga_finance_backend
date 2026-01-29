"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("reports", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reportName: {
        type: Sequelize.STRING,
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

    await queryInterface.bulkInsert(
      "reports",
      [
        {
          reportName: "futureDemandReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "loanDisbursedReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "masterDataReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "clientProspectReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "outstandingReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "overDueReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "parReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "securityDepositReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "processingChargeReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "collectionReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "demandVsCollectionReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "rejectReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          reportName: "accountStatementReport",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("reports");
  },
};
