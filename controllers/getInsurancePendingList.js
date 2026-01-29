const {
  member_details,
  proposed_loan_details,
  insurance_receipts,
  manager_credentials,
  roles,
} = require("../models");
const { Op } = require("sequelize");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
};

module.exports = getInsurancePendingList = async (req, res) => {
  try {
    const { manager_id, role } = req.query;

    // Base where condition
    const whereCondition = {
      branchManagerStatus: "disbursed",
      isLoanInsured: false,
    };

    // Define additional filtering based on role
    if (role === "Customer Relationship Officer") {
      whereCondition.fieldManagerId = manager_id; // Filter by fieldManagerId
    } else if (role === "Branch Manager") {
      const manager = await manager_credentials.findOne({
        where: { id: manager_id },
      });

      if (!manager) {
        return res.status(404).json({ error: "Manager not found" });
      }

      // Get branch IDs
      const branchIds = manager.branchId.split(",").map((id) => id.trim());

      const role = await roles.findOne({
        where: { roleName: "Customer Relationship Officer" },
      });

      if (!role) {
        return res.status(400).json({
          error: "Role 'Customer Relationship Officer' does not exist.",
        });
      }

      // Fetch Customer Relationship Officer IDs based on branch IDs
      const croIds = await manager_credentials.findAll({
        where: {
          branchId: {
            [Op.in]: branchIds,
          },
          roleId: role.id, // Assuming roleId is the field for roles
        },
        attributes: ["id"],
      });

      const croIdList = croIds.map((cro) => cro.id);

      // Update the where condition to filter member_details based on CRO IDs
      whereCondition.fieldManagerId = {
        [Op.in]: croIdList,
      };
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    const data = await member_details.findAll({
      where: whereCondition,
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails",
        },
        {
          model: insurance_receipts,
          as: "insuranceReceiptsDetails",
        },
      ],
    });

    const pendingInsuranceList = [];

    for (const member of data) {
      const disbursionDate = member.branchManagerStatusUpdatedAt;
      const tenureInMonths = member.proposedLoanDetails.tenureInMonths;
      const insurancePercentage =
        tenureInMonths === 24 ? 2.284 : tenureInMonths === 12 ? 1.142 : 0;
      const insuranceAmount = Math.round(
        (member.sanctionedLoanAmountBySanctionCommittee * insurancePercentage) /
          100
      );
      const receiptsForDisbursionDate = await insurance_receipts.findAll({
        where: {
          memberId: member.id,
          disbursionDate: formatDate(disbursionDate),
        },
      });
      if (receiptsForDisbursionDate.length === 0) {
        // No receipts found, meaning no payment has been made
        // Add the full Insurance amount as pending
        pendingInsuranceList.push({
          memberId: member.id,
          ApplicationId: member.ApplicationId,
          memberName: member.memberName,
          disbursionDate: formatDate(disbursionDate),
          insuranceAmount, // Full Insurance amount is pending
          pendingInsuranceAmount: insuranceAmount, // No payment made, so pending amount is full Insurance
        });
      } else {
        // Receipts exist, calculate the total paid amount
        const totalPaidAmount = receiptsForDisbursionDate.reduce(
          (sum, receipt) => {
            return sum + receipt.receivedAmount;
          },
          0
        );
        //   console.log("totalPaidAmount: " + totalPaidAmount);

        // Calculate the pending amount
        const pendingInsuranceAmount = Math.max(
          insuranceAmount - totalPaidAmount,
          0
        );

        //   console.log("pendingInsuranceAmount: " + pendingInsuranceAmount);

        // If Insurance is still pending, add to the pendingInsuranceList
        if (pendingInsuranceAmount > 0) {
          pendingInsuranceList.push({
            memberId: member.id,
            ApplicationId: member.ApplicationId,
            memberName: member.memberName,
            disbursionDate: formatDate(disbursionDate),
            insuranceAmount, // Original Insurance amount
            pendingInsuranceAmount, // Pending amount (remaining amount to be paid)
          });
        }
      }
    }

    res.status(200).json(pendingInsuranceList);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
