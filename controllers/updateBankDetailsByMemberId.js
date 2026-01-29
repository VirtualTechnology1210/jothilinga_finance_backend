const { bank_details, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateBankDetailsByMemberId = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.body.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    const { id, ...updateData } = req.body;

    await bank_details.update(
      updateData,
      { where: { memberId: req.body.memberId } },
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
