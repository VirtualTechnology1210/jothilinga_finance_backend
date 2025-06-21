module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = [
        {
          name: "bmMeetingDayOrder",
          type: Sequelize.STRING,
          after: "pincode",
        },
        {
          name: "bmMeetingTime",
          type: Sequelize.TIME,
          after: "bmMeetingDayOrder",
        },
      ];

      for (const column of columns) {
        await queryInterface.addColumn(
          "center",
          column.name,
          {
            type: column.type,
            allowNull: true,
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
      const columns = ["bmMeetingDayOrder", "bmMeetingTime"];

      for (const column of columns) {
        await queryInterface.removeColumn("center", column, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
