"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert a row into the series table
    await queryInterface.bulkInsert(
      "series",
      [
        {
          seriesName: "loanClosureId",
          nextNumber: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove the inserted row from series
    await queryInterface.bulkDelete(
      "series",
      { seriesName: "loanClosureId" },
      {}
    );
  },
};
