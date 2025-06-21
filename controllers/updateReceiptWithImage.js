const multer = require("multer");
const models = require("../models");
const fs = require("fs");
const path = require("path");
const { sequelize, series } = require("../models");

const updateReceiptWithImage = async (req, res) => {
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
        const {
          role,
          managerId,
          receiptId,
          memberId,
          receiptNo,
          emiDate,
          emiAmount,
          pendingEmiAmount,
          receivedAmount,
          description,
          denominations,
          currentISTDateTime,
        } = req.body;
        const parsedDenominations =
          typeof denominations === "string"
            ? JSON.parse(denominations)
            : denominations;
        const status = receivedAmount >= pendingEmiAmount ? "paid" : "pending";

        // Initialize an object to store file data (dynamically fetched)
        const fileData = {};

        // Loop over the files in req.files (this can be dynamic)
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            const fieldName = file.fieldname; // This is the field name from frontend
            fileData[fieldName] = file.filename; // Store the filename in fileData object
          });
        }

        const existingRecord = await models["bl_collection_approval"].findOne(
          { where: { receiptId } },
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

        console.log("File Data: ", JSON.stringify(fileData));
        const croRole = await models["roles"].findOne({
          where: { roleName: role },
          transaction,
        });
        if (!croRole) {
          return res.json({ error: "role doesnot exist" });
        }

        const manager = await models["manager_credentials"].findOne({
          where: { id: managerId, roleId: croRole.id },
          transaction,
        });
        if (!manager) {
          return res.json({ error: "manager credentials doesnot exist" });
        }

        const updatedReceipt = await models["receipts"].update(
          {
            memberId,
            managerId,
            emiDate,
            emiAmount,
            receivedAmount,
            description,
            status,
          },

          { where: { id: receiptId } },
          transaction
        );

        const updatedBlCollection = await models[
          "bl_collection_approval"
        ].update(
          {
            receiptNo: receiptNo,
            fieldManagerStatus: "submitted",
            fieldManagerStatusUpdatedAt: currentISTDateTime,
            ...fileData,
          },

          { where: { receiptId: receiptId } },
          transaction
        );
        for (const [denomination, { count, subTotal }] of Object.entries(
          parsedDenominations
        )) {
          await models["bl_denominations"].update(
            {
              count: count,
              total: subTotal,
            },
            {
              where: {
                blCollectionId: existingRecord.id,
                denomination: parseInt(denomination),
              },
            },
            transaction
          );
        }

        await transaction.commit();
        // Send a success response with saved data
        res.status(201).json({
          message: "Data with images uploaded successfully!",
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

module.exports = updateReceiptWithImage;
