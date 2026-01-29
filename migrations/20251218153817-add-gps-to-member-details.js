"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("member_details", "latitude", {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: true,
        });
        await queryInterface.addColumn("member_details", "longitude", {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("member_details", "latitude");
        await queryInterface.removeColumn("member_details", "longitude");
    },
};
