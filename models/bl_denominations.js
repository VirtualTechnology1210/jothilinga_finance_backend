"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class bl_denominations extends Sequelize.Model {
    static associate(models) {
      // define association here
      bl_denominations.belongsTo(models.bl_collection_approval, {
        foreignKey: "blCollectionId",
        as: "fk_bl_denominations_belongsTo_bl_collection_approval_blCollectionId", // Alias for the relationship
      });
    }
  }

  bl_denominations.init(
    {
      // Define attributes here
      blCollectionId: {
        type: Sequelize.INTEGER,
        references: {
          model: "bl_collection_approval",
          key: "id",
        },
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
      modelName: "bl_denominations",
      freezeTableName: true,
    }
  );

  return bl_denominations;
};
