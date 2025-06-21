"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("jlg_denominations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jlgCollectionId: {
        type: Sequelize.INTEGER,
        references: {
          model: "jlg_collection_approval",
          key: "id",
        },
      },
      emiDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      denomination: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable("jlg_denominations");
  },
};
