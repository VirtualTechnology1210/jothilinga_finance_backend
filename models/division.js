
'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class division extends Sequelize.Model {
    static associate(models) {
      // define association here
      division.hasMany(models.branch, {
        foreignKey: "divisionId",
        as: "divisionDetails", // Alias for the relationship
      });
      division.belongsTo(models.region, {
        foreignKey: "regionId",
        as: "region", // Alias for the relationship
      });
    }
  }

  division.init({
    // Define attributes here
    divisionName: {
      allowNull: true,
      type: Sequelize.STRING,
      unique: true,
    },
    divisionCode: {
      allowNull: true,
      type: Sequelize.STRING,
      unique: true,
    },
    regionId:{
      allowNull:true,
      type: Sequelize.INTEGER,
    },
  }, {
    sequelize,
    modelName: 'division',
    freezeTableName: true,
  });

  return division;
};
