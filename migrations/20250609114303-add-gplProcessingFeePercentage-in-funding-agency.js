module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns
      const columns = [
        {
          name: "gplProcessingFeePercentage",
          type: Sequelize.DOUBLE,
          after: "jlgProcessingFeePercentage",
          allowNull: true,
        },
      ];

      for (const column of columns) {
        await queryInterface.addColumn(
          "funding_agencies",
          column.name,
          {
            type: column.type,
            allowNull: column.allowNull,
            after: column.after,
          },
          { transaction }
        );
      }

      // Update existing rows with default values
      await queryInterface.sequelize.query(
        `
        UPDATE funding_agencies
        SET 
          gplProcessingFeePercentage = 2
        `,
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
      const columns = ["gplProcessingFeePercentage"];

      for (const column of columns) {
        await queryInterface.removeColumn("funding_agencies", column, {
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
