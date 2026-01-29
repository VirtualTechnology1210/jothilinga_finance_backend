"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "credit_officer_verification_photos_static",
      {
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
        housePhoto1: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        housePhoto2: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        businessPhoto1: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        businessPhoto2: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        businessPhoto3: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        businessPhoto4: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        other1: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        other2: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        comment: {
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
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("credit_officer_verification_photos_static");
  },
};
