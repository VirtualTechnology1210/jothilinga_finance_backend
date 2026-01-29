"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class group extends Sequelize.Model {
    static associate(models) {
      // define association here
      group.belongsTo(models.center, {
        foreignKey: "centerId",
        as: "fk_group_belongsTo_center_centerId", // Alias for the relationship
      });
      group.hasMany(models.member_details, {
        foreignKey: "groupId",
        as: "fk_group_hasMany_member_details_groupId", // Alias for the relationship
      });
    }
  }

  group.init(
    {
      // Define attributes here
      centerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      leaderName: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      mobileNumber: {
        allowNull: true,
        type: Sequelize.BIGINT,
        unique: true,
      },
      cgt1: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      cgt2: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      grt: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      cgt1Photo: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      cgt1Comment: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      cgt2Photo: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      cgt2Comment: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      grtPhoto: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      grtComment: {
        allowNull: true,
        type: Sequelize.STRING,
      },
    },
    {
      sequelize,
      modelName: "group",
      freezeTableName: true,
    }
  );

  return group;
};
