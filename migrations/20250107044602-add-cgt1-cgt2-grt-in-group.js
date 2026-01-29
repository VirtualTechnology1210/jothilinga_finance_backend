module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "group",
        "cgt1",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          after: "mobileNumber",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "group",
        "cgt2",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          after: "cgt1",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "group",
        "grt",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          after: "cgt2",
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
      await queryInterface.removeColumn("group", "cgt1", {
        transaction,
      });
      await queryInterface.removeColumn("group", "cgt2", {
        transaction,
      });
      await queryInterface.removeColumn("group", "grt", {
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
