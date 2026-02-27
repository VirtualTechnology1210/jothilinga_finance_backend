/**
 * ============================================================
 * COMPREHENSIVE 3-WAY COMPARISON SCRIPT
 * ============================================================
 * 
 * Compares interest/principal calculations across:
 *   1. Dashboard (getDashboardCount.js logic)
 *   2. Collection Report (getCollectionReportData.js logic - after fix)
 *   3. Old Collection Report (before fix - raw chart values per receipt)
 * 
 * Usage:
 *   npx dotenv -e .env.development node scripts/compare_three_reports.js
 * ============================================================
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.development") });

const {
    member_details,
    proposed_loan_details,
    receipts,
    emi_charts,
    sequelize,
} = require("../models");
const { Op } = require("sequelize");

const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1]) || 20;

const formatDate = (dateValue) => {
    if (!dateValue) return null;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    } catch (e) { return null; }
};

const run = async () => {
    try {
        console.log("=".repeat(70));
        console.log("  3-WAY COMPARISON: Dashboard vs Collection Report vs Old Report");
        console.log("=".repeat(70));
        console.log();

        const members = await member_details.findAll({
            where: {
                branchManagerStatus: "disbursed",
                loanType: "Business Loan",
            },
            include: [
                { model: proposed_loan_details, as: "proposedLoanDetails" },
                {
                    model: receipts,
                    as: "receiptsDetails",
                    where: { status: { [Op.in]: ["paid", "Paid", "pending", "Pending"] } },
                    required: false,
                },
                { model: emi_charts, as: "fk_member_details_hasMany_emi_charts_memberId" },
            ],
            limit: LIMIT,
        });

        console.log(`Checking ${members.length} members...\n`);

        let dashboardTotalInterest = 0;
        let dashboardTotalPrincipal = 0;
        let newReportTotalInterest = 0;
        let newReportTotalPrincipal = 0;
        let oldReportTotalInterest = 0;
        let oldReportTotalPrincipal = 0;
        let splitPaymentCount = 0;
        let memberMismatches = [];

        for (const member of members) {
            const m = member.toJSON();
            const memberReceipts = m.receiptsDetails || [];
            if (memberReceipts.length === 0) continue;

            // Get EMI chart (use submitted first, like both Dashboard & Collection Report now do)
            const emiChartRecords = m.fk_member_details_hasMany_emi_charts_memberId || [];
            if (emiChartRecords.length === 0) continue;

            const selectedChart = emiChartRecords.find(c => c.status === 'submitted') || emiChartRecords[emiChartRecords.length - 1];
            let emiChartEntries = [];
            try {
                emiChartEntries = typeof selectedChart.emiChart === 'string'
                    ? JSON.parse(selectedChart.emiChart)
                    : selectedChart.emiChart;
            } catch (e) { continue; }

            if (!Array.isArray(emiChartEntries) || emiChartEntries.length === 0) continue;

            // ========== METHOD 1: DASHBOARD LOGIC ==========
            // (Aggregate receipts per emiDate, then split using chart values)
            let dashInterest = 0, dashPrincipal = 0;

            emiChartEntries.forEach((chartEntry) => {
                const chartEmiDate = new Date(chartEntry.emiDate);
                const formattedEmiDate = formatDate(chartEmiDate);
                if (!formattedEmiDate) return;

                const receiptsForDate = memberReceipts.filter(r => r.emiDate === formattedEmiDate);
                const totalReceived = Math.round(receiptsForDate.reduce((sum, r) => sum + (r.receivedAmount || 0), 0));
                if (totalReceived === 0) return;

                const interestComp = Math.round(parseFloat(chartEntry.interestAmount || 0));
                const principalComp = Math.round(parseFloat(chartEntry.principalAmount || 0));

                if (totalReceived >= interestComp) {
                    dashInterest += interestComp;
                    dashPrincipal += Math.min(principalComp, totalReceived - interestComp);
                } else {
                    dashInterest += totalReceived;
                }
            });

            // ========== METHOD 2: NEW COLLECTION REPORT (proportional per receipt) ==========
            let newRepInterest = 0, newRepPrincipal = 0;

            // Group receipts by emiDate
            const receiptsByDate = {};
            memberReceipts.forEach(r => {
                const d = r.emiDate || 'unknown';
                if (!receiptsByDate[d]) receiptsByDate[d] = [];
                receiptsByDate[d].push(r);
            });

            Object.entries(receiptsByDate).forEach(([emiDate, dateReceipts]) => {
                // Find matching chart entry
                const chartEntry = emiChartEntries.find(ce => formatDate(new Date(ce.emiDate)) === emiDate);
                if (!chartEntry) return;

                const totalReceived = Math.round(dateReceipts.reduce((sum, r) => sum + (r.receivedAmount || 0), 0));
                const interestComp = Math.round(parseFloat(chartEntry.interestAmount || 0));
                const principalComp = Math.round(parseFloat(chartEntry.principalAmount || 0));

                let actualInterest = 0, actualPrincipal = 0;
                if (totalReceived >= interestComp) {
                    actualInterest = interestComp;
                    actualPrincipal = Math.min(principalComp, totalReceived - interestComp);
                } else {
                    actualInterest = totalReceived;
                }

                if (dateReceipts.length > 1) splitPaymentCount++;

                // Distribute proportionally to each receipt
                dateReceipts.forEach(r => {
                    const proportion = totalReceived > 0 ? r.receivedAmount / totalReceived : 0;
                    newRepInterest += Math.round(actualInterest * proportion);
                    newRepPrincipal += Math.round(actualPrincipal * proportion);
                });
            });

            // ========== METHOD 3: OLD COLLECTION REPORT (raw chart values per receipt) ==========
            let oldRepInterest = 0, oldRepPrincipal = 0;

            memberReceipts.forEach(receipt => {
                const chartEntry = emiChartEntries.find(ce => formatDate(new Date(ce.emiDate)) === receipt.emiDate);
                if (!chartEntry) return;
                // OLD BUG: Each receipt gets the FULL chart values (double-counting for split payments!)
                oldRepInterest += Math.round(parseFloat(chartEntry.interestAmount || 0));
                oldRepPrincipal += Math.round(parseFloat(chartEntry.principalAmount || 0));
            });

            dashboardTotalInterest += dashInterest;
            dashboardTotalPrincipal += dashPrincipal;
            newReportTotalInterest += newRepInterest;
            newReportTotalPrincipal += newRepPrincipal;
            oldReportTotalInterest += oldRepInterest;
            oldReportTotalPrincipal += oldRepPrincipal;

            // Check for mismatch
            const dashVsNew = Math.abs(dashInterest - newRepInterest);
            const dashVsOld = Math.abs(dashInterest - oldRepInterest);
            if (dashVsOld > 1) {
                memberMismatches.push({
                    id: m.id, name: m.memberName,
                    dashInterest, dashPrincipal,
                    newRepInterest, newRepPrincipal,
                    oldRepInterest, oldRepPrincipal,
                    splitReceipts: Object.values(receiptsByDate).filter(g => g.length > 1).length,
                });
            }
        }

        // ============ RESULTS ============
        console.log("=".repeat(70));
        console.log("  AGGREGATE TOTALS COMPARISON");
        console.log("=".repeat(70));
        console.log();
        console.log("                              Interest       Principal");
        console.log("  ──────────────────────────────────────────────────────");
        console.log(`  Dashboard (correct):     ₹${dashboardTotalInterest.toLocaleString().padStart(10)}    ₹${dashboardTotalPrincipal.toLocaleString().padStart(10)}`);
        console.log(`  New Report (fixed):      ₹${newReportTotalInterest.toLocaleString().padStart(10)}    ₹${newReportTotalPrincipal.toLocaleString().padStart(10)}`);
        console.log(`  Old Report (broken):     ₹${oldReportTotalInterest.toLocaleString().padStart(10)}    ₹${oldReportTotalPrincipal.toLocaleString().padStart(10)}`);
        console.log();
        console.log(`  Dashboard vs New Report: ₹${Math.abs(dashboardTotalInterest - newReportTotalInterest).toLocaleString().padStart(10)} diff`);
        console.log(`  Dashboard vs Old Report: ₹${Math.abs(dashboardTotalInterest - oldReportTotalInterest).toLocaleString().padStart(10)} diff`);
        console.log();
        console.log(`  Split payment EMI dates found: ${splitPaymentCount}`);
        console.log();

        if (Math.abs(dashboardTotalInterest - newReportTotalInterest) <= 5) {
            console.log("  ✅ Dashboard and New Report MATCH! (within rounding tolerance)");
        } else {
            console.log("  ⛔ Dashboard and New Report still have a difference!");
        }

        if (memberMismatches.length > 0) {
            console.log();
            console.log("─".repeat(70));
            console.log("  MEMBERS WHERE OLD REPORT HAD WRONG VALUES");
            console.log("─".repeat(70));
            console.log();
            memberMismatches.slice(0, 10).forEach((m, i) => {
                console.log(`  ${i + 1}. ${m.name} (ID: ${m.id}) - ${m.splitReceipts} split EMI date(s)`);
                console.log(`     Dashboard:   Interest=₹${m.dashInterest.toLocaleString()}  Principal=₹${m.dashPrincipal.toLocaleString()}`);
                console.log(`     New Report:  Interest=₹${m.newRepInterest.toLocaleString()}  Principal=₹${m.newRepPrincipal.toLocaleString()}`);
                console.log(`     Old Report:  Interest=₹${m.oldRepInterest.toLocaleString()}  Principal=₹${m.oldRepPrincipal.toLocaleString()} ← WRONG`);
                console.log();
            });
            if (memberMismatches.length > 10) {
                console.log(`  ... and ${memberMismatches.length - 10} more members`);
            }
        }

        console.log();
        console.log("=".repeat(70));
        console.log("  COMPARISON COMPLETE");
        console.log("=".repeat(70));

        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        console.error(err.stack);
        await sequelize.close();
        process.exit(1);
    }
};

run();
