"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class center_cro_transfer_history extends Sequelize.Model {
    static associate(models) {
      // define association here
      center_cro_transfer_history.belongsTo(models.center, {
        foreignKey: "centerId",
        as: "fk_center_cro_transfer_history_belongsTo_center_centerId",
      });
      center_cro_transfer_history.belongsTo(models.manager_credentials, {
        foreignKey: "fromFieldManagerId",
        as: "fk_center_cro_transfer_history_belongsTo_manager_credentials_fromFieldManagerId",
      });
      center_cro_transfer_history.belongsTo(models.manager_credentials, {
        foreignKey: "toFieldManagerId",
        as: "fk_center_cro_transfer_history_belongsTo_manager_credentials_toFieldManagerId",
      });
    }
  }

  center_cro_transfer_history.init(
    {
      // Define attributes here
      centerId: {
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
      modelName: "center_cro_transfer_history",
      freezeTableName: true,
    }
  );

  return center_cro_transfer_history;
};
