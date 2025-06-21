"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("center", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      meetingDayOrder: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      meetingTime: {
        allowNull: true,
        type: Sequelize.TIME,
      },
      centerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        unique: true,
      },
      area: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      pincode: {
        allowNull: true,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable("center");
  },
};
