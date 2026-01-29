const { JSON } = require("sequelize");
const {
  member_details,
  manager_credentials,
  branch,
  receipts,
  bl_collection_approval,
  bl_denominations,
  sequelize,
} = require("../models");

module.exports = Delete = async (req, res) => {
  const { id } = req.query;

  // Start a database transaction for data consistency
  const transaction = await sequelize.transaction();

  try {
    // First, check if the receipt exists
    const receiptExists = await receipts.findOne({
      where: { id: id },
      transaction
    });

    if (!receiptExists) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Receipt record not found"
      });
    }

    // Find all bl_collection_approval records associated with this receipt
    const collectionApprovals = await bl_collection_approval.findAll({
      where: { receiptId: id },
      transaction
    });

    // Delete bl_denominations for each bl_collection_approval
    for (const approval of collectionApprovals) {
      await bl_denominations.destroy({
        where: { blCollectionId: approval.id },
        transaction
      });
    }

    // Delete bl_collection_approval records
    await bl_collection_approval.destroy({
      where: { receiptId: id },
      transaction
    });

    // Finally, delete the receipt record
    const receiptDeleted = await receipts.destroy({
      where: { id: id },
      transaction
    });

    if (!receiptDeleted) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Failed to delete receipt record"
      });
    }

    // Commit the transaction if all deletions are successful
    await transaction.commit();

    return res.status(200).json({
      message: "Receipt and associated records deleted successfully"
    });

  } catch (error) {
    // Rollback transaction in case of any error
    await transaction.rollback();

    console.error("Delete operation failed:", error);

    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete EMI payment record and associated data"
    });
  }
};