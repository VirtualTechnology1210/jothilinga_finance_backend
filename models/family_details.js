"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize) => {
  class family_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      family_details.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "member", // Alias for the relationship
      });
      family_details.hasOne(models.family_business_details, {
        foreignKey: "familyMemberId",
        as: "familyBusinessDetails",
      });
    }
  }

  family_details.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        references: { model: "member_details", key: "id" },
        unique: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      coApplicantName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      relation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      phoneNumber: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      useSameFieldsFromApplicant: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      residenceType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stayingStabilityInYears: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stayingStabilityInMonths: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      aadharNo: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      isPanNo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      panNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      anotherIdentity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      anotherIdentityId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ebNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      familyCardNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rationShopNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      permanentDoorNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      permanentStreetNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      permanentPanchayat: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      permanentTaluk: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      permanentDistrict: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      permanentPincode: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      currentDoorNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentStreetNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentPanchayat: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentTaluk: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentDistrict: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentPincode: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "family_details",
      freezeTableName: true,
    }
  );

  return family_details;
};
