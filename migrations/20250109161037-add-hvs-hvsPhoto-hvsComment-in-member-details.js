module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = [
        {
          name: "hvs",
          type: Sequelize.BOOLEAN,
          after: "grt",
          allowNull: false,
        },
        {
          name: "hvsPhoto",
          type: Sequelize.STRING,
          after: "hvs",
          allowNull: true,
        },
        {
          name: "hvsComment",
          type: Sequelize.STRING,
          after: "hvsPhoto",
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
      const columns = ["hvs", "hvsPhoto", "hvsComment"];

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
