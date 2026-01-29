"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("credit_documents", {
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
      creditManagerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      businessPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      housePhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      neighbourCheckPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tradeReferencePhoto: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("credit_documents");
  },
};
