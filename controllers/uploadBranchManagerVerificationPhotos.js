const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  branch_manager_verification_photos,
  member_details,
  manager_credentials,
} = require("../models"); // Adjust the import path as needed

const uploadBranchManagerVerificationPhotos = async (req, res) => {
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
    const uploadPhoto = multer({ storage: storage });

    // Handle the new files upload
    uploadPhoto.single("verificationPhoto")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const {
          member_id,
          roleId,
          photoName,
          description,
          comment,
          photoUpdatedAt,
        } = req.body;
        // console.log("member_id: " + member_id);
        // console.log("photoName: " + photoName);
        // console.log("description: " + description);
        // console.log("comment: " + comment);
        // console.log("photoUpdatedAt: " + photoUpdatedAt);

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

        // Access the uploaded file
        const uploadedFile = req.file;
        if (!uploadedFile) {
          console.log("error: No file uploaded");
          return res.status(400).json({ error: "No file uploaded" });
        }
        // console.log("uploadedFile: " + JSON.stringify(uploadedFile));
        const fileName = uploadedFile.filename;
        // console.log("fileName: " + fileName);

        await branch_manager_verification_photos.create({
          memberId: member_id,
          roleId,
          photoName,
          fileName,
          description,
          comment,
          photoUpdatedAt,
        });

        res.status(201).json({
          message: "Branch Manager Verification Document uploaded successfully",
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

module.exports = uploadBranchManagerVerificationPhotos;
