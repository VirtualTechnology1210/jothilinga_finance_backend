const { manager_credentials, sequelize } = require("../models");

module.exports = loginFieldManager = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { username, password } = req.body;

    // Find the field manager with the provided username
    const fieldManager = await manager_credentials.findOne({
      where: { username },
      transaction,
    });

    if (!fieldManager) {
      await transaction.rollback();
      // If the user is not found, return an error
      return res.status(404).json({ error: "Invalid username." });
    }

    // Check if the provided password matches the stored password
    if (fieldManager.password !== password) {
      await transaction.rollback();
      // If the passwords don't match, return an error
      return res.status(401).json({ error: "Invalid password." });
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Login successful.",
      user: { id: fieldManager.id, username: fieldManager.username },
      userType: "Customer Relationship Officer",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
