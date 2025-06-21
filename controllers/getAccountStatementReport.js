const {
  member_details,
  proposed_loan_details,
  manager_credentials,
  branch,
  receipts,
  sequelize,
} = require("../models");

module.exports = getAccountStatementReport = async (req, res) => {
  const applicationId = req.params.applicationId;

  try {
    // Fetch member details along with associated data
    const member = await member_details.findOne({
      where: { ApplicationId: applicationId },
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails", // Ensure this alias matches the association alias
        },
        {
          model: receipts,
          as: "receiptsDetails", // Ensure this alias matches the association alias
        },
      ],
    });

    if (!member) {
      return res.json({ error: "Member not found." });
    }
    if (member.accountManagerStatus !== "payment credited") {
      return res.json({ error: "Loan not Disbursed." });
    }

    const getBranchId = await manager_credentials.findOne({
      where: {
        id: member.fieldManagerId,
      },
    });

    if (!getBranchId) {
      return res.json({
        error: `No manager found with id: ${member.fieldManagerId}`,
      });
    }

    // console.log("getBranchId: " + JSON.stringify(getBranchId));

    const getBranchName = await branch.findOne({
      where: {
        id: getBranchId.branchId,
      },
    });

    // Check if getBranchName is null
    if (!getBranchName) {
      return res.json({
        error: `No branch found with id: ${getBranchId.branchId}`,
      });
    }

    // console.log("member: " + JSON.stringify(member));

    // Structure the response to include all attributes
    const response = {
      memberDetails: member.get(),
      branchName: getBranchName.branchName,
      managerName: getBranchId.employeeName,
    };

    res.json({ message: response });
  } catch (error) {
    console.log(error); // Log the error for debugging purposes
    res.json({
      error: "Internal Server Error",
    });
  }
};
