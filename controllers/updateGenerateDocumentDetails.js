const { sequelize } = require("../models");
const models = require("../models");

module.exports = updateGenerateDocumentDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { members, centerId, bmStatusUpdatedAt } = req.body;

    // Ensure `members` is an array
    if (!Array.isArray(members)) {
      throw new Error("Invalid data format: 'members' must be an array.");
    }

    // Iterate over each member and update the data
    for (const member of members) {
      const {
        id,
        isAttendedBank,
        processingCharge,
        isProcessingChargePaid,
        gst,
        isGstPaid,
        securityDeposit,
        isSecurityDepositPaid,
        isLoanInsured,
        isInsuranceAmountPaid,
        insuranceAmount,
        amountToRelease,
      } = member;

      // Validate data
      if (!id) {
        throw new Error("Invalid member data. Each member must have an id.");
      }

      // Perform the update
      await models["member_details"].update(
        {
          isAttendedBank,
          processingCharge,
          isProcessingChargePaid,
          gst,
          isGstPaid,
          securityDeposit,
          isSecurityDepositPaid,
          isLoanInsured,
          isInsuranceAmountPaid,
          insuranceAmount,
          amountToRelease,
        },
        { where: { id }, transaction }
      );
    }

    await models["center"].update(
      { bmStatusUpdatedAt },
      { where: { id: centerId }, transaction }
    );

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      message: "Details updated successfully for all members!",
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};
