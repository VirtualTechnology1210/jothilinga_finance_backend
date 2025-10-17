const { member_details, loan_details, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addLoanDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { memberId } = req.params; // Get the memberId from the URL params
    const formData = req.body; // Get the data from the request body

    // Check if the member exists
    const member = await member_details.findOne({
      where: { id: memberId },
      transaction,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    formData.memberId = memberId;

    // Insert all loan details at once
    await loan_details.create(formData, { transaction });

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Loan details added successfully.",
      memberId,
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
