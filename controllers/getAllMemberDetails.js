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
  sequelize,
} = require("../models");

module.exports = getAllMemberDetails = async (req, res) => {
  const queryParams = req.query;

  try {
    const whereClause = {};

    // Add the query parameters to the where clause if they exist
    if (queryParams.accountManagerStatus) {
      whereClause.accountManagerStatus = queryParams.accountManagerStatus;
    }
    if (queryParams.creditManagerStatus) {
      whereClause.creditManagerStatus = queryParams.creditManagerStatus;
    }

    // Fetch member details along with associated data
    const memberDetails = await member_details.findAll({
      where: whereClause,
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
      ],
    });

    res.status(200).json(memberDetails);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
