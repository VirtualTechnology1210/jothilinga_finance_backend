module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "proposed_loan_details",
        "fundingAgencyId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          after: "otherExpenses",
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE proposed_loan_details
        SET fundingAgencyId = (
          SELECT fg.id
          FROM funding_agencies fg
          WHERE fg.agencyName = 'own funding'
        )
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
      await queryInterface.removeColumn(
        "proposed_loan_details",
        "fundingAgencyId",
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
