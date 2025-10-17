"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize) => {
  class savings extends Sequelize.Model {
    static associate(models) {
      // define association here
      savings.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "memberDetails",
      });
    }
  }

  savings.init(
    {
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "member_details",
          key: "id",
        },
      },
      savingAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "savings",
      freezeTableName: true,
      timestamps: true,
    }
  );

  return savings;
};
