"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class credit_officer_verification_photos extends Sequelize.Model {
    static associate(models) {
      // define association here
      credit_officer_verification_photos.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "creditOfficerVerificationPhotos", // Alias for the relationship
      });
    }
  }

  credit_officer_verification_photos.init(
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
      photoName: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fileName: {
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
      photoUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "credit_officer_verification_photos",
      freezeTableName: true,
    }
  );

  return credit_officer_verification_photos;
};
