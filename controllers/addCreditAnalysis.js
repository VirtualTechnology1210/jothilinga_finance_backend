const { credit_analysis, member_details, sequelize } = require("../models");
const { Sequelize, where } = require("sequelize");

module.exports = addCreditAnalysis = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body;
    const creditOfficerStatus = req.query.creditOfficerStatus;

    // console.log("formData: " + JSON.stringify(formData));
    // console.log("creditOfficerStatus: " + JSON.stringify(creditOfficerStatus));

    if (!formData.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    const getMemberId = await member_details.findOne({
      where: { id: formData.memberId },
    });

    if (!getMemberId) {
      throw new Error("Member Id not exist.");
    }

    const memberUpdateResult = await member_details.update(
      { creditOfficerStatus, creditOfficerUpdatedAt: Sequelize.fn("NOW") },
      { where: { id: formData.memberId } },
      { transaction }
    );

    if (memberUpdateResult[0] === 0) {
      // Check if any rows were affected
      throw new Error("Failed to update member details.");
    }

    const creditAnalysisResult = await credit_analysis.upsert(formData, {
      transaction,
    });

    if (!creditAnalysisResult) {
      throw new Error("Failed to create credit analysis record.");
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Application status updated.",
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
