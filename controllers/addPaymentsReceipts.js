const {
  payments_receipts,
  manager_credentials,
  roles,
  sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");

module.exports = addPaymentsReceipts = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { fieldManagerId, date, narration, paymentAmount, receiptAmount } =
      req.body;

    if (!fieldManagerId) {
      return res.status(400).json({ error: "fieldManagerId is required." });
    }

    const role = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
      transaction,
    });

    if (!role) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }

    const FieldManagerIdExist = await manager_credentials.findOne(
      {
        where: { id: fieldManagerId, roleId: role.id },
      },
      { transaction }
    );

    if (!FieldManagerIdExist) {
      return res.status(400).json({ error: "fieldManagerId not exist." });
    }

    await payments_receipts.create(
      {
        fieldManagerId,
        date,
        narration,
        paymentAmount,
        receiptAmount,
      },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Row added successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
