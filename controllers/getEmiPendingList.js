// const {
//   member_details,
//   proposed_loan_details,
//   receipts,
//   manager_credentials,
//   bl_collection_approval,
//   bl_denominations,
//   roles,
// } = require("../models");
// const { Op } = require("sequelize");

// // Function to calculate first and last EMI dates
// const getFirstAndLastEmiDates = (disbursementDate, tenureInMonths, emiDay) => {
//   const disbursement = new Date(disbursementDate);

//   // First EMI Date
//   const firstEmiDate = new Date(
//     disbursement.getFullYear(),
//     disbursement.getMonth(),
//     emiDay
//   );
//   // if (firstEmiDate < disbursement) {
//   //   firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
//   // }
//   firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);

//   // Last EMI Date
//   const lastEmiDate = new Date(
//     disbursement.getFullYear(),
//     disbursement.getMonth() + tenureInMonths,
//     emiDay
//   );

//   return { firstEmiDate, lastEmiDate };
// };

// // Function to generate EMI dates between first EMI date and the current date
// const getEmiDates = (
//   emiDay,
//   formattedFromDate,
//   formattedToDate,
//   firstEmiDate,
//   lastEmiDate
// ) => {
//   const emiDates = [];
//   const currentDate = new Date(formattedToDate);
//   let currentEmiDate = new Date(firstEmiDate);

//   while (
//     currentEmiDate <= currentDate &&
//     currentEmiDate >= firstEmiDate &&
//     currentEmiDate <= lastEmiDate
//   ) {
//     emiDates.push(new Date(currentEmiDate)); // Clone date object
//     currentEmiDate.setMonth(currentEmiDate.getMonth() + 1); // Move to the next month's EMI
//   }

//   return emiDates;
// };

// // Function to calculate EMI amount using the formula
// const calculateEmiAmount = (loanAmount, rateOfInterest, tenureInMonths) => {
//   const monthlyRate = rateOfInterest / 12 / 100;
//   const emiAmount =
//     (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) /
//     (Math.pow(1 + monthlyRate, tenureInMonths) - 1);

//   return Math.round(emiAmount); // Return rounded EMI amount
// };

// const formatDate = (date) => {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
// };

// module.exports = getEmiPendingList = async (req, res) => {
//   try {
//     const { manager_id, role, fromDate, toDate } = req.query;
//     console.log("fromDate: " + fromDate);
//     console.log("toDate: " + toDate);
//     console.log("formatted fromDate: " + formatDate(new Date(fromDate)));
//     console.log("formatted toDate: " + formatDate(new Date(toDate)));

//     const formattedFromDate = formatDate(new Date(fromDate));
//     const formattedToDate = formatDate(new Date(toDate));

//     // Base where condition
//     const whereCondition = {
//       branchManagerStatus: "disbursed",
//       loanType: "Business Loan",
//     };

//     // Define additional filtering based on role
//     if (role === "Customer Relationship Officer") {
//       whereCondition.fieldManagerId = manager_id; // Filter by fieldManagerId
//     } else if (role === "Branch Manager") {
//       const manager = await manager_credentials.findOne({
//         where: { id: manager_id },
//       });

//       if (!manager) {
//         return res.status(404).json({ error: "Manager not found" });
//       }

//       // Get branch IDs
//       const branchIds = manager.branchId.split(",").map((id) => id.trim());

//       const role = await roles.findOne({
//         where: { roleName: "Customer Relationship Officer" },
//       });

//       if (!role) {
//         return res.status(400).json({
//           error: "Role 'Customer Relationship Officer' does not exist.",
//         });
//       }

//       // Fetch Customer Relationship Officer IDs based on branch IDs
//       const croIds = await manager_credentials.findAll({
//         where: {
//           branchId: {
//             [Op.in]: branchIds,
//           },
//           roleId: role.id, // Assuming roleId is the field for roles
//         },
//         attributes: ["id"],
//       });

//       const croIdList = croIds.map((cro) => cro.id);

//       // Update the where condition to filter member_details based on CRO IDs
//       whereCondition.fieldManagerId = {
//         [Op.in]: croIdList,
//       };
//     } else {
//       return res.status(400).json({ error: "Invalid role" });
//     }

//     const data = await member_details.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: proposed_loan_details,
//           as: "proposedLoanDetails",
//         },
//         {
//           model: receipts,
//           as: "receiptsDetails",
//         },
//       ],
//     });

//     const pendingEmiList = [];
//     const retriggerEmiList = [];

//     for (const member of data) {
//       const disbursementDate = member.branchManagerStatusUpdatedAt;
//       const tenureInMonths = member.proposedLoanDetails.tenureInMonths;
//       const emiDay = member.emiDateByBranchManager; // Assume this holds the EMI day

//       // Calculate first and last EMI dates
//       const { firstEmiDate, lastEmiDate } = getFirstAndLastEmiDates(
//         disbursementDate,
//         tenureInMonths,
//         emiDay
//       );

//       // Generate EMI dates up to the current date
//       const emiDates = getEmiDates(
//         emiDay,
//         formattedFromDate,
//         formattedToDate,
//         firstEmiDate,
//         lastEmiDate
//       );

//       // Calculate EMI amount using the loan details
//       const loanAmount = member.sanctionedLoanAmountBySanctionCommittee;
//       const rateOfInterest = member.proposedLoanDetails.rateOfInterest;
//       const emiAmount = calculateEmiAmount(
//         loanAmount,
//         rateOfInterest,
//         tenureInMonths
//       );

//       // Loop through EMI dates and check the receipts
//       for (const emiDate of emiDates) {
//         // console.log("emiDate: " + emiDate);
//         // console.log("formatDate(emiDate): " + formatDate(emiDate));
//         // Fetch all receipts for the current emiDate
//         const receiptsForEmiDate = await receipts.findAll({
//           where: {
//             memberId: member.id,
//             emiDate: formatDate(emiDate),
//           },
//           include: [
//             {
//               model: bl_collection_approval,
//               as: "fk_receipts_hasOne_bl_collection_approval_receiptId",
//               include: [
//                 {
//                   model: bl_denominations,
//                   as: "fk_bl_collection_approval_hasMany_bl_denominations_blCollectionId",
//                 },
//               ],
//             },
//           ],
//         });

//         if (receiptsForEmiDate.length === 0) {
//           // No receipts found, meaning no payment has been made
//           // Add the full EMI amount as pending
//           pendingEmiList.push({
//             memberId: member.id,
//             ApplicationId: member.ApplicationId,
//             memberName: member.memberName,
//             emiDate: formatDate(emiDate),
//             emiAmount, // Full EMI amount is pending
//             pendingEmiAmount: emiAmount, // No payment made, so pending amount is full EMI
//           });
//         } else {
//           // Receipts exist, calculate the total paid amount
//           const totalPaidAmount = receiptsForEmiDate.reduce((sum, receipt) => {
//             return sum + receipt.receivedAmount;
//           }, 0);
//           //   console.log("totalPaidAmount: " + totalPaidAmount);

//           // Calculate the pending amount
//           const pendingEmiAmount = Math.max(emiAmount - totalPaidAmount, 0);

//           //   console.log("pendingEmiAmount: " + pendingEmiAmount);

//           // If EMI is still pending, add to the pendingEmiList
//           if (pendingEmiAmount > 0) {
//             pendingEmiList.push({
//               memberId: member.id,
//               ApplicationId: member.ApplicationId,
//               memberName: member.memberName,
//               emiDate: formatDate(emiDate),
//               emiAmount, // Original EMI amount
//               pendingEmiAmount, // Pending amount (remaining amount to be paid)
//             });
//           }
//           if (role === "Customer Relationship Officer") {
//             for (const receipt of receiptsForEmiDate) {
//               if (
//                 receipt?.fk_receipts_hasOne_bl_collection_approval_receiptId
//                   ?.fieldManagerStatus === "retrigger"
//               ) {
//                 const transformedDenominations =
//                   receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
//                     ? receipt.fk_receipts_hasOne_bl_collection_approval_receiptId.fk_bl_collection_approval_hasMany_bl_denominations_blCollectionId.reduce(
//                         (acc, curr) => {
//                           acc[curr.denomination] = {
//                             count: curr.count,
//                             subTotal: curr.total,
//                           };
//                           return acc;
//                         },
//                         {
//                           500: { count: 0, subTotal: 0 },
//                           200: { count: 0, subTotal: 0 },
//                           100: { count: 0, subTotal: 0 },
//                           50: { count: 0, subTotal: 0 },
//                           20: { count: 0, subTotal: 0 },
//                           10: { count: 0, subTotal: 0 },
//                           5: { count: 0, subTotal: 0 },
//                           2: { count: 0, subTotal: 0 },
//                           1: { count: 0, subTotal: 0 },
//                         }
//                       )
//                     : null;
//                 retriggerEmiList.push({
//                   receiptId: receipt.id,
//                   memberId: member.id,
//                   ApplicationId: member.ApplicationId,
//                   memberName: member.memberName,
//                   emiDate: formatDate(emiDate),
//                   emiAmount,
//                   pendingEmiAmount:
//                     emiAmount - totalPaidAmount + receipt.receivedAmount,
//                   receivedAmount: receipt.receivedAmount,
//                   description: receipt.description,
//                   collectionPhoto:
//                     receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
//                       .collectionPhoto,
//                   receiptNo:
//                     receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
//                       .receiptNo,
//                   denominations: transformedDenominations,
//                 });
//               }
//             }
//           }
//         }
//       }
//     }

//     res.status(200).json({ pendingEmiList, retriggerEmiList });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Internal Server Error",
//       details: error.message,
//     });
//   }
// };  



const {
  member_details,
  proposed_loan_details,
  receipts,
  manager_credentials,
  bl_collection_approval,
  bl_denominations,
  roles,
  emi_charts,
} = require("../models");
const { Op } = require("sequelize");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // Format: yyyy-mm-dd
};

// UPDATED: Function to get EMI dates from chart within date range
const getEmiDatesFromChart = (emiChart, formattedFromDate, formattedToDate) => {
  if (!emiChart || !Array.isArray(emiChart)) {
    console.log('EMI chart is empty or not an array');
    return [];
  }

  const fromDate = new Date(formattedFromDate);
  const toDate = new Date(formattedToDate);
  const validEmiDates = [];

  console.log(`Filtering EMI dates between ${formattedFromDate} and ${formattedToDate}`);

  for (const emiEntry of emiChart) {
    try {
      // Parse the emiDate from the chart (format: "Fri Aug 15 2025")
      const emiDate = new Date(emiEntry.emiDate);
      const emiDateStr = formatDate(emiDate);

      console.log(`Checking EMI date: ${emiDateStr} (${emiEntry.emiDate})`);

      if (emiDateStr === "Invalid Date") {
        console.log(`Invalid EMI date: ${emiDateStr}`);
        continue;
      }
      // Check if this EMI date falls within the requested date range
      if (emiDate >= fromDate && emiDate <= toDate) {
        validEmiDates.push({
          date: emiDate,
          dateStr: emiDateStr,
          month: emiEntry.month,
          emiAmount: parseFloat(emiEntry.emiAmount) || 0,
          principalAmount: parseFloat(emiEntry.principalAmount) || 0,
          interestAmount: parseFloat(emiEntry.interestAmount) || 0,
          interestRate: emiEntry.interestRate,
          remainingPrincipal: parseFloat(emiEntry.remainingPrincipal) || 0
        });
        console.log(`✓ Added EMI date: ${emiDateStr}, Amount: ${emiEntry.emiAmount}`);
      } else {
        console.log(`✗ EMI date ${emiDateStr} is outside the range`);
      }
    } catch (error) {
      console.log(`Error parsing EMI date: ${emiEntry.emiDate}`, error);
    }
  }

  console.log(`Total valid EMI dates found: ${validEmiDates.length}`);
  return validEmiDates;
};

module.exports = getEmiPendingList = async (req, res) => {
  try {
    const { manager_id, role, fromDate, toDate } = req.query;
    console.log("fromDate: " + fromDate);
    console.log("toDate: " + toDate);

    const formattedFromDate = formatDate(new Date(fromDate));
    const formattedToDate = formatDate(new Date(toDate));

    console.log("formatted fromDate: " + formattedFromDate);
    console.log("formatted toDate: " + formattedToDate);

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

      const roleRecord = await roles.findOne({
        where: { roleName: "Customer Relationship Officer" },
      });

      if (!roleRecord) {
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
          roleId: roleRecord.id, // Assuming roleId is the field for roles
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
        {
          model: emi_charts,
          as: "fk_member_details_hasMany_emi_charts_memberId",
          // Only fetch submitted EMI charts
          where: {
            status: 'submitted'
          },
          required: false, // Left join to include members even if no EMI chart exists
        },
      ],
    });

    console.log(`Found ${data.length} members with disbursed loans`);

    const pendingEmiList = [];
    const retriggerEmiList = [];

    for (const member of data) {
      console.log(`\n=== Processing member ${member.id} - ApplicationId: ${member.ApplicationId} ===`);

      // Get EMI chart for this member (only submitted status)
      const emiChartRecord = member.fk_member_details_hasMany_emi_charts_memberId && member.fk_member_details_hasMany_emi_charts_memberId.length > 0
        ? member.fk_member_details_hasMany_emi_charts_memberId.find(chart =>
          chart.status === 'submitted'
        )
        : null;

      if (!emiChartRecord) {
        console.log(`No submitted EMI chart found for member ${member.id}`);
        continue; // Skip this member if no submitted EMI chart exists
      }

      let emiChart;
      try {
        // FIXED: Handle both JSON string and object cases
        if (typeof emiChartRecord.emiChart === 'string') {
          // If it's a string, parse it as JSON
          emiChart = JSON.parse(emiChartRecord.emiChart);
          console.log(`Parsed EMI chart from JSON string for member ${member.id}`);
        } else if (typeof emiChartRecord.emiChart === 'object' && emiChartRecord.emiChart !== null) {
          // If it's already an object, use it directly
          emiChart = emiChartRecord.emiChart;
          console.log(`Using EMI chart object directly for member ${member.id}`);
        } else {
          console.log(`Invalid EMI chart data type for member ${member.id}:`, typeof emiChartRecord.emiChart);
          continue;
        }

        console.log(`Found EMI chart for member ${member.id} with ${Array.isArray(emiChart) ? emiChart.length : 'unknown'} EMI entries`);
      } catch (error) {
        console.log(`Error processing EMI chart for member ${member.id}:`, error.message);
        console.log(`EMI chart raw data:`, emiChartRecord.emiChart);
        continue; // Skip this member if processing fails
      }

      if (!Array.isArray(emiChart) || emiChart.length === 0) {
        console.log(`Invalid or empty EMI chart for member ${member.id}`, emiChart);
        continue;
      }

      // UPDATED: Get EMI dates directly from chart within the date range
      const validEmiDates = getEmiDatesFromChart(emiChart, formattedFromDate, formattedToDate);

      if (validEmiDates.length === 0) {
        console.log(`No EMI dates found within the specified date range for member ${member.id}`);
        continue;
      }

      // Loop through valid EMI dates and check the receipts
      for (let i = 0; i < validEmiDates.length; i++) {
        const emiInfo = validEmiDates[i];
        console.log(`\n--- Processing EMI date: ${emiInfo.dateStr} for member ${member.id} ---`);
        console.log(`EMI amount: ${emiInfo.emiAmount}`);

        // Get next EMI info if available
        const nextEmiInfo = i + 1 < validEmiDates.length ? validEmiDates[i + 1] : null;

        // If no next EMI in validEmiDates, try to get from full emiChart
        let nextEmiFromChart = null;
        if (!nextEmiInfo && Array.isArray(emiChart)) {
          const currentEmiIndex = emiChart.findIndex(e => {
            const eDate = new Date(e.emiDate);
            return formatDate(eDate) === emiInfo.dateStr;
          });
          if (currentEmiIndex !== -1 && currentEmiIndex + 1 < emiChart.length) {
            const nextEntry = emiChart[currentEmiIndex + 1];
            const nextDate = new Date(nextEntry.emiDate);
            nextEmiFromChart = {
              date: nextDate,
              dateStr: formatDate(nextDate),
              month: nextEntry.month,
              emiAmount: parseFloat(nextEntry.emiAmount) || 0,
              principalAmount: parseFloat(nextEntry.principalAmount) || 0,
              interestAmount: parseFloat(nextEntry.interestAmount) || 0,
              interestRate: nextEntry.interestRate,
              remainingPrincipal: parseFloat(nextEntry.remainingPrincipal) || 0
            };
          }
        }
        const nextEmi = nextEmiInfo || nextEmiFromChart;

        // Fetch all receipts for the current emiDate
        const receiptsForEmiDate = await receipts.findAll({
          where: {
            memberId: member.id,
            emiDate: emiInfo.dateStr,
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
          console.log(`No payment found for member ${member.id} on ${emiInfo.dateStr} - Adding to pending list`);

          // Check if this is the last EMI (no next EMI available)
          const isLastEmi = !nextEmi;

          const pendingEmiData = {
            memberId: member.id,
            ApplicationId: member.ApplicationId,
            memberName: member.memberName,
            phoneNumber: member.phoneNumber,
            emiDate: emiInfo.dateStr,
            emiAmount: emiInfo.emiAmount,
            pendingEmiAmount: emiInfo.emiAmount, // No payment made, so pending amount is full EMI
            month: emiInfo.month,
            principalAmount: emiInfo.principalAmount,
            interestAmount: emiInfo.interestAmount,
            interestRate: emiInfo.interestRate,
            remainingPrincipal: emiInfo.remainingPrincipal,
            isLastEmi: isLastEmi,
            securityDeposit: member.securityDeposit || 0,
            latitude: member.latitude,
            longitude: member.longitude,
          };

          // Add next EMI info if available
          if (nextEmi) {
            pendingEmiData.nextEmiDate = nextEmi.dateStr;
            pendingEmiData.nextEmiAmount = nextEmi.emiAmount;
            pendingEmiData.nextEmiMonth = nextEmi.month;
            pendingEmiData.nextEmiPrincipalAmount = nextEmi.principalAmount;
            pendingEmiData.nextEmiInterestAmount = nextEmi.interestAmount;
            pendingEmiData.nextEmiInterestRate = nextEmi.interestRate;
            pendingEmiData.nextEmiRemainingPrincipal = nextEmi.remainingPrincipal;
          }

          pendingEmiList.push(pendingEmiData);
        } else {
          // Receipts exist, calculate the total paid amount
          const totalPaidAmount = receiptsForEmiDate.reduce((sum, receipt) => {
            return sum + parseFloat(receipt.receivedAmount || 0);
          }, 0);

          // Calculate the pending amount
          const pendingEmiAmount = Math.max(emiInfo.emiAmount - totalPaidAmount, 0);

          console.log(`Member ${member.id} on ${emiInfo.dateStr} - EMI: ${emiInfo.emiAmount}, Paid: ${totalPaidAmount}, Pending: ${pendingEmiAmount}`);

          // If EMI is still pending, add to the pendingEmiList
          if (pendingEmiAmount > 0) {
            // Check if this is the last EMI (no next EMI available)
            const isLastEmi = !nextEmi;

            const pendingEmiData = {
              memberId: member.id,
              ApplicationId: member.ApplicationId,
              memberName: member.memberName,
              phoneNumber: member.phoneNumber,
              emiDate: emiInfo.dateStr,
              emiAmount: emiInfo.emiAmount,
              pendingEmiAmount: pendingEmiAmount,
              month: emiInfo.month,
              principalAmount: emiInfo.principalAmount,
              interestAmount: emiInfo.interestAmount,
              interestRate: emiInfo.interestRate,
              remainingPrincipal: emiInfo.remainingPrincipal,
              totalPaid: totalPaidAmount,
              isLastEmi: isLastEmi,
              securityDeposit: member.securityDeposit || 0,
              latitude: member.latitude,
              longitude: member.longitude,
            };

            // Add next EMI info if available
            if (nextEmi) {
              pendingEmiData.nextEmiDate = nextEmi.dateStr;
              pendingEmiData.nextEmiAmount = nextEmi.emiAmount;
              pendingEmiData.nextEmiMonth = nextEmi.month;
              pendingEmiData.nextEmiPrincipalAmount = nextEmi.principalAmount;
              pendingEmiData.nextEmiInterestAmount = nextEmi.interestAmount;
              pendingEmiData.nextEmiInterestRate = nextEmi.interestRate;
              pendingEmiData.nextEmiRemainingPrincipal = nextEmi.remainingPrincipal;
            }

            pendingEmiList.push(pendingEmiData);
          }

          // Handle retrigger logic for Customer Relationship Officer
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
                          count: parseInt(curr.count) || 0,
                          subTotal: parseFloat(curr.total) || 0,
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
                  emiDate: emiInfo.dateStr,
                  emiAmount: emiInfo.emiAmount,
                  pendingEmiAmount: Math.max(emiInfo.emiAmount - totalPaidAmount + parseFloat(receipt.receivedAmount || 0), 0),
                  receivedAmount: parseFloat(receipt.receivedAmount || 0),
                  description: receipt.description,
                  collectionPhoto:
                    receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
                      .collectionPhoto,
                  receiptNo:
                    receipt.fk_receipts_hasOne_bl_collection_approval_receiptId
                      .receiptNo,
                  denominations: transformedDenominations,
                  month: emiInfo.month,
                  principalAmount: emiInfo.principalAmount,
                  interestAmount: emiInfo.interestAmount,
                  interestRate: emiInfo.interestRate,
                  latitude: member.latitude,
                  longitude: member.longitude,
                });
              }
            }
          }
        }
      }
    }

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Pending EMIs: ${pendingEmiList.length}`);
    console.log(`Retrigger EMIs: ${retriggerEmiList.length}`);

    // Sort by EMI date for better organization
    pendingEmiList.sort((a, b) => new Date(a.emiDate) - new Date(b.emiDate));
    retriggerEmiList.sort((a, b) => new Date(a.emiDate) - new Date(b.emiDate));

    res.status(200).json({
      success: true,
      pendingEmiList,
      retriggerEmiList,
      totalPending: pendingEmiList.length,
      totalRetrigger: retriggerEmiList.length,
      dateRange: {
        from: formattedFromDate,
        to: formattedToDate
      }
    });
  } catch (error) {
    console.error("Error in getEmiPendingList:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};