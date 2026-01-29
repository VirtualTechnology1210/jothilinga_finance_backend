const { manager_credentials, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateBranchManagerCredentials = async (req, res) => {
  const transaction = await sequelize.transaction();

  const id = req.params.id;

  try {
    const { username, password, employeeName, employeeId } = req.body;

    if (!username) {
      return res.status(400).json({ error: "username is required." });
    }

    if (!password) {
      return res.status(400).json({ error: "password is required." });
    }

    if (!employeeName) {
      return res.status(400).json({ error: "employeeName is required." });
    }

    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required." });
    }

    // Create a new row
    await manager_credentials.update(
      { username, password, employeeName, employeeId },
      { where: { id } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Credentials updated successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint errors for username
    if (error instanceof Sequelize.UniqueConstraintError) {
      if (error.fields.username) {
        return res.status(400).json({
          error: "username already exists.",
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
