module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = [
        {
          name: "totalIncomeVerifiedByCreditManager",
          type: Sequelize.DOUBLE,
          after: "pdf2",
          allowNull: true,
        },
        {
          name: "totalExpensesVerifiedByCreditManager",
          type: Sequelize.DOUBLE,
          after: "totalIncomeVerifiedByCreditManager",
          allowNull: true,
        },
        {
          name: "noOfLoansVerifiedByCreditManager",
          type: Sequelize.INTEGER,
          after: "totalExpensesVerifiedByCreditManager",
          allowNull: true,
        },
        {
          name: "emiVerifiedByCreditManager",
          type: Sequelize.INTEGER,
          after: "noOfLoansVerifiedByCreditManager",
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
      const columns = [
        "totalIncomeVerifiedByCreditManager",
        "totalExpensesVerifiedByCreditManager",
        "noOfLoansVerifiedByCreditManager",
        "emiVerifiedByCreditManager",
      ];

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
