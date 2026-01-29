const {
  family_business_details,
  member_details,
  family_details,
  sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addFamilyBusinessDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body; // Get the data from the request body

    // Check if the member exists
    const member = await member_details.findOne({
      where: { id: req.body.memberId },
      transaction,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Check if the member exists
    const familyMember = await family_details.findOne({
      where: { id: req.body.familyMemberId },
      transaction,
    });

    if (!familyMember) {
      return res.status(404).json({ error: "Family Member not found." });
    }

    // Create the Family Business Details
    await family_business_details.create(
      {
        ...formData,
        creditUpdatedAt: Sequelize.fn("NOW"),
      },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Family Business details added successfully.",
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
