"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class foreclosure_approval extends Sequelize.Model {
    static associate(models) {
      // define association here
      foreclosure_approval.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "fk_foreclosure_approval_belongsTo_member_details_memberId", // Alias for the relationship
      });
      foreclosure_approval.hasMany(models.foreclosure_denominations, {
        foreignKey: "foreclosureId",
        as: "fk_foreclosure_approval_hasMany_foreclosure_denominations_foreclosureId", // Alias for the relationship
      });
    }
  }

  foreclosure_approval.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
      },
      forecloseChargesPercentage: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      forecloseChargesAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      forecloseGstPercentage: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      forecloseGstAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      totalOutstandingAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      totalPayableAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      branchManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      branchManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      branchManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      accountManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      accountManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      accountManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "foreclosure_approval",
      freezeTableName: true,
    }
  );

  return foreclosure_approval;
};
