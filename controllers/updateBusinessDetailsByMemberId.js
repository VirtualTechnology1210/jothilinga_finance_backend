const {
  member_business_details,
  family_business_details,
  sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateBusinessDetailsByMemberId = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body; // Expect formData to be an array of objects

    // Validate formData to ensure it's an array of objects
    if (!Array.isArray(formData) || formData.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid input data. Expected an array of objects." });
    }

    for (const data of formData) {
      if (data.ApplicantId) {
        const existing = await member_business_details.findOne({
          where: { ApplicantId: data.ApplicantId },
          transaction
        });
        if (existing) {
          await member_business_details.update(
            { ...data },
            { where: { ApplicantId: data.ApplicantId }, transaction }
          );
        } else {
          await member_business_details.create({ ...data }, { transaction });
        }
      } else if (data.memberId) {
        if (!data.familyMemberId) {
          throw new Error("Family Member ID is missing.");
        }
        const existing = await family_business_details.findOne({
          where: { memberId: data.memberId },
          transaction,
        });
        if (existing) {
          await family_business_details.update(
            { ...data },
            { where: { memberId: data.memberId }, transaction }
          );
        } else {
          await family_business_details.create({ ...data }, { transaction });
        }
      }
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Business Details updated successfully.",
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
