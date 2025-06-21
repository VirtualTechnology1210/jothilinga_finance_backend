module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "group",
        "cgt1Photo",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "grt",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "group",
        "cgt1Comment",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "cgt1Photo",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "group",
        "cgt2Photo",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "cgt1Comment",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "group",
        "cgt2Comment",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "cgt2Photo",
        },
        { transaction }
      );

      // Commit the transaction if everything was successful
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("group", "cgt1Photo", {
        transaction,
      });
      await queryInterface.removeColumn("group", "cgt1Comment", {
        transaction,
      });
      await queryInterface.removeColumn("group", "cgt2Photo", {
        transaction,
      });
      await queryInterface.removeColumn("group", "cgt2Comment", {
        transaction,
      });

      // Commit the transaction if the down migration is successful
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  },
};
