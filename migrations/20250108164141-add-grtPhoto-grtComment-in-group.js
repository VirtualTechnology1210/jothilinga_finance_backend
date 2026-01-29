module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "group",
        "grtPhoto",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "cgt2Comment",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "group",
        "grtComment",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "grtPhoto",
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
      await queryInterface.removeColumn("group", "grtPhoto", {
        transaction,
      });
      await queryInterface.removeColumn("group", "grtComment", {
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
