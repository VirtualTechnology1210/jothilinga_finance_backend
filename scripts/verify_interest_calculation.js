/**
 * ============================================================
 * INTEREST & PRINCIPAL CALCULATION VERIFICATION SCRIPT
 * ============================================================
 * 
 * This script verifies the interest and principal calculations
 * used in:
 *   1. Dashboard (getDashboardCount.js)
 *   2. Collection Report (getCollectionReportData.js)
 *   3. Daily Collection Report (CroTransferByCenterWiseReport.js)
 * 
 * It compares:
 *   - EMI Chart-based values (CORRECT - new method)
 *   - Formula-based values (WRONG - old method)
 * 
 * Usage:
 *   npx dotenv -e .env.development node scripts/verify_interest_calculation.js
 * 
 * Optional args:
 *   --member-id=123   Check a specific member only
 *   --limit=10        Limit the number of members to check
 * ============================================================
 */

const path = require("path");

// Load env
const envFile = `.env.development`;
require("dotenv").config({ path: path.resolve(__dirname, "..", envFile) });

const {
    member_details,
    proposed_loan_details,
    receipts,
    emi_charts,
    sequelize,
} = require("../models");
const { Op } = require("sequelize");

// Parse CLI arguments
const args = process.argv.slice(2);
const getArg = (name) => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split("=")[1] : null;
};

const MEMBER_ID = getArg("member-id");
const LIMIT = parseInt(getArg("limit")) || 20;

// ============================================================
// Helper: Format date to YYYY-MM-DD
// ============================================================
const formatDate = (dateValue) => {
    if (!dateValue) return null;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    } catch (e) {
        return null;
    }
};

// ============================================================
// OLD METHOD: Formula-based calculation (what was used before)
// ============================================================
const calculateWithFormula = (member, memberReceipts) => {
    const loanAmount = member.sanctionedLoanAmountBySanctionCommittee || 0;
    const tenureInMonths = member.proposedLoanDetails?.tenureInMonths || 0;
    const rateOfInterest =
        (member.proposedLoanDetails?.rateOfInterest || 0) / 100;
    const monthlyRate = rateOfInterest / 12;

    let balance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalEmiPaid = 0;

    // Group receipts by emiDate
    const receiptsByDate = {};
    memberReceipts.forEach((receipt) => {
        const date = receipt.emiDate;
        if (!receiptsByDate[date]) receiptsByDate[date] = [];
        receiptsByDate[date].push(receipt);
    });

    // Sort emiDates chronologically
    const sortedDates = Object.keys(receiptsByDate).sort(
        (a, b) => new Date(a) - new Date(b)
    );

    const perEmiDetails = [];

    sortedDates.forEach((emiDate) => {
        const receiptsForDate = receiptsByDate[emiDate];
        const totalReceived = Math.round(
            receiptsForDate.reduce(
                (sum, receipt) => sum + (receipt.receivedAmount || 0),
                0
            )
        );

        const interestComponent = Math.round(balance * monthlyRate);

        let interestPaid = 0;
        let principalPaid = 0;

        if (totalReceived >= interestComponent) {
            interestPaid = interestComponent;
            const remaining = totalReceived - interestComponent;
            principalPaid = remaining; // old formula doesn't cap
            balance -= principalPaid;
        } else {
            interestPaid = totalReceived;
        }

        totalInterestPaid += interestPaid;
        totalPrincipalPaid += principalPaid;
        totalEmiPaid += totalReceived;

        perEmiDetails.push({
            emiDate,
            totalReceived,
            interestPaid,
            principalPaid,
            balance: Math.round(balance),
        });
    });

    return {
        totalInterestPaid: Math.round(totalInterestPaid),
        totalPrincipalPaid: Math.round(totalPrincipalPaid),
        totalEmiPaid: Math.round(totalEmiPaid),
        perEmiDetails,
    };
};

// ============================================================
// NEW METHOD: EMI Chart-based calculation (correct method)
// ============================================================
const calculateWithEmiChart = (member, memberReceipts, emiChartEntries) => {
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalEmiPaid = 0;

    const perEmiDetails = [];

    if (!Array.isArray(emiChartEntries) || emiChartEntries.length === 0) {
        return {
            totalInterestPaid: 0,
            totalPrincipalPaid: 0,
            totalEmiPaid: 0,
            perEmiDetails: [],
            error: "No EMI chart entries found",
        };
    }

    emiChartEntries.forEach((chartEntry) => {
        const chartEmiDate = new Date(chartEntry.emiDate);
        const formattedEmiDate = formatDate(chartEmiDate);

        if (!formattedEmiDate) return;

        // Filter receipts for this EMI date
        const receiptsForDate = memberReceipts.filter(
            (receipt) => receipt.emiDate === formattedEmiDate
        );

        // Sum all receipt amounts for this date
        const totalReceived = Math.round(
            receiptsForDate.reduce(
                (sum, receipt) => sum + (receipt.receivedAmount || 0),
                0
            )
        );

        if (totalReceived === 0) return; // Skip if no payment

        totalEmiPaid += totalReceived;

        const interestComponent = Math.round(
            parseFloat(chartEntry.interestAmount || 0)
        );
        const principalComponent = Math.round(
            parseFloat(chartEntry.principalAmount || 0)
        );

        let interestPaid = 0;
        let principalPaid = 0;

        if (totalReceived >= interestComponent) {
            interestPaid = interestComponent;
            const remaining = totalReceived - interestComponent;
            principalPaid = Math.min(principalComponent, remaining);
        } else {
            interestPaid = totalReceived;
        }

        totalInterestPaid += interestPaid;
        totalPrincipalPaid += principalPaid;

        perEmiDetails.push({
            emiDate: formattedEmiDate,
            month: chartEntry.month,
            totalReceived,
            receiptCount: receiptsForDate.length,
            chartInterest: interestComponent,
            chartPrincipal: principalComponent,
            interestPaid,
            principalPaid,
            isSplitPayment: receiptsForDate.length > 1,
        });
    });

    return {
        totalInterestPaid: Math.round(totalInterestPaid),
        totalPrincipalPaid: Math.round(totalPrincipalPaid),
        totalEmiPaid: Math.round(totalEmiPaid),
        perEmiDetails,
    };
};

// ============================================================
// MAIN VERIFICATION
// ============================================================
const verify = async () => {
    try {
        console.log("=".repeat(70));
        console.log(
            "  INTEREST & PRINCIPAL CALCULATION VERIFICATION"
        );
        console.log("=".repeat(70));
        console.log();

        // Build where clause
        const whereCondition = {
            branchManagerStatus: "disbursed",
            loanType: "Business Loan",
        };

        if (MEMBER_ID) {
            whereCondition.id = MEMBER_ID;
            console.log(`🔍 Checking specific member ID: ${MEMBER_ID}`);
        } else {
            console.log(`🔍 Checking up to ${LIMIT} members (use --limit=N to change)`);
        }
        console.log();

        const members = await member_details.findAll({
            where: whereCondition,
            include: [
                {
                    model: proposed_loan_details,
                    as: "proposedLoanDetails",
                },
                {
                    model: receipts,
                    as: "receiptsDetails",
                    where: {
                        status: { [Op.in]: ["paid", "Paid", "pending", "Pending"] },
                    },
                    required: false,
                },
                {
                    model: emi_charts,
                    as: "fk_member_details_hasMany_emi_charts_memberId",
                },
            ],
            limit: MEMBER_ID ? undefined : LIMIT,
        });

        console.log(`Found ${members.length} members to verify\n`);

        let totalMembers = 0;
        let membersWithDiscrepancy = 0;
        let membersWithSplitPayments = 0;
        let membersWithoutEmiChart = 0;
        let membersWithNoReceipts = 0;

        const discrepancies = [];
        const splitPaymentMembers = [];

        // Summary accumulators
        let sumFormulaInterest = 0;
        let sumFormulaePrincipal = 0;
        let sumChartInterest = 0;
        let sumChartPrincipal = 0;

        for (const member of members) {
            totalMembers++;
            const memberData = member.toJSON();
            const memberReceipts = memberData.receiptsDetails || [];

            if (memberReceipts.length === 0) {
                membersWithNoReceipts++;
                continue;
            }

            // Get EMI chart
            const emiChartRecords =
                memberData.fk_member_details_hasMany_emi_charts_memberId || [];
            let emiChartEntries = [];

            if (emiChartRecords.length > 0) {
                const submittedChart =
                    emiChartRecords.find((c) => c.status === "submitted") ||
                    emiChartRecords[emiChartRecords.length - 1];
                try {
                    emiChartEntries =
                        typeof submittedChart.emiChart === "string"
                            ? JSON.parse(submittedChart.emiChart)
                            : submittedChart.emiChart;
                } catch (e) {
                    emiChartEntries = [];
                }
            }

            if (
                !Array.isArray(emiChartEntries) ||
                emiChartEntries.length === 0
            ) {
                membersWithoutEmiChart++;
                continue;
            }

            // Calculate using both methods
            const formulaResult = calculateWithFormula(memberData, memberReceipts);
            const chartResult = calculateWithEmiChart(
                memberData,
                memberReceipts,
                emiChartEntries
            );

            sumFormulaInterest += formulaResult.totalInterestPaid;
            sumFormulaePrincipal += formulaResult.totalPrincipalPaid;
            sumChartInterest += chartResult.totalInterestPaid;
            sumChartPrincipal += chartResult.totalPrincipalPaid;

            // Check for split payments
            const hasSplitPayments = chartResult.perEmiDetails.some(
                (d) => d.isSplitPayment
            );
            if (hasSplitPayments) {
                membersWithSplitPayments++;
                splitPaymentMembers.push({
                    memberId: memberData.id,
                    applicationId: memberData.ApplicationId,
                    memberName: memberData.memberName,
                    splitDetails: chartResult.perEmiDetails.filter(
                        (d) => d.isSplitPayment
                    ),
                });
            }

            // Check for discrepancy
            const interestDiff = Math.abs(
                formulaResult.totalInterestPaid - chartResult.totalInterestPaid
            );
            const principalDiff = Math.abs(
                formulaResult.totalPrincipalPaid - chartResult.totalPrincipalPaid
            );

            if (interestDiff > 1 || principalDiff > 1) {
                membersWithDiscrepancy++;
                discrepancies.push({
                    memberId: memberData.id,
                    applicationId: memberData.ApplicationId,
                    memberName: memberData.memberName,
                    loanAmount: memberData.sanctionedLoanAmountBySanctionCommittee,
                    tenure: memberData.proposedLoanDetails?.tenureInMonths,
                    rate: memberData.proposedLoanDetails?.rateOfInterest,
                    formula: {
                        interest: formulaResult.totalInterestPaid,
                        principal: formulaResult.totalPrincipalPaid,
                    },
                    chart: {
                        interest: chartResult.totalInterestPaid,
                        principal: chartResult.totalPrincipalPaid,
                    },
                    diff: {
                        interest: interestDiff,
                        principal: principalDiff,
                    },
                    hasSplitPayments,
                });
            }
        }

        // ============================================================
        // PRINT RESULTS
        // ============================================================
        console.log("=".repeat(70));
        console.log("  VERIFICATION SUMMARY");
        console.log("=".repeat(70));
        console.log(`  Total members checked:        ${totalMembers}`);
        console.log(`  Members with no receipts:     ${membersWithNoReceipts}`);
        console.log(`  Members without EMI chart:    ${membersWithoutEmiChart}`);
        console.log(`  Members with split payments:  ${membersWithSplitPayments}`);
        console.log(`  Members with discrepancy:     ${membersWithDiscrepancy}`);
        console.log();

        console.log("─".repeat(70));
        console.log("  AGGREGATE TOTALS COMPARISON");
        console.log("─".repeat(70));
        console.log(
            `  Formula Interest (OLD):    ₹${sumFormulaInterest.toLocaleString()}`
        );
        console.log(
            `  Chart Interest (NEW):      ₹${sumChartInterest.toLocaleString()}`
        );
        console.log(
            `  Difference:                ₹${Math.abs(sumFormulaInterest - sumChartInterest).toLocaleString()}`
        );
        console.log();
        console.log(
            `  Formula Principal (OLD):   ₹${sumFormulaePrincipal.toLocaleString()}`
        );
        console.log(
            `  Chart Principal (NEW):     ₹${sumChartPrincipal.toLocaleString()}`
        );
        console.log(
            `  Difference:                ₹${Math.abs(sumFormulaePrincipal - sumChartPrincipal).toLocaleString()}`
        );
        console.log();

        // ============================================================
        // DISCREPANCIES DETAIL
        // ============================================================
        if (discrepancies.length > 0) {
            console.log("─".repeat(70));
            console.log("  DISCREPANCIES DETAIL (Formula vs EMI Chart)");
            console.log("─".repeat(70));
            console.log();

            discrepancies.forEach((d, i) => {
                console.log(
                    `  ${i + 1}. Member: ${d.memberName} (ID: ${d.memberId}, AppId: ${d.applicationId})`
                );
                console.log(
                    `     Loan: ₹${(d.loanAmount || 0).toLocaleString()} | Tenure: ${d.tenure}m | Rate: ${d.rate}%`
                );
                console.log(
                    `     Formula:  Interest=₹${d.formula.interest.toLocaleString()}  Principal=₹${d.formula.principal.toLocaleString()}`
                );
                console.log(
                    `     EMI Chart: Interest=₹${d.chart.interest.toLocaleString()}  Principal=₹${d.chart.principal.toLocaleString()}`
                );
                console.log(
                    `     DIFF:      Interest=₹${d.diff.interest.toLocaleString()}  Principal=₹${d.diff.principal.toLocaleString()} ${d.hasSplitPayments ? " ⚡ HAS SPLIT PAYMENTS" : ""}`
                );
                console.log();
            });
        } else {
            console.log("  ✅ No discrepancies found between formula and chart!");
            console.log();
        }

        // ============================================================
        // SPLIT PAYMENTS DETAIL
        // ============================================================
        if (splitPaymentMembers.length > 0) {
            console.log("─".repeat(70));
            console.log("  SPLIT PAYMENTS DETAIL");
            console.log("─".repeat(70));
            console.log();

            splitPaymentMembers.forEach((m, i) => {
                console.log(
                    `  ${i + 1}. ${m.memberName} (ID: ${m.memberId}, AppId: ${m.applicationId})`
                );
                m.splitDetails.forEach((sd) => {
                    console.log(
                        `     EMI Date: ${sd.emiDate} (Month ${sd.month}) | ${sd.receiptCount} receipts`
                    );
                    console.log(
                        `       Total Received: ₹${sd.totalReceived} | Chart Interest: ₹${sd.chartInterest} | Chart Principal: ₹${sd.chartPrincipal}`
                    );
                    console.log(
                        `       → Interest Paid: ₹${sd.interestPaid} | Principal Paid: ₹${sd.principalPaid}`
                    );
                });
                console.log();
            });
        }

        console.log("=".repeat(70));
        console.log("  VERIFICATION COMPLETE");
        console.log("=".repeat(70));

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.error(error.stack);
        await sequelize.close();
        process.exit(1);
    }
};

verify();
