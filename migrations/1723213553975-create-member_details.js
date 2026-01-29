"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("member_details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ApplicationId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      fieldManagerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      memberName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
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
      usePermanentAddressAsCurrentAddress: {
        type: Sequelize.BOOLEAN,
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
      fieldManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      fieldManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fieldManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      branchManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      branchManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      branchManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      creditOfficerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      creditOfficerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      creditOfficerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      misStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      misMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      misStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      creditManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      creditManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      creditManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      sanctionCommitteeStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      sanctionCommitteeMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sanctionCommitteeStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      accountManagerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      accountManagerMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      accountManagerStatusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cbReport: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coApplicantCbReport: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      creditManagerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      loanId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sanctionedLoanAmountByCreditManager: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      sanctionedLoanAmountBySanctionCommittee: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      transactionAccountNumber: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      transactionRefNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transactionDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      transactionAmount: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      processingCharge: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isProcessingChargePaid: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      gst: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isGstPaid: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      securityDeposit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isSecurityDepositPaid: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      isLoanInsured: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      insuranceAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isInsuranceAmountPaid: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      amountToRelease: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      applicantIncome: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      coApplicantIncome: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      otherIncome: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      businessExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      householdExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      otherExpenses: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      existingEmi: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      balance: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sanctionedLoanAmountByCreditOfficer: {
        type: Sequelize.INTEGER,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("member_details");
  },
};
