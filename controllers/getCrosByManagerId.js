const { manager_credentials, sequelize } = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getCrosByManagerId = async (req, res) => {
  try {
    const { managerId } = req.query;

    if (!managerId) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: managerId,
    });

    const crosData = await manager_credentials.findAll({
      where: {
        id: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
      },
      attributes: ["id", "username"],
    });

    res.status(200).json({ message: crosData });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
