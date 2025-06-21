module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // First add the column with default value 'pending'
      const columns = [
        {
          name: "loanStatus",
          type: Sequelize.STRING,
          after: "eucPhoto",
          allowNull: true,
          defaultValue: "pending",
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
            defaultValue: column.defaultValue,
          },
          { transaction }
        );
      }

      // Then update the loanStatus to 'opened' for records where branchManagerStatus is 'disbursed'
      await queryInterface.sequelize.query(
        `UPDATE member_details SET loanStatus = 'opened' WHERE branchManagerStatus = 'disbursed'`,
        { transaction }
      );

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
      const columns = ["loanStatus"];

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
