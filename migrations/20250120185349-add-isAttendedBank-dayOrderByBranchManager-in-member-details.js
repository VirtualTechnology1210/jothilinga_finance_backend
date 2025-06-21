module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = [
        {
          name: "isAttendedBank",
          type: Sequelize.BOOLEAN,
          after: "hvsAadharNo",
          allowNull: false,
          defaultValue: false,
        },
        {
          name: "dayOrderByBranchManager",
          type: Sequelize.STRING,
          after: "isAttendedBank",
          allowNull: true,
        },
      ];

      for (const column of columns) {
        const columnOptions = {
          type: column.type,
          allowNull: column.allowNull,
          after: column.after,
        };

        if (column.defaultValue !== undefined) {
          columnOptions.defaultValue = column.defaultValue;
        }

        await queryInterface.addColumn(
          "member_details",
          column.name,
          columnOptions,
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
      const columns = ["isAttendedBank", "dayOrderByBranchManager"];

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
