"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class member_cro_transfer_history extends Sequelize.Model {
    static associate(models) {
      // define association here
      member_cro_transfer_history.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "fk_member_cro_transfer_history_belongsTo_member_details_memberId", // Alias for the relationship
      });
      member_cro_transfer_history.belongsTo(models.manager_credentials, {
        foreignKey: "fromFieldManagerId",
        as: "fk_member_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId",
      });
      member_cro_transfer_history.belongsTo(models.manager_credentials, {
        foreignKey: "toFieldManagerId",
        as: "fk_member_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId",
      });
    }
  }

  member_cro_transfer_history.init(
    {
      // Define attributes here
      memberId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      fromFieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      toFieldManagerId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      transferDate: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    },
    {
      sequelize,
      modelName: "member_cro_transfer_history",
      freezeTableName: true,
    }
  );

  return member_cro_transfer_history;
};
