const { member_details, bank_details, sequelize } = require("../models");

module.exports = addBankDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body; // Get the data from the request body

    // Check if the member exists
    const member = await member_details.findOne({
      where: { id: formData.memberId },
      transaction,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Create the Bank details
    await bank_details.create(formData, { transaction });

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Bank details submitted successfully.",
      memberId: formData.memberId,
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
