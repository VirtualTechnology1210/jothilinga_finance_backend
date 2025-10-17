const {
  member_details,
  proposed_loan_details,
  receipts,
  manager_credentials,
  roles,
  center,
  group,
  jlg_collection_approval,
  jlg_denominations,
} = require("../models");
const { Op } = require("sequelize");

const getFirstAndLastEmiDates = (
  disbursementDate,
  tenure,
  emiDayOrder,
  formattedSelectedDate
) => {
  //   console.log("disbursementDate: " + disbursementDate);
  //   console.log("tenure: " + tenure);
  //   console.log("emiDayOrder: " + emiDayOrder);
  //   console.log("formattedSelectedDate: " + formattedSelectedDate);
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
  //   console.log("targetDay: " + targetDay);
  const transactionDate = new Date(disbursementDate);
  //   console.log("transactionDate: " + transactionDate);
  let firstEmiDate, lastEmiDate;

  for (let month = 1; month <= tenure; month++) {
    const paymentDate = new Date(transactionDate);
    // console.log("paymentDate before: " + paymentDate);
    paymentDate.setMonth(transactionDate.getMonth() + month);
    // console.log("paymentDate after: " + paymentDate);

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
    // console.log("firstDayOfMonth: " + firstDayOfMonth);
    // console.log("lastDayOfMonth: " + lastDayOfMonth);

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
      //   console.log("date.getDay(): " + date.getDay());
      if (date.getDay() === targetDay) {
        count++;
        if (count === parseInt(weekNumber)) {
          if (
            isLessOrEqualDate(new Date(date), new Date(formattedSelectedDate))
          ) {
            // console.log("isLessOrEqualDate is true");
            emiDates.push(date);
          }
          if (month === 1) firstEmiDate = date;
          if (month === tenure) lastEmiDate = date;
          break;
        }
      }
    }
  }

  return { firstEmiDate, lastEmiDate, emiDates };
};

const formatDate = (date) => {
  //   console.log("date in formateDate: " + date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
};

module.exports = getJlgEmiPendingList = async (req, res) => {
  try {
    const { manager_id, role, selectedDate, centerId } = req.query;
    // console.log("req.query: " + JSON.stringify(req.query));
    // console.log("centerId: " + centerId);
    // console.log("selectedDate: " + selectedDate);
    // console.log(
    //   "formatted selectedDate: " + formatDate(new Date(selectedDate))
    // );

    const formattedSelectedDate = formatDate(new Date(selectedDate));

    // Base where condition
    const whereCondition = {};

    // Define additional filtering based on role
    if (role === "Customer Relationship Officer") {
      whereCondition.fieldManagerId = manager_id; // Filter by fieldManagerId
      whereCondition.loanType = "JLG Loan";
      whereCondition.centerId = centerId;
      whereCondition.branchManagerStatus = "disbursed";
    } else {
      return res.json({ error: "Invalid role" });
    }
    const selectedDateObj = new Date(selectedDate);
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
    // console.log("dayOfMonth: " + dayOfMonth);
    const weekNumber = Math.ceil(dayOfMonth / 7);
    // console.log("weekNumber: " + weekNumber);
    const bmMeetingDayOrder =
      weekNumber + "," + weekDays[selectedDateObj.getDay()];
    // console.log(
    //   "weekDays[selectedDateObj.getDay()]: " +
    //     weekDays[selectedDateObj.getDay()]
    // );
    // console.log("bmMeetingDayOrder: " + bmMeetingDayOrder);
    const pendingEmiList = [];
    let minLastPendingEmiDate = null;

    const getJlgCollection = await jlg_collection_approval.findOne({
      where: {
        centerId,
        managerId: manager_id,
        emiDate: formattedSelectedDate,
      },
      include: [
        {
          model: jlg_denominations,
          as: "fk_jlg_collection_approval_hasMany_jlg_denominations_jlgCollectionId",
        },
      ],
    });

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

    // console.log("member_details: " + JSON.stringify(data));

    for (const member of data) {
      const disbursementDate = member.branchManagerStatusUpdatedAt;
      const tenure = member.proposedLoanDetails.tenureInMonths;
      const emiDayOrder =
        member.fk_member_details_belongsTo_center_centerId?.bmMeetingDayOrder;
      const { firstEmiDate, lastEmiDate, emiDates } = getFirstAndLastEmiDates(
        disbursementDate,
        tenure,
        emiDayOrder,
        formattedSelectedDate
      );
      //   console.log("firstEmiDate: " + firstEmiDate);
      //   console.log("lastEmiDate: " + lastEmiDate);
      //   console.log("emiDates: " + JSON.stringify(emiDates));
      let pendingEmi = 0;
      let lastPendingEmiDate = null;
      let pendingEmiDatesWithEmiAmount = []; // Array to store pending EMI dates, EMI amounts, and pending amounts

      const emiAmount = member.securityDeposit;
      let skipMember = false;

      const getCollectionAmount = await receipts.findAll({
        where: {
          memberId: member.id,
          ...(getJlgCollection &&
            getJlgCollection.collectedDate && {
              collectedDate: getJlgCollection.collectedDate,
            }),
        },
      });
      const totalCollectionAmount = getCollectionAmount.reduce(
        (sum, receipt) => {
          return sum + receipt.receivedAmount;
        },
        0
      );
      for (const emiDate of emiDates) {
        if (!skipMember) {
          const { Op } = require("sequelize"); // Make sure to import Op from sequelize

          const receiptsForEmiDate = await receipts.findAll({
            where: {
              memberId: member.id,
              emiDate: formatDate(emiDate),
              ...(getJlgCollection &&
                getJlgCollection.collectedDate && {
                  collectedDate: {
                    [Op.ne]: getJlgCollection.collectedDate, // NOT EQUAL condition
                  },
                }),
            },
          });

          if (receiptsForEmiDate.length === 0) {
            pendingEmi += emiAmount;
            lastPendingEmiDate = formatDate(emiDate);
            pendingEmiDatesWithEmiAmount.push({
              date: lastPendingEmiDate,
              emiAmount: emiAmount, // EMI amount
              pendingEmiAmount: emiAmount, // Pending EMI amount (full amount since no payment was made)
            });
            // console.log("lastPendingEmiDate: " + lastPendingEmiDate);
            skipMember = true;
          } else {
            const totalPaidAmount = receiptsForEmiDate.reduce(
              (sum, receipt) => {
                return sum + receipt.receivedAmount;
              },
              0
            );
            const pendingAmount = Math.max(emiAmount - totalPaidAmount, 0);

            if (pendingAmount > 0) {
              pendingEmi += pendingAmount;
              pendingEmiDatesWithEmiAmount.push({
                date: formatDate(emiDate),
                emiAmount: emiAmount, // EMI amount
                pendingEmiAmount: pendingAmount, // Pending EMI amount (partial payment)
              });
            }
          }
        }
      }
      // Update the minimum lastPendingEmiDate
      if (lastPendingEmiDate !== null) {
        if (
          minLastPendingEmiDate === null ||
          lastPendingEmiDate < minLastPendingEmiDate
        ) {
          minLastPendingEmiDate = lastPendingEmiDate;
        }
      }
      pendingEmiList.push({
        memberId: member.id,
        ApplicationId: member.ApplicationId,
        memberName: member.memberName,
        groupName: member.fk_member_details_belongsTo_group_groupId.leaderName,
        pendingEmi,
        pendingEmiDatesWithEmiAmount, // Add the array of pending EMI dates, EMI amounts, and pending amounts
        collectedEmi: getJlgCollection ? totalCollectionAmount : pendingEmi,
      });
    }
    // console.log("pendingEmiList: " + JSON.stringify(pendingEmiList));
    // console.log("formattedSelectedDate: " + formattedSelectedDate);
    // console.log("minLastPendingEmiDate: " + minLastPendingEmiDate);
    if (formattedSelectedDate > minLastPendingEmiDate) {
      return res.json({
        error: "Please select last pending date: " + minLastPendingEmiDate,
      });
    }
    const transformedDenominations = getJlgCollection
      ? getJlgCollection.fk_jlg_collection_approval_hasMany_jlg_denominations_jlgCollectionId.reduce(
          (acc, curr) => {
            acc[curr.denomination] = {
              count: curr.count,
              subTotal: curr.total,
            };
            return acc;
          },
          {
            500: { count: 0, subTotal: 0 },
            200: { count: 0, subTotal: 0 },
            100: { count: 0, subTotal: 0 },
            50: { count: 0, subTotal: 0 },
            20: { count: 0, subTotal: 0 },
            10: { count: 0, subTotal: 0 },
            5: { count: 0, subTotal: 0 },
            2: { count: 0, subTotal: 0 },
            1: { count: 0, subTotal: 0 },
          }
        )
      : null;
    res.json({
      pendingEmiList,
      minLastPendingEmiDate: getJlgCollection ? null : minLastPendingEmiDate,
      denominations: transformedDenominations,
      getJlgCollection: getJlgCollection ? getJlgCollection : null,
    });
  } catch (error) {
    console.error(error);
    res.json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
