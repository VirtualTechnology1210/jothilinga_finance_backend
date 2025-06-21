"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("group", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      centerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      leaderName: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      mobileNumber: {
        allowNull: true,
        type: Sequelize.BIGINT,
        unique: true,
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
    await queryInterface.dropTable("group");
  },
};
