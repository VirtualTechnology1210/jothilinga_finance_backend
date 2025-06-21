const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { booking_process_bm, member_details, sequelize } = require("../models");

const uploadBranchManagerBookingProcessDocuments = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction(); // Start transaction

    // Define storage for uploaded files
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./uploads/documents/");
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

    const uploadPhotos = multer({ storage: storage });

    uploadPhotos.fields([
      { name: "ornamentPhoto", maxCount: 1 },
      { name: "bookingReceipt", maxCount: 1 },
      { name: "customerLivePhoto", maxCount: 1 },
      { name: "others1", maxCount: 1 },
      { name: "others2", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const { member_id } = req.body;

        if (!member_id) {
          await transaction.rollback();
          return res.status(400).json({ error: "Member ID is required" });
        }

        const isMemberExist = await member_details.findOne({
          where: { id: member_id },
          transaction,
        });

        if (!isMemberExist) {
          await transaction.rollback();
          return res.status(400).json({ error: "Member ID not exist" });
        }

        const existingRecord = await booking_process_bm.findOne({
          where: { memberId: member_id },
          transaction,
        });

        const photoData = existingRecord ? { ...existingRecord.toJSON() } : {};

        Object.keys(req.files).forEach((key) => {
          if (req.files[key] && req.files[key][0]) {
            const newFilename = req.files[key][0].filename;

            if (photoData[key]) {
              const oldFilename = photoData[key];
              const filePath = path.join(
                __dirname,
                "../uploads/documents",
                oldFilename
              );

              fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting old image:", err);
              });
            }

            photoData[key] = newFilename;
          }
        });

        // Upsert operation (update or create)
        await booking_process_bm.update(
          { ...photoData },
          {
            where: { memberId: member_id },
            transaction,
          }
        );

        await member_details.update(
          {
            branchManagerStatus: "submitted",
            branchManagerStatusUpdatedAt: new Date().toISOString(),
          },
          { where: { id: member_id }, transaction }
        );

        await transaction.commit(); // Commit only if everything succeeds

        res.status(201).json({
          message: "Documents uploaded successfully",
          memberId: member_id,
        });
      } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error uploading documents:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Transaction error:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

module.exports = uploadBranchManagerBookingProcessDocuments;
