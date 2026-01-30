const {
  member_details,
  receipts,
  proposed_loan_details,
  center,
  foreclosure_approval,
  foreclosure_denominations,
  group,
  manager_credentials,
  branch,
} = require("../models");
const { Op } = require("sequelize"); // Import Sequelize operators

module.exports = getNocDataForAm = async (req, res) => {
  try {
    const { searchType, searchValue, role, manager_id } = req.query;

    // Allow only specific roles
    if (!role || !["Accounts Manager", "superadmin"].includes(role)) {
      return res.status(403).json({
        error: "Access Denied",
        message: "Only Accounts Managers and superadmin can access this data",
      });
    }

    // For Accounts Manager we require manager_id (to enforce branch restriction)
    if (role === "Accounts Manager" && !manager_id) {
      return res.status(400).json({
        error: "Manager Id is required",
      });
    }

    // Define the search condition based on searchType
    let whereCondition = {};

    switch (searchType) {
      case "lan":
        whereCondition = { fedLanNo: searchValue };
        break;
      case "prospectId":
        whereCondition = { ApplicationId: searchValue };
        break;
      case "aadharNo":
        whereCondition = { aadharNo: searchValue };
        break;
      case "mobileNo":
        whereCondition = { phoneNumber: searchValue };
        break;
      case "memberName":
        whereCondition = { memberName: searchValue };
        break;
      default:
        return res.status(400).json({
          error: "Invalid Search Type",
          message: "Please provide a valid search type",
        });
    }

    let managerBranchId = null;
    if (role === "Accounts Manager") {
      const managerRecord = await manager_credentials.findOne({
        where: { id: manager_id },
        attributes: ["branchId"],
      });

      if (!managerRecord || !managerRecord.branchId) {
        return res.status(400).json({
          error: "Invalid manager_id",
          message: "Manager branch information not found",
        });
      }

      managerBranchId = managerRecord.branchId;
    }

    // Find member based on the search condition
    const member = await member_details.findOne({
      where: {
        ...whereCondition,
        branchManagerStatus: "disbursed",
        loanStatus: { [Op.in]: ["completed", "foreclosed"] },
      },
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails",
        },
      ],
    });

    if (!member) {
      return res.status(404).json({
        error: "Member not applicable for NOC",
        message: "No member found with the provided search criteria",
      });
    }

    // Get member's CRO branch
    const memberCro = await manager_credentials.findOne({
      where: { id: member.fieldManagerId },
      attributes: ["branchId"],
    });

    // If Accounts Manager, ensure member belongs to same branch
    if (
      role === "Accounts Manager" &&
      (!memberCro || memberCro.branchId !== managerBranchId)
    ) {
      return res.status(404).json({
        error: "Member not applicable for NOC",
        message:
          "No member found with the provided search criteria for your branch",
      });
    }

    // Derive branch name from member's CRO branch
    let branchName = null;
    if (memberCro && memberCro.branchId) {
      const branchRecord = await branch.findOne({
        where: { id: memberCro.branchId },
        attributes: ["branchName"],
      });
      branchName = branchRecord ? branchRecord.branchName : null;
    }

    res.json({
      success: "NOC data retrieved successfully",
      branchName,
      member: member,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
