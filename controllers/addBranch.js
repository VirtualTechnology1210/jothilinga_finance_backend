const { branch, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addBranch = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { branchName, branchCode, divisionId } = req.body;

    if (!branchName) {
      return res.status(400).json({ error: "branchName is required." });
    }

    if (!branchCode) {
      return res.status(400).json({ error: "branchCode is required." });
    }

    if (!divisionId) {
      return res.status(400).json({ error: "divisionId is required." });
    }

    // Create a new business category
    await branch.create(
      { branchName, branchCode, divisionId },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Branch added successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint errors for branchName and branchCode
    if (error instanceof Sequelize.UniqueConstraintError) {
      if (error.fields.branchName) {
        return res.status(400).json({
          error: "Branch Name already exists.",
        });
      }
      if (error.fields.branchCode) {
        return res.status(400).json({
          error: "Branch Code already exists.",
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
