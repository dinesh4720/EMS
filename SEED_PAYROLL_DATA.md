# Seed Payroll Data - Quick Guide

## What This Does

The seed script creates realistic payroll data for testing:
- ✅ Payroll runs for the last 3 months
- ✅ Payroll records for all active staff
- ✅ Random allowances (HRA, Transport, Medical, Special)
- ✅ Random deductions (PF, Tax, Insurance)
- ✅ Mixed statuses (Generated, Paid, On Hold)
- ✅ Payslips for all records
- ✅ Recurring salary adjustments

## How to Run

### Step 1: Make Sure Backend is Running
```bash
cd backend
npm run dev
```

### Step 2: Run the Seed Script (in a new terminal)
```bash
cd backend
node seed-payroll.js
```

## Expected Output

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
📊 Found 15 active staff members
🗑️  Clearing existing payroll data...

📅 Creating payroll for 1/2026...
✅ Created payroll run for 1/2026
   Total Amount: ₹7,50,000
   Total Paid: ₹5,00,000
   Total Pending: ₹2,50,000

📅 Creating payroll for 12/2025...
✅ Created payroll run for 12/2025
   Total Amount: ₹7,45,000
   Total Paid: ₹7,45,000
   Total Pending: ₹0

📅 Creating payroll for 11/2025...
✅ Created payroll run for 11/2025
   Total Amount: ₹7,52,000
   Total Paid: ₹7,52,000
   Total Pending: ₹0

💰 Creating salary adjustments...
✅ Created 20 salary adjustments

📊 Payroll Data Summary:
   Payroll Runs: 3
   Payroll Records: 45
   Payslips: 45
   Salary Adjustments: 20

✅ Payroll data seeded successfully!
```

## What Gets Created

### 1. Payroll Runs (3 months)
- Current month (mostly "Generated" status)
- Last month (mostly "Paid" status)
- 2 months ago (mostly "Paid" status)

### 2. Payroll Records (per employee per month)
Each record includes:
- **Base Salary**: Random between ₹30,000 - ₹80,000
- **Allowances**: 
  - HRA (40% of base)
  - Transport (₹2,000 fixed)
  - Medical (₹1,500 fixed)
  - Special (10% of base)
- **Deductions**:
  - PF (12% of base)
  - Tax (10% of base)
  - Insurance (₹1,000 fixed)
- **Status**: Generated, Paid, or On Hold
- **Payment Details**: For paid records

### 3. Payslips
- Unique payslip number: `PS-YYYY-MM-EMPID`
- Linked to payroll record
- Random download count

### 4. Salary Adjustments
- Recurring HRA allowances
- Recurring PF deductions
- Applied to first 10 employees

## Verify the Data

### Option 1: Check in Dashboard
1. Open http://localhost:5173
2. Navigate to **Staffs → Payroll**
3. You should see:
   - KPI cards with totals
   - Payroll records in the table
   - Different statuses (Generated, Paid)

### Option 2: Check in MongoDB
```bash
# Connect to MongoDB
mongosh

# Use the database
use school-management

# Check payroll runs
db.payrollruns.find().pretty()

# Check payroll records
db.payrollrecords.find().limit(5).pretty()

# Check payslips
db.payslips.find().limit(5).pretty()

# Check salary adjustments
db.salaryadjustments.find().pretty()
```

## Test Features

After seeding, you can test:

1. **View Payroll Dashboard**
   - See KPI cards with totals
   - Check different months

2. **Filter Records**
   - Filter by status (Generated, Paid, On Hold)
   - Filter by employment type
   - Search by employee name

3. **Mark as Paid**
   - Select "Generated" records
   - Click "Pay" button
   - Enter payment details

4. **Bulk Operations**
   - Select multiple records
   - Click "Pay Selected"
   - Confirm bulk payment

5. **Run Payroll**
   - Select next month
   - Click "Run Payroll"
   - See new records created

## Troubleshooting

### No Staff Found
If you see "No staff found", run the staff seed script first:
```bash
cd backend
node seed-staff.js
```

### Connection Error
Make sure MongoDB is running:
```bash
# Check if MongoDB is running
mongosh

# If not running, start it
# Windows: Start MongoDB service
# Mac/Linux: sudo systemctl start mongod
```

### Module Error
If you get module errors, make sure you're using Node.js v14+ and have all dependencies:
```bash
cd backend
npm install
```

## Clean Up

To remove all payroll data and start fresh:
```bash
# Run the seed script again (it clears existing data first)
node seed-payroll.js
```

Or manually in MongoDB:
```javascript
use school-management
db.payrollruns.deleteMany({})
db.payrollrecords.deleteMany({})
db.payslips.deleteMany({})
db.salaryadjustments.deleteMany({})
```

## Next Steps

After seeding:
1. ✅ View payroll dashboard
2. ✅ Test filtering and search
3. ✅ Try marking salaries as paid
4. ✅ Test bulk payment operations
5. ✅ Run payroll for next month
6. ✅ Download payslips (when implemented)

Enjoy testing the payroll system! 🎉
