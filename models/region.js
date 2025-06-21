
'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class region extends Sequelize.Model {
    static associate(models) {
      // define association here
      region.hasMany(models.division, {
        foreignKey: "regionId",
        as: "regionDetails", // Alias for the relationship
      });
    }
  }

  region.init({
    // Define attributes here
    regionName: {
      allowNull: true,
      type: Sequelize.STRING,
      unique: true,
    },
    regionCode: {
      allowNull: true,
      type: Sequelize.STRING,
      unique: true,
    },
  }, {
    sequelize,
    modelName: 'region',
    freezeTableName: true,
  });

  return region;
};
