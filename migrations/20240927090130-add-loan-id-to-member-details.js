module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 2: Insert a row into the 'series' table for loanId
      await queryInterface.bulkInsert(
        "series",
        [
          {
            seriesName: "loanId",
            nextNumber: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction }
      );

      // Step 3: Fetch the nextNumber from the series
      const [seriesRow] = await queryInterface.sequelize.query(
        `SELECT id, nextNumber FROM series WHERE seriesName = 'loanId'`,
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
        WHERE md.branchManagerStatus = 'disbursed'
      `,
        { transaction }
      );

      // Step 5: Update each member's loanId based on 1111 + branchCode + seriesNextNumber
      for (const member of members) {
        const loanId = `1111${member.branchCode}${seriesNextNumber
          .toString()
          .padStart(4, "0")}`;

        await queryInterface.sequelize.query(
          `
          UPDATE member_details
          SET loanId = '${loanId}'
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
        WHERE seriesName = 'loanId'
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
      // Optionally delete the row in series with seriesName 'loanId'
      await queryInterface.bulkDelete(
        "series",
        { seriesName: "loanId" },
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
