"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class center extends Sequelize.Model {
    static associate(models) {
      // define association here
      center.hasMany(models.group, {
        foreignKey: "centerId",
        as: "fk_center_hasMany_group_centerId", // Alias for the relationship
      });
      center.hasMany(models.member_details, {
        foreignKey: "centerId",
        as: "fk_center_hasMany_member_details_centerId", // Alias for the relationship
      });
      center.hasMany(models.center_cro_transfer_history, {
        foreignKey: "centerId",
        as: "fk_center_hasMany_center_cro_transfer_history_centerId", // Alias for the relationship
      });
      center.hasMany(models.jlg_collection_approval, {
        foreignKey: "centerId",
        as: "fk_center_hasMany_jlg_collection_approval_centerId", // Alias for the relationship
      });
    }
  }

  center.init(
    {
      // Define attributes here
      fieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      meetingDayOrder: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      meetingTime: {
        allowNull: true,
        type: Sequelize.TIME,
      },
      centerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        unique: true,
      },
      area: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      pincode: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      bmMeetingDayOrder: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      bmMeetingTime: {
        allowNull: true,
        type: Sequelize.TIME,
      },
    },
    {
      sequelize,
      modelName: "center",
      freezeTableName: true,
    }
  );

  return center;
};
