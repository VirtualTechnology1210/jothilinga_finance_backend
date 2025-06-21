const { division, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateDivision = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { divisionName, divisionCode, divisionId, regionId } = req.body;
    // console.log("req.body: " + JSON.stringify(req.body));

    if (!divisionName) {
      return res.status(400).json({ error: "divisionName is required." });
    }

    if (!divisionCode) {
      return res.status(400).json({ error: "divisionCode is required." });
    }

    if (!regionId) {
      return res.status(400).json({ error: "regionId is required." });
    }

    // Create a new business category
    await division.update(
      { divisionName, divisionCode, regionId },
      { where: { id: divisionId } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Division updated successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint errors for branchName and branchCode
    if (error instanceof Sequelize.UniqueConstraintError) {
      if (error.fields.divisionName) {
        return res.status(400).json({
          error: "Division Name already exists.",
        });
      }
      if (error.fields.divisionCode) {
        return res.status(400).json({
          error: "Division Code already exists.",
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
