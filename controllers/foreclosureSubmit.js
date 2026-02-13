const {
  sequelize,
  member_details,
  foreclosure_approval,
  foreclosure_denominations,
} = require("../models");
const { Sequelize } = require("sequelize");

module.exports = foreclosureSubmit = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const foreClosureData = req.body;

    if (foreClosureData.role === "Branch Manager") {
      let approvalRecord;

      if (foreClosureData.type === "Add") {
        // Create new foreclosure approval record
        approvalRecord = await foreclosure_approval.create(
          {
            memberId: foreClosureData.memberId,
            forecloseChargesPercentage: foreClosureData.foreCloseCharges,
            forecloseChargesAmount: foreClosureData.foreCloseChargesAmount,
            forecloseGstPercentage: 18,
            forecloseGstAmount: foreClosureData.foreCloseGST,
            totalOutstandingAmount: foreClosureData.outstandingPrincipal,
            totalPayableAmount: foreClosureData.totalPayableAmount,
            reason: foreClosureData.reason,
            branchManagerStatus: "submitted",
            branchManagerStatusUpdatedAt: new Date().toISOString(),
            accountManagerStatusUpdatedAt: new Date().toISOString(),
            accountManagerStatus: "submitted",
            securityDeposit: foreClosureData.securityDeposit,
            netPayableAmount: foreClosureData.netPayableAmount,
          },
          { transaction }
        );

        // Update member_details loanStatus to foreclosed and set loanCloseDate
        await member_details.update(
          {
            loanStatus: "foreclosed",
            loanCloseDate: new Date().toISOString()
          },
          { where: { id: foreClosureData.memberId }, transaction }
        );
      } else if (
        foreClosureData.type === "Edit" &&
        foreClosureData.approvalId
      ) {
        // Update existing foreclosure approval record
        await foreclosure_approval.update(
          {
            forecloseChargesPercentage: foreClosureData.foreCloseCharges,
            forecloseChargesAmount: foreClosureData.foreCloseChargesAmount,
            forecloseGstPercentage: 18,
            forecloseGstAmount: foreClosureData.foreCloseGST,
            totalOutstandingAmount: foreClosureData.outstandingPrincipal,
            totalPayableAmount: foreClosureData.totalPayableAmount,
            reason: foreClosureData.reason,
            branchManagerStatus: "submitted",
            branchManagerStatusUpdatedAt: new Date().toISOString(),
            securityDeposit: foreClosureData.securityDeposit,
            netPayableAmount: foreClosureData.netPayableAmount,
          },
          {
            where: { id: foreClosureData.approvalId },
            transaction,
          }
        );

        // Delete existing denominations
        await foreclosure_denominations.destroy({
          where: { foreclosureId: foreClosureData.approvalId },
          transaction,
        });

        approvalRecord = { id: foreClosureData.approvalId };
      }

      // Convert denominations object to array format
      const denominationsArray = Object.entries(
        foreClosureData.denominations
      ).map(([denomination, count]) => ({
        foreclosureId: approvalRecord.id,
        denomination: denomination === "Coins" ? 1 : parseInt(denomination),
        count: count,
        total:
          denomination === "Coins" ? count : count * parseInt(denomination),
      }));

      // Create foreclosure denominations records
      if (denominationsArray.length > 0) {
        await foreclosure_denominations.bulkCreate(denominationsArray, {
          transaction,
        });
      }
    }

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Foreclosure updated successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
