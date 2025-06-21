const { region, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateRegion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { regionName, regionCode, regionId } = req.body;

    if (!regionName) {
      return res.status(400).json({ error: "regionName is required." });
    }

    if (!regionCode) {
      return res.status(400).json({ error: "regionCode is required." });
    }

    // Create a new business category
    await region.update(
      { regionName, regionCode },
      { where: { id: regionId } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Region updated successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint errors for branchName and branchCode
    if (error instanceof Sequelize.UniqueConstraintError) {
      if (error.fields.regionName) {
        return res.status(400).json({
          error: "Region Name already exists.",
        });
      }
      if (error.fields.regionCode) {
        return res.status(400).json({
          error: "Region Code already exists.",
        });
      }
    }

    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
