"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize) => {
  class member_details extends Sequelize.Model {
    static associate(models) {
      // define association here
      member_details.hasOne(models.family_details, {
        foreignKey: "memberId",
        as: "familyMember", // Alias for the relationship
      });
      member_details.hasOne(models.member_business_details, {
        foreignKey: "ApplicantId",
        as: "businessDetails", // You can use an alias if needed
      });
      member_details.hasOne(models.family_business_details, {
        foreignKey: "memberId",
        as: "familyBusinessDetails",
      });
      member_details.hasOne(models.loan_details, {
        foreignKey: "memberId",
        as: "loanDetails",
      });
      member_details.hasOne(models.proposed_loan_details, {
        foreignKey: "memberId",
        as: "proposedLoanDetails",
      });
      member_details.hasOne(models.bank_details, {
        foreignKey: "memberId",
        as: "bankDetails",
      });
      member_details.hasOne(models.member_photos, {
        foreignKey: "memberId",
        as: "memberPhotoDetails",
      });
      member_details.hasOne(models.nominee_photos, {
        foreignKey: "memberId",
        as: "nomineePhotoDetails",
      });
      member_details.hasOne(models.credit_documents, {
        foreignKey: "memberId",
        as: "creditDocumentsDetails",
      });
      member_details.hasOne(models.credit_analysis, {
        foreignKey: "memberId",
        as: "creditAnalysisDetails",
      });
      member_details.hasMany(models.branch_manager_verification_photos, {
        foreignKey: "memberId",
        as: "branchManagerVerificationPhotosDetails",
      });
      member_details.hasMany(models.credit_officer_verification_photos, {
        foreignKey: "memberId",
        as: "creditOfficerVerificationPhotosDetails",
      });
      member_details.hasMany(models.credit_officer_verification_data, {
        foreignKey: "memberId",
        as: "creditOfficerVerificationDataDetails",
      });
      member_details.hasOne(models.branch_manager_verification_photos_static, {
        foreignKey: "memberId",
        as: "branchManagerVerificationPhotosStaticDetails",
      });
      member_details.hasOne(models.credit_officer_verification_photos_static, {
        foreignKey: "memberId",
        as: "creditOfficerVerificationPhotosStaticDetails",
      });
      member_details.hasMany(models.receipts, {
        foreignKey: "memberId",
        as: "receiptsDetails",
      });
      member_details.hasMany(models.emi_charts, {
        foreignKey: "memberId",
        as: "fk_member_details_hasMany_emi_charts_memberId",
      });
      member_details.hasMany(models.insurance_receipts, {
        foreignKey: "memberId",
        as: "insuranceReceiptsDetails",
      });
      member_details.belongsTo(models.center, {
        foreignKey: "centerId",
        as: "fk_member_details_belongsTo_center_centerId", // Alias for the relationship
      });
      member_details.belongsTo(models.group, {
        foreignKey: "groupId",
        as: "fk_member_details_belongsTo_group_groupId", // Alias for the relationship
      });
      member_details.hasMany(models.member_cro_transfer_history, {
        foreignKey: "memberId",
        as: "fk_member_details_hasMany_member_cro_transfer_history_memberId",
      });
      member_details.hasOne(models.foreclosure_approval, {
        foreignKey: "memberId",
        as: "fk_member_details_hasOne_member_foreclosure_approval_memberId",
      });
      member_details.hasOne(models.booking_process_bm, {
        foreignKey: "memberId",
        as: "fk_member_details_hasOne_booking_process_bm_memberId",
      });
    }
  }

  member_details.init(
    {
      // Define attributes here
      ApplicationId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      customerId: {
        type: Sequelize.STRING,
        allowNull: true,
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
      pdf1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pdf2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      totalIncomeVerifiedByCreditManager: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      totalExpensesVerifiedByCreditManager: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      noOfLoansVerifiedByCreditManager: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      emiVerifiedByCreditManager: {
        type: Sequelize.INTEGER,
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
      impsCharge: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isImpsPaid: {
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
      emiDateByBranchManager: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      loanType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      centerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cgt1: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      cgt2: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      grt: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      hvs: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      hvsPhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hvsComment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hvsAadharNo: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      isAttendedBank: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dayOrderByBranchManager: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fedLanNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isEucDone: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      isPurposeFullfill: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      eucComment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eucPhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eucUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      loanStatus: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "pending",
      },
      loanCloseDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      loanClosureId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      goldRateByBm: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      ornamentModelNoByBm: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      ornamentNameByBm: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      ornamentWeightByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      ornamentWeightValueByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      wastageByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      wastageValueByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      totalByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      gstByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      gstValueByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      eligibleLoanAmountByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      totalLoanAmountByBm: {
        allowNull: true,
        type: Sequelize.DECIMAL(10, 2),
      },
      reasonForContactChange: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contactChangeUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      contactChangeUpdatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "member_details",
      freezeTableName: true,
    }
  );

  return member_details;
};
