"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch the role ID where roleName is 'superadmin'
    const [role] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE roleName = 'superadmin' LIMIT 1;`
    );

    if (role.length === 0) {
      throw new Error("Role 'superadmin' not found in roles table.");
    }

    const roleId = role[0].id; // Get the id of the role

    await queryInterface.bulkInsert(
      "manager_credentials",
      [
        {
          username: "vetrivikas",
          password: "123", // Ideally, you should hash the password
          roleId: roleId, // Use the fetched role ID
          employeeName: "vetrivikas",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove the inserted manager credential
    await queryInterface.bulkDelete(
      "manager_credentials",
      { username: "vetrivikas" },
      {}
    );
  },
};
