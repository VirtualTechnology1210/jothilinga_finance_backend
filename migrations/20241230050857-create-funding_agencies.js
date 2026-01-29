"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table
    await queryInterface.createTable("funding_agencies", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      agencyName: {
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

    // Insert the row with agencyName='own funding'
    await queryInterface.bulkInsert(
      "funding_agencies",
      [
        {
          agencyName: "own funding",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },
  down: async (queryInterface, Sequelize) => {
    // Remove the row with agencyName='own funding'
    await queryInterface.bulkDelete(
      "funding_agencies",
      { agencyName: "own funding" },
      {}
    );

    // Drop the table
    await queryInterface.dropTable("funding_agencies");
  },
};
