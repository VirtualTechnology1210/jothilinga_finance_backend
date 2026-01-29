const { JSON } = require("sequelize");
const {
  member_details,
  proposed_loan_details,
  manager_credentials,
  branch,
  receipts,
  emi_charts,
  roles,
  sequelize,
} = require("../models");

const { Op } = require("sequelize");

module.exports = getAccountStatementReport = async (req, res) => {
  const applicationId = req.params.applicationId;

  try {
    // Your existing code (unchanged)
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
              error: "You are not authorized to access this branch’s customer data.",
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
      // let emiChartArray = JSON.parse(emiChartRecord.emiChart);
      let emiChartArray = emiChartRecord.emiChart;

      emiChartArray.sort((a, b) => a.month - b.month);


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


            totalEmiPaid += monthData.emiAmount;
            totalPrincipalPaid += monthData.principalAmount;
            totalInterestPaid += monthData.interestAmount;


            lastPaidMonth = monthData.month;

          } else {
            // If there's a gap (like Month 2 pending, Month 3 paid), stop counting
            break;
          }
        } else {
          // If current month is not paid, stop counting
          break;
        }
      }
    }


    const response = {
      memberDetails: member.get(),
      branchName: getBranchName.branchName,
      managerName: getBranchId.employeeName,

      cumulativeEmiPaid: totalEmiPaid,
      cumulativePrincipalPaid: totalPrincipalPaid,
      cumulativeInterestPaid: totalInterestPaid
    };

    res.json({ message: response });

  } catch (error) {
    console.log(error);
    res.json({
      error: "Internal Server Error",
    });
  }
};