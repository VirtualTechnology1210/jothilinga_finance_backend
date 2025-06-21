const multer = require("multer");
const models = require("../models");
const fs = require("fs");
const path = require("path");
const { sequelize, series } = require("../models");

const updateJlgEmiPayWithImage = async (req, res) => {
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
        // Log the entire request body and files
        console.log("========== REQUEST DATA ==========");
        console.log("Request Body:", req.body);

        // Parse JSON fields properly

        const parsedDenominations =
          typeof req.body.denominations === "string"
            ? JSON.parse(req.body.denominations)
            : req.body.denominations;

        console.log("Parsed denominations:", parsedDenominations);

        const parsedReceiptsData =
          typeof req.body.receiptsData === "string"
            ? JSON.parse(req.body.receiptsData)
            : req.body.receiptsData;

        console.log("Parsed receiptsData:", parsedReceiptsData);
        console.log(
          "Request Files:",
          req.files?.map((file) => ({
            fieldname: file.fieldname,
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
          })) || "No files"
        );
        console.log("==================================");

        // Access non-file fields
        const {
          manager_id,
          role,
          receiptsData,
          emiDate,
          centerId,
          comment,
          receiptNo,
          denominations,
          totalPendingEmi,
          collectedTotal,
          currentISTDateTime,
          type,
        } = req.body;

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
          where: { id: manager_id, roleId: croRole.id },
          transaction,
        });
        if (!manager) {
          return res.json({ error: "manager credentials doesnot exist" });
        }

        if (type === "Add") {
          const createJlgCollection = await models[
            "jlg_collection_approval"
          ].create(
            {
              centerId,
              managerId: manager_id,
              emiDate,
              emiAmount: totalPendingEmi,
              receivedAmount: collectedTotal,
              remarks: comment,
              receiptNo,
              collectedDate: currentISTDateTime,
              fieldManagerStatus: "submitted",
              fieldManagerStatusUpdatedAt: currentISTDateTime,
              ...fileData,
            },
            { transaction }
          );

          for (const [denomination, { count, subTotal }] of Object.entries(
            parsedDenominations
          )) {
            await models["jlg_denominations"].create(
              {
                jlgCollectionId: createJlgCollection.id,
                emiDate: emiDate,
                denomination: parseInt(denomination),
                count: count,
                total: subTotal,
              },
              { transaction }
            );
          }
          for (const receipt of parsedReceiptsData) {
            balance = receipt.collectedEmi;
            // Make sure pendingEmiDatesWithEmiAmount exists and is iterable
            if (
              !receipt.pendingEmiDatesWithEmiAmount ||
              !Array.isArray(receipt.pendingEmiDatesWithEmiAmount)
            ) {
              console.error(
                "Invalid pendingEmiDatesWithEmiAmount for receipt:",
                receipt
              );
              continue;
            }
            for (const pendingEmiDate of receipt.pendingEmiDatesWithEmiAmount) {
              if (pendingEmiDate.date != emiDate) {
                await models["receipts"].create(
                  {
                    memberId: receipt.memberId,
                    managerId: manager_id,
                    emiDate: pendingEmiDate.date,
                    emiAmount: pendingEmiDate.emiAmount,
                    receivedAmount:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? pendingEmiDate.pendingEmiAmount
                        : balance,
                    status:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? "paid"
                        : "pending",
                    description: "",
                    collectedDate: currentISTDateTime,
                  },
                  { transaction }
                );
                if (balance >= pendingEmiDate.pendingEmiAmount) {
                  balance -= pendingEmiDate.pendingEmiAmount;
                } else {
                  balance = 0;
                }
              } else {
                await models["receipts"].create(
                  {
                    memberId: receipt.memberId,
                    managerId: manager_id,
                    emiDate: pendingEmiDate.date,
                    emiAmount: pendingEmiDate.emiAmount,
                    receivedAmount:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? pendingEmiDate.pendingEmiAmount
                        : balance,
                    status:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? "paid"
                        : "pending",
                    description: "",
                    collectedDate: currentISTDateTime,
                  },
                  { transaction }
                );
                if (balance >= pendingEmiDate.pendingEmiAmount) {
                  balance -= pendingEmiDate.pendingEmiAmount;
                } else {
                  balance = 0;
                }
              }
            }
          }
        }
        if (type === "Edit") {
          const existingRecord = await models[
            "jlg_collection_approval"
          ].findOne({ where: { centerId, emiDate } }, { transaction });

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
          const updateJlgCollection = await models[
            "jlg_collection_approval"
          ].update(
            {
              managerId: manager_id,
              emiAmount: totalPendingEmi,
              receivedAmount: collectedTotal,
              remarks: comment,
              receiptNo,
              fieldManagerStatus: "submitted",
              fieldManagerStatusUpdatedAt: currentISTDateTime,
              ...fileData,
            },
            { where: { centerId, emiDate } },
            transaction
          );

          for (const [denomination, { count, subTotal }] of Object.entries(
            parsedDenominations
          )) {
            await models["jlg_denominations"].update(
              {
                count: count,
                total: subTotal,
              },
              {
                where: {
                  jlgCollectionId: existingRecord.id,
                  emiDate: emiDate,
                  denomination: parseInt(denomination),
                },
              },
              transaction
            );
          }

          for (const receipt of parsedReceiptsData) {
            const deletedReceipt = await models["receipts"].destroy({
              where: {
                memberId: receipt.memberId,
                collectedDate: existingRecord.collectedDate,
              },
              transaction,
            });
            balance = receipt.collectedEmi;
            // Make sure pendingEmiDatesWithEmiAmount exists and is iterable
            if (
              !receipt.pendingEmiDatesWithEmiAmount ||
              !Array.isArray(receipt.pendingEmiDatesWithEmiAmount)
            ) {
              console.error(
                "Invalid pendingEmiDatesWithEmiAmount for receipt:",
                receipt
              );
              continue;
            }
            for (const pendingEmiDate of receipt.pendingEmiDatesWithEmiAmount) {
              if (pendingEmiDate.date != emiDate) {
                await models["receipts"].create(
                  {
                    memberId: receipt.memberId,
                    managerId: manager_id,
                    emiDate: pendingEmiDate.date,
                    emiAmount: pendingEmiDate.emiAmount,
                    receivedAmount:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? pendingEmiDate.pendingEmiAmount
                        : balance,
                    status:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? "paid"
                        : "pending",
                    description: "",
                    collectedDate: existingRecord.collectedDate,
                  },
                  { transaction }
                );
                if (balance >= pendingEmiDate.pendingEmiAmount) {
                  balance -= pendingEmiDate.pendingEmiAmount;
                } else {
                  balance = 0;
                }
              } else {
                await models["receipts"].create(
                  {
                    memberId: receipt.memberId,
                    managerId: manager_id,
                    emiDate: pendingEmiDate.date,
                    emiAmount: pendingEmiDate.emiAmount,
                    receivedAmount:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? pendingEmiDate.pendingEmiAmount
                        : balance,
                    status:
                      balance >= pendingEmiDate.pendingEmiAmount
                        ? "paid"
                        : "pending",
                    description: "",
                    collectedDate: existingRecord.collectedDate,
                  },
                  { transaction }
                );
                if (balance >= pendingEmiDate.pendingEmiAmount) {
                  balance -= pendingEmiDate.pendingEmiAmount;
                } else {
                  balance = 0;
                }
              }
            }
          }
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

module.exports = updateJlgEmiPayWithImage;
