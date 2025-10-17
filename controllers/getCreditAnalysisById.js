const { credit_analysis } = require("../models");

module.exports = getCreditAnalysisById = async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Fetch the credit_analysis from the database
    const getCreditAnalysis = await credit_analysis.findOne({
      where: {
        memberId: memberId,
      },
    });

    // Check if the record exists
    if (!getCreditAnalysis) {
      return res.status(400).json({
        error: "memberId not found",
      });
    }

    return res.status(200).json({ creditAnalysis: getCreditAnalysis });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
