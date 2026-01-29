const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { nominee_photos, member_details } = require("../models"); // Adjust the import path as needed

const uploadNomineePhotos = async (req, res) => {
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
      { name: "nomineePhoto", maxCount: 1 },
      { name: "aadharFrontPhoto", maxCount: 1 },
      { name: "aadharBackPhoto", maxCount: 1 },
      { name: "anotherIdentityPhoto", maxCount: 1 },
      { name: "rationCardPhoto", maxCount: 1 },
      { name: "bankPassbookPhoto", maxCount: 1 },
      { name: "salaryProofPhoto", maxCount: 1 },
      { name: "ownHouseProofPhoto", maxCount: 1 },
      { name: "applicantLinkProofPhoto", maxCount: 1 },
      { name: "signaturePhoto", maxCount: 1 },
      { name: "other1", maxCount: 1 },
      { name: "other2", maxCount: 1 },
      { name: "other3", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const { member_id, anotherIdentity } = req.body;

        if (!member_id) {
          return res.status(400).json({ error: "Member ID is required" });
        }

        const isMemberExist = await member_details.findOne({
          where: { id: member_id },
        });

        if (!isMemberExist) {
          return res.status(400).json({ error: "Member ID not exist" });
        }

        // Retrieve the existing member_photos record, if any
        const existingRecord = await nominee_photos.findOne({
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

        // Save or update the nominee record
        await nominee_photos.upsert({
          memberId: member_id,
          anotherIdentity,
          ...photoData,
        });

        res
          .status(201)
          .json({ message: "Nominee Documents uploaded successfully" });
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

module.exports = uploadNomineePhotos;
