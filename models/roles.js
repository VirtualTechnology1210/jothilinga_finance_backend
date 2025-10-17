"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class roles extends Sequelize.Model {
    static associate(models) {
      // define association here
      roles.hasMany(models.manager_credentials, {
        foreignKey: "roleId",
        as: "fk_roles_hasMany_manager_credentials_roleId",
      });
      roles.hasMany(models.permissions, {
        foreignKey: "roleId",
        as: "fk_roles_hasMany_permissions_roleId",
      });
    }
  }

  roles.init(
    {
      // Define attributes here
      roleName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "roles",
    }
  );

  return roles;
};
