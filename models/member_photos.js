"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class member_photos extends Sequelize.Model {
    static associate(models) {
      // define association here
      member_photos.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "memberPhotos", // Alias for the relationship
      });
    }
  }

  member_photos.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      anotherIdentity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      memberPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aadharFrontPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aadharBackPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      anotherIdentityPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rationCardPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bankPassbookPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      businessProofPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ownHouseProofPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      applicantLinkProofPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      signaturePhoto: {
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
      other3: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "member_photos",
      freezeTableName: true,
    }
  );

  return member_photos;
};
