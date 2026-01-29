const {
  nature_of_business,
  business_categories,
  sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addNatureOfBusiness = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { businessCategoryId, natureOfBusiness } = req.body;

    // Validate input data
    if (
      typeof businessCategoryId !== "number" ||
      typeof natureOfBusiness !== "string"
    ) {
      throw new Error("Invalid input data");
    }

    // Check if the businessCategoryId exists in business_categories
    const businessCategoryExists = await business_categories.findOne({
      where: { id: businessCategoryId },
      transaction,
    });

    if (!businessCategoryExists) {
      throw new Error("Business Category ID does not exist");
    }

    // Create a new NatureOfBusiness record
    await nature_of_business.create(
      {
        businessCategoryId,
        natureOfBusiness,
      },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Nature of Business added successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint error
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        error: "Nature of Business already exists.",
      });
    }

    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
