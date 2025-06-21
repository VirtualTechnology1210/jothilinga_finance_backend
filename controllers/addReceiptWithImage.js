const multer = require("multer");
const models = require("../models");
const fs = require("fs");
const path = require("path");
const { sequelize, series } = require("../models");

const addReceiptWithImage = async (req, res) => {
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

        const createdReceipt = await models["receipts"].create(
          {
            memberId,
            managerId,
            emiDate,
            emiAmount,
            receivedAmount,
            description,
            collectedDate: currentISTDateTime,
            status,
          },
          { transaction }
        );

        const createBlCollection = await models[
          "bl_collection_approval"
        ].create(
          {
            receiptId: createdReceipt.id,
            receiptNo: receiptNo,
            fieldManagerStatus: "submitted",
            fieldManagerStatusUpdatedAt: currentISTDateTime,
            ...fileData,
          },
          { transaction }
        );
        for (const [denomination, { count, subTotal }] of Object.entries(
          parsedDenominations
        )) {
          await models["bl_denominations"].create(
            {
              blCollectionId: createBlCollection.id,
              denomination: parseInt(denomination),
              count: count,
              total: subTotal,
            },
            { transaction }
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

module.exports = addReceiptWithImage;
