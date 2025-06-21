const {
  manager_credentials,
  member_details,
  sequelize,
  center,
  center_cro_transfer_history,
  member_cro_transfer_history,
} = require("../models");
const { Op } = require("sequelize");

module.exports = transferCro = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      fromCroId,
      toCroId,
      transferType,
      selectedCenters,
      selectedMembers,
    } = req.body;

    if (transferType && transferType === "center") {
      await center.update(
        { fieldManagerId: toCroId },
        {
          where: {
            id: {
              [Op.in]: selectedCenters,
            },
            fieldManagerId: fromCroId,
          },
        },
        { transaction }
      );

      await member_details.update(
        { fieldManagerId: toCroId },
        {
          where: {
            centerId: {
              [Op.in]: selectedCenters,
            },
            fieldManagerId: fromCroId,
          },
        },
        { transaction }
      );

      for (const centerId of selectedCenters) {
        await center_cro_transfer_history.create(
          {
            centerId,
            fromFieldManagerId: fromCroId,
            toFieldManagerId: toCroId,
            transferDate: new Date(),
          },
          { transaction }
        );
      }
    }

    if (transferType && transferType === "member") {
      await member_details.update(
        { fieldManagerId: toCroId },
        {
          where: {
            id: {
              [Op.in]: selectedMembers,
            },
            fieldManagerId: fromCroId,
            loanType: "Business Loan",
          },
        },
        { transaction }
      );

      for (const memberId of selectedMembers) {
        await member_cro_transfer_history.create(
          {
            memberId,
            fromFieldManagerId: fromCroId,
            toFieldManagerId: toCroId,
            transferDate: new Date(),
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    res.status(200).json({
      message: "Transfered successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
