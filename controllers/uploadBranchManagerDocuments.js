const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  branch_manager_verification_photos,
  member_details,
  manager_credentials,
} = require("../models"); // Adjust the import path as needed

const uploadBranchManagerDocuments = async (req, res) => {
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

    // Create multer instance to allow multiple file uploads
    const uploadPhotos = multer({ storage: storage });

    // Handle multiple file uploads
    uploadPhotos.array("verificationPhotos", 10)(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const {
          member_id,
          roleId,
          photosData, // This will be an array of metadata (photoName, description, etc.) from the frontend
        } = req.body;

        console.log("member_id: " + member_id);
        console.log("roleId: " + roleId);
        console.log("photosData: " + JSON.stringify(photosData));

        if (!member_id) {
          return res.status(400).json({ error: "Member ID is required" });
        }

        if (!roleId) {
          return res.status(400).json({ error: "roleId is required" });
        }

        const isMemberExist = await member_details.findOne({
          where: { id: member_id },
        });

        if (!isMemberExist) {
          return res.status(400).json({ error: "Member ID not exist" });
        }

        const isRoleIdExist = await manager_credentials.findOne({
          where: { id: roleId },
        });

        if (!isRoleIdExist) {
          return res.status(400).json({ error: "Role Id not exist" });
        }

        // Access the uploaded files
        const uploadedFiles = req.files;
        if (!uploadedFiles || uploadedFiles.length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        console.log("uploadedFiles: " + JSON.stringify(uploadedFiles));
        console.log("photosData.length: " + photosData.length);
        console.log("uploadedFiles.length: " + uploadedFiles.length);

        // Ensure the length of uploaded files matches the metadata length
        if (photosData.length !== uploadedFiles.length) {
          return res
            .status(400)
            .json({ error: "Mismatch between files and metadata count" });
        }

        console.log("uploadedFiles after: " + JSON.stringify(uploadedFiles));

        // Process each uploaded file and corresponding metadata
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const photoMetadata = JSON.parse(photosData[i]); // Ensure frontend sends photosData as a JSON string
          const { photoName, description, comment, photoUpdatedAt } =
            photoMetadata;

          const fileName = file.filename; // Get the saved filename from multer

          console.log("member_id: " + member_id);
          console.log("roleId: " + roleId);
          console.log("photoName: " + photoName);
          console.log("fileName: " + fileName);
          console.log("description: " + description);
          console.log("comment: " + comment);
          console.log("photoUpdatedAt: " + photoUpdatedAt);

          // Save to the database
          await branch_manager_verification_photos.create({
            memberId: member_id,
            roleId,
            photoName,
            fileName,
            description,
            comment,
            photoUpdatedAt,
          });
        }

        res.status(201).json({
          message: "Branch Manager Documents uploaded successfully",
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

module.exports = uploadBranchManagerDocuments;
