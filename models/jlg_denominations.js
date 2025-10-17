"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class jlg_denominations extends Sequelize.Model {
    static associate(models) {
      // define association here
      jlg_denominations.belongsTo(models.jlg_collection_approval, {
        foreignKey: "jlgCollectionId",
        as: "fk_jlg_denominations_belongsTo_jlg_collection_approval_emiDate", // Alias for the relationship
      });
    }
  }

  jlg_denominations.init(
    {
      // Define attributes here
      jlgCollectionId: {
        type: Sequelize.INTEGER,
        references: {
          model: "jlg_collection_approval",
          key: "id",
        },
      },
      emiDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      denomination: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "jlg_denominations",
      freezeTableName: true,
    }
  );

  return jlg_denominations;
};
