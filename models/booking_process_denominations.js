"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class booking_process_denominations extends Sequelize.Model {
    static associate(models) {
      // define association here
      booking_process_denominations.belongsTo(models.booking_process_bm, {
        foreignKey: "bookingProcessId",
        as: "fk_booking_process_denominations_belongsTobooking_process_bm_bookingProcessId", // Alias for the relationship
      });
    }
  }

  booking_process_denominations.init(
    {
      // Define attributes here
      bookingProcessId: {
        type: Sequelize.INTEGER,
        references: {
          model: "booking_process_bm",
          key: "id",
        },
      },
      denomination: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "booking_process_denominations",
      freezeTableName: true,
    }
  );

  return booking_process_denominations;
};
