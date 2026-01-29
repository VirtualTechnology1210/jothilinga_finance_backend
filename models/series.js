"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class series extends Sequelize.Model {
    static associate(models) {
      // define association here
    }
  }

  series.init(
    {
      // Define attributes here
      seriesName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nextNumber: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "series",
      freezeTableName: true,
    }
  );

  return series;
};
