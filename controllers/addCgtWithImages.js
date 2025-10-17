const multer = require("multer");
const models = require("../models");
const fs = require("fs");
const path = require("path");
const { sequelize } = require("../models");

const addCgtWithImages = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Define storage for uploaded files
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./uploads/documents/"); // Directory to save uploaded files
      },
      filename: function (req, file, cb) {
        cb(
          null,
          Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            "-" +
            file.originalname
        );
      },
    });

    // Create multer instance with the storage configuration
    const uploadPhotos = multer({ storage: storage });

    // Use uploadPhotos to handle form data (this includes both files and non-files)
    uploadPhotos.any()(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        // Access non-file fields (form data)
        const { id, members, columnName } = req.body;
        console.log(
          "req.body in addCgtWithImages: " + JSON.stringify(req.body)
        );

        if (!columnName) {
          return res.status(400).json({ error: "Column name is required." });
        }

        // Initialize an object to store file data (dynamically fetched)
        const fileData = {};

        // Loop over the files in req.files (this can be dynamic)
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            const fieldName = file.fieldname; // This is the field name from frontend
            fileData[fieldName] = file.filename; // Store the filename in fileData object
          });
        }

        // Parse the `members` JSON if it's received as a string
        const membersData =
          typeof members === "string" ? JSON.parse(members) : members;

        console.log("File Data: ", JSON.stringify(fileData));
        console.log("Members Data: ", membersData);

        // Update the `member_details` table for each ApplicationId
        for (const [applicationId, value] of Object.entries(membersData)) {
          if (value !== undefined) {
            await models.member_details.update(
              { [columnName]: value }, // Use dynamic column name
              { where: { ApplicationId: applicationId }, transaction }
            );
          }
        }

        // Update the `group` table (existing logic for file updates)
        const formFields = { ...req.body };
        delete formFields.id;
        delete formFields.members;
        delete formFields.columnName;

        const existingRecord = await models["group"].findOne(
          { where: { id } },
          { transaction }
        );

        if (!existingRecord) {
          return res.status(404).json({ error: "Record not found" });
        }

        // Delete existing files
        for (const field in fileData) {
          const existingFileName = existingRecord[field];

          if (existingFileName && existingFileName !== "null") {
            const existingFilePath = path.join(
              __dirname,
              "../uploads/documents/",
              existingFileName
            );

            // Check if the file exists before attempting to delete
            if (fs.existsSync(existingFilePath)) {
              fs.unlinkSync(existingFilePath);
            }
          }
        }

        // Update the `group` record
        const savedData = await models["group"].update(
          {
            ...formFields,
            ...fileData, // Add dynamically processed file data
          },
          { where: { id }, transaction }
        );

        console.log("Saved Data: ", savedData);
        await transaction.commit();
        // Send a success response
        res.status(201).json({
          message: "Data with images uploaded successfully!",
          savedData: savedData,
        });
      } catch (error) {
        await transaction.rollback();
        console.error("Error saving data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Unique constraint violation.",
        details: error.errors.map((e) => e.message),
      });
    }
    console.log(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

module.exports = addCgtWithImages;
