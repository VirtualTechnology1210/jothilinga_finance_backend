const { credit_officer_verification_data, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = delCreditOfficerVerificationData = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // console.log("delCreditOfficerVerificationData: " + req.body.id);
    if (!req.body.id) {
      return res.status(400).json({ error: "id is required." });
    }
    const result = await credit_officer_verification_data.destroy({
      where: {
        id: req.body.id,
      },
      transaction,
    });

    if (result === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the provided id." });
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Data deleted successfully.",
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
