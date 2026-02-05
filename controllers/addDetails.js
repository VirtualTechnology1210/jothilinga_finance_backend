const { sequelize } = require("../models");
const models = require("../models");

module.exports = addDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { model, type, id, ...formData } = req.body;

    if (!models[model]) {
      return res.status(400).json({ error: "Invalid model provided." });
    }

    const selectedModel = models[model];

    console.log(
      "formData for model: " + model + " - " + JSON.stringify(formData)
    );

    let savedData;

    if (type === "Add") {
      savedData = await selectedModel.create(formData, { transaction });
    }
    if (type === "Edit") {
      // Special handling for member_details when loanId is empty
      if (model === "member_details" && formData.loanId === "") {
        // Get the member details to find the fieldManagerId
        const memberDetails = await models.member_details.findOne({
          where: { id },
          transaction,
        });

        if (!memberDetails) {
          throw new Error("Member details not found");
        }

        // Get the branchId from fieldManagerId
        const fieldManager = await models.manager_credentials.findOne({
          where: { id: memberDetails.fieldManagerId },
          attributes: ["branchId"],
          transaction,
        });

        if (!fieldManager || !fieldManager.branchId) {
          throw new Error("Invalid fieldManagerId or branchId not found");
        }

        // Fetch branchCode from branch table using branchId
        const branchData = await models.branch.findOne({
          where: { id: fieldManager.branchId },
          attributes: ["branchCode"],
          transaction,
        });

        if (!branchData || !branchData.branchCode) {
          throw new Error("Invalid branchId or branchCode not found");
        }

        // Get the next number for loanIdGL series
        const seriesResult = await models.series.findOne({
          where: { seriesName: "loanIdGL" },
          transaction,
        });

        if (!seriesResult) {
          throw new Error("loanIdGL series not found");
        }

        const nextNumber = seriesResult.nextNumber;

        // Format the loanId: 1111 + branchCode + GL + padded nextNumber
        const newLoanId = `1111${branchData.branchCode}BL${String(
          nextNumber
        ).padStart(4, "0")}`;

        // Update the loanId in formData
        formData.loanId = newLoanId;

        // Increment the nextNumber in the series
        await models.series.update(
          { nextNumber: nextNumber + 1 },
          { where: { seriesName: "loanIdGL" }, transaction }
        );
      }
      if (
        model === "bl_collection_approval" &&
        formData.accountManagerStatus === "submitted"
      ) {
        const blCollectionApproval =
          await models.bl_collection_approval.findOne({
            where: { id },
            include: [
              {
                model: models.receipts,
                as: "fk_bl_collection_approval_belongsTo_receipts_receiptId",
                include: [
                  {
                    model: models.member_details,
                    as: "fk_receipts_belongsTo_member_details_memberId",
                    include: [
                      {
                        model: models.proposed_loan_details,
                        as: "proposedLoanDetails",
                      },
                    ],
                  },
                ],
              },
            ],
            transaction,
          });

        if (!blCollectionApproval) {
          throw new Error("blCollectionApproval details not found");
        }

        // Get the member details and proposed loan details
        const receipt =
          blCollectionApproval.fk_bl_collection_approval_belongsTo_receipts_receiptId;
        if (receipt) {
          const memberDetails =
            receipt.fk_receipts_belongsTo_member_details_memberId;
          const proposedLoanDetails = memberDetails?.proposedLoanDetails;

          if (memberDetails && proposedLoanDetails) {
            // Get total number of EMIs from tenure
            const totalEMIs = proposedLoanDetails.tenureInMonths;

            // Count paid receipts for this member
            const paidReceiptsCount = await models.receipts.count({
              where: {
                memberId: memberDetails.id,
                status: "paid",
              },
              transaction,
            });

            // If all EMIs are paid, update loan status to completed
            if (paidReceiptsCount >= totalEMIs) {
              await models.member_details.update(
                {
                  loanStatus: "completed",
                  loanCloseDate: new Date().toISOString(),
                },
                {
                  where: { id: memberDetails.id },
                  transaction,
                }
              );
              console.log(`Loan completed for member ID: ${memberDetails.id}`);
            }
          }
        }
      }
      if (
        model === "jlg_collection_approval" &&
        formData.accountManagerStatus === "submitted"
      ) {
        const jlgCollectionApproval =
          await models.jlg_collection_approval.findOne({
            where: { id },
            include: [
              {
                model: models.center,
                as: "fk_jlg_collection_approval_belongsTo_center_centerId",
                include: [
                  {
                    model: models.member_details,
                    as: "fk_center_hasMany_member_details_centerId",
                    include: [
                      {
                        model: models.proposed_loan_details,
                        as: "proposedLoanDetails",
                      },
                    ],
                  },
                ],
              },
            ],
            transaction,
          });

        if (!jlgCollectionApproval) {
          throw new Error("JLG Collection Approval details not found");
        }

        const center =
          jlgCollectionApproval.fk_jlg_collection_approval_belongsTo_center_centerId;

        if (center && center.fk_center_hasMany_member_details_centerId) {
          // Iterate through each member in the center
          for (const memberDetails of center.fk_center_hasMany_member_details_centerId) {
            const proposedLoanDetails = memberDetails?.proposedLoanDetails;

            if (memberDetails && proposedLoanDetails) {
              // Get total number of EMIs from tenure
              const totalEMIs = proposedLoanDetails.tenureInMonths;

              // Count paid receipts for this member
              const paidReceiptsCount = await models.receipts.count({
                where: {
                  memberId: memberDetails.id,
                  status: "paid",
                },
                transaction,
              });

              // If all EMIs are paid, update loan status to completed
              if (paidReceiptsCount >= totalEMIs) {
                await models.member_details.update(
                  {
                    loanStatus: "completed",
                    loanCloseDate: new Date().toISOString(),
                  },
                  {
                    where: { id: memberDetails.id },
                    transaction,
                  }
                );
                console.log(
                  `Loan completed for member ID: ${memberDetails.id} in center ID: ${center.id}`
                );
              }
            }
          }
        }
      }
      if (
        model === "foreclosure_approval" &&
        formData.accountManagerStatus === "submitted"
      ) {
        const foreclosureApproval = await models.foreclosure_approval.findOne({
          where: { id },
          transaction,
        });
        const getLoanClosureId = await models.series.findOne({
          where: { seriesName: "loanClosureId" },
          transaction,
        });
        await models.member_details.update(
          {
            loanStatus: "foreclosed",
            loanCloseDate: new Date().toISOString(),
            loanClosureId: getLoanClosureId.nextNumber,
          },
          {
            where: { id: foreclosureApproval.memberId },
            transaction,
          }
        );
        await models.series.update(
          { nextNumber: getLoanClosureId.nextNumber + 1 },
          { where: { seriesName: "loanClosureId" }, transaction }
        );
      }

      savedData = await selectedModel.update(
        formData,
        { where: { id } },
        { transaction }
      );
    }
    console.log("savedData: " + JSON.stringify(savedData));

    await transaction.commit();

    res.status(201).json({
      message: "Details added successfully!",
      savedData: savedData,
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
