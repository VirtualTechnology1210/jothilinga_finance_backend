const { business_categories } = require("../models");

module.exports = getAllBusinessCategories = async (req, res) => {
  try {
    const businessCategories = await business_categories.findAll({
      attributes: ["id", ["business_category", "name"]], // Map business_category to name
    });

    if (businessCategories.length === 0) {
      // If no rows are found, return a specific message
      return res.status(404).json({
        message: "No business categories found",
      });
    }

    res.status(200).json(businessCategories);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
