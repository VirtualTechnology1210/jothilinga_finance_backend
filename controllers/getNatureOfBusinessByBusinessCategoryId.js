const { nature_of_business, business_categories } = require("../models");

module.exports = getNatureOfBusinessByBusinessCategoryId = async (req, res) => {
  const categoryId = req.params.categoryId;

  try {
    const getData = await nature_of_business.findAll({
      where: { businessCategoryId: categoryId },
      attributes: ["id", ["natureOfBusiness", "name"]],
    });

    if (!getData) {
      return res.status(404).json({
        error: "Data not found",
      });
    }

    res.status(200).json(getData);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
