const { sequelize } = require("../models");
const { Sequelize, Op } = require("sequelize");
const db = require("../models");
const { get } = require("../routes/routes");

module.exports = getBlEmiPendingApprovals = async (req, res) => {
  try {
    const { croId, role, branchId } = req.query;
    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }
    if (role === "Branch Manager" && !croId) {
      return res.status(400).json({ error: "Cro ID is required" });
    }
    if ((role === "MIS" || role === "Accounts Manager") && !branchId) {
      return res.status(400).json({ error: "Branch ID is required" });
    }

    let managerIds = [];
    let managerDetails = [];
    if (role === "MIS" || role === "Accounts Manager") {
      const roleId = await db["roles"].findOne({
        where: {
          roleName: "Customer Relationship Officer",
        },
      });
      const getManagerCredentials = await db["manager_credentials"].findAll({
        where: {
          branchId: branchId,
          roleId: roleId.id,
        },
        attributes: ["id", "branchId", "username"],
      });
      managerIds = getManagerCredentials.map((cred) => cred.id);
      managerDetails = getManagerCredentials.map((cred) => ({
        id: cred.id,
        username: cred.username,
      }));
    }

    console.log("managerIds: " + managerIds);
    console.log("managerDetails: " + JSON.stringify(managerDetails));

    // Define the where clause based on role
    let receiptWhereClause = {};
    let blCollectionWhereClause = {};

    // Set conditions based on role
    if (role === "Branch Manager") {
      receiptWhereClause = { managerId: croId };
      blCollectionWhereClause = {
        fieldManagerStatus: "submitted",
        branchManagerStatus: "pending",
        misStatus: "pending",
        accountManagerStatus: "pending",
      };
    } else if (role === "MIS") {
      receiptWhereClause = {
        managerId: {
          [Op.in]: managerIds,
        },
      };
      blCollectionWhereClause = {
        fieldManagerStatus: "submitted",
        branchManagerStatus: "submitted",
        misStatus: "pending",
        accountManagerStatus: "pending",
      };
    } else if (role === "Accounts Manager") {
      receiptWhereClause = {
        managerId: {
          [Op.in]: managerIds,
        },
      };
      blCollectionWhereClause = {
        fieldManagerStatus: "submitted",
        branchManagerStatus: "submitted",
        misStatus: "submitted",
        accountManagerStatus: "pending",
      };
    }

    const getReceiptsData = await db["receipts"].findAll({
      where: receiptWhereClause,
      attributes: [
        "id",
        "memberId",
        "managerId",
        "emiDate",
        "emiAmount",
        "receivedAmount",
        "status",
        "description",
        "collectedDate",
        [
          sequelize.literal(`(
              receipts.emiAmount - COALESCE(
                (SELECT SUM(r2.receivedAmount) 
                 FROM receipts AS r2 
                 WHERE r2.memberId = receipts.memberId 
                 AND r2.emiDate = receipts.emiDate
                 AND r2.id != receipts.id), 0
              )
            )`),
          "pendingEmiAmount",
        ],
      ],
      include: [
        {
          model: db["bl_collection_approval"],
          as: "fk_receipts_hasOne_bl_collection_approval_receiptId",
          where: blCollectionWhereClause,
          attributes: ["id", "collectionPhoto", "receiptNo"],
        },
        {
          model: db["member_details"],
          as: "fk_receipts_belongsTo_member_details_memberId",
          attributes: ["id", "memberName"],
        },
      ],
    });

    if (role === "MIS" || role === "Accounts Manager") {
      const managerMap = managerDetails.reduce((acc, manager) => {
        acc[manager.id] = manager.username;
        return acc;
      }, {});

      // Convert to plain objects AFTER adding managerName
      const result = getReceiptsData.map((approval) => {
        const approvalData = approval.get({ plain: true }); // Convert to plain object
        approvalData.managerName = managerMap[approval.managerId] || null;
        return approvalData;
      });
      res.status(200).json({ message: result });
    } else {
      res.status(200).json({ message: getReceiptsData });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
