module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // First add the column with default value 'pending'
      const columns = [
        {
          name: "loanCloseDate",
          type: Sequelize.DATE,
          after: "loanStatus",
          allowNull: true,
        },
      ];

      for (const column of columns) {
        await queryInterface.addColumn(
          "member_details",
          column.name,
          {
            type: column.type,
            allowNull: column.allowNull,
            after: column.after,
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fix the column name in the down migration to match what we added
      const columns = ["loanCloseDate"];

      for (const column of columns) {
        await queryInterface.removeColumn("member_details", column, {
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
