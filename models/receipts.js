"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class receipts extends Sequelize.Model {
    static associate(models) {
      // define association here
      receipts.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "fk_receipts_belongsTo_member_details_memberId", // Alias for the relationship
      });
      receipts.hasOne(models.bl_collection_approval, {
        foreignKey: "receiptId",
        as: "fk_receipts_hasOne_bl_collection_approval_receiptId", // Alias for the relationship
      });
    }
  }

  receipts.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
      },
      managerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      emiDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      emiAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      receivedAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      collectedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "receipts",
      freezeTableName: true,
    }
  );

  return receipts;
};
