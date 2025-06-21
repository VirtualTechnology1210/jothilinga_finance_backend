"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("nature_of_business", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      businessCategoryId: {
        type: Sequelize.INTEGER,
        references: { model: "business_categories", key: "id" },
      },
      natureOfBusiness: {
        type: Sequelize.STRING,
        allowNull: true,
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
    await queryInterface.dropTable("nature_of_business");
  },
};
