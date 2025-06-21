"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("center_cro_transfer_history", {
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
      fromFieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      toFieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      transferDate: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.dropTable("center_cro_transfer_history");
  },
};
