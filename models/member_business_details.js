"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class member_business_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      member_business_details.belongsTo(models.member_details, {
        foreignKey: "ApplicantId",
        as: "applicant", // You can use an alias if needed
      });
    }
  }

  member_business_details.init(
    {
      // Define attributes here
      ApplicantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "member_details",
          key: "id",
        },
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceOfIncome: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      relationshipType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      experienceInCurrentCompanyInYears: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      experienceInCurrentCompanyInMonths: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      companyAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      overallExperienceInYears: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      overallExperienceInMonths: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      monthlySalary: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      salaryDate: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shopName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shopAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shopLocation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      businessTypeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      businessType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      natureOfBusinessId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      natureOfBusiness: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stabilityInBusinessInYears: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      stabilityInBusinessInMonths: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      yearsOfStabilityInCurrentAddress: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      monthlyBusinessIncome: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isGstRegistered: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      gstNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isUdhayamRegistered: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      udhayamNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      district: {
        type: Sequelize.STRING,
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
      overallBusinessExperience: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      jobDescription: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dailyIncome: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "member_business_details",
      freezeTableName: true,
    }
  );

  return member_business_details;
};
