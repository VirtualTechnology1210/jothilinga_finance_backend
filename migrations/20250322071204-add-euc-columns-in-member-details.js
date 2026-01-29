module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = [
        {
          name: "isEucDone",
          type: Sequelize.BOOLEAN,
          after: "fedLanNo",
          allowNull: true,
        },
        {
          name: "isPurposeFullfill",
          type: Sequelize.BOOLEAN,
          after: "isEucDone",
          allowNull: true,
        },
        {
          name: "eucComment",
          type: Sequelize.STRING,
          after: "isPurposeFullfill",
          allowNull: true,
        },
        {
          name: "eucPhoto",
          type: Sequelize.STRING,
          after: "eucComment",
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
        "isEucDone",
        "isPurposeFullfill",
        "eucComment",
        "eucPhoto",
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
