"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class branch extends Sequelize.Model {
    static associate(models) {
      // define association here
      branch.belongsTo(models.division, {
        foreignKey: "divisionId",
        as: "division", // Alias for the relationship
      });
    }
  }

  branch.init(
    {
      // Define attributes here
      branchName: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      branchCode: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      divisionId:{
        allowNull:true,
        type: Sequelize.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "branch",
      freezeTableName: true,
    }
  );

  return branch;
};
