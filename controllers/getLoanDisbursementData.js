const {
  member_details,
  proposed_loan_details,
  member_business_details,
  bank_details,
  emi_charts,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const getFieldManagerRecords = require("./utils/getFieldManagerRecords");

module.exports = getLoanDisbursementData = async (req, res) => {
  try {
    const { id, fromDate, toDate, includeMonthlyBreakdown } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Use the utility function
    const fieldManagerIds = await getFieldManagerRecords({
      userId: id,
    });

    console.log("Field Manager IDs:", fieldManagerIds);
    console.log("Field Manager IDs length:", fieldManagerIds.length);

    // Fetch data using Sequelize ORM for member_details and proposed_loan_details
    const loanDetails = await member_details.findAll({
      where: {
        loanType: "Business Loan",
        branchManagerStatus: "disbursed",
        fieldManagerId: {
          [Op.in]: fieldManagerIds, // Filter by IDs
        },
      },
      include: [
        {
          model: proposed_loan_details,
          as: "proposedLoanDetails",
        },
        {
          model: member_business_details,
          as: "businessDetails",
        },
        {
          model: bank_details,
          as: "bankDetails",
        },
      ],
    });

    console.log("Loan Details found:", loanDetails.length);
    if (loanDetails.length > 0) {
      console.log(
        "First loan detail sample:",
        JSON.stringify(loanDetails[0].toJSON(), null, 2)
      );
    }

    // Get additional data using raw SQL for manager_credentials and branch details
    const fieldManagerIdsFromLoans = loanDetails.map((ld) => ld.fieldManagerId);
    console.log("Field Manager IDs from loans:", fieldManagerIdsFromLoans);

    const managerAndBranchData = await sequelize.query(
      `SELECT 
        mc.id as fieldManagerId, 
        mc.branchId, 
        mc.username,
        mc.employeeName,
        b.branchName, 
        b.branchCode,
        d.divisionName,
        d.divisionCode,
        r.regionName,
        r.regionCode
      FROM manager_credentials mc
      LEFT JOIN branch b ON mc.branchId = b.id
      LEFT JOIN division d ON b.divisionId = d.id
      LEFT JOIN region r ON d.regionId = r.id
      WHERE mc.id IN (:fieldManagerIds)`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          fieldManagerIds: fieldManagerIdsFromLoans,
        },
      }
    );

    console.log("Manager and Branch Data found:", managerAndBranchData.length);
    if (managerAndBranchData.length > 0) {
      console.log("First manager data sample:", managerAndBranchData[0]);
    }

    // Extract loan IDs from the fetched data
    const loanIdsArray = loanDetails.map((loan) => loan.id);

    let emiChartMap = {};

    // Only fetch EMI charts if we have loan IDs
    if (loanIdsArray.length > 0) {
      console.log("Fetching EMI charts for loan IDs:", loanIdsArray);

      const emiChartsData = await emi_charts.findAll({
        where: {
          memberId: { [Op.in]: loanIdsArray },
        },
        attributes: [
          "memberId",
          [sequelize.cast(sequelize.col("emiChart"), "CHAR"), "emiChart"],
        ],
      });

      console.log("EMI charts fetched:", emiChartsData.length, "records");

      // Create a map: loanId -> parsed emiChart array

      emiChartsData.forEach((row) => {
        try {
          console.log(
            `Processing EMI chart for loan ${
              row.memberId
            }, type: ${typeof row.emiChart}`
          );
          const parsedEmiChart =
            typeof row.emiChart === "string"
              ? JSON.parse(row.emiChart)
              : row.emiChart;

          emiChartMap[row.memberId] = parsedEmiChart; // Use memberId as the key
          console.log(
            `Successfully parsed EMI chart for loan ${row.memberId}, entries: ${parsedEmiChart.length}`
          );
        } catch (error) {
          console.error(
            `Error parsing EMI chart for loan ${row.memberId}:`,
            error
          );
          console.error(`Raw emiChart data:`, row.emiChart);
          emiChartMap[row.memberId] = []; // Fallback to empty array
        }
      });
    }

    // Helper function to generate EMI dates within a range
    const generateEmiDatesInRange = (
      disbursementDate,
      emiDay,
      tenureInMonths,
      fromDate,
      toDate
    ) => {
      if (!disbursementDate || !emiDay || !tenureInMonths) return [];

      const disbursedDate = new Date(disbursementDate);
      const startDate = fromDate ? new Date(fromDate) : new Date();
      const endDate = toDate
        ? new Date(toDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const emiDates = [];

      // Start from the first EMI date
      let currentEmiDate = new Date(disbursedDate);
      currentEmiDate.setDate(emiDay);

      // If disbursement date is after EMI day, move to next month
      if (disbursedDate.getDate() > emiDay) {
        currentEmiDate.setMonth(currentEmiDate.getMonth() + 1);
      }

      // Generate all EMI dates for the loan tenure
      for (let month = 0; month < tenureInMonths; month++) {
        const emiDate = new Date(currentEmiDate);
        emiDate.setMonth(currentEmiDate.getMonth() + month);

        // Only include dates within the selected range
        if (emiDate >= startDate && emiDate <= endDate) {
          emiDates.push({ emiDate, emiMonth: month + 1 });
        }
      }

      return emiDates;
    };

    // Helper function to calculate EMI months paid
    const calculateEmiMonthsPaid = (disbursementDate) => {
      if (!disbursementDate) return 0;

      const currentDate = new Date();
      const disbursedDate = new Date(disbursementDate);
      const monthsDiff = Math.max(
        0,
        Math.floor((currentDate - disbursedDate) / (1000 * 60 * 60 * 24 * 30))
      );
      return monthsDiff;
    };

    // Prepare a map to track loan cycles per customerId
    const loanCycleMap = {};

    // Combine the data
    let combinedData = [];

    loanDetails.forEach((loan) => {
      const managerBranch =
        managerAndBranchData.find(
          (mb) => mb.fieldManagerId === loan.fieldManagerId
        ) || {};

      // Calculate loan cycle based on customerId
      const customerId = loan.customerId;
      if (!loanCycleMap[customerId]) {
        loanCycleMap[customerId] = 1;
      } else {
        loanCycleMap[customerId] += 1;
      }

      // Get EMI details for this loan
      const emiDetails = emiChartMap[loan.id] || [];

      // Base loan data
      const baseLoanData = {
        ...loan.toJSON(),
        branchName: managerBranch.branchName || null,
        branchCode: managerBranch.branchCode || null,
        divisionName: managerBranch.divisionName || null,
        divisionCode: managerBranch.divisionCode || null,
        regionName: managerBranch.regionName || null,
        regionCode: managerBranch.regionCode || null,
        username: managerBranch.username || null,
        employeeName: managerBranch.employeeName || null,
        loanCycle: loanCycleMap[customerId],
        emiDetails, // Full EMI array for reference
      };

      // Check if monthly breakdown is requested
      if (includeMonthlyBreakdown === "true" && fromDate && toDate) {
        // Generate EMI dates within the selected range
        const emiDatesInRange = generateEmiDatesInRange(
          loan.branchManagerStatusUpdatedAt, // disbursement date
          loan.emiDateByBranchManager, // EMI day
          loan.proposedLoanDetails?.tenureInMonths,
          fromDate,
          toDate
        );

        const emiMonthsPaid = calculateEmiMonthsPaid(
          loan.branchManagerStatusUpdatedAt
        );

        // Create a row for each EMI date with corresponding EMI data
        emiDatesInRange.forEach(({ emiDate, emiMonth }) => {
          const adjustedEmiMonth = emiMonthsPaid + emiMonth;

          // Get the EMI data for this specific month (0-based index)
          const currentEmiData =
            emiDetails[adjustedEmiMonth - 1] || emiDetails[0] || {};

          // Instead of adding to emiDataArray, create a separate record for each EMI date
          combinedData.push({
            ...baseLoanData,
            emiDate: emiDate,
            emiMonth: adjustedEmiMonth,
            emiMonthsPaid: emiMonthsPaid,
            principalAmount: currentEmiData.principalAmount || 0,
            interestAmount: currentEmiData.interestAmount || 0,
            emiAmount: currentEmiData.emiAmount || 0,
            outstandingBalance: currentEmiData.outstandingBalance || 0,
            monthlyEmiStatus:
              adjustedEmiMonth <= emiMonthsPaid ? "Paid" : "Pending",
            // Include emiData for backward compatibility
            emiData: [
              {
                emiAmount: currentEmiData.emiAmount || 0,
                emiDate: emiDate.toISOString().split("T")[0],
                outstandingBalance: currentEmiData.outstandingBalance || 0,
                monthlyEmiStatus:
                  adjustedEmiMonth <= emiMonthsPaid ? "Paid" : "Pending",
              },
            ],
          });
        });
      } else {
        // Default behavior - return single record with summary EMI data
        const emiMonthsPaid = calculateEmiMonthsPaid(
          loan.branchManagerStatusUpdatedAt
        );

        console.log(
          `Processing loan ${loan.id}: emiDetails length: ${emiDetails.length}, emiMonthsPaid: ${emiMonthsPaid}`
        );

        // Calculate total amounts for summary
        let totalEmiAmount = 0;
        let currentOutstandingBalance = 0;

        if (emiDetails.length > 0) {
          // Get current EMI data
          const nextEmiIndex = Math.min(emiMonthsPaid, emiDetails.length - 1);
          const currentEmiData = emiDetails[nextEmiIndex] || emiDetails[0];

          console.log(`Loan ${loan.id} EMI data:`, currentEmiData);

          totalEmiAmount = currentEmiData.emiAmount || 0;
          currentOutstandingBalance = currentEmiData.outstandingBalance || 0;

          console.log(
            `Loan ${loan.id} calculated amounts - EMI: ${totalEmiAmount}, Outstanding: ${currentOutstandingBalance}`
          );
        } else {
          console.log(`No EMI details found for loan ${loan.id}`);
        }

        // Create emiData array with single EMI entry for frontend compatibility
        const emiDataArray =
          totalEmiAmount > 0
            ? [
                {
                  emiAmount: totalEmiAmount,
                  emiDate: null,
                  outstandingBalance: currentOutstandingBalance,
                },
              ]
            : [];

        combinedData.push({
          ...baseLoanData,
          emiData: emiDataArray, // Frontend expects this structure
          emiMonthsPaid: emiMonthsPaid,
          totalEmiAmount: totalEmiAmount,
          emiAmount: totalEmiAmount,
          outstandingBalance: currentOutstandingBalance,
          // Add summary statistics
          totalTenure: loan.proposedLoanDetails?.tenureInMonths || 0,
          remainingMonths: Math.max(
            0,
            (loan.proposedLoanDetails?.tenureInMonths || 0) - emiMonthsPaid
          ),
        });
      }
    });

    // Sort by EMI date if monthly breakdown is enabled
    if (includeMonthlyBreakdown === "true") {
      combinedData.sort((a, b) => new Date(a.emiDate) - new Date(b.emiDate));
    }

    if (combinedData.length > 0) {
      console.log(
        "- First combined data sample:",
        JSON.stringify(combinedData[0], null, 2)
      );
    }

    res.status(200).json({
      success: true,
      data: combinedData,
      summary: {
        totalLoans: loanDetails.length,
        includeMonthlyBreakdown: includeMonthlyBreakdown === "true",
        dateRange: fromDate && toDate ? { fromDate, toDate } : null,
        totalRecords: combinedData.length,
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
