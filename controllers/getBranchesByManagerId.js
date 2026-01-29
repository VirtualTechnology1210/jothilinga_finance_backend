const { manager_credentials, branch, sequelize } = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getBranchesByManagerId = async (req, res) => {
  try {
    const { managerId } = req.query;

    if (!managerId) {
      return res.status(400).json({ error: "ID is required" });
    }

    const getManagerCredentials = await manager_credentials.findOne({
      where: {
        id: managerId,
      },
      attributes: ["id", "branchId"],
    });

    const branchIds = getManagerCredentials.branchId
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id) // Remove empty strings if any
      .map((id) => parseInt(id, 10)); // Convert to numbers

    // console.log("branchIds: " + branchIds);

    const getBranches = await branch.findAll({
      where: {
        id: {
          [Op.in]: branchIds,
        },
      },
      attributes: ["id", "branchName", "branchCode"],
    });

    res.status(200).json({ message: getBranches });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
