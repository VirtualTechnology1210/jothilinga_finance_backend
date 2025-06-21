const { branch, division, region } = require("../models");

module.exports = getAllBranches = async (req, res) => {
  try {
    const branches = await branch.findAll({
      attributes: ["id", "branchName", "branchCode"], // Fetch branch attributes
      include: [
        {
          model: division,
          as: "division", // Alias defined in the branch model
          attributes: ["id", "divisionName", "divisionCode"], // Fetch division attributes
          include: [
            {
              model: region,
              as: "region", // Alias defined in the division model
              attributes: ["id", "regionName", "regionCode"], // Fetch region attributes
            },
          ],
        },
      ],
    });

    if (branches.length === 0) {
      // If no rows are found, return a specific message
      return res.status(404).json({
        message: "No branches found",
      });
    }

    res.status(200).json(branches);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
