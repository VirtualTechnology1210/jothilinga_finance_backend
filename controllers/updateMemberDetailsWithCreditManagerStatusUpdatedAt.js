const { member_details, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateMemberDetailsWithCreditManagerStatusUpdatedAt = async (
  req,
  res
) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.params.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    // Create a new row
    await member_details.update(
      {
        ...req.body,
        creditManagerStatusUpdatedAt: Sequelize.fn("NOW"),
      },
      { where: { id: req.params.memberId } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Member Details updated successfully.",
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
