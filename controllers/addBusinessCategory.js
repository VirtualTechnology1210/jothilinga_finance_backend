const { business_categories, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addBusinessCategory = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { businessCategory } = req.body;

    if (!businessCategory) {
      return res.status(400).json({ error: "businessCategory is required." });
    }

    // Create a new business category
    await business_categories.create(
      { business_category: businessCategory },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Business Category added successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint error
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        error: "Business Category already exists.",
      });
    }

    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
