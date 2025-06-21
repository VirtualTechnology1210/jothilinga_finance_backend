const { bank_details, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateBankDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.body.id) {
      return res.status(400).json({ error: "id is required." });
    }

    // Create a new row
    await bank_details.update(
      {
        ...req.body,
        creditOfficerUpdatedAt: Sequelize.fn("NOW"),
      },
      { where: { id: req.body.id } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Bank Details updated successfully.",
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
