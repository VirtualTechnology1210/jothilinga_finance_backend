const { receipts, sequelize, member_details } = require("../models");

module.exports = addReceipt = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      memberId,
      managerId,
      emiDate,
      emiAmount,
      pendingEmiAmount,
      receivedAmount,
      description,
    } = req.body; // Get the data from the request body

    // Check if the member exists
    const member = await member_details.findOne({
      where: { id: memberId },
      transaction,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Determine the collected date and status
    const collectedDate = new Date(); // Current date
    const status = receivedAmount >= pendingEmiAmount ? "paid" : "pending";

    // Create the receipt with specified fields
    await receipts.create(
      {
        memberId,
        managerId,
        emiDate,
        emiAmount,
        receivedAmount,
        description,
        collectedDate, // Add collectedDate to the receipt
        status, // Add status based on receivedAmount comparison
      },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Receipt added successfully.",
      memberId, // Return the memberId from request body
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
