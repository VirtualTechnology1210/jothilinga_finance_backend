
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('division', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      divisionName: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      divisionCode: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      regionId:{
        allowNull:true,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('division');
  }
};
