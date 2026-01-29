const {
  member_details,
  proposed_loan_details,
  receipts,
  member_business_details,
  center,
  group,
  manager_credentials,
  branch,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
};

const getFirstAndLastEmiDates = (
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

module.exports = getJlgCollectionSheetReport = async (req, res) => {
  try {
    const { fromDate, toDate, manager_id, role } = req.query;

    const getBranchId = await manager_credentials.findOne({
      where: { id: manager_id },
      attributes: ["branchId"],
    });

    const getBranchName = await branch.findOne({
      where: { id: getBranchId.branchId },
      attributes: ["branchName"],
    });

    // Convert string dates to Date objects
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const getCenters = await center.findAll({
      where: {
        fieldManagerId: manager_id,
      },
    });

    const allReports = [];

    // Loop through each center
    for (const centerData of getCenters) {
      const centerId = centerData.id;

      // Loop through each day from start to end date for this center
      for (
        let currentDate = new Date(startDate);
        currentDate <= endDate;
        currentDate.setDate(currentDate.getDate() + 1)
      ) {
        const formattedSelectedDate = formatDate(currentDate);
        const whereCondition = {};

        // Define additional filtering based on role
        if (role === "Branch Manager" || role === "superadmin") {
          whereCondition.fieldManagerId = manager_id; // Filter by fieldManagerId
          whereCondition.loanType = "JLG Loan";
          whereCondition.centerId = centerId;
          whereCondition.branchManagerStatus = "disbursed";
        } else {
          return res.json({ error: "Invalid role" });
        }
        const selectedDateObj = new Date(currentDate);
        const weekDays = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayOfMonth = selectedDateObj.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        const bmMeetingDayOrder =
          weekNumber + "," + weekDays[selectedDateObj.getDay()];

        const data = await member_details.findAll({
          where: whereCondition,
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
              model: center, // Include the center model
              as: "fk_member_details_belongsTo_center_centerId",
              where: {
                id: centerId,
                fieldManagerId: manager_id,
                bmMeetingDayOrder,
              },
            },
            {
              model: group,
              as: "fk_member_details_belongsTo_group_groupId",
            },
          ],
        });
        for (const member of data) {
          const disbursementDate = member.branchManagerStatusUpdatedAt;
          const tenure = member.proposedLoanDetails.tenureInMonths;
          const emiDayOrder =
            member.fk_member_details_belongsTo_center_centerId?.bmMeetingDayOrder;
          const { firstEmiDate, lastEmiDate, emiDates, nextEmiDate } =
            getFirstAndLastEmiDates(
              disbursementDate,
              tenure,
              emiDayOrder,
              formattedSelectedDate
            );

          // Add validation to check if current date is between first and last EMI dates
          const currentDateObj = new Date(formattedSelectedDate);
          if (currentDateObj < firstEmiDate || currentDateObj > lastEmiDate) {
            continue; // Skip this iteration if the date is outside EMI date range
          }

          let pendingEmiUptoLastMonth = 0;
          let currentMonthPendingEmi = 0;
          let paidEmiCount = 0;
          let totalOutstandingPrincipal = Math.round(
            member.sanctionedLoanAmountBySanctionCommittee
          );
          const emiAmount = member.securityDeposit;
          for (const emiDate of emiDates) {
            const receiptsForEmiDate = await receipts.findAll({
              where: {
                memberId: member.id,
                emiDate: formatDate(emiDate),
              },
            });
            if (receiptsForEmiDate.length === 0) {
              if (formatDate(emiDate) === formattedSelectedDate) {
                currentMonthPendingEmi = emiAmount;
              } else {
                pendingEmiUptoLastMonth += emiAmount;
              }
            } else {
              const totalPaidAmount = receiptsForEmiDate.reduce(
                (sum, receipt) => {
                  return sum + receipt.receivedAmount;
                },
                0
              );
              const interestComponent = Math.round(
                (totalOutstandingPrincipal *
                  member.proposedLoanDetails.rateOfInterest) /
                  12 /
                  100
              );
              if (totalPaidAmount >= interestComponent) {
                const principalReduction = Math.min(
                  totalOutstandingPrincipal,
                  totalPaidAmount - interestComponent
                );
                totalOutstandingPrincipal -= principalReduction;
              }
              // Count only receipts with status "paid"
              const totalPaidCount = receiptsForEmiDate.filter(
                (receipt) => receipt.status === "paid"
              ).length;
              paidEmiCount += totalPaidCount;
              const pendingAmount = Math.max(emiAmount - totalPaidAmount, 0);
              if (formatDate(emiDate) === formattedSelectedDate) {
                currentMonthPendingEmi = pendingAmount;
              } else {
                pendingEmiUptoLastMonth += pendingAmount;
              }
            }
          }
          allReports.push({
            branchName: getBranchName.branchName,
            centerName:
              member.fk_member_details_belongsTo_center_centerId?.name,
            groupName: member.fk_member_details_belongsTo_group_groupId
              ? member.fk_member_details_belongsTo_group_groupId.leaderName
              : null,
            meetingDay: formattedSelectedDate,
            memberName: member.memberName,
            mobile: member.phoneNumber,
            fedLanNo: member.fedLanNo,
            loanAmount: member.sanctionedLoanAmountBySanctionCommittee,
            disbursementDate: disbursementDate,
            tenure: tenure,
            paidEmiCount: paidEmiCount,
            pendingEmiUptoLastMonth: pendingEmiUptoLastMonth,
            currentMonthPendingEmi: currentMonthPendingEmi,
            totalOutstandingPrincipal: totalOutstandingPrincipal,
            nextEmiDate: nextEmiDate ? formatDate(nextEmiDate) : null,
          });
        }
      }
    }

    res.json({
      success: true,
      reports: allReports,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
