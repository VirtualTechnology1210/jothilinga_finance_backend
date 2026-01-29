const multer = require("multer");
const models = require("../models");
const fs = require("fs");
const path = require("path");
const { sequelize, series } = require("../models");

const addDetailsWithImages = async (req, res) => {
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
        const { model, type, id } = req.body;
        // console.log("Form Fields: ", formFields);

        // Initialize an object to store file data (dynamically fetched)
        const fileData = {};

        // Loop over the files in req.files (this can be dynamic)
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            const fieldName = file.fieldname; // This is the field name from frontend
            fileData[fieldName] = file.filename; // Store the filename in fileData object
          });
        }

        console.log("File Data: ", JSON.stringify(fileData));

        const formFields = { ...req.body };
        delete formFields.model;
        delete formFields.type;
        if (type === "Edit") {
          delete formFields.id;
        }

        console.log("formFields: ", JSON.stringify(formFields));

        let savedData;

        if (type === "Add") {
          // Combine form fields with dynamic file data
          savedData = await models[model].create(
            {
              ...formFields,
              ...fileData, // Add dynamically processed file data
            },
            { transaction }
          );
        }
        if (type === "Edit") {
          // Fetch existing data
          const existingRecord = await models[model].findOne(
            { where: { id } },
            { transaction }
          );

          if (!existingRecord) {
            return res.status(404).json({ error: "Record not found" });
          }

          // Delete existing files
          for (const field in fileData) {
            const existingFilePath = existingRecord[field]
              ? path.join(
                  __dirname,
                  "../uploads/documents/",
                  existingRecord[field]
                )
              : null;

            if (existingFilePath && fs.existsSync(existingFilePath)) {
              fs.unlinkSync(existingFilePath);
            }
          }

          // Combine form fields with dynamic file data
          savedData = await models[model].update(
            {
              ...formFields,
              ...fileData, // Add dynamically processed file data
            },
            { where: { id }, transaction }
          );
        }

        console.log("Saved Data: ", savedData);
        await transaction.commit();
        // Send a success response with saved data
        res.status(201).json({
          message: "Data with images uploaded successfully!",
          savedData: savedData,
        });
      } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } catch (error) {
    await transaction.rollback();
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

module.exports = addDetailsWithImages;
