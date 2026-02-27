# 📊 Interest & Principal Calculation - Dashboard

## Overview

The Dashboard's **"Interest Collected"** and **"Principal Paid"** values are calculated by comparing the **EMI Chart** data with **Receipts** (actual payments made by customers).

---

## 🗂️ Data Sources

### 1. EMI Chart (`emi_charts` table)

Each customer has an **EMI Chart** stored as a JSON array in the `emiChart` column. This chart is generated at loan disbursement time and contains pre-calculated values for every month:

```json
[
  {
    "month": 1,
    "emiDate": "Mon Aug 04 2025",
    "emiAmount": 6234,
    "interestRate": "2.000%",
    "daysCalculated": 31,
    "interestAmount": 2067,       ← Interest for this month
    "principalAmount": 4167,      ← Principal for this month
    "remainingPrincipal": 95834
  },
  {
    "month": 2,
    "emiDate": "Thu Sep 04 2025",
    "emiAmount": 6142,
    "interestAmount": 1975,       ← Different interest each month
    "principalAmount": 4167,
    "remainingPrincipal": 91667
  }
  // ... more months
]
```

**Key Point:** Each month has **different** `interestAmount` values because the interest is calculated on the **remaining principal** (which reduces each month as principal is paid off).

### 2. Receipts (`receipts` table)

Each payment made by a customer is stored as a receipt:

| Column         | Description                                      |
|----------------|--------------------------------------------------|
| `memberId`     | ID of the customer                               |
| `emiDate`      | The EMI schedule date this payment is for         |
| `emiAmount`    | The expected EMI amount                          |
| `receivedAmount`| The actual amount received in this payment       |
| `collectedDate`| When the payment was actually collected           |
| `status`       | `"paid"` if full EMI covered, `"pending"` if partial |

#### Receipt Status Logic

When a receipt is created (in `addReceiptWithImage.js`):

```javascript
const status = Number(receivedAmount) >= Number(pendingEmiAmount) ? "paid" : "pending";
```

| Scenario | receivedAmount | pendingEmiAmount | Status |
|----------|---------------|------------------|--------|
| Full payment | ₹6,234 | ₹6,234 | `"paid"` |
| 1st split payment | ₹2,000 | ₹6,234 | `"pending"` |
| 2nd split payment | ₹2,000 | ₹4,234 | `"pending"` |
| 3rd (final) split | ₹2,234 | ₹2,234 | `"paid"` |

**Important:** The dashboard query filters receipts to only include `status = "paid"` or `"pending"`. This **excludes** any receipts with invalid/rejected statuses, ensuring only actual payments are counted.

---

## 🔢 How the Calculation Works

### Step-by-Step Process (in `getDashboardCount.js`)

```
For each MEMBER (with disbursed loan):
│
├── 1. Fetch their EMI Chart from emi_charts table
│
├── 2. For each EMI ENTRY in the chart:
│   │
│   ├── 3. Find ALL receipts matching this emiDate
│   │      (multiple receipts = split payment)
│   │
│   ├── 4. SUM all receipt amounts for this emiDate
│   │      receivedAmount = receipt1 + receipt2 + receipt3 ...
│   │
│   ├── 5. Get interestAmount & principalAmount FROM THE EMI CHART
│   │      (NOT calculated with formula!)
│   │
│   └── 6. Split the received amount:
│       │
│       ├── IF receivedAmount >= interestAmount:
│       │   ├── Interest Paid = chart's interestAmount (full)
│       │   └── Principal Paid = min(chart's principalAmount, remaining)
│       │
│       └── IF receivedAmount < interestAmount:
│           ├── Interest Paid = receivedAmount (all goes to interest)
│           └── Principal Paid = 0 (nothing left for principal)
│
└── 7. Accumulate totals across all members
```

---

## 💰 Split Payment Scenario (Most Important!)

### What is a Split Payment?

A customer pays their monthly EMI in **multiple smaller payments** instead of one lump sum.

### Example

**Customer**: Muthu  
**EMI for August 2025**: ₹6,234  
**EMI Chart values for this month**:
- `interestAmount`: ₹2,067
- `principalAmount`: ₹4,167

**Customer pays in 3 installments:**

| Receipt # | emiDate    | receivedAmount | collectedDate |
|-----------|------------|----------------|---------------|
| 1         | 2025-08-04 | ₹2,000         | 2025-08-01    |
| 2         | 2025-08-04 | ₹2,000         | 2025-08-03    |
| 3         | 2025-08-04 | ₹2,234         | 2025-08-04    |

> **Notice:** All 3 receipts have the **same `emiDate`** (2025-08-04), even though they were collected on different actual dates.

### How the Code Handles This

```javascript
// Step 1: Find ALL receipts for emiDate "2025-08-04"
const receiptsForEmiDate = member.receiptsDetails.filter(
  (receipt) => receipt.emiDate === "2025-08-04"
);
// Result: [Receipt #1, Receipt #2, Receipt #3]

// Step 2: SUM all received amounts
let receivedAmount = 2000 + 2000 + 2234 = 6234;
// ✅ Total received = ₹6,234

// Step 3: Get values FROM EMI CHART (not calculated!)
const interestComponent = 2067;   // from chart
const principalComponent = 4167;  // from chart

// Step 4: Split the total received amount
// Since 6234 >= 2067 (interest covered ✅)
//   Interest Paid = ₹2,067
//   Remaining = 6234 - 2067 = ₹4,167
//   Principal Paid = min(4167, 4167) = ₹4,167
```

### Result:
| Component      | Amount  |
|----------------|---------|
| Interest Paid  | ₹2,067  |
| Principal Paid | ₹4,167  |
| Total Paid     | ₹6,234  |

✅ **The split payments are correctly combined and then properly split into interest and principal!**

---

## ⚠️ Edge Cases

### Case 1: Partial Payment (Not Fully Paid)

**EMI**: ₹6,234 | **Chart Interest**: ₹2,067 | **Chart Principal**: ₹4,167

Customer pays only ₹1,500 (one partial receipt):

```
receivedAmount = 1500
interestComponent = 2067 (from chart)

Since 1500 < 2067 (interest NOT fully covered ❌)
  → Interest Paid = ₹1,500 (all goes to interest)
  → Principal Paid = ₹0
  → Outstanding Interest = 2067 - 1500 = ₹567
```

### Case 2: Split Payment - Still Partially Paid

Customer pays ₹1,000 + ₹500 = ₹1,500 total (two receipts, same emiDate):

```
receivedAmount = 1000 + 500 = 1500

Same result as Case 1:
  → Interest Paid = ₹1,500
  → Principal Paid = ₹0
  → Outstanding Interest = ₹567
```

### Case 3: Overpayment

Customer pays ₹7,000 for an EMI of ₹6,234:

```
receivedAmount = 7000
interestComponent = 2067
principalComponent = 4167

Since 7000 >= 2067 (interest covered ✅)
  → Interest Paid = ₹2,067
  → Remaining = 7000 - 2067 = ₹4,933
  → Principal Paid = min(4167, 4933) = ₹4,167
  → Extra ₹766 is captured in total EMI paid but not double-counted
```

### Case 4: No EMI Chart Data

If a member has **no EMI chart** in the `emi_charts` table, they are **skipped entirely**. Their interest/principal won't be counted.

### Case 5: No Receipts for an EMI Date

If there are no receipts for a particular month's EMI date, that month is **skipped** (receivedAmount = 0). No interest or principal is counted for that month.

---

## 📐 Why EMI Chart Values Instead of Formula?

### Old Method (Formula-Based):
```javascript
// Old: Simple monthly interest formula
interest = (outstandingPrincipal × rateOfInterest) / 12 / 100
```

**Problems with old method:**
- Doesn't account for **varying days per month** (28/30/31 days)
- Doesn't match the **actual EMI schedule** given to the customer
- Interest slightly different from what was promised to the customer
- Doesn't handle **rate changes** during the tenure

### New Method (EMI Chart-Based):
```javascript
// New: Read directly from pre-calculated chart
interest = chartEntry.interestAmount   // ← exact value from chart
principal = chartEntry.principalAmount  // ← exact value from chart
```

**Benefits:**
- ✅ **Exact match** with the EMI schedule given to the customer
- ✅ Accounts for **days calculated** per month
- ✅ Handles **rate changes** (different rates in different months)
- ✅ Dashboard shows the **same numbers** as the customer's EMI chart document

---

## 🔄 Data Flow Diagram

```
┌──────────────────┐     ┌──────────────────┐
│   emi_charts     │     │    receipts       │
│   (per member)   │     │   (per payment)   │
│                  │     │                   │
│  emiDate: Aug 04 │     │  emiDate: Aug 04  │
│  interest: 2067  │     │  received: 2000   │
│  principal: 4167 │     │                   │
│                  │     │  emiDate: Aug 04   │
│  emiDate: Sep 04 │     │  received: 2000   │
│  interest: 1975  │     │                   │
│  principal: 4167 │     │  emiDate: Aug 04   │
│                  │     │  received: 2234   │
└────────┬─────────┘     └────────┬──────────┘
         │                        │
         │   Match by emiDate     │
         └────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────┐
    │   getDashboardCount.js  │
    │                         │
    │  For each chart entry:  │
    │  1. Sum all receipts    │
    │  2. Compare with chart  │
    │  3. Split into:         │
    │     - Interest Paid     │
    │     - Principal Paid    │
    │     - Outstanding       │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │       Dashboard         │
    │                         │
    │  Interest Collected: ₹X │
    │  Principal Paid: ₹Y     │
    │  Outstanding: ₹Z        │
    └─────────────────────────┘
```

---

## 📝 Important Notes

1. **The `emiDate` in receipts always matches the scheduled EMI date**, not the actual collection date. This is how split payments work — all partial payments for the same month share the same `emiDate`.

2. **Interest is always paid first.** If a customer pays less than the interest amount, the entire payment goes toward interest. Principal is only reduced when interest is fully covered.

3. **The interest/principal values come from the EMI chart, NOT from a formula.** This ensures consistency between what the customer sees in their statement and what the dashboard shows.

4. **Members without EMI chart data are skipped.** If the `emi_charts` table has no record for a member, they won't appear in interest/principal calculations.

5. **The latest EMI chart record is used** if a member has multiple EMI chart records (e.g., from refinancing).

---

## 🛠️ Files Involved

| File | Purpose |
|------|---------|
| `controllers/getDashboardCount.js` | Main calculation logic |
| `models/emi_chart.js` | EMI chart model with `emiChart` JSON column |
| `models/receipts.js` | Receipts model with `emiDate` and `receivedAmount` |
| `models/member_details.js` | Member model with associations to both |
| `frontend/screens/Dashboard.js` | Dashboard UI displaying the calculated values |
