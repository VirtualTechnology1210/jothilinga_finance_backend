"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class daily_gold_rate extends Sequelize.Model {
    static associate(models) {
      // define association here
    }
  }

  daily_gold_rate.init(
    {
      // Define attributes here

      rateDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
      },
      goldRate22k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "daily_gold_rate",
      freezeTableName: true,
    }
  );

  return daily_gold_rate;
};
