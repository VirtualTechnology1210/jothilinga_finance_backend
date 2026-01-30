// const multer = require("multer");
// const models = require("../models");
// const fs = require("fs");
// const path = require("path");
// const { sequelize, series } = require("../models");

// const addReceiptWithImage = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     // Define storage for uploaded files
//     const storage = multer.diskStorage({
//       destination: function (req, file, cb) {
//         cb(null, "./uploads/documents/"); // Directory to save uploaded files
//       },
//       filename: function (req, file, cb) {
//         cb(
//           null,
//           Date.now() +
//             "-" +
//             Math.round(Math.random() * 1e9) +
//             "-" +
//             file.originalname
//         );
//       },
//     });

//     // Create multer instance with the storage configuration
//     const uploadPhotos = multer({ storage: storage });

//     // Use uploadPhotos to handle form data (this includes both files and non-files)
//     uploadPhotos.any()(req, res, async (err) => {
//       if (err) {
//         return res.status(500).json({ error: "Error uploading files" });
//       }

//       try {
//         // Access non-file fields (form data)
//         const {
//           role,
//           managerId,
//           memberId,
//           receiptNo,
//           emiDate,
//           emiAmount,
//           pendingEmiAmount,
//           receivedAmount,
//           description,
//           denominations,
//           currentISTDateTime,
//         } = req.body;
//         const parsedDenominations =
//           typeof denominations === "string"
//             ? JSON.parse(denominations)
//             : denominations;
//         const status = receivedAmount >= pendingEmiAmount ? "paid" : "pending";

//         // Initialize an object to store file data (dynamically fetched)
//         const fileData = {};

//         // Loop over the files in req.files (this can be dynamic)
//         if (req.files && req.files.length > 0) {
//           req.files.forEach((file) => {
//             const fieldName = file.fieldname; // This is the field name from frontend
//             fileData[fieldName] = file.filename; // Store the filename in fileData object
//           });
//         }

//         console.log("File Data: ", JSON.stringify(fileData));
//         const croRole = await models["roles"].findOne({
//           where: { roleName: role },
//           transaction,
//         });
//         if (!croRole) {
//           return res.json({ error: "role doesnot exist" });
//         }

//         const manager = await models["manager_credentials"].findOne({
//           where: { id: managerId, roleId: croRole.id },
//           transaction,
//         });
//         if (!manager) {
//           return res.json({ error: "manager credentials doesnot exist" });
//         }

//         const createdReceipt = await models["receipts"].create(
//           {
//             memberId,
//             managerId,
//             emiDate,
//             emiAmount,
//             receivedAmount,
//             description,
//             collectedDate: currentISTDateTime,
//             status,
//           },
//           { transaction }
//         );

//         const createBlCollection = await models[
//           "bl_collection_approval"
//         ].create(
//           {
//             receiptId: createdReceipt.id,
//             receiptNo: receiptNo,
//             fieldManagerStatus: "submitted",
//             fieldManagerStatusUpdatedAt: currentISTDateTime,
//             ...fileData,
//           },
//           { transaction }
//         );
//         for (const [denomination, { count, subTotal }] of Object.entries(
//           parsedDenominations
//         )) {
//           await models["bl_denominations"].create(
//             {
//               blCollectionId: createBlCollection.id,
//               denomination: parseInt(denomination),
//               count: count,
//               total: subTotal,
//             },
//             { transaction }
//           );
//         }

//         await transaction.commit();
//         // Send a success response with saved data
//         res.status(201).json({
//           message: "Data with images uploaded successfully!",
//         });
//       } catch (error) {
//         console.error("Error saving data:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//       }
//     });
//   } catch (error) {
//     await transaction.rollback();
//     if (error.name === "SequelizeUniqueConstraintError") {
//       return res.status(400).json({
//         error: "Unique constraint violation.",
//         details: error.errors.map((e) => e.message),
//       });
//     }
//     console.log(error);
//     res.status(500).json({ error: "An error occurred. Please try again." });
//   }
// };

// module.exports = addReceiptWithImage;




const multer = require("multer");
const models = require("../models");
const fs = require("fs");
const path = require("path");
const { sequelize, series } = require("../models");

const addReceiptWithImage = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Log initial request details
    console.log("=== INCOMING REQUEST ===");
    console.log("Request Method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Request Query Params:", JSON.stringify(req.query, null, 2));
    console.log("Initial Request Body:", JSON.stringify(req.body, null, 2));

    // Define storage for uploaded files
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        console.log("File destination callback triggered");
        cb(null, "./uploads/documents/"); // Directory to save uploaded files
      },
      filename: function (req, file, cb) {
        const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname;
        console.log("Generated filename:", filename);
        console.log("Original filename:", file.originalname);
        console.log("File mimetype:", file.mimetype);
        console.log("File size:", file.size);
        cb(null, filename);
      },
    });

    // Create multer instance with the storage configuration
    const uploadPhotos = multer({ storage: storage });

    // Use uploadPhotos to handle form data (this includes both files and non-files)
    uploadPhotos.any()(req, res, async (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(500).json({ error: "Error uploading files" });
      }

      try {
        console.log("\n=== AFTER MULTER PROCESSING ===");
        console.log("Request Body after multer:", JSON.stringify(req.body, null, 2));
        console.log("Request Files:", JSON.stringify(req.files, null, 2));
        console.log("Number of files received:", req.files ? req.files.length : 0);

        // Access non-file fields (form data) - Updated for mixed payments
        const {
          role,
          managerId,
          memberId,
          receiptNo,
          emiDate,
          emiAmount,
          pendingEmiAmount,
          receivedAmount,
          currentEmiPayment,
          description,
          denominations,
          currentISTDateTime,
          transactionId,
          paymentMethod,
          upiAmount,
          cashAmount,
          hasExcessPayment,
          excessAmount,
          nextEmiDate,
          nextEmiAmount,
          nextEmiMonth,
          useSecurityDeposit,
          isCreateSavingsOnly,
          securityDepositAmount,
        } = req.body;

        console.log("\n=== EXTRACTED FORM DATA ===");
        console.log("Role:", role);
        console.log("Manager ID:", managerId);
        console.log("Member ID:", memberId);
        console.log("Receipt No:", receiptNo);
        console.log("EMI Date:", emiDate);
        console.log("EMI Amount:", emiAmount);
        console.log("Pending EMI Amount:", pendingEmiAmount);
        console.log("Received Amount:", receivedAmount);
        console.log("Current EMI Payment:", currentEmiPayment);
        console.log("Description:", description);
        console.log("Denominations (raw):", denominations);
        console.log("Current IST DateTime:", currentISTDateTime);
        console.log("Payment Method:", paymentMethod);
        console.log("Transaction ID:", transactionId);
        console.log("UPI Amount:", upiAmount);
        console.log("Cash Amount:", cashAmount);
        console.log("Has Excess Payment:", hasExcessPayment);
        console.log("Excess Amount:", excessAmount);
        console.log("Next EMI Date:", nextEmiDate);
        console.log("Next EMI Amount:", nextEmiAmount);

        // Parse and validate amounts
        const parsedUpiAmount = parseInt(upiAmount) || 0;
        const parsedCashAmount = parseInt(cashAmount) || 0;
        const parsedReceivedAmount = parseInt(receivedAmount) || 0;

        console.log("\n=== PARSED AMOUNTS ===");
        console.log("Parsed UPI Amount:", parsedUpiAmount);
        console.log("Parsed Cash Amount:", parsedCashAmount);
        console.log("Parsed Received Amount:", parsedReceivedAmount);

        // Validate payment amounts
        const calculatedTotal = parsedCashAmount + parsedUpiAmount;
        if (calculatedTotal !== parsedReceivedAmount) {
          console.log("Amount validation failed:");
          console.log(`Cash (${parsedCashAmount}) + UPI (${parsedUpiAmount}) = ${calculatedTotal}`);
          console.log(`But received amount is: ${parsedReceivedAmount}`);
          return res.status(400).json({
            error: "Payment amount mismatch. Cash + UPI should equal received amount."
          });
        }

        const parsedDenominations =
          typeof denominations === "string"
            ? JSON.parse(denominations)
            : denominations;

        console.log("Parsed Denominations:", JSON.stringify(parsedDenominations, null, 2));

        // Validate cash denominations total matches cash amount
        const denominationTotal = Object.entries(parsedDenominations).reduce(
          (sum, [denomination, { subTotal }]) => sum + (subTotal || 0),
          0
        );

        console.log("Denomination Total:", denominationTotal);
        console.log("Expected Cash Amount:", parsedCashAmount);

        if (denominationTotal !== parsedCashAmount) {
          console.log("Denomination validation failed:");
          console.log(`Denomination total: ${denominationTotal}`);
          console.log(`Expected cash amount: ${parsedCashAmount}`);
          return res.status(400).json({
            error: "Denomination total doesn't match cash amount."
          });
        }

        const status = Number(receivedAmount) >= Number(pendingEmiAmount) ? "paid" : "pending";
        console.log("Calculated Status:", status);

        // Initialize an object to store file data (dynamically fetched)
        const fileData = {};

        // Loop over the files in req.files (this can be dynamic)
        if (req.files && req.files.length > 0) {
          console.log("\n=== PROCESSING FILES ===");
          req.files.forEach((file, index) => {
            console.log(`File ${index + 1}:`);
            console.log("  Field Name:", file.fieldname);
            console.log("  Original Name:", file.originalname);
            console.log("  Filename:", file.filename);
            console.log("  Mimetype:", file.mimetype);
            console.log("  Size:", file.size);
            console.log("  Path:", file.path);

            const fieldName = file.fieldname; // This is the field name from frontend
            fileData[fieldName] = file.filename; // Store the filename in fileData object
          });
        } else {
          console.log("No files received");
        }

        console.log("\n=== FILE DATA OBJECT ===");
        console.log("File Data: ", JSON.stringify(fileData, null, 2));

        console.log("\n=== DATABASE OPERATIONS ===");
        const croRole = await models["roles"].findOne({
          where: { roleName: role },
          transaction,
        });
        console.log("Found Role:", croRole ? croRole.toJSON() : "Not found");

        if (!croRole) {
          return res.json({ error: "role doesnot exist" });
        }

        const manager = await models["manager_credentials"].findOne({
          where: { id: managerId, roleId: croRole.id },
          transaction,
        });
        console.log("Found Manager:", manager ? manager.toJSON() : "Not found");

        if (!manager) {
          return res.json({ error: "manager credentials doesnot exist" });
        }

        // --- SECURITY DEPOSIT & SAVINGS LOGIC ---
        let sdAmountUsed = 0;
        let savingsAmount = 0;
        const parsedSDAmount = parseFloat(securityDepositAmount) || 0;

        if (isCreateSavingsOnly === 'true' && parsedSDAmount > 0) {
          savingsAmount = parsedSDAmount;
          await models["savings"].create({
            memberId,
            savingAmount: savingsAmount,
          }, { transaction });

          await models["member_details"].update(
            { securityDeposit: 0 },
            { where: { id: memberId }, transaction }
          );
          console.log(`Moved full security deposit ${parsedSDAmount} to savings for member ${memberId}`);
        } else if (useSecurityDeposit === 'true' && parsedSDAmount > 0) {
          sdAmountUsed = Math.min(parsedSDAmount, parseFloat(pendingEmiAmount));
          const sdBalance = parsedSDAmount - sdAmountUsed;

          if (sdBalance > 0) {
            savingsAmount = sdBalance;
            await models["savings"].create({
              memberId,
              savingAmount: savingsAmount,
            }, { transaction });
          }

          await models["member_details"].update(
            { securityDeposit: 0 },
            { where: { id: memberId }, transaction }
          );
          console.log(`Used ${sdAmountUsed} from SD and moved ${savingsAmount} to savings for member ${memberId}`);
        }
        // ----------------------------------------

        // Check if there's excess payment for next EMI
        const hasExcess = hasExcessPayment === 'true' && excessAmount && parseFloat(excessAmount) > 0;
        const parsedExcessAmount = hasExcess ? parseFloat(excessAmount) : 0;
        const parsedCurrentEmiPayment = currentEmiPayment ? parseFloat(currentEmiPayment) : parsedReceivedAmount;

        console.log("\n=== EXCESS PAYMENT CHECK ===");
        console.log("Has Excess:", hasExcess);
        console.log("Parsed Excess Amount:", parsedExcessAmount);
        console.log("Current EMI Payment:", parsedCurrentEmiPayment);

        // Create receipt for current EMI
        const currentEmiStatus = parsedCurrentEmiPayment >= Number(pendingEmiAmount) ? "paid" : "pending";
        const receiptData = {
          memberId,
          managerId,
          emiDate,
          emiAmount,
          receivedAmount: parsedCurrentEmiPayment,
          description: description || '',
          collectedDate: currentISTDateTime,
          status: currentEmiStatus,
          upi_payment: parsedUpiAmount,
          cash_amount: parsedCashAmount,
          transaction_id: transactionId || null,
        };

        if (sdAmountUsed > 0) {
          receiptData.description = (receiptData.description ? receiptData.description + " " : "") +
            `(Used Security Deposit: ₹${sdAmountUsed})`;
        }
        if (savingsAmount > 0) {
          receiptData.description = (receiptData.description ? receiptData.description + " " : "") +
            `(Moved to Savings: ₹${savingsAmount})`;
        }
        console.log("Receipt Data to be created:", JSON.stringify(receiptData, null, 2));

        const createdReceipt = await models["receipts"].create(
          receiptData,
          { transaction }
        );
        console.log("Created Receipt:", createdReceipt.toJSON());

        const blCollectionData = {
          receiptId: createdReceipt.id,
          receiptNo: receiptNo,
          fieldManagerStatus: "submitted",
          fieldManagerStatusUpdatedAt: currentISTDateTime,
          upi_amount: parsedUpiAmount,
          transaction_id: transactionId || null,
          ...fileData,
        };
        console.log("BL Collection Data to be created:", JSON.stringify(blCollectionData, null, 2));

        const createBlCollection = await models[
          "bl_collection_approval"
        ].create(
          blCollectionData,
          { transaction }
        );
        console.log("Created BL Collection:", createBlCollection.toJSON());

        console.log("\n=== CREATING DENOMINATIONS ===");

        // Create cash denominations entries
        for (const [denomination, { count, subTotal }] of Object.entries(
          parsedDenominations
        )) {
          const denominationData = {
            blCollectionId: createBlCollection.id,
            denomination: parseInt(denomination),
            count: count,
            total: subTotal,
            transactionId: transactionId || null,
          };
          console.log("Creating cash denomination:", JSON.stringify(denominationData, null, 2));

          await models["bl_denominations"].create(
            denominationData,
            { transaction }
          );
        }

        // Create UPI entry in denominations table if UPI amount > 0
        if (parsedUpiAmount > 0) {
          const upiDenominationData = {
            blCollectionId: createBlCollection.id,
            denomination: 0,
            count: 1,
            total: parsedUpiAmount,
            transactionId: transactionId || null,
            payment_type: 'UPI',
          };
          console.log("Creating UPI denomination entry:", JSON.stringify(upiDenominationData, null, 2));

          await models["bl_denominations"].create(
            upiDenominationData,
            { transaction }
          );
        }

        // Handle excess payment - create advance receipt for next EMI
        if (hasExcess && nextEmiDate) {
          console.log("\n=== CREATING ADVANCE RECEIPT FOR NEXT EMI ===");

          // Generate new receipt number for advance payment
          const advanceReceiptNo = `${receiptNo}-ADV`;

          const advanceReceiptData = {
            memberId,
            managerId,
            emiDate: nextEmiDate,
            emiAmount: nextEmiAmount ? parseFloat(nextEmiAmount) : parsedExcessAmount,
            receivedAmount: parsedExcessAmount,
            description: `Advance payment for ${nextEmiMonth || 'next month'} EMI`,
            collectedDate: currentISTDateTime,
            status: "pending", // Status is pending as this is advance payment
            upi_payment: parsedExcessAmount, // Use UPI for excess amount as per requirement
            cash_amount: 0, // Don't use denominations for excess
            transaction_id: transactionId || null,
          };
          console.log("Advance Receipt Data:", JSON.stringify(advanceReceiptData, null, 2));

          const createdAdvanceReceipt = await models["receipts"].create(
            advanceReceiptData,
            { transaction }
          );
          console.log("Created Advance Receipt:", createdAdvanceReceipt.toJSON());

          const advanceBlCollectionData = {
            receiptId: createdAdvanceReceipt.id,
            receiptNo: advanceReceiptNo,
            fieldManagerStatus: "submitted",
            fieldManagerStatusUpdatedAt: currentISTDateTime,
            upi_amount: parsedExcessAmount,
            transaction_id: transactionId || null,
            ...fileData, // Use same photo for advance receipt
          };
          console.log("Advance BL Collection Data:", JSON.stringify(advanceBlCollectionData, null, 2));

          const createAdvanceBlCollection = await models[
            "bl_collection_approval"
          ].create(
            advanceBlCollectionData,
            { transaction }
          );
          console.log("Created Advance BL Collection:", createAdvanceBlCollection.toJSON());

          // Create UPI denomination entry for advance payment
          const advanceUpiDenominationData = {
            blCollectionId: createAdvanceBlCollection.id,
            denomination: 0,
            count: 1,
            total: parsedExcessAmount,
            transactionId: transactionId || null,
            payment_type: 'UPI',
          };
          console.log("Creating advance UPI denomination entry:", JSON.stringify(advanceUpiDenominationData, null, 2));

          await models["bl_denominations"].create(
            advanceUpiDenominationData,
            { transaction }
          );
        }
        await transaction.commit();
        console.log("\n=== SUCCESS ===");
        console.log("Transaction committed successfully");

        // Send a success response with saved data
        const responseData = {
          message: hasExcess
            ? "Payment processed successfully! Current EMI paid and advance payment recorded for next EMI."
            : "Data with images uploaded successfully!",
          paymentSummary: {
            totalAmount: parsedReceivedAmount,
            cashAmount: parsedCashAmount,
            upiAmount: parsedUpiAmount,
            transactionId: transactionId || null,
            status: currentEmiStatus,
            currentEmiPayment: parsedCurrentEmiPayment,
          }
        };

        if (hasExcess) {
          responseData.advancePayment = {
            amount: parsedExcessAmount,
            nextEmiDate: nextEmiDate,
            nextEmiMonth: nextEmiMonth,
            description: `Advance payment for ${nextEmiMonth || 'next month'} EMI`
          };
        }

        res.status(201).json(responseData);
      } catch (error) {
        console.error("\n=== ERROR IN PROCESSING ===");
        console.error("Error saving data:", error);
        console.error("Error stack:", error.stack);
        await transaction.rollback();
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error("\n=== TRANSACTION ERROR ===");
    console.error("Transaction rolled back due to error:", error);
    console.error("Error stack:", error.stack);

    if (error.name === "SequelizeUniqueConstraintError") {
      console.error("Unique constraint violation details:", error.errors);
      return res.status(400).json({
        error: "Unique constraint violation.",
        details: error.errors.map((e) => e.message),
      });
    }
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};

module.exports = addReceiptWithImage;