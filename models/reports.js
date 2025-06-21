"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class reports extends Sequelize.Model {
    static associate(models) {
      // define association here
      reports.hasMany(models.permissions, {
        foreignKey: "reportId",
        as: "fk_reports_hasMany_permissions_reportId",
      });
    }
  }

  reports.init(
    {
      // Define attributes here
      reportName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "reports",
    }
  );

  return reports;
};
