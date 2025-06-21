"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class permissions extends Sequelize.Model {
    static associate(models) {
      // define association here
      permissions.belongsTo(models.roles, {
        foreignKey: "roleId",
        as: "fk_permissions_belongsTo__roles_roleId", // Alias for the relationship
      });
      permissions.belongsTo(models.reports, {
        foreignKey: "reportId",
        as: "fk_permissions_belongsTo_reports_reportId", // Alias for the relationship
      });
    }
  }

  permissions.init(
    {
      // Define attributes here
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reportId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      view: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "permissions",
    }
  );

  return permissions;
};
