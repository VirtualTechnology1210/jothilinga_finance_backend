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
  credit_analysis,
  sequelize,
} = require("../models");

module.exports = getMemberDetailsForSuperadminAndAccountManagerStatus = async (
  req,
  res
) => {
  const accountManagerStatus = req.query.accountManagerStatus;

  if (!accountManagerStatus) {
    return res.status(400).json({
      error: "accountManagerStatus query parameter is required.",
    });
  }

  try {
    // Fetch member details along with associated data
    const members = await member_details.findAll({
      where: { accountManagerStatus },
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
          model: credit_analysis,
          as: "creditAnalysisDetails", // Ensure this alias matches the association alias
        },
      ],
    });

    if (members.length === 0) {
      return res.status(404).json({ error: "Data not exist." });
    }

    // Structure the response to include all attributes for all members
    const response = members.map((member) => ({
      memberDetails: member.get(),
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
      creditAnalysis: member.creditAnalysisDetails
        ? member.creditAnalysisDetails.get()
        : null,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
