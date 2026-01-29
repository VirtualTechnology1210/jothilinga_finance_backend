"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class business_categories extends Sequelize.Model {
    static associate(models) {
      // define association here
      this.hasMany(models.nature_of_business, {
        foreignKey: "businessCategoryId",
        as: "natureOfBusinesses",
      });
    }
  }

  business_categories.init(
    {
      // Define attributes here
      business_category: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "business_categories",
      freezeTableName: true,
    }
  );

  return business_categories;
};
