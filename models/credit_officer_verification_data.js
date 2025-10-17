"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class credit_officer_verification_data extends Sequelize.Model {
    static associate(models) {
      // define association here
      credit_officer_verification_data.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "creditOfficerVerificationData", // Alias for the relationship
      });
    }
  }

  credit_officer_verification_data.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memberType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fieldName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fieldValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "credit_officer_verification_data",
      freezeTableName: true,
    }
  );

  return credit_officer_verification_data;
};
