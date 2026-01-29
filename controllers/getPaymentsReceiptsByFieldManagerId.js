const { payments_receipts, manager_credentials, roles } = require("../models");

module.exports = getPaymentsReceiptsByFieldManagerId = async (req, res) => {
  const fieldManagerId = req.params.fieldManagerId;

  try {
    const croRoleId = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });

    if (!croRoleId) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }
    const FieldManagerIdExist = await manager_credentials.findOne({
      where: { id: fieldManagerId, roleId: croRoleId.id },
    });

    if (!FieldManagerIdExist) {
      return res.status(400).json({ error: "fieldManagerId not exist." });
    }

    const getList = await payments_receipts.findAll({
      where: {
        fieldManagerId,
      },
    });

    res.status(200).json({ list: getList });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
