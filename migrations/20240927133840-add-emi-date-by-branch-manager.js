module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 1: Add emiDateByBranchManager column to member_details after the sanctionedLoanAmountByCreditOfficer column
      await queryInterface.addColumn(
        "member_details",
        "emiDateByBranchManager",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          after: "sanctionedLoanAmountByCreditOfficer",
        },
        { transaction } // Ensure this operation is part of the transaction
      );

      // Step 2: Update emiDateByBranchManager with values from proposed_loan_details where branchManagerStatus = 'disbursed'
      await queryInterface.sequelize.query(
        `
        UPDATE member_details
        SET emiDateByBranchManager = (
          SELECT pld.emiDate
          FROM proposed_loan_details pld
          WHERE pld.memberId = member_details.id
        )
        WHERE branchManagerStatus = 'disbursed'
        `,
        { transaction } // Ensure this operation is part of the transaction
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
      // Remove emiDateByBranchManager column from member_details
      await queryInterface.removeColumn(
        "member_details",
        "emiDateByBranchManager",
        {
          transaction,
        }
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
