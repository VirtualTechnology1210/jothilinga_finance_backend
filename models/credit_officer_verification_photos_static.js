"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class credit_officer_verification_photos_static extends Sequelize.Model {
    static associate(models) {
      // define association here
      credit_officer_verification_photos_static.belongsTo(
        models.member_details,
        {
          foreignKey: "memberId",
          as: "creditOfficerVerificationPhotosStatic", // Alias for the relationship
        }
      );
    }
  }

  credit_officer_verification_photos_static.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      housePhoto1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      housePhoto2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      businessPhoto1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      businessPhoto2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      businessPhoto3: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      businessPhoto4: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      other1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      other2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "credit_officer_verification_photos_static",
      freezeTableName: true,
    }
  );

  return credit_officer_verification_photos_static;
};
