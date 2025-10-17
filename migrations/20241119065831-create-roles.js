"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("roles", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      roleName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Insert default values into the roles table
    await queryInterface.bulkInsert(
      "roles",
      [
        {
          roleName: "superadmin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "Accounts Manager",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "Sanction Committee",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "Credit Manager",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "MIS",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "Credit Officer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "Branch Manager",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "Customer Relationship Officer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          roleName: "developer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    //Map roleName values to roles.id and update manager_credentials.roleId
    const roles = await queryInterface.sequelize.query(
      `SELECT id, roleName FROM roles;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    roles.forEach((role) => {
      roleMap[role.roleName] = role.id;
    });

    // Update manager_credentials with corresponding roleId
    for (const [roleName, roleId] of Object.entries(roleMap)) {
      await queryInterface.sequelize.query(
        `UPDATE manager_credentials SET roleId = :roleId WHERE roleId = :roleName;`,
        {
          replacements: { roleId, roleName },
          type: Sequelize.QueryTypes.UPDATE,
        }
      );
    }

    //Change roleId column type from STRING to INTEGER
    await queryInterface.changeColumn("manager_credentials", "roleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Revert roleId column type back to STRING
    await queryInterface.changeColumn("manager_credentials", "roleId", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Optionally, revert the roleId data back to role names (reverse mapping)
    const roles = await queryInterface.sequelize.query(
      `SELECT id, roleName FROM roles;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    roles.forEach((role) => {
      roleMap[role.id] = role.roleName;
    });

    for (const [roleId, roleName] of Object.entries(roleMap)) {
      await queryInterface.sequelize.query(
        `UPDATE manager_credentials SET roleId = :roleName WHERE roleId = :roleId;`,
        {
          replacements: { roleId, roleName },
          type: Sequelize.QueryTypes.UPDATE,
        }
      );
    }
    await queryInterface.dropTable("roles");
  },
};
