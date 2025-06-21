"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class manager_credentials extends Sequelize.Model {
    static associate(models) {
      // define association here
      manager_credentials.belongsTo(models.roles, {
        foreignKey: "roleId",
        as: "fk_manager_credentials_belongsTo_roles_roleId", // Alias for the relationship
      });
      manager_credentials.hasMany(models.center_cro_transfer_history, {
        foreignKey: "fromFieldManagerId",
        as: "fk_manager_credentials_hasMany_center_cro_transfer_history_fromFieldManagerId", // Alias for the relationship
      });
      manager_credentials.hasMany(models.center_cro_transfer_history, {
        foreignKey: "toFieldManagerId",
        as: "fk_manager_credentials_hasMany_center_cro_transfer_history_toFieldManagerId", // Alias for the relationship
      });
      manager_credentials.hasMany(models.member_cro_transfer_history, {
        foreignKey: "fromFieldManagerId",
        as: "fk_manager_credentials_hasMany_member_cro_transfer_history_fromFieldManagerId", // Alias for the relationship
      });
      manager_credentials.hasMany(models.member_cro_transfer_history, {
        foreignKey: "toFieldManagerId",
        as: "fk_manager_credentials_hasMany_member_cro_transfer_history_toFieldManagerId", // Alias for the relationship
      });
    }
  }

  manager_credentials.init(
    {
      // Define attributes here
      username: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      password: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      employeeName: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      employeeId: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      roleId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      branchId: {
        allowNull: true,
        type: Sequelize.STRING,
      },
    },
    {
      sequelize,
      modelName: "manager_credentials",
      freezeTableName: true,
    }
  );

  return manager_credentials;
};
