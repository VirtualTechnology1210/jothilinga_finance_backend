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

    // Check if role is Branch Manager
    if (role !== "Accounts Manager") {
      return res.status(403).json({
        error: "Access Denied",
        message: "Only Accounts Managers can access this data",
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

    const getBranchId = await manager_credentials.findOne({
      where: { id: manager_id },
      attributes: ["branchId"],
    });

    const getBranchName = await branch.findOne({
      where: { id: getBranchId.branchId },
      attributes: ["branchName"],
    });

    // Find members based on the search condition
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

    res.json({
      success: "NOC data retrieved successfully",
      branchName: getBranchName.branchName,
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
