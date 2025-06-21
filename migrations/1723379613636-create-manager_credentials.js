"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("manager_credentials", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      username: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      password: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      roleId: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      branchId: {
        allowNull: true,
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("manager_credentials");
  },
};
