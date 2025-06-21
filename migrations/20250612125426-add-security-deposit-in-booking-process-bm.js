module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns
      const columns = [
        {
          name: "securityDeposit",
          type: Sequelize.DECIMAL(10, 2),
          after: "grandTotal",
          allowNull: false,
        },
      ];

      for (const column of columns) {
        await queryInterface.addColumn(
          "booking_process_bm",
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
      const columns = ["securityDeposit"];

      for (const column of columns) {
        await queryInterface.removeColumn("booking_process_bm", column, {
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
