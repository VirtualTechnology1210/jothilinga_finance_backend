const { division, region } = require("../models");

module.exports = getAllDivisions = async (req, res) => {
  try {
    const divisions = await division.findAll({
      attributes: ["id", "divisionName", "divisionCode"],
      include: [
        {
          model: region,
          as: "region",
          attributes: ["id", "regionName", "regionCode"],
        },
      ],
    });

    if (divisions.length === 0) {
      // If no rows are found, return a specific message
      return res.status(404).json({
        message: "No divisions found",
      });
    }

    res.status(200).json(divisions);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
