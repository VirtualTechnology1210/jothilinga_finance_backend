module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "member_details",
        "centerId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          after: "loanType",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "member_details",
        "groupId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          after: "centerId",
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
      await queryInterface.removeColumn("member_details", "centerId", {
        transaction,
      });
      await queryInterface.removeColumn("member_details", "groupId", {
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
