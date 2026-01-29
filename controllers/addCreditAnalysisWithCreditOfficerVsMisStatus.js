const { member_details, credit_analysis, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addCreditAnalysisWithCreditOfficerVsMisStatus = async (
  req,
  res
) => {
  const transaction = await sequelize.transaction();
  const { payload, creditAnalysisData } = req.body;

  try {
    if (!payload.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    const ExistMemberId = await credit_analysis.findOne({
      where: { memberId: creditAnalysisData.memberId },
    });

    if (ExistMemberId) {
      await credit_analysis.update(
        creditAnalysisData,
        { where: { memberId: creditAnalysisData.memberId } },
        {
          transaction,
        }
      );
    } else {
      await credit_analysis.create(creditAnalysisData, {
        transaction,
      });
    }

    // Create a new row
    const memberUpdateResult = await member_details.update(
      payload,
      { where: { id: payload.memberId } },
      { transaction }
    );

    if (memberUpdateResult[0] === 0) {
      // Check if any rows were affected
      throw new Error("Failed to update member details.");
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Member Details updated successfully and Added Credit Analysis.",
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
