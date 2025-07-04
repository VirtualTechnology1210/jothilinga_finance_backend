const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { member_details } = require("../models"); // Adjust the import path as needed
const { Sequelize } = require("sequelize");

const uploadCbReport = async (req, res) => {
  try {
    // Define storage for uploaded files
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./uploads/documents/"); // Directory to save uploaded files
      },
      filename: function (req, file, cb) {
        const { member_id } = req.body; // Get member_id from the request body
        const ext = path.extname(file.originalname); // Get file extension (e.g., .pdf)
        cb(null, `${Date.now()}-${member_id}-${file.fieldname}${ext}`); // Create a unique filename
      },
    });

    // Create multer instance with the new name
    const uploadPhotos = multer({ storage: storage });

    // Handle the new files upload
    uploadPhotos.fields([
      { name: "cbReport", maxCount: 1 },
      { name: "coApplicantCbReport", maxCount: 1 },
      { name: "pdf1", maxCount: 1 },
      { name: "pdf2", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        const {
          member_id,
          creditManagerId,
          creditManagerMessage,
          sanctionedLoanAmountByCreditManager,
          totalIncomeVerifiedByCreditManager,
          totalExpensesVerifiedByCreditManager,
          noOfLoansVerifiedByCreditManager,
          emiVerifiedByCreditManager,
        } = req.body;

        if (!member_id) {
          return res.status(400).json({ error: "Member ID is required" });
        }

        if (!creditManagerId) {
          return res.status(400).json({ error: "creditManagerId is required" });
        }

        const isMemberExist = await member_details.findOne({
          where: { id: member_id },
        });

        if (!isMemberExist) {
          return res
            .status(400)
            .json({ error: "Member ID not exist in member_details" });
        }

        // Create an object to store filenames for each document type as comma-separated values
        const photoData = isMemberExist ? { ...isMemberExist.toJSON() } : {};

        console.log("photoData before: " + JSON.stringify(photoData));

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

        console.log("photoData after: " + JSON.stringify(photoData));

        // Save or update the member_details record
        await member_details.update(
          {
            creditManagerId,
            cbReport: photoData["cbReport"],
            coApplicantCbReport: photoData["coApplicantCbReport"],
            pdf1: photoData["pdf1"],
            pdf2: photoData["pdf2"],
            creditManagerStatus: "pending",
            creditManagerMessage,
            sanctionedLoanAmountByCreditManager,
            totalIncomeVerifiedByCreditManager,
            totalExpensesVerifiedByCreditManager,
            noOfLoansVerifiedByCreditManager,
            emiVerifiedByCreditManager,
            creditManagerStatusUpdatedAt: Sequelize.fn("NOW"),
          },
          { where: { id: member_id } }
        );

        res.status(201).json({
          message: "Cb Report uploaded successfully",
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

module.exports = uploadCbReport;
