const {
  manager_credentials,
  roles,
  member_details,
  proposed_loan_details,
  receipts,
  center,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const getFirstAndLastEmiDates = (disbursementDate, tenureInMonths, emiDay) => {
  const disbursement = new Date(disbursementDate);

  // First EMI Date: based on the EMI day in the disbursement month
  const firstEmiDate = new Date(
    disbursement.getFullYear(),
    disbursement.getMonth(),
    emiDay
  );
  firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);

  // Last EMI Date: based on the tenure and EMI day
  const lastEmiDate = new Date(
    disbursement.getFullYear(),
    disbursement.getMonth() + tenureInMonths,
    emiDay
  );
  return { firstEmiDate, lastEmiDate };
};

const getJlgFirstAndLastEmiDates = (disbursementDate, tenure, emiDayOrder) => {
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
  let firstEmiDate, lastEmiDate;

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

    for (
      let date = firstDayOfMonth;
      date <= lastDayOfMonth;
      date.setDate(date.getDate() + 1)
    ) {
      //   console.log("date.getDay(): " + date.getDay());
      if (date.getDay() === targetDay) {
        count++;
        if (count === parseInt(weekNumber)) {
          if (month === 1) firstEmiDate = date;
          if (month === tenure) lastEmiDate = date;
          break;
        }
      }
    }
  }

  return { firstEmiDate, lastEmiDate };
};

const getEmiDatesInRange = (emiDay, firstEmiDate, lastEmiDate) => {
  const emiDates = [];
  const from = new Date(firstEmiDate);
  const to = new Date(lastEmiDate);

  let currentDate = new Date(from);

  while (currentDate <= to) {
    const emiDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      emiDay
    );
    if (emiDate >= firstEmiDate && emiDate <= lastEmiDate) {
      emiDates.push(emiDate); // Pushing the `emiDate` as it is
    }

    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return emiDates;
};

const getJlgEmiDatesInRange = (emiDayOrder, firstEmiDate, lastEmiDate) => {
  const emiDates = [];
  const from = new Date(firstEmiDate);
  const to = new Date(lastEmiDate);
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
  const targetWeek = parseInt(weekNumber);

  // Helper function to check if date is within range
  const isDateInRange = (date) => date >= from && date <= to;

  // Start from the first day of the month containing 'from' date
  let currentMonthStart = new Date(from.getFullYear(), from.getMonth(), 1);
  // End at the last day of the month containing 'to' date
  let currentMonthEnd = new Date(to.getFullYear(), to.getMonth() + 1, 0);

  // Iterate through each month in the range
  while (currentMonthStart <= currentMonthEnd) {
    let count = 0;
    const month = currentMonthStart.getMonth();
    const year = currentMonthStart.getFullYear();
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Find the nth occurrence of the target day in this month
    for (
      let date = new Date(year, month, 1);
      date <= lastDayOfMonth;
      date.setDate(date.getDate() + 1)
    ) {
      if (date.getDay() === targetDay) {
        count++;
        if (count === targetWeek) {
          const emiDate = new Date(date);
          // Check if the date is within our range and between first and last EMI dates
          if (isDateInRange(emiDate)) {
            if (
              (!firstEmiDate || emiDate >= new Date(firstEmiDate)) &&
              (!lastEmiDate || emiDate <= new Date(lastEmiDate))
            ) {
              emiDates.push(new Date(emiDate));
            }
          }
          break;
        }
      }
    }

    // Move to next month
    currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
  }

  return emiDates;
};

module.exports = getDashboardCount = async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log("userId: " + userId);

    const getBranchIdsOfRole = await manager_credentials.findOne({
      where: { id: userId },
    });

    if (!getBranchIdsOfRole) {
      return res.status(400).json({
        error: "ManagerId not exist.",
      });
    }

    const branchIdsString = getBranchIdsOfRole.branchId;

    // Fetch the role IDs for "superadmin" and "developer"
    const excludedRoles = await roles.findAll({
      where: {
        roleName: ["superadmin", "developer"],
      },
      attributes: ["id"],
    });

    const excludedRoleIds = excludedRoles.map((role) => role.id);
    // Check if fieldManagerId filter should be applied
    const applyFieldManagerFilter =
      branchIdsString !== null &&
      !excludedRoleIds.includes(getBranchIdsOfRole.roleId);

    const croRoleId = await roles.findOne({
      where: { roleName: "Customer Relationship Officer" },
    });

    if (!croRoleId) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }

    let fieldManagerIds = [];
    if (applyFieldManagerFilter) {
      const fieldManagerRecords = await manager_credentials.findAll({
        attributes: ["id"],
        where: {
          roleId: croRoleId.id,
          [Op.and]: sequelize.where(
            sequelize.fn(
              "FIND_IN_SET",
              sequelize.col("branchId"),
              branchIdsString
            ),
            { [Op.gt]: 0 }
          ),
        },
        raw: true,
      });
      fieldManagerIds = fieldManagerRecords.map((record) => record.id);
    }

    const userCount = await manager_credentials.count();

    const blPendingMemberCount = await member_details.count({
      where: {
        loanType: "Business Loan",
        accountManagerStatus: "pending",
        branchManagerStatus: { [Op.not]: "rejected" },
        creditOfficerStatus: { [Op.not]: "rejected" },
        misStatus: { [Op.not]: "rejected" },
        creditManagerStatus: { [Op.not]: "rejected" },
        sanctionCommitteeStatus: { [Op.not]: "rejected" },
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const jlgPendingMemberCount = await member_details.count({
      where: {
        loanType: "JLG Loan",
        accountManagerStatus: "pending",
        branchManagerStatus: { [Op.not]: "rejected" },
        creditOfficerStatus: { [Op.not]: "rejected" },
        misStatus: { [Op.not]: "rejected" },
        creditManagerStatus: { [Op.not]: "rejected" },
        sanctionCommitteeStatus: { [Op.not]: "rejected" },
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const blApprovedMemberCount = await member_details.count({
      where: {
        loanType: "Business Loan",
        accountManagerStatus: "payment credited",
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const jlgApprovedMemberCount = await member_details.count({
      where: {
        loanType: "JLG Loan",
        accountManagerStatus: "submitted",
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const blRejectedMemberCount = await member_details.count({
      where: {
        loanType: "Business Loan",
        [Op.or]: [
          { branchManagerStatus: "rejected" },
          { creditOfficerStatus: "rejected" },
          { misStatus: "rejected" },
          { creditManagerStatus: "rejected" },
          { sanctionCommitteeStatus: "rejected" },
        ],
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const jlgRejectedMemberCount = await member_details.count({
      where: {
        loanType: "JLG Loan",
        [Op.or]: [
          { branchManagerStatus: "rejected" },
          { creditOfficerStatus: "rejected" },
          { misStatus: "rejected" },
          { creditManagerStatus: "rejected" },
          { sanctionCommitteeStatus: "rejected" },
        ],
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const blDisbursedLoanAmount = await member_details.sum(
      "sanctionedLoanAmountBySanctionCommittee",
      {
        where: {
          loanType: "Business Loan",
          accountManagerStatus: "payment credited",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );
    const jlgDisbursedLoanAmount = await member_details.sum(
      "sanctionedLoanAmountBySanctionCommittee",
      {
        where: {
          loanType: "JLG Loan",
          accountManagerStatus: "submitted",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );
    const blDisbursedLoanCount = await member_details.count({
      where: {
        loanType: "Business Loan",
        accountManagerStatus: "payment credited",
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const jlgDisbursedLoanCount = await member_details.count({
      where: {
        loanType: "JLG Loan",
        accountManagerStatus: "submitted",
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
      },
    });
    const blSecurityDepositAmount = await member_details.sum(
      "securityDeposit",
      {
        where: {
          loanType: "Business Loan",
          accountManagerStatus: "payment credited",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );
    const jlgSecurityDepositAmount = await member_details.sum(
      "securityDeposit",
      {
        where: {
          loanType: "JLG Loan",
          accountManagerStatus: "submitted",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );

    const blInsuranceChargeAmount = await member_details.sum(
      "insuranceAmount",
      {
        where: {
          loanType: "Business Loan",
          accountManagerStatus: "payment credited",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );

    const blProcessingChargeAmount = await member_details.sum(
      "processingCharge",
      {
        where: {
          loanType: "Business Loan",
          accountManagerStatus: "payment credited",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );
    const jlgProcessingChargeAmount = await member_details.sum(
      "processingCharge",
      {
        where: {
          loanType: "JLG Loan",
          accountManagerStatus: "submitted",
          ...(applyFieldManagerFilter && {
            fieldManagerId: { [Op.in]: fieldManagerIds },
          }),
        },
      }
    );

    const members = await member_details.findAll({
      where: {
        branchManagerStatus: "disbursed",
        ...(applyFieldManagerFilter && {
          fieldManagerId: { [Op.in]: fieldManagerIds },
        }),
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
      ],
    });

    let blTotalOutstandingPrincipal = 0;
    let jlgTotalOutstandingPrincipal = 0;
    let blTotalOutstandingInterest = 0;
    let jlgTotalOutstandingInterest = 0;
    let blTotalPrincipalPaid = 0;
    let jlgTotalPrincipalPaid = 0;
    let blTotalInterestPaid = 0;
    let jlgTotalInterestPaid = 0;
    let blTotalEmiPaid = 0;
    let jlgTotalEmiPaid = 0;

    members.forEach((member) => {
      let firstEmiDate, lastEmiDate, emiDates;
      if (member.loanType === "Business Loan") {
        ({ firstEmiDate, lastEmiDate } = getFirstAndLastEmiDates(
          member.branchManagerStatusUpdatedAt,
          member.proposedLoanDetails.tenureInMonths,
          member.emiDateByBranchManager
        ));

        // Get all EMI dates from firstEmiDate to lastEmiDate
        emiDates = getEmiDatesInRange(
          member.emiDateByBranchManager,
          firstEmiDate,
          lastEmiDate
        );
      } else if (member.loanType === "JLG Loan") {
        ({ firstEmiDate, lastEmiDate } = getJlgFirstAndLastEmiDates(
          member.branchManagerStatusUpdatedAt,
          member.proposedLoanDetails.tenureInMonths,
          member.fk_member_details_belongsTo_center_centerId.bmMeetingDayOrder
        ));
        emiDates = getJlgEmiDatesInRange(
          member.fk_member_details_belongsTo_center_centerId.bmMeetingDayOrder,
          firstEmiDate,
          lastEmiDate
        );
      }

      let blOutstandingPrincipal = Math.round(
        member.sanctionedLoanAmountBySanctionCommittee
      );
      let jlgOutstandingPrincipal = Math.round(
        member.sanctionedLoanAmountBySanctionCommittee
      );
      let blOutstandingInterest = 0;
      let jlgOutstandingInterest = 0;
      let blPrincipalPaid = 0;
      let jlgPrincipalPaid = 0;
      let blInterestPaid = 0;
      let jlgInterestPaid = 0;
      let blEmiPaid = 0;
      let jlgEmiPaid = 0;

      emiDates.forEach((emiDate) => {
        const formattedEmiDate = `${emiDate.getFullYear()}-${String(
          emiDate.getMonth() + 1
        ).padStart(2, "0")}-${String(emiDate.getDate()).padStart(2, "0")}`;

        // Filter receipts for the current EMI date
        const receiptsForEmiDate = member.receiptsDetails.filter(
          (receipt) => receipt.emiDate === formattedEmiDate
        );

        // Calculate total received amount for this EMI date
        let receivedAmount = Math.round(
          receiptsForEmiDate.reduce(
            (sum, receipt) => sum + receipt.receivedAmount,
            0
          )
        );
        if (member.loanType === "Business Loan") {
          blEmiPaid += receivedAmount;
        } else {
          jlgEmiPaid += receivedAmount;
        }

        // Calculate interest component for this EMI date
        const interestComponent = Math.round(
          ((member.loanType === "Business Loan"
            ? blOutstandingPrincipal
            : jlgOutstandingPrincipal) *
            member.proposedLoanDetails.rateOfInterest) /
            12 /
            100
        );

        if (receivedAmount >= interestComponent) {
          if (member.loanType === "Business Loan") {
            blInterestPaid += interestComponent;
            jlgOutstandingInterest += interestComponent;
          } else {
            jlgInterestPaid += interestComponent;
            jlgOutstandingInterest += interestComponent;
          }

          receivedAmount -= interestComponent;

          const principalReduction = Math.min(
            member.loanType === "Business Loan"
              ? blOutstandingPrincipal
              : jlgOutstandingPrincipal,
            receivedAmount
          );
          if (member.loanType === "Business Loan") {
            blPrincipalPaid += principalReduction;
            blOutstandingPrincipal -= principalReduction;
          } else {
            jlgPrincipalPaid += principalReduction;
            jlgOutstandingPrincipal -= principalReduction;
          }
        } else {
          if (member.loanType === "Business Loan") {
            blInterestPaid += receivedAmount;
            blOutstandingInterest += Math.round(
              interestComponent - receivedAmount
            );
          } else {
            jlgInterestPaid += receivedAmount;
            jlgOutstandingInterest += Math.round(
              interestComponent - receivedAmount
            );
          }
        }
      });

      // Accumulate totals for all members
      if (member.loanType === "Business Loan") {
        blTotalOutstandingPrincipal += blOutstandingPrincipal;
        blTotalOutstandingInterest += blOutstandingInterest;
        blTotalPrincipalPaid += blPrincipalPaid;
        blTotalInterestPaid += blInterestPaid;
        blTotalEmiPaid += blEmiPaid;
      } else {
        jlgTotalOutstandingPrincipal += jlgOutstandingPrincipal;
        jlgTotalOutstandingInterest += jlgOutstandingInterest;
        jlgTotalPrincipalPaid += jlgPrincipalPaid;
        jlgTotalInterestPaid += jlgInterestPaid;
        jlgTotalEmiPaid += jlgEmiPaid;
      }
    });

    res.status(200).json({
      userCount,
      blPendingMemberCount,
      jlgPendingMemberCount,
      blApprovedMemberCount,
      jlgApprovedMemberCount,
      blRejectedMemberCount,
      jlgRejectedMemberCount,
      blDisbursedLoanAmount,
      jlgDisbursedLoanAmount,
      blDisbursedLoanCount,
      jlgDisbursedLoanCount,
      blSecurityDepositAmount,
      jlgSecurityDepositAmount,
      blInsuranceChargeAmount,
      blProcessingChargeAmount,
      jlgProcessingChargeAmount,
      blTotalOutstandingPrincipal: Math.round(blTotalOutstandingPrincipal),
      jlgTotalOutstandingPrincipal: Math.round(jlgTotalOutstandingPrincipal),
      blTotalOutstandingInterest: Math.round(blTotalOutstandingInterest),
      jlgTotalOutstandingInterest: Math.round(jlgTotalOutstandingInterest),
      blTotalPrincipalPaid: Math.round(blTotalPrincipalPaid),
      jlgTotalPrincipalPaid: Math.round(jlgTotalPrincipalPaid),
      blTotalInterestPaid: Math.round(blTotalInterestPaid),
      jlgTotalInterestPaid: Math.round(jlgTotalInterestPaid),
      blTotalEmiPaid: Math.round(blTotalEmiPaid),
      jlgTotalEmiPaid: Math.round(jlgTotalEmiPaid),
    });
    console.log("Response for insurance amount .", blInsuranceChargeAmount);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
