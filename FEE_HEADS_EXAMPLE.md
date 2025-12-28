# Fee Heads Calculation - Visual Examples

## How It Works Now

The system automatically breaks down the pending amount into monthly fee heads.

**Fee Structure:**
- Tuition Fee: ₹5,000/month
- Transport Fee: ₹2,000/month
- **Total per month: ₹7,000**

---

## Example 1: Student Owes ₹45,000

### Calculation:
```
₹45,000 ÷ ₹7,000 = 6 complete months + ₹3,000 remaining
```

### Fee Collection Modal Shows:

```
┌─────────────────────────────────────────────────────────┐
│  Collect Fee - Rahul Kumar                              │
│  Pending: ₹45,000                                       │
├─────────────────────────────────────────────────────────┤
│  ☐  Tuition Fee      December 2024      ₹5,000         │
│  ☐  Transport Fee    December 2024      ₹2,000         │
│  ☐  Tuition Fee      November 2024      ₹5,000         │
│  ☐  Transport Fee    November 2024      ₹2,000         │
│  ☐  Tuition Fee      October 2024       ₹5,000         │
│  ☐  Transport Fee    October 2024       ₹2,000         │
│  ☐  Tuition Fee      September 2024     ₹5,000         │
│  ☐  Transport Fee    September 2024     ₹2,000         │
│  ☐  Tuition Fee      August 2024        ₹5,000         │
│  ☐  Transport Fee    August 2024        ₹2,000         │
│  ☐  Tuition Fee      July 2024          ₹5,000         │
│  ☐  Transport Fee    July 2024          ₹2,000         │
│  ☐  Tuition Fee (Partial)  June 2024    ₹3,000         │
├─────────────────────────────────────────────────────────┤
│  Total Selected: ₹0                                     │
│  [Cancel]                    [Collect ₹0]               │
└─────────────────────────────────────────────────────────┘
```

**If user selects all:**
- Total = ₹5,000 + ₹2,000 + ₹5,000 + ₹2,000 + ₹5,000 + ₹2,000 + ₹5,000 + ₹2,000 + ₹5,000 + ₹2,000 + ₹5,000 + ₹2,000 + ₹3,000
- **Total = ₹45,000** ✓

---

## Example 2: Student Owes ₹14,000

### Calculation:
```
₹14,000 ÷ ₹7,000 = 2 complete months exactly
```

### Fee Collection Modal Shows:

```
┌─────────────────────────────────────────────────────────┐
│  Collect Fee - Priya Sharma                             │
│  Pending: ₹14,000                                       │
├─────────────────────────────────────────────────────────┤
│  ☐  Tuition Fee      December 2024      ₹5,000         │
│  ☐  Transport Fee    December 2024      ₹2,000         │
│  ☐  Tuition Fee      November 2024      ₹5,000         │
│  ☐  Transport Fee    November 2024      ₹2,000         │
├─────────────────────────────────────────────────────────┤
│  Total Selected: ₹0                                     │
│  [Cancel]                    [Collect ₹0]               │
└─────────────────────────────────────────────────────────┘
```

**If user selects all:**
- Total = ₹5,000 + ₹2,000 + ₹5,000 + ₹2,000
- **Total = ₹14,000** ✓

---

## Example 3: Student Owes ₹3,000

### Calculation:
```
₹3,000 ÷ ₹7,000 = 0 complete months + ₹3,000 remaining
₹3,000 < ₹5,000 (tuition) → Partial tuition only
```

### Fee Collection Modal Shows:

```
┌─────────────────────────────────────────────────────────┐
│  Collect Fee - Amit Singh                               │
│  Pending: ₹3,000                                        │
├─────────────────────────────────────────────────────────┤
│  ☐  Tuition Fee (Partial)  December 2024   ₹3,000      │
├─────────────────────────────────────────────────────────┤
│  Total Selected: ₹0                                     │
│  [Cancel]                    [Collect ₹0]               │
└─────────────────────────────────────────────────────────┘
```

**If user selects all:**
- Total = ₹3,000
- **Total = ₹3,000** ✓

---

## Example 4: Student Owes ₹12,000

### Calculation:
```
₹12,000 ÷ ₹7,000 = 1 complete month + ₹5,000 remaining
₹5,000 = full tuition, no transport
```

### Fee Collection Modal Shows:

```
┌─────────────────────────────────────────────────────────┐
│  Collect Fee - Neha Patel                               │
│  Pending: ₹12,000                                       │
├─────────────────────────────────────────────────────────┤
│  ☐  Tuition Fee      December 2024      ₹5,000         │
│  ☐  Transport Fee    December 2024      ₹2,000         │
│  ☐  Tuition Fee      November 2024      ₹5,000         │
├─────────────────────────────────────────────────────────┤
│  Total Selected: ₹0                                     │
│  [Cancel]                    [Collect ₹0]               │
└─────────────────────────────────────────────────────────┘
```

**If user selects all:**
- Total = ₹5,000 + ₹2,000 + ₹5,000
- **Total = ₹12,000** ✓

---

## Example 5: Student Owes ₹8,500

### Calculation:
```
₹8,500 ÷ ₹7,000 = 1 complete month + ₹1,500 remaining
₹1,500 < ₹5,000 → Partial tuition
```

### Fee Collection Modal Shows:

```
┌─────────────────────────────────────────────────────────┐
│  Collect Fee - Vikram Kumar                             │
│  Pending: ₹8,500                                        │
├─────────────────────────────────────────────────────────┤
│  ☐  Tuition Fee      December 2024      ₹5,000         │
│  ☐  Transport Fee    December 2024      ₹2,000         │
│  ☐  Tuition Fee (Partial)  November 2024   ₹1,500      │
├─────────────────────────────────────────────────────────┤
│  Total Selected: ₹0                                     │
│  [Cancel]                    [Collect ₹0]               │
└─────────────────────────────────────────────────────────┘
```

**If user selects all:**
- Total = ₹5,000 + ₹2,000 + ₹1,500
- **Total = ₹8,500** ✓

---

## Example 6: Partial Payment Scenario

### Initial State:
```
Student: Rahul Kumar
Pending: ₹45,000
```

### User Collects December Fees Only:
```
☑  Tuition Fee      December 2024      ₹5,000
☑  Transport Fee    December 2024      ₹2,000
☐  Tuition Fee      November 2024      ₹5,000
☐  Transport Fee    November 2024      ₹2,000
... (rest unchecked)

Total Selected: ₹7,000
```

### After Collection:
```
Payment recorded: ₹7,000
New pending: ₹45,000 - ₹7,000 = ₹38,000
Status: Still "Pending"
```

### Next Time User Opens Modal:
```
New calculation: ₹38,000 ÷ ₹7,000 = 5 months + ₹3,000

Fee heads shown:
☐  Tuition Fee      December 2024      ₹5,000
☐  Transport Fee    December 2024      ₹2,000
☐  Tuition Fee      November 2024      ₹5,000
☐  Transport Fee    November 2024      ₹2,000
☐  Tuition Fee      October 2024       ₹5,000
☐  Transport Fee    October 2024       ₹2,000
☐  Tuition Fee      September 2024     ₹5,000
☐  Transport Fee    September 2024     ₹2,000
☐  Tuition Fee      August 2024        ₹5,000
☐  Transport Fee    August 2024        ₹2,000
☐  Tuition Fee (Partial)  July 2024    ₹3,000

Total: ₹38,000 ✓
```

---

## Benefits

1. **Always Accurate**: Fee heads always add up to exact pending amount
2. **Flexible Collection**: User can select any combination of fees
3. **Clear Breakdown**: Shows which months are pending
4. **Handles Partials**: Correctly handles partial month fees
5. **No Confusion**: User sees exactly what they're collecting

---

## Edge Cases Handled

### Case 1: Zero Pending
```
Pending: ₹0
Fee heads shown: (empty list)
Message: "No pending fees"
```

### Case 2: Very Small Amount
```
Pending: ₹500
Fee heads shown:
☐  Tuition Fee (Partial)  December 2024   ₹500
```

### Case 3: Exact Monthly Amount
```
Pending: ₹7,000
Fee heads shown:
☐  Tuition Fee      December 2024      ₹5,000
☐  Transport Fee    December 2024      ₹2,000
```

### Case 4: Large Amount (1 Year)
```
Pending: ₹84,000 (12 months)
Fee heads shown: 24 items (12 tuition + 12 transport)
```

---

## User Workflow

1. **Open Payments Page**
   - See list of students with pending amounts

2. **Click "Collect" on Student**
   - Modal opens with dynamically calculated fee heads
   - All fees match exact pending amount

3. **Select Fees to Collect**
   - Can select all or partial
   - Total updates in real-time

4. **Choose Payment Mode**
   - Cash, Cheque, Online, Card

5. **Click "Collect"**
   - Payment recorded
   - Student data refreshes
   - Receipt generated

6. **Next Collection**
   - Fee heads recalculated based on new pending amount
   - Always accurate

---

## Technical Details

See `FEE_HEADS_FIX.md` for implementation details and code.
