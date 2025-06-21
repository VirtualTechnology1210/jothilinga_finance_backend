module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 1: Add customerId column to member_details after the ApplicationId column
      await queryInterface.addColumn(
        "member_details",
        "customerId",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "ApplicationId", // Add customerId after ApplicationId
        },
        { transaction } // Ensure this operation is part of the transaction
      );

      // Step 2: Insert a row into the 'series' table for customerId
      await queryInterface.bulkInsert(
        "series",
        [
          {
            seriesName: "customerId",
            nextNumber: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Step 3: Fetch the nextNumber from the series
      const [seriesRow] = await queryInterface.sequelize.query(
        `SELECT id, nextNumber FROM series WHERE seriesName = 'customerId'`,
        { transaction }
      );

      let seriesNextNumber = seriesRow[0].nextNumber;

      // Step 4: Fetch all member_details and corresponding branchCode via fieldManagerId -> manager_credentials -> branch
      const [members] = await queryInterface.sequelize.query(
        `
        SELECT md.id AS memberId, b.branchCode
        FROM member_details md
        INNER JOIN manager_credentials mc ON md.fieldManagerId = mc.id
        INNER JOIN branch b ON mc.branchId = b.id
      `,
        { transaction }
      );

      // Step 5: Update each member's customerId based on branchCode + seriesNextNumber
      for (const member of members) {
        const customerId = `${member.branchCode}${seriesNextNumber
          .toString()
          .padStart(4, "0")}`;

        await queryInterface.sequelize.query(
          `
          UPDATE member_details
          SET customerId = '${customerId}'
          WHERE id = ${member.memberId}
        `,
          { transaction }
        );

        seriesNextNumber++;
      }

      // Step 6: Update the nextNumber in the series table after processing
      await queryInterface.sequelize.query(
        `
        UPDATE series
        SET nextNumber = ${seriesNextNumber}
        WHERE seriesName = 'customerId'
      `,
        { transaction }
      );

      // Commit the transaction if everything was successful
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove customerId column from member_details
      await queryInterface.removeColumn("member_details", "customerId", {
        transaction,
      });

      // Optionally delete the row in series with seriesName 'customerId'
      await queryInterface.bulkDelete(
        "series",
        { seriesName: "customerId" },
        { transaction }
      );

      // Commit the transaction if the down migration is successful
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  },
};
