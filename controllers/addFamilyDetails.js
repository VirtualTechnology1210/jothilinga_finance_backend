const { member_details, family_details, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addFamilyDetails = async (req, res) => {
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

    // Create the Family Details
    const newId = await family_details.create(formData, { transaction });

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Co Applicant Details submitted successfully.",
      coApplicantId: newId.id,
      memberId: formData.memberId,
      nomineedetails: newId,
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
