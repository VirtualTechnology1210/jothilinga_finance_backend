const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { credit_documents, member_details } = require("../models"); // Adjust the import path as needed

const uploadCreditManagerDocuments = async (req, res) => {
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
      { name: "businessPhoto", maxCount: 10 },
      { name: "housePhoto", maxCount: 10 },
      { name: "neighbourCheckPhoto", maxCount: 10 },
      { name: "tradeReferencePhoto", maxCount: 10 },
    ])(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const { member_id, creditManagerId } = req.body;

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
        const existingRecord = await credit_documents.findOne({
          where: { memberId: member_id },
        });

        // Create an object to store filenames for each document type as comma-separated values
        const photoData = existingRecord ? { ...existingRecord.toJSON() } : {};

        // Update only the fields for which new files have been uploaded
        Object.keys(req.files).forEach((key) => {
          if (req.files[key]) {
            const newFilenames = req.files[key]
              .map((file) => file.filename)
              .join(",");
            // Combine new filenames with existing ones if applicable
            photoData[key] = photoData[key]
              ? `${photoData[key]},${newFilenames}`
              : newFilenames;
          }
        });

        // Save or update the credit_documents record
        await credit_documents.upsert({
          memberId: member_id,
          creditManagerId: creditManagerId,
          ...photoData,
        });

        res.status(201).json({ message: "Documents uploaded successfully" });
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

module.exports = uploadCreditManagerDocuments;
