const {
  member_details,
  proposed_loan_details,
  manager_credentials,
  branch,
  receipts,
  emi_charts,
  roles,
  foreclosure_approval,
  foreclosure_denominations,
  sequelize,
} = require("../models");

const { Op } = require("sequelize");

module.exports = getAccountStatementReport = async (req, res) => {
  const applicationId = req.params.applicationId;

  try {
    const member = await member_details.findOne({
      where: {
        [Op.or]: [
          { ApplicationId: applicationId },
          { customerId: applicationId }
        ]
      },
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails",
        },
        {
          model: receipts,
          as: "receiptsDetails",
        },
        {
          model: foreclosure_approval,
          as: "fk_member_details_hasOne_member_foreclosure_approval_memberId",
          include: [
            {
              model: foreclosure_denominations,
              as: "fk_foreclosure_approval_hasMany_foreclosure_denominations_foreclosureId",
            },
          ],
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
      where: { id: member.fieldManagerId },
    });

    if (!getBranchId) {
      return res.json({
        error: `No manager found with id: ${member.fieldManagerId}`,
      });
    }

    // Branch Filtering Logic
    const requestingManagerId = req.query.managerId;
    if (requestingManagerId) {
      const requestingManager = await manager_credentials.findOne({
        where: { id: requestingManagerId },
        include: [{ model: roles, as: "fk_manager_credentials_belongsTo_roles_roleId" }]
      });

      if (requestingManager) {
        const roleName = requestingManager.fk_manager_credentials_belongsTo_roles_roleId.roleName;
        // Superadmin and Developer have full access
        if (roleName !== "superadmin" && roleName !== "developer") {
          const allowedBranchIds = requestingManager.branchId ? requestingManager.branchId.split(",").map(id => id.trim()) : [];
          const memberBranchId = String(getBranchId.branchId);

          if (!allowedBranchIds.includes(memberBranchId)) {
            return res.json({
              error: "You are not authorized to access this branch's customer data.",
            });
          }
        }
      }
    }

    const getBranchName = await branch.findOne({
      where: { id: getBranchId.branchId },
    });

    if (!getBranchName) {
      return res.json({
        error: `No branch found with id: ${getBranchId.branchId}`,
      });
    }

    const emiChartRecord = await emi_charts.findOne({
      where: { memberId: member.id }
    });

    const allReceipts = await receipts.findAll({
      where: { memberId: member.id }
    });

    let totalEmiPaid = 0;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let lastPaidMonth = 0;

    if (emiChartRecord && emiChartRecord.emiChart) {
      // Handle both JSON string and object cases using global JSON
      let emiChartArray = [];

      try {
        if (typeof emiChartRecord.emiChart === 'string') {
          emiChartArray = global.JSON.parse(emiChartRecord.emiChart);
        } else if (Array.isArray(emiChartRecord.emiChart)) {
          emiChartArray = emiChartRecord.emiChart;
        } else if (typeof emiChartRecord.emiChart === 'object') {
          // It might be an object, try to use it directly or convert
          emiChartArray = Object.values(emiChartRecord.emiChart);
        }
      } catch (e) {
        console.log("Error parsing emiChart:", e.message);
        emiChartArray = [];
      }

      // Only sort if it's a valid array
      if (Array.isArray(emiChartArray) && emiChartArray.length > 0) {
        emiChartArray.sort((a, b) => (a.month || 0) - (b.month || 0));

        for (let monthData of emiChartArray) {
          const emiDate = new Date(monthData.emiDate);

          const matchingReceipt = allReceipts.find(receipt => {
            const receiptDate = new Date(receipt.emiDate);
            return (
              receiptDate.getFullYear() === emiDate.getFullYear() &&
              receiptDate.getMonth() === emiDate.getMonth()
            );
          });

          if (matchingReceipt && matchingReceipt.status === "paid") {
            if (monthData.month === lastPaidMonth + 1) {
              totalEmiPaid += monthData.emiAmount || 0;
              totalPrincipalPaid += monthData.principalAmount || 0;
              totalInterestPaid += monthData.interestAmount || 0;
              lastPaidMonth = monthData.month;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    }

    // Prepare foreclosure details if the loan is foreclosed
    let foreclosureDetails = null;
    if (member.loanStatus === "foreclosed" || member.loanStatus === "completed") {
      const foreclosureData = member.fk_member_details_hasOne_member_foreclosure_approval_memberId;
      if (foreclosureData) {
        // Get denominations
        const denominations = foreclosureData.fk_foreclosure_approval_hasMany_foreclosure_denominations_foreclosureId || [];

        foreclosureDetails = {
          foreclosureDate: member.loanCloseDate ||
            foreclosureData.branchManagerStatusUpdatedAt ||
            foreclosureData.accountManagerStatusUpdatedAt ||
            foreclosureData.updatedAt ||
            foreclosureData.createdAt,
          loanClosureId: member.loanClosureId || foreclosureData.id,
          totalOutstandingAmount: foreclosureData.totalOutstandingAmount,
          forecloseChargesPercentage: foreclosureData.forecloseChargesPercentage,
          forecloseChargesAmount: foreclosureData.forecloseChargesAmount,
          forecloseGstAmount: foreclosureData.forecloseGstAmount,
          totalPayableAmount: foreclosureData.totalPayableAmount,
          securityDeposit: foreclosureData.securityDeposit !== null && foreclosureData.securityDeposit !== undefined
            ? foreclosureData.securityDeposit
            : (member.securityDeposit || 0),
          netPayableAmount: foreclosureData.netPayableAmount !== null && foreclosureData.netPayableAmount !== undefined
            ? foreclosureData.netPayableAmount
            : foreclosureData.totalPayableAmount,
          reason: foreclosureData.reason,
          denominations: denominations.map(d => ({
            denomination: d.denomination,
            count: d.count,
            total: d.total,
          })),
        };
      }
    }

    const response = {
      memberDetails: member.get(),
      branchName: getBranchName.branchName,
      managerName: getBranchId.employeeName,

      cumulativeEmiPaid: totalEmiPaid,
      cumulativePrincipalPaid: totalPrincipalPaid,
      cumulativeInterestPaid: totalInterestPaid,

      // Add foreclosure details
      isForeclosed: member.loanStatus === "foreclosed",
      isCompleted: member.loanStatus === "completed",
      foreclosureDetails: foreclosureDetails,
    };

    res.json({ message: response });

  } catch (error) {
    console.log(error);
    res.json({
      error: "Internal Server Error",
    });
  }
};
