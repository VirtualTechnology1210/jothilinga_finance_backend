const { sequelize } = require("../models");
const { Sequelize, Op } = require("sequelize");
const db = require("../models");

module.exports = getJlgEmiPendingApprovals = async (req, res) => {
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
    let whereClause = {};

    // Set conditions based on role
    if (role === "Branch Manager") {
      whereClause = {
        managerId: croId,
        fieldManagerStatus: "submitted",
        branchManagerStatus: "pending",
        misStatus: "pending",
        accountManagerStatus: "pending",
      };
    } else if (role === "MIS") {
      whereClause = {
        managerId: {
          [Op.in]: managerIds,
        },
        fieldManagerStatus: "submitted",
        branchManagerStatus: "submitted",
        misStatus: "pending",
        accountManagerStatus: "pending",
      };
    } else if (role === "Accounts Manager") {
      whereClause = {
        managerId: {
          [Op.in]: managerIds,
        },
        fieldManagerStatus: "submitted",
        branchManagerStatus: "submitted",
        misStatus: "submitted",
        accountManagerStatus: "pending",
      };
    }

    const getCollectionApproval = await db["jlg_collection_approval"].findAll({
      where: whereClause,
      include: [
        {
          model: db["center"],
          as: "fk_jlg_collection_approval_belongsTo_center_centerId",
          attributes: ["id", "name"],
        },
      ],
    });

    if (role === "MIS" || role === "Accounts Manager") {
      const managerMap = managerDetails.reduce((acc, manager) => {
        acc[manager.id] = manager.username;
        return acc;
      }, {});

      // Convert to plain objects AFTER adding managerName
      const result = getCollectionApproval.map((approval) => {
        const approvalData = approval.get({ plain: true }); // Convert to plain object
        approvalData.managerName = managerMap[approval.managerId] || null;
        return approvalData;
      });
      res.status(200).json({ message: result });
    } else {
      res.status(200).json({ message: getCollectionApproval });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
