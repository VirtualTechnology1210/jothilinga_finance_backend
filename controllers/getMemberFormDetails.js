const {
  member_details,
  family_details,
  member_business_details,
  family_business_details,
  loan_details,
  proposed_loan_details,
  bank_details,
  member_photos,
  nominee_photos,
  credit_documents,
  branch_manager_verification_photos_static,
  credit_officer_verification_photos_static,
  branch_manager_verification_photos,
  credit_officer_verification_data,
  manager_credentials,
  branch,
  center,
  booking_process_bm,
  booking_process_denominations,
  sequelize,
} = require("../models");

module.exports = getMemberFormDetails = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    // Fetch member details along with associated data
    const member = await member_details.findOne({
      where: { id: memberId },
      include: [
        {
          model: family_details,
          as: "familyMember", // Ensure this alias matches the association alias
        },
        {
          model: member_business_details,
          as: "businessDetails", // Ensure this alias matches the association alias
        },
        {
          model: family_business_details,
          as: "familyBusinessDetails", // Ensure this alias matches the association alias
        },
        {
          model: loan_details,
          as: "loanDetails", // Ensure this alias matches the association alias
        },
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails", // Ensure this alias matches the association alias
        },
        {
          model: bank_details,
          as: "bankDetails", // Ensure this alias matches the association alias
        },
        {
          model: member_photos,
          as: "memberPhotoDetails", // Ensure this alias matches the association alias
        },
        {
          model: nominee_photos,
          as: "nomineePhotoDetails", // Ensure this alias matches the association alias
        },
        {
          model: credit_documents,
          as: "creditDocumentsDetails", // Ensure this alias matches the association alias
        },
        {
          model: branch_manager_verification_photos,
          as: "branchManagerVerificationPhotosDetails", // Ensure this alias matches the association alias
        },
        {
          model: branch_manager_verification_photos_static,
          as: "branchManagerVerificationPhotosStaticDetails", // Ensure this alias matches the association alias
        },
        {
          model: credit_officer_verification_photos_static,
          as: "creditOfficerVerificationPhotosStaticDetails", // Ensure this alias matches the association alias
        },
        {
          model: credit_officer_verification_data,
          as: "creditOfficerVerificationDataDetails", // Ensure this alias matches the association alias
        },
        {
          model: booking_process_bm,
          as: "fk_member_details_hasOne_booking_process_bm_memberId", // Ensure this alias matches the association alias
          include: [
            {
              model: booking_process_denominations,
              as: "fk_booking_process_bm_hasMany_booking_process_denominations_bookingProcessId", // Ensure this alias matches the association alias
            },
          ],
        },
      ],
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    const getBranchId = await manager_credentials.findOne({
      where: {
        id: member.fieldManagerId,
      },
    });

    if (!getBranchId) {
      return res.status(404).json({
        error: "Manager not found",
        message: `No manager found with id: ${member.fieldManagerId}`,
      });
    }

    // console.log("getBranchId: " + JSON.stringify(getBranchId));

    const getBranchName = await branch.findOne({
      where: {
        id: getBranchId.branchId,
      },
    });

    // Check if getBranchName is null
    if (!getBranchName) {
      return res.status(404).json({
        error: "Branch not found",
        message: `No branch found with id: ${getBranchId.branchId}`,
      });
    }
    let getCenterData = {};
    if (member.loanType === "JLG Loan") {
      getCenterData = await center.findOne({
        where: { id: member.centerId },
      });

      if (!getCenterData) {
        return res.status(404).json({
          error: "Center not found",
          message: `No center found with id: ${member.centerId}`,
        });
      }
    }

    // console.log("member: " + JSON.stringify(member));

    // Structure the response to include all attributes
    const response = {
      memberDetails: member.get(),
      branchName: getBranchName.branchName,
      managerName: getBranchId.username,
      coApplicantDetails: member.familyMember
        ? member.familyMember.get()
        : null,
      businessDetails: member.businessDetails
        ? member.businessDetails.get()
        : null,
      familyBusinessDetails: member.familyBusinessDetails
        ? member.familyBusinessDetails.get()
        : null,
      loanDetails: member.loanDetails ? member.loanDetails.get() : null,
      proposedLoanDetails: member.proposedLoanDetails
        ? member.proposedLoanDetails.get()
        : null,
      bankDetails: member.bankDetails ? member.bankDetails.get() : null,
      memberDocuments: member.memberPhotoDetails
        ? member.memberPhotoDetails.get()
        : null,
      nomineeDocuments: member.nomineePhotoDetails
        ? member.nomineePhotoDetails.get()
        : null,
      creditDocuments: member.creditDocumentsDetails
        ? member.creditDocumentsDetails.get()
        : null,
      branchManagerVerificationPhotosDetails:
        member.branchManagerVerificationPhotosDetails || [],
      branchManagerVerificationPhotosStaticDetails:
        member.branchManagerVerificationPhotosStaticDetails
          ? member.branchManagerVerificationPhotosStaticDetails.get()
          : null,
      creditOfficerVerificationPhotosStaticDetails:
        member.creditOfficerVerificationPhotosStaticDetails
          ? member.creditOfficerVerificationPhotosStaticDetails.get()
          : null,
      creditOfficerVerificationDataDetails:
        member.creditOfficerVerificationDataDetails || [],
      center: getCenterData,
      bookingProcessDetails:
        member.fk_member_details_hasOne_booking_process_bm_memberId
          ? member.fk_member_details_hasOne_booking_process_bm_memberId.get()
          : null,
      denominations: member.fk_member_details_hasOne_booking_process_bm_memberId
        ? member.fk_member_details_hasOne_booking_process_bm_memberId
            .fk_booking_process_bm_hasMany_booking_process_denominations_bookingProcessId
        : [],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
