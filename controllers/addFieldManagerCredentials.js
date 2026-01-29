const { manager_credentials, sequelize, roles } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addFieldManagerCredential = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { username, password, branchId } = req.body;

    if (!username) {
      return res.status(400).json({ error: "username is required." });
    }

    if (!password) {
      return res.status(400).json({ error: "password is required." });
    }

    if (!branchId) {
      return res.status(400).json({ error: "branchId is required." });
    }

    // Fetch the roleId for "Customer Relationship Officer"
    const role = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
      transaction,
    });

    if (!role) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }

    // Create a new manager_credentials
    await manager_credentials.create(
      { username, password, branchId, roleId: role.id },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Customer Relationship Officer Credentials added successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    // Handle unique constraint errors for username
    if (error instanceof Sequelize.UniqueConstraintError) {
      if (error.fields.username) {
        return res.status(400).json({
          error: "Username already exists.",
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
