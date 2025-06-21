"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("member_photos", {
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
      anotherIdentity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      memberPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aadharFrontPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aadharBackPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      anotherIdentityPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rationCardPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bankPassbookPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      businessProofPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ownHouseProofPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      applicantLinkProofPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      signaturePhoto: {
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
      other3: {
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
    await queryInterface.dropTable("member_photos");
  },
};
