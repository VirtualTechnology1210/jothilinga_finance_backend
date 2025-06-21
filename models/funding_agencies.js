"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class funding_agencies extends Sequelize.Model {
    static associate(models) {
      // define association here
      funding_agencies.hasMany(models.proposed_loan_details, {
        foreignKey: "fundingAgencyId",
        as: "fk_funding_agencies_hasMany_proposed_loan_details_fundingAgencyId",
      });
    }
  }

  funding_agencies.init(
    {
      // Define attributes here
      agencyName: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      bcOrOwn: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      fundingAgencyCode: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      blProcessingFeePercentage: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      jlgProcessingFeePercentage: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      gplProcessingFeePercentage: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      gstPercentage: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
    },
    {
      sequelize,
      modelName: "funding_agencies",
      freezeTableName: true,
    }
  );

  return funding_agencies;
};
