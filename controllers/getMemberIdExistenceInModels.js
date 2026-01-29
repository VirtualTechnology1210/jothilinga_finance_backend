const {
  member_business_details,
  loan_details,
  proposed_loan_details,
  bank_details,
} = require("../models");

module.exports = getMemberIdExistenceInModels = async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Check if memberId exists in member_business_details
    const businessDetailsRecord = await member_business_details.findOne({
      where: { ApplicantId: memberId },
    });

    // Check if memberId exists in loan_details
    const loanDetailsRecord = await loan_details.findOne({
      where: { memberId: memberId },
    });

    const proposedLoanDetailsRecord = await proposed_loan_details.findOne({
      where: { memberId: memberId },
    });

    const bankDetailsRecord = await bank_details.findOne({
      where: { memberId: memberId },
    });

    // Prepare the response messages
    const businessDetailsMessage = businessDetailsRecord
      ? "Member Id found in business details"
      : "Member Id not found in business details";

    const loanDetailsMessage = loanDetailsRecord
      ? "Member Id found in loan details"
      : "Member Id not found in loan details";

    const proposedLoanDetailsMessage = proposedLoanDetailsRecord
      ? "Member Id found in proposed loan details"
      : "Member Id not found in proposed loan details";

    const bankDetailsMessage = bankDetailsRecord
      ? "Member Id found in bank details"
      : "Member Id not found in bank details";

    res.status(200).json({
      businessDetailsMessage: businessDetailsMessage,
      loanDetailsMessage: loanDetailsMessage,
      proposedLoanDetailsMessage: proposedLoanDetailsMessage,
      bankDetailsMessage: bankDetailsMessage,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
