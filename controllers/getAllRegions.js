const { region } = require("../models");

module.exports = getAllRegions = async (req, res) => {
  try {
    const regions = await region.findAll({
      attributes: ["id", "regionName", "regionCode"],
    });

    if (regions.length === 0) {
      // If no rows are found, return a specific message
      return res.status(404).json({
        message: "No regions found",
      });
    }

    res.status(200).json(regions);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
