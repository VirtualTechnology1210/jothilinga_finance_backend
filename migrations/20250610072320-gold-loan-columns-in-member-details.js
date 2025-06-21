module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns
      const columns = [
        {
          name: "goldRateByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "loanClosureId",
          allowNull: true,
        },
        {
          name: "ornamentModelNoByBm",
          type: Sequelize.STRING,
          after: "goldRateByBm",
          allowNull: true,
        },
        {
          name: "ornamentNameByBm",
          type: Sequelize.STRING,
          after: "ornamentModelNoByBm",
          allowNull: true,
        },
        {
          name: "ornamentWeightByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "ornamentNameByBm",
          allowNull: true,
        },
        {
          name: "ornamentWeightValueByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "ornamentWeightByBm",
          allowNull: true,
        },
        {
          name: "wastageByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "ornamentWeightValueByBm",
          allowNull: true,
        },
        {
          name: "wastageValueByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "wastageByBm",
          allowNull: true,
        },
        {
          name: "totalByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "wastageValueByBm",
          allowNull: true,
        },
        {
          name: "gstByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "totalByBm",
          allowNull: true,
        },
        {
          name: "gstValueByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "gstByBm",
          allowNull: true,
        },
        {
          name: "eligibleLoanAmountByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "gstValueByBm",
          allowNull: true,
        },
        {
          name: "totalLoanAmountByBm",
          type: Sequelize.DECIMAL(10, 2),
          after: "eligibleLoanAmountByBm",
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
        "goldRateByBm",
        "ornamentModelNoByBm",
        "ornamentNameByBm",
        "ornamentWeightByBm",
        "ornamentWeightValueByBm",
        "wastageByBm",
        "wastageValueByBm",
        "totalByBm",
        "gstByBm",
        "gstValueByBm",
        "eligibleLoanAmountByBm",
        "totalLoanAmountByBm",
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
