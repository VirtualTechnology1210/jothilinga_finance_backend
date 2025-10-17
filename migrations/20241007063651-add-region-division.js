'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Step 1: Add the new divisionId column to the branch table
    await queryInterface.addColumn('branch', 'divisionId', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Change to false if you want to make it mandatory
      after: "branchCode",
      references: {
        model: 'division',  // Reference the division table
        key: 'id'           // Reference to the primary key
      }
    });

    // Step 2: Insert new region
    await queryInterface.bulkInsert('region', [{
      regionName: 'Tamilnadu',
      regionCode: '01',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Fetch the newly inserted region's id
    const [newRegionResult] = await queryInterface.sequelize.query(
      `SELECT id FROM region WHERE regionName = 'Tamilnadu' LIMIT 1;`
    );
    const newRegion = newRegionResult[0];  // Extract the actual data from the query result

    // Step 3: Insert new division associated with the new region
    await queryInterface.bulkInsert('division', [{
      divisionName: 'Madurai',
      divisionCode: '1111',
      regionId: newRegion.id,  // Use the regionId from the region fetched in step 1
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Fetch the newly inserted division's id
    const [newDivisionResult] = await queryInterface.sequelize.query(
      `SELECT id FROM division WHERE divisionName = 'Madurai' LIMIT 1;`
    );
    const newDivision = newDivisionResult[0];  // Extract the actual data from the query result

    // Step 4: Update existing rows in branch table to associate them with the new division
    await queryInterface.bulkUpdate('branch', {
      divisionId: newDivision.id, // Use the divisionId from the division fetched in step 2
      updatedAt: new Date()
    }, {
      divisionId: null // Condition to find rows that you want to update, assuming these rows don't have a division yet
    });
  },

  async down (queryInterface, Sequelize) {
    // Step 5: Revert changes made in the up migration
    // Remove the new division
    await queryInterface.bulkDelete('division', {
      divisionName: 'Madurai'
    });

    // Remove the new region
    await queryInterface.bulkDelete('region', {
      regionName: 'Tamilnadu'
    });

    // Reset divisionId in the branch table to null (if needed)
    await queryInterface.bulkUpdate('branch', {
      divisionId: null
    }, {
      divisionId: Sequelize.literal('(SELECT id FROM division WHERE divisionName = \'Madurai\')')
    });

    // Step 6: Remove the divisionId column from the branch table
    await queryInterface.removeColumn('branch', 'divisionId');
  }
};
