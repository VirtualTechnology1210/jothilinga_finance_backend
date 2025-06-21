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

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
};

const getBlFirstAndLastEmiDates = (
  disbursementDate,
  tenure,
  emiDay,
  formattedSelectedDate
) => {
  const disbursement = new Date(disbursementDate);
  const emiDates = [];

  for (let month = 1; month <= tenure; month++) {
    const emiDate = new Date(disbursement);
    emiDate.setMonth(disbursement.getMonth() + month);
    emiDate.setDate(emiDay); // Set the EMI day directly

    emiDates.push(formatDate(new Date(emiDate)));
  }
  return emiDates;
};

const getJlgFirstAndLastEmiDates = (
  disbursementDate,
  tenure,
  emiDayOrder,
  formattedSelectedDate
) => {
  const emiDates = [];
  const [weekNumber, dayOfWeek] = emiDayOrder.split(",");
  const dayOfWeekMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0,
  };
  const targetDay = dayOfWeekMap[dayOfWeek];
  const transactionDate = new Date(disbursementDate);
  let firstEmiDate,
    lastEmiDate,
    nextEmiDate = null;

  for (let month = 1; month <= tenure; month++) {
    const paymentDate = new Date(transactionDate);
    paymentDate.setMonth(transactionDate.getMonth() + month);

    // Find the nth occurrence of the target day in the month
    let count = 0;
    const firstDayOfMonth = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth() + 1,
      0
    );
    const isLessOrEqualDate = (date1, date2) => {
      return (
        date1.getFullYear() < date2.getFullYear() ||
        (date1.getFullYear() === date2.getFullYear() &&
          (date1.getMonth() < date2.getMonth() ||
            (date1.getMonth() === date2.getMonth() &&
              date1.getDate() <= date2.getDate())))
      );
    };

    for (
      let date = firstDayOfMonth;
      date <= lastDayOfMonth;
      date.setDate(date.getDate() + 1)
    ) {
      if (date.getDay() === targetDay) {
        count++;
        if (count === parseInt(weekNumber)) {
          if (
            isLessOrEqualDate(new Date(date), new Date(formattedSelectedDate))
          ) {
            emiDates.push(date);
          }
          if (month === 1) firstEmiDate = date;
          if (month === tenure) lastEmiDate = date;

          // Find the next EMI date after the selected date
          if (
            !isLessOrEqualDate(
              new Date(date),
              new Date(formattedSelectedDate)
            ) &&
            !nextEmiDate
          ) {
            nextEmiDate = date;
          }

          break;
        }
      }
    }
  }

  // If the selected date is the last EMI date, set nextEmiDate to null
  if (formatDate(lastEmiDate) === formattedSelectedDate) {
    nextEmiDate = null;
  }

  return { firstEmiDate, lastEmiDate, emiDates, nextEmiDate };
};

module.exports = getForeclosureDataForBm = async (req, res) => {
  try {
    const { searchType, searchValue, role, manager_id } = req.query;

    // Handle Accounts Manager role
    if (role === "Accounts Manager") {
      const pendingForeclosures = await foreclosure_approval.findAll({
        where: {
          accountManagerStatus: "pending",
          branchManagerStatus: "submitted",
        },
        include: [
          {
            model: foreclosure_denominations,
            as: "fk_foreclosure_approval_hasMany_foreclosure_denominations_foreclosureId",
          },
          {
            model: member_details,
            as: "fk_foreclosure_approval_belongsTo_member_details_memberId",
          },
        ],
      });

      return res.json({
        success: "Fetched all pending foreclosure approvals",
        pendingForeclosures: pendingForeclosures,
      });
    }

    // Check if role is Branch Manager
    if (role !== "Branch Manager") {
      return res.status(403).json({
        error: "Access Denied",
        message: "Only Branch Managers can access this data",
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

    // Find members based on the search condition
    const member = await member_details.findOne({
      where: {
        ...whereCondition,
        branchManagerStatus: "disbursed",
        loanStatus: { [Op.in]: ["opened", "foreclosed"] },
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
          model: center,
          as: "fk_member_details_belongsTo_center_centerId",
        },
        {
          model: group,
          as: "fk_member_details_belongsTo_group_groupId",
        },
      ],
    });

    if (!member) {
      return res.status(404).json({
        error: "Member not applicable for Foreclosure",
        message: "No member found with the provided search criteria",
      });
    }
    const getBmStatusOfForeclosure = await foreclosure_approval.findOne({
      where: {
        memberId: member.id,
      },
      include: [
        {
          model: foreclosure_denominations,
          as: "fk_foreclosure_approval_hasMany_foreclosure_denominations_foreclosureId",
        },
      ],
    });
    if (
      getBmStatusOfForeclosure &&
      getBmStatusOfForeclosure.accountManagerStatus === "pending"
    ) {
      console.log(
        "getBmStatusOfForeclosure: " + JSON.stringify(getBmStatusOfForeclosure)
      );
      return res.json({
        success: "Foreclosure Approval Pending from Account Manager",
        foreclosureData: getBmStatusOfForeclosure,
        memberName: member.memberName,
        branchManagerStatus: getBmStatusOfForeclosure.branchManagerStatus,
      });
    }
    if (
      getBmStatusOfForeclosure &&
      getBmStatusOfForeclosure.accountManagerStatus === "submitted"
    ) {
      const getBranchId = await manager_credentials.findOne({
        where: { id: manager_id },
        attributes: ["branchId"],
      });

      const getBranchName = await branch.findOne({
        where: { id: getBranchId.branchId },
        attributes: ["branchName"],
      });
      return res.json({
        success: "Foreclosed",
        receiptData: getBmStatusOfForeclosure,
        member: member,
        branchManagerStatus: getBmStatusOfForeclosure.branchManagerStatus,
        branchName: getBranchName.branchName,
      });
    }
    let totalOutstandingPrincipal = 0;

    if (member.loanType === "JLG Loan") {
      const disbursementDate = member.branchManagerStatusUpdatedAt;
      const tenure = member.proposedLoanDetails.tenureInMonths;
      const emiDayOrder =
        member.fk_member_details_belongsTo_center_centerId?.bmMeetingDayOrder;
      const formattedCurrentDate = formatDate(new Date());
      const { emiDates } = getJlgFirstAndLastEmiDates(
        disbursementDate,
        tenure,
        emiDayOrder,
        formattedCurrentDate
      );
      totalOutstandingPrincipal = Math.round(
        member.sanctionedLoanAmountBySanctionCommittee
      );
      const monthlyRate = member.proposedLoanDetails.rateOfInterest / 12 / 100;
      for (const emiDate of emiDates) {
        const receiptsForEmiDate = await receipts.findAll({
          where: {
            memberId: member.id,
            emiDate: formatDate(emiDate),
          },
        });

        const totalPaidAmount = receiptsForEmiDate.reduce((sum, receipt) => {
          return sum + receipt.receivedAmount;
        }, 0);
        const interestComponent = totalOutstandingPrincipal * monthlyRate;
        if (totalPaidAmount >= interestComponent) {
          const principalReduction = Math.min(
            totalOutstandingPrincipal,
            Math.round(totalPaidAmount - interestComponent)
          );
          totalOutstandingPrincipal -= principalReduction;
        }
      }
    } else if (member.loanType === "Business Loan") {
      const disbursementDate = member.branchManagerStatusUpdatedAt;
      const tenure = member.proposedLoanDetails.tenureInMonths;
      const emiDay = member.emiDateByBranchManager;
      const formattedCurrentDate = formatDate(new Date());
      // In the Business Loan section, update the function call:
      const emiDates = getBlFirstAndLastEmiDates(
        disbursementDate,
        tenure,
        emiDay,
        formattedCurrentDate
      );
      totalOutstandingPrincipal = Math.round(
        member.sanctionedLoanAmountBySanctionCommittee
      );
      console.log("emiDates: " + emiDates);
      const monthlyRate = member.proposedLoanDetails.rateOfInterest / 12 / 100;
      for (const emiDate of emiDates) {
        const receiptsForEmiDate = await receipts.findAll({
          where: {
            memberId: member.id,
            emiDate: formatDate(new Date(emiDate)),
          },
        });

        const totalPaidAmount = receiptsForEmiDate.reduce((sum, receipt) => {
          return sum + receipt.receivedAmount;
        }, 0);
        const interestComponent = totalOutstandingPrincipal * monthlyRate;
        if (totalPaidAmount >= interestComponent) {
          const principalReduction = Math.min(
            totalOutstandingPrincipal,
            Math.round(totalPaidAmount - interestComponent)
          );
          totalOutstandingPrincipal -= principalReduction;
        }
      }
    }

    res.json({
      success: "Foreclosure data retrieved successfully",
      data: {
        memberId: member.id || "",
        memberName: member.memberName || "",
        outstandingPrincipal: totalOutstandingPrincipal || 0,
      },
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
