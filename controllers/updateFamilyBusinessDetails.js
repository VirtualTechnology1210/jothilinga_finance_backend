const { family_business_details, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateFamilyBusinessDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.body.familyMemberId) {
      return res.status(400).json({ error: "familyMemberId  is required." });
    }

    // Create a new row
    await family_business_details.update(
      {
        ...req.body,
        creditUpdatedAt: Sequelize.fn("NOW"),
      },
      { where: { familyMemberId: req.body.familyMemberId } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Family Member Business Details updated successfully.",
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
