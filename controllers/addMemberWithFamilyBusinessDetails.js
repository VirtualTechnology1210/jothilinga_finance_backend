const {
  sequelize,
  member_business_details,
  family_business_details,
} = require("../models");

module.exports = addMemberWithFamilyBusinessDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body; // Expect formData to be an array of objects
    let memberId;

    // Validate formData to ensure it's an array of objects
    if (!Array.isArray(formData) || formData.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid input data. Expected an array of objects." });
    }

    // Loop through the formData array and create records in the respective tables
    for (const data of formData) {
      if (data.ApplicantId) {
        // If ApplicantId exists, add to member_business_details
        const newBusinessDetails = await member_business_details.create(
          { ...data },
          { transaction }
        );
        memberId = newBusinessDetails.ApplicantId;
      } else if (data.familyMemberId && data.memberId) {
        // If familyMemberId and memberId exist, add to family_business_details
        await family_business_details.create({ ...data }, { transaction });
      }
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Member and family Business Details added successfully.",
      memberId,
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
