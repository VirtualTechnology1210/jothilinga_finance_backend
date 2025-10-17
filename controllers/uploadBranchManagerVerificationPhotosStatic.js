const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  branch_manager_verification_photos_static,
  member_details,
} = require("../models"); // Adjust the import path as needed

const uploadBranchManagerVerificationPhotosStatic = async (req, res) => {
  try {
    // Define storage for uploaded files
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./uploads/documents/"); // Directory to save uploaded files
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

    // Create multer instance with the new name
    const uploadPhotos = multer({ storage: storage });

    // Handle the new files upload
    uploadPhotos.fields([
      { name: "housePhoto1", maxCount: 1 },
      { name: "housePhoto2", maxCount: 1 },
      { name: "businessPhoto1", maxCount: 1 },
      { name: "businessPhoto2", maxCount: 1 },
      { name: "businessPhoto3", maxCount: 1 },
      { name: "businessPhoto4", maxCount: 1 },
      { name: "other1", maxCount: 1 },
      { name: "other2", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const { member_id, description, comment } = req.body;

        if (!member_id) {
          return res.status(400).json({ error: "Member ID is required" });
        }

        const isMemberExist = await member_details.findOne({
          where: { id: member_id },
        });

        if (!isMemberExist) {
          return res.status(400).json({ error: "Member ID not exist" });
        }

        // Retrieve the existing branch_manager_verification_photos_static record, if any
        const existingRecord =
          await branch_manager_verification_photos_static.findOne({
            where: { memberId: member_id },
          });

        // Create an object to store filenames for each document type as comma-separated values
        const photoData = existingRecord ? { ...existingRecord.toJSON() } : {};

        // Update only the fields for which new files have been uploaded
        Object.keys(req.files).forEach((key) => {
          if (req.files[key] && req.files[key][0]) {
            const newFilename = req.files[key][0].filename;

            // Check if there's an existing image for the field
            if (photoData[key]) {
              const oldFilename = photoData[key];
              const filePath = path.join(
                __dirname,
                "../uploads/documents",
                oldFilename
              );

              // Delete the old image from the file system
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error("Error deleting old image:", err);
                }
              });
            }

            // Replace the old filename with the new one
            photoData[key] = newFilename;
          }
        });

        // Save or update the branch_manager_verification_photos_static record
        await branch_manager_verification_photos_static.upsert({
          memberId: member_id,
          description,
          comment,
          ...photoData,
        });

        res.status(201).json({
          message: "branch_manager_verification_photos uploaded successfully",
          memberId: member_id,
        });
      } catch (error) {
        console.error("Error uploading documents:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

module.exports = uploadBranchManagerVerificationPhotosStatic;
