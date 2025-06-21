const { branch_manager_verification_photos, sequelize } = require("../models");
const path = require("path");
const fs = require("fs");
const { Sequelize } = require("sequelize");

module.exports = delBranchManagerVerificationDocument = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.body.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }
    if (!req.body.fileName) {
      return res.status(400).json({ error: "fileName is required." });
    }

    const filePath = path.join(
      __dirname,
      "../uploads/documents",
      req.body.fileName
    );

    // Delete the old image from the file system
    fs.unlink(filePath, async (err) => {
      if (err) {
        await transaction.rollback();
        console.error("Error deleting old image:", err);
      }
    });

    await branch_manager_verification_photos.destroy({
      where: {
        memberId: req.body.memberId,
        fileName: req.body.fileName,
      },
      transaction,
    });

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Document Deleted successfully.",
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
