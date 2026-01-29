const { JSON } = require("sequelize");
const {
  member_details,
  proposed_loan_details,
  manager_credentials,
  branch,
  receipts,
  emi_charts,
  sequelize,
} = require("../models");

module.exports = getAccountStatementReport = async (req, res) => {
  const applicationId = req.params.applicationId;

  try {
    // Your existing code (unchanged)
    const member = await member_details.findOne({
      where: { ApplicationId: applicationId },
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
      where: { memberId: member.id },
      order: [['emiDate', 'ASC'], ['collectedDate', 'ASC'], ['createdAt', 'ASC']] // Order by EMI date, then by collection date for partial payments
    });

    let totalEmiPaid = 0;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let lastPaidMonth = 0; 

    // Calculate cumulative amounts (your existing logic)
    if (emiChartRecord && emiChartRecord.emiChart) {
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
            break;
          }
        } else {
          break;
        }
      }
    }

    // NEW: Group receipts by EMI month to handle partial payments
    const groupReceiptsByEmiMonth = (receipts, emiChart) => {
      const grouped = {};
      
      receipts.forEach(receipt => {
        const receiptDate = new Date(receipt.emiDate);
        const emiDateKey = `${receiptDate.getFullYear()}-${receiptDate.getMonth() + 1}`; // YYYY-MM format
        
        if (!grouped[emiDateKey]) {
          // Find the EMI amount for this month from emi_chart
          let emiAmount = receipt.emiAmount || receipt.receivedAmount; // Use emiAmount from receipt, fallback to receivedAmount
          
          if (emiChart && emiChart.emiChart) {
            const emiMonthData = emiChart.emiChart.find(monthData => {
              const emiDate = new Date(monthData.emiDate);
              return (
                emiDate.getFullYear() === receiptDate.getFullYear() &&
                emiDate.getMonth() === receiptDate.getMonth()
              );
            });
            
            if (emiMonthData) {
              emiAmount = emiMonthData.emiAmount;
            }
          }
          
          grouped[emiDateKey] = {
            emiDate: receipt.emiDate, // Use the EMI due date
            emiAmount: emiAmount, // Total EMI amount due for this month
            payments: []
          };
        }
        
        // Add individual payment to the group
        grouped[emiDateKey].payments.push({
          id: receipt.id,
          receivedDate: receipt.collectedDate || receipt.createdAt, // When payment was actually collected
          receivedAmount: receipt.receivedAmount,
          status: receipt.status,
          paymentMethod: receipt.upi_payment ? 'UPI' : 'Cash', // Determine payment method
          description: receipt.description,
          createdAt: receipt.createdAt
        });
      });
      
      // Convert to array and sort by EMI date
      return Object.values(grouped).sort((a, b) => new Date(a.emiDate) - new Date(b.emiDate));
    };

    // Group receipts for partial payment support
    const groupedReceiptsDetails = groupReceiptsByEmiMonth(allReceipts, emiChartRecord);

    // Prepare member details with grouped receipts
    const memberData = member.get();
    
    // Replace the original receiptsDetails with grouped version
    memberData.receiptsDetails = groupedReceiptsDetails;

    const response = {
      memberDetails: memberData,
      branchName: getBranchName.branchName,
      managerName: getBranchId.employeeName,
      cumulativeEmiPaid: totalEmiPaid,
      cumulativePrincipalPaid: totalPrincipalPaid,
      cumulativeInterestPaid: totalInterestPaid,
      
      // Optional: Add summary statistics
      paymentSummary: {
        totalEmiMonths: groupedReceiptsDetails.length,
        totalPartialPayments: groupedReceiptsDetails.reduce((sum, emi) => sum + emi.payments.length, 0),
        fullyPaidMonths: groupedReceiptsDetails.filter(emi => 
          emi.payments.reduce((sum, payment) => sum + payment.receivedAmount, 0) >= emi.emiAmount
        ).length
      }
    };

    // Alternative approach if you want to keep the original receiptsDetails unchanged
// and add a new field for grouped payments
// const alternativeResponse = {
//   memberDetails: member.get(), // Original structure preserved
//   branchName: getBranchName.branchName,
//   managerName: getBranchId.employeeName,
//   cumulativeEmiPaid: totalEmiPaid,
//   cumulativePrincipalPaid: totalPrincipalPaid,
//   cumulativeInterestPaid: totalInterestPaid,
  
//   // NEW: Add grouped receipts for partial payment support
//   groupedReceiptsDetails: groupedReceiptsDetails
// };

    res.json({ message: response });
    
  } catch (error) {
    console.log(error);
    res.json({
      error: "Internal Server Error",
    });
  }
};

