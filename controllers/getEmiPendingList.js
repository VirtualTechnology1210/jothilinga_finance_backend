const {
  member_details,
  proposed_loan_details,
  receipts,
  manager_credentials,
  bl_collection_approval,
  bl_denominations,
  roles,
} = require("../models");
const { Op } = require("sequelize");

// Function to calculate first and last EMI dates
const getFirstAndLastEmiDates = (disbursementDate, tenureInMonths, emiDay) => {
  const disbursement = new Date(disbursementDate);

  // First EMI Date
  const firstEmiDate = new Date(
    disbursement.getFullYear(),
    disbursement.getMonth(),
    emiDay
  );
  // if (firstEmiDate < disbursement) {
  //   firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
  // }
  firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);

  // Last EMI Date
  const lastEmiDate = new Date(
    disbursement.getFullYear(),
    disbursement.getMonth() + tenureInMonths,
    emiDay
  );

  return { firstEmiDate, lastEmiDate };
};

// Function to generate EMI dates between first EMI date and the current date
const getEmiDates = (
  emiDay,
  formattedFromDate,
  formattedToDate,
  firstEmiDate,
  lastEmiDate
) => {
  const emiDates = [];
  const currentDate = new Date(formattedToDate);
  let currentEmiDate = new Date(firstEmiDate);

  while (
    currentEmiDate <= currentDate &&
    currentEmiDate >= firstEmiDate &&
    currentEmiDate <= lastEmiDate
  ) {
    emiDates.push(new Date(currentEmiDate)); // Clone date object
    currentEmiDate.setMonth(currentEmiDate.getMonth() + 1); // Move to the next month's EMI
  }

  return emiDates;
};

// Function to calculate EMI amount using the formula
const calculateEmiAmount = (loanAmount, rateOfInterest, tenureInMonths) => {
  const monthlyRate = rateOfInterest / 12 / 100;
  const emiAmount =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) /
    (Math.pow(1 + monthlyRate, tenureInMonths) - 1);

  return Math.round(emiAmount); // Return rounded EMI amount
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
};

module.exports = getEmiPendingList = async (req, res) => {
  try {
    const { manager_id, role, fromDate, toDate } = req.query;
    console.log("fromDate: " + fromDate);
    console.log("toDate: " + toDate);
    console.log("formatted fromDate: " + formatDate(new Date(fromDate)));
    console.log("formatted toDate: " + formatDate(new Date(toDate)));

    const formattedFromDate = formatDate(new Date(fromDate));
    const formattedToDate = formatDate(new Date(toDate));

    // Base where condition
    const whereCondition = {
      branchManagerStatus: "disbursed",
      loanType: "Business Loan",
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
          model: receipts,
          as: "receiptsDetails",
        },
      ],
    });

    const pendingEmiList = [];
    const retriggerEmiList = [];

    for (const member of data) {
      const disbursementDate = member.branchManagerStatusUpdatedAt;
      const tenureInMonths = member.proposedLoanDetails.tenureInMonths;
      const emiDay = member.emiDateByBranchManager; // Assume this holds the EMI day

      // Calculate first and last EMI dates
      const { firstEmiDate, lastEmiDate } = getFirstAndLastEmiDates(
        disbursementDate,
        tenureInMonths,
        emiDay
      );

      // Generate EMI dates up to the current date
      const emiDates = getEmiDates(
        emiDay,
        formattedFromDate,
        formattedToDate,
        firstEmiDate,
        lastEmiDate
      );

      // Calculate EMI amount using the loan details
      const loanAmount = member.sanctionedLoanAmountBySanctionCommittee;
      const rateOfInterest = member.proposedLoanDetails.rateOfInterest;
      const emiAmount = calculateEmiAmount(
        loanAmount,
        rateOfInterest,
        tenureInMonths
      );

      // Loop through EMI dates and check the receipts
      for (const emiDate of emiDates) {
        // console.log("emiDate: " + emiDate);
        // console.log("formatDate(emiDate): " + formatDate(emiDate));
        // Fetch all receipts for the current emiDate
        const receiptsForEmiDate = await receipts.findAll({
          where: {
            memberId: member.id,
            emiDate: formatDate(emiDate),
          },
          include: [
            {
              model: bl_collection_approval,
              as: "fk_receipts_hasOne_bl_collection_approval_receiptId",
              include: [
                {
                  model: bl_denominations,
                  as: "fk_bl_collection_approval_hasMany_bl_denominations_blCollectionId",
                },
              ],
            },
          ],
        });

        if (receiptsForEmiDate.length === 0) {
          // No receipts found, meaning no payment has been made
          // Add the full EMI amount as pending
          pendingEmiList.push({
            memberId: member.id,
            ApplicationId: member.ApplicationId,
            memberName: member.memberName,
            emiDate: formatDate(emiDate),
            emiAmount, // Full EMI amount is pending
            pendingEmiAmount: emiAmount, // No payment made, so pending amount is full EMI
          });
        } else {
          // Receipts exist, calculate the total paid amount
          const totalPaidAmount = receiptsForEmiDate.reduce((sum, receipt) => {
            return sum + receipt.receivedAmount;
          }, 0);
          //   console.log("totalPaidAmount: " + totalPaidAmount);

          // Calculate the pending amount
          const pendingEmiAmount = Math.max(emiAmount - totalPaidAmount, 0);

          //   console.log("pendingEmiAmount: " + pendingEmiAmount);

          // If EMI is still pending, add to the pendingEmiList
          if (pendingEmiAmount > 0) {
            pendingEmiList.push({
              memberId: member.id,
              ApplicationId: member.ApplicationId,
              memberName: member.memberName,
              emiDate: formatDate(emiDate),
              emiAmount, // Original EMI amount
              pendingEmiAmount, // Pending amount (remaining amount to be paid)
            });
          }
          if (role === "Customer Relationship Officer") {
            for (const receipt of receiptsForEmiDate) {
              if (
                receipt?.fk_receipts_hasOne_bl_collection_approval_receiptId
                  ?.fieldManagerStatus === "retrigger"
              ) {
                const transformedDenominations =
                  receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
                    ? receipt.fk_receipts_hasOne_bl_collection_approval_receiptId.fk_bl_collection_approval_hasMany_bl_denominations_blCollectionId.reduce(
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
                retriggerEmiList.push({
                  receiptId: receipt.id,
                  memberId: member.id,
                  ApplicationId: member.ApplicationId,
                  memberName: member.memberName,
                  emiDate: formatDate(emiDate),
                  emiAmount,
                  pendingEmiAmount:
                    emiAmount - totalPaidAmount + receipt.receivedAmount,
                  receivedAmount: receipt.receivedAmount,
                  description: receipt.description,
                  collectionPhoto:
                    receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
                      .collectionPhoto,
                  receiptNo:
                    receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
                      .receiptNo,
                  denominations: transformedDenominations,
                });
              }
            }
          }
        }
      }
    }

    res.status(200).json({ pendingEmiList, retriggerEmiList });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
