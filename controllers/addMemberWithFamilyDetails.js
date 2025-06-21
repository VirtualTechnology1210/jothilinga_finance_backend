const { member_details, family_details, sequelize } = require("../models");

module.exports = addMemberWithFamilyDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body; // Expect formData to be an array of objects

    // Validate formData to ensure it's an array of objects
    if (!Array.isArray(formData) || formData.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid input data. Expected an array of objects." });
    }

    const applicantData = formData.find(
      (item) => item.relationshipType === "Applicant"
    );
    const familyData = formData.filter(
      (item) => item.relationshipType !== "Applicant"
    );

    const newMember = await member_details.create(applicantData, {
      transaction,
    });

    // Assign the new member ID to the family members
    familyData.forEach((member) => (member.memberId = newMember.id));

    await family_details.bulkCreate(familyData, { transaction });

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Member and family details added successfully.",
      memberId: newMember.id,
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
