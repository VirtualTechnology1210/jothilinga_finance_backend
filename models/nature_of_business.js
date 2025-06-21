"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class nature_of_business extends Sequelize.Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.business_categories, {
        foreignKey: "businessCategoryId",
        as: "businessCategory",
      });
    }
  }

  nature_of_business.init(
    {
      // Define attributes here
      businessCategoryId: {
        type: Sequelize.INTEGER,
        references: { model: "business_categories", key: "id" },
      },
      natureOfBusiness: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "nature_of_business",
      freezeTableName: true,
    }
  );

  return nature_of_business;
};
