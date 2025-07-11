"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class family_business_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      family_business_details.belongsTo(models.family_details, {
        foreignKey: "familyMemberId",
        as: "familyDetails",
      });

      family_business_details.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "memberDetails",
      });
    }
  }

  family_business_details.init(
    {
      // Define attributes here
      familyMemberId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "family_details", // References the family_details table
          key: "id",
        },
        unique: true,
      },
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "member_details", // References the member_details table
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
      modelName: "family_business_details",
      freezeTableName: true,
    }
  );

  return family_business_details;
};
