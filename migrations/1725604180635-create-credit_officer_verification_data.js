"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("credit_officer_verification_data", {
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
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fieldName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fieldValue: {
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("credit_officer_verification_data");
  },
};
