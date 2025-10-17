const { credit_officer_verification_data, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addCreditOfficerVerificationData = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Validate req.body (optional)
    if (!Array.isArray(req.body) || req.body.length === 0) {
      throw new Error("Invalid data format.");
    }

    await credit_officer_verification_data.bulkCreate(req.body, {
      transaction,
    });

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Data added successfully.",
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
