const {
  manager_credentials,
  roles,
  center,
  member_details,
} = require("../models");
const { Op } = require("sequelize"); // Import Sequelize operators

module.exports = getCroData = async (req, res) => {
  try {
    const { branchId, croId, transferType } = req.query;

    // console.log("branchId: " + branchId, "croId: " + croId);

    // Find the role for CRO
    const croRole = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });
    if (!croRole) {
      throw new Error("Required roles are missing");
    }

    // Construct the where condition dynamically
    const whereCondition = {
      roleId: croRole.id,
    };
    if (branchId) {
      whereCondition.branchId = branchId;
    }
    if (croId) {
      whereCondition.id = { [Op.ne]: croId }; // Exclude the specified croId
    }

    // Fetch CRO data
    const croData = await manager_credentials.findAll({
      where: whereCondition,
      attributes: ["id", "username", "branchId"], // Specify the columns to retrieve
    });

    let centerData = [];
    let memberData = [];
    if (transferType && transferType === "center") {
      const getCenterData = await center.findAll({
        where: { fieldManagerId: croId },
        attributes: ["id", "name"],
      });
      if (getCenterData.length > 0) {
        centerData = getCenterData;
      }
    }

    if (transferType && transferType === "member") {
      const getMemberData = await member_details.findAll({
        where: { fieldManagerId: croId, loanType: "Business Loan" },
        attributes: ["id", "memberName"],
      });
      if (getMemberData.length > 0) {
        memberData = getMemberData;
      }
    }

    if (!croData || croData.length === 0) {
      return res.json({
        error: "CRO record not found",
        centerData,
        memberData,
      });
    }

    res.json({
      message: croData,
      centerData,
      memberData,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
