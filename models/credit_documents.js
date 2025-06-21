"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class credit_documents extends Sequelize.Model {
    static associate(models) {
      // define association here
      credit_documents.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "creditDocuments", // Alias for the relationship
      });
    }
  }

  credit_documents.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      creditManagerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      businessPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      housePhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      neighbourCheckPhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tradeReferencePhoto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "credit_documents",
      freezeTableName: true,
    }
  );

  return credit_documents;
};
