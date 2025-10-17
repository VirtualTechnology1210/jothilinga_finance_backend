const { permissions, sequelize } = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updatePermissionForRole = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { roleId, reportId, view } = req.body;
    // Find or create the permission
    await permissions.update(
      { view },
      { where: { roleId, reportId } },
      { transaction }
    );

    res.status(200).json({ message: "Permission updated successfully." });
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
