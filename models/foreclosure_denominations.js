"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class foreclosure_denominations extends Sequelize.Model {
    static associate(models) {
      // define association here
      foreclosure_denominations.belongsTo(models.foreclosure_approval, {
        foreignKey: "foreclosureId",
        as: "fk_foreclosure_denominations_belongsTo_foreclosure_approval_foreclosureId", // Alias for the relationship
      });
    }
  }

  foreclosure_denominations.init(
    {
      // Define attributes here
      foreclosureId: {
        type: Sequelize.INTEGER,
        references: { model: "foreclosure_approval", key: "id" },
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
      modelName: "foreclosure_denominations",
      freezeTableName: true,
    }
  );

  return foreclosure_denominations;
};
