"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class booking_process_bm extends Sequelize.Model {
    static associate(models) {
      // define association here
      booking_process_bm.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "fk_booking_process_bm_belongsTo_member_details_memberId", // Alias for the relationship
      });
      booking_process_bm.hasMany(models.booking_process_denominations, {
        foreignKey: "bookingProcessId",
        as: "fk_booking_process_bm_hasMany_booking_process_denominations_bookingProcessId", // Alias for the relationship
      });
    }
  }

  booking_process_bm.init(
    {
      // Define attributes here
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
      securityDeposit: {
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
    },
    {
      sequelize,
      modelName: "booking_process_bm",
      freezeTableName: true,
    }
  );

  return booking_process_bm;
};
