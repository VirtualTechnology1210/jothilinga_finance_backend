/**
 * Quick check: Find members with multiple EMI chart records
 * and compare which record the Dashboard vs Collection Report would pick
 * 
 * Usage: npx dotenv -e .env.development -- node scripts/check_emi_chart_mismatch.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.development") });

const { emi_charts, sequelize } = require("../models");

(async () => {
    try {
        // Find all EMI charts grouped by memberId
        const allCharts = await emi_charts.findAll({
            order: [['memberId', 'ASC'], ['id', 'ASC']],
            attributes: ['id', 'memberId', 'status', 'loanAmount', 'totalInterest', 'createdAt'],
        });

        // Group by memberId
        const grouped = {};
        allCharts.forEach(c => {
            const data = c.toJSON();
            if (!grouped[data.memberId]) grouped[data.memberId] = [];
            grouped[data.memberId].push(data);
        });

        // Find members with multiple charts
        const multipleCharts = Object.entries(grouped).filter(([_, charts]) => charts.length > 1);

        console.log("=".repeat(60));
        console.log("  EMI CHART MISMATCH CHECK");
        console.log("=".repeat(60));
        console.log(`  Total members with EMI charts: ${Object.keys(grouped).length}`);
        console.log(`  Members with MULTIPLE charts:  ${multipleCharts.length}`);
        console.log();

        if (multipleCharts.length > 0) {
            console.log("  ⚠️  These members could cause Dashboard vs Report mismatch:");
            console.log();

            multipleCharts.forEach(([memberId, charts]) => {
                // Dashboard OLD logic: pick last
                const dashboardPick = charts[charts.length - 1];
                // Collection Report logic: pick submitted, fallback to first
                const collectionPick = charts.find(c => c.status === 'submitted') || charts[0];

                const isDifferent = dashboardPick.id !== collectionPick.id;

                console.log(`  Member ${memberId}: ${charts.length} charts ${isDifferent ? '⛔ MISMATCH!' : '✅ Same'}`);
                charts.forEach((c, i) => {
                    const isDash = c.id === dashboardPick.id;
                    const isCol = c.id === collectionPick.id;
                    let label = '';
                    if (isDash && isCol) label = ' ← Dashboard + Collection';
                    else if (isDash) label = ' ← Dashboard (OLD picks this)';
                    else if (isCol) label = ' ← Collection Report picks this';
                    console.log(`    Chart #${i + 1}: id=${c.id} status="${c.status}" loanAmt=${c.loanAmount} totalInterest=${c.totalInterest}${label}`);
                });
                console.log();
            });
        } else {
            console.log("  ✅ All members have only 1 EMI chart record — no mismatch possible.");
        }

        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        await sequelize.close();
        process.exit(1);
    }
})();
