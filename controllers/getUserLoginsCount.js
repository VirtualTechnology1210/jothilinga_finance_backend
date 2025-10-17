const { manager_credentials } = require("../models");

module.exports = getUserLoginsCount = async (req, res) => {
  try {
    // Get the count from both models
    const totalCount = await manager_credentials.count();

    res.status(200).json({
      message: "Count Retrieved successfully",
      total_count: totalCount,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
