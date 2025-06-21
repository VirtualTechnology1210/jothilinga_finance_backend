module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns
      const columns = [
        {
          name: "bcOrOwn",
          type: Sequelize.STRING,
          after: "agencyName",
          allowNull: true,
        },
        {
          name: "fundingAgencyCode",
          type: Sequelize.STRING,
          after: "bcOrOwn",
          allowNull: true,
        },
        {
          name: "blProcessingFeePercentage",
          type: Sequelize.DOUBLE,
          after: "fundingAgencyCode",
          allowNull: true,
        },
        {
          name: "jlgProcessingFeePercentage",
          type: Sequelize.DOUBLE,
          after: "blProcessingFeePercentage",
          allowNull: true,
        },
        {
          name: "gstPercentage",
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
          bcOrOwn = CASE 
                      WHEN agencyName = 'own funding' THEN 'OWN'
                      ELSE 'BC'
                    END,
          fundingAgencyCode = agencyName,
          blProcessingFeePercentage = 2.5,
          jlgProcessingFeePercentage = 2,
          gstPercentage = 18
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
      const columns = [
        "bcOrOwn",
        "fundingAgencyCode",
        "blProcessingFeePercentage",
        "jlgProcessingFeePercentage",
        "gstPercentage",
      ];

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
