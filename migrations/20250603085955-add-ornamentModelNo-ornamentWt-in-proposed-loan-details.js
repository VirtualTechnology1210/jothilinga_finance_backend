module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn(
          "proposed_loan_details",
          "ornament_modelNo",
          {
            type: Sequelize.STRING,
            allowNull: false,
            after: "fundingAgencyId",
          },
          { transaction }
        ),
        queryInterface.addColumn(
          "proposed_loan_details",
          "ornament_wt",
          {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            after: "ornament_modelNo",
          },
          { transaction }
        ),
      ]);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.removeColumn(
          "proposed_loan_details",
          "ornament_modelNo",
          { transaction }
        ),
        queryInterface.removeColumn("proposed_loan_details", "ornament_wt", {
          transaction,
        }),
      ]);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
