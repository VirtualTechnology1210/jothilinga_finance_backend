"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("booking_process_bm", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
      },
      goldRate: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      ornamentModelNo: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      ornamentName: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      ornamentWeight: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      ornamentWeightValue: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      wastage: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      wastageValue: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      gst: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      gstValue: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      grandTotal: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      ornamentPhoto: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      bookingReceipt: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      customerLivePhoto: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      others1: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      others2: {
        allowNull: true,
        type: Sequelize.STRING,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("booking_process_bm");
  },
};
