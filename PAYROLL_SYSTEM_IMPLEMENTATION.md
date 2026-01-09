# Staff Payroll Management System - Complete Implementation

## Overview
Comprehensive payroll management system for staff with monthly payroll processing, salary tracking, bulk operations, filtering, and reporting capabilities.

## Features Implemented

### 1. Backend Models

#### PayrollRun Model (`backend/models/PayrollRun.js`)
- Tracks monthly payroll execution
- Fields:
  - `month`, `year` - Payroll period (unique compound index)
  - `status` - pending, processing, completed, failed, partial
  - `totalEmployees`, `processedEmployees`, `failedEmployees`
  - `totalAmount`, `totalPaid`, `totalPending`
  - `runBy` - User who initiated the run
  - `errorLog` - Array of error messages
  - `completedAt` - Completion timestamp

#### PayrollRecord Model (`backend/models/PayrollRecord.js`)
- Individual employee payroll records
- Fields:
  - `employeeId`, `payrollRunId` - References
  - `month`, `year` - Period (unique per employee)
  - `employmentType` - full_time, part_time, contractor
  - `baseSalary` - Base salary amount
  - `allowances` - Array of allowance objects (type, amount, description)
  - `deductions` - Array of deduction objects (type, amount, description)
  - `totalAllowances`, `totalDeductions` - Calculated totals
  - `grossPay`, `netPay` - Calculated amounts
  - `status` - not_generated, generated, paid, on_hold, failed
  - `paymentDate`, `paymentMethod`, `paymentReference`
  - `isLocked` - Prevents editing after payment
  - `paidBy`, `lockedBy` - Audit trail
- Auto-calculates totals before saving

#### Payslip Model (`backend/models/Payslip.js`)
- Generated payslip documents
- Fields:
  - `payrollRecordId` - Reference to payroll record
  - `employeeId`, `month`, `year`
  - `payslipNumber` - Unique identifier (PS-YYYY-MM-EMPID)
  - `filePath`, `fileUrl` - Document storage
  - `downloadCount`, `lastDownloadedAt` - Usage tracking

#### SalaryAdjustment Model (`backend/models/SalaryAdjustment.js`)
- Recurring or one-time salary adjustments
- Fields:
  - `employeeId` - Staff member
  - `type` - allowance or deduction
  - `category` - HRA, Transport, Tax, PF, etc.
  - `amount` - Adjustment amount
  - `effectiveMonth`, `effectiveYear` - When to apply
  - `isRecurring` - Apply every month
  - `isActive` - Enable/disable

### 2. Backend API Routes (`backend/routes/payroll.js`)

#### Dashboard & KPIs
- `GET /api/payroll/dashboard/:month/:year`
  - Returns KPI data for selected month
  - Total payout, pending amount, employee counts
  - Projected next month payout
  - Next payroll date

#### Payroll Records
- `GET /api/payroll/records`
  - Query params: month, year, status, employmentType, minSalary, maxSalary, search, page, limit
  - Returns paginated payroll records with filters
  - Supports search by employee ID

#### Payroll Processing
- `POST /api/payroll/run`
  - Body: `{ month, year, employeeIds, staffData }`
  - Generates payroll for all specified employees
  - Creates/updates PayrollRecord for each employee
  - Applies salary adjustments automatically
  - Generates payslips
  - Idempotent - can be run multiple times
  - Returns success/failure summary

#### Payment Operations
- `PUT /api/payroll/records/:id/pay`
  - Mark single salary as paid
  - Body: `{ paymentMethod, paymentReference, notes }`
  - Locks record after payment

- `POST /api/payroll/records/bulk-pay`
  - Mark multiple salaries as paid
  - Body: `{ recordIds[], paymentMethod, paymentReference }`
  - Returns success/failure summary

#### Record Management
- `PUT /api/payroll/records/:id`
  - Update payroll record (before payment)
  - Body: `{ baseSalary, allowances, deductions, status, notes }`
  - Cannot edit locked records

#### Payslips
- `GET /api/payroll/payslips/:employeeId/:month/:year`
  - Fetch payslip for employee
  - Increments download count
  - Returns payslip with populated payroll record

#### Salary Adjustments
- `GET /api/payroll/adjustments/:employeeId`
  - Get all active adjustments for employee

- `POST /api/payroll/adjustments`
  - Create new salary adjustment
  - Body: `{ employeeId, type, category, amount, description, effectiveMonth, effectiveYear, isRecurring }`

- `DELETE /api/payroll/adjustments/:id`
  - Soft delete (sets isActive = false)

### 3. Frontend Component (`school-dashboard/src/pages/staffs/StaffPayroll.jsx`)

#### Dashboard KPIs
Four KPI cards showing:
1. **Total Payout** - Amount paid this month (green)
2. **Pending** - Amount pending payment (blue)
3. **Projected Next Month** - Estimated next payout (yellow)
4. **Total Employees** - Active in payroll (purple)

#### Month/Year Selector
- Dropdown selectors for month and year
- Changes update entire dashboard and table
- Defaults to current month

#### Toolbar Features
- **Search** - Search by employee name or code
- **Status Filter** - All, Generated, Paid, On Hold, Failed
- **Employment Type Filter** - All, Full Time, Part Time, Contractor
- **Run Payroll Button** - Initiates payroll processing
- **Bulk Pay Button** - Appears when rows selected

#### Payroll Table
Columns:
- Employee (photo, name, code)
- Employment Type (chip)
- Base Salary (formatted currency)
- Allowances (green, formatted)
- Deductions (red, formatted)
- Net Pay (bold, formatted)
- Status (colored chip)
- Actions (Pay button, Payslip button)

Features:
- Multi-select with checkboxes
- Responsive design
- Loading states
- Empty state handling

#### Payment Modal
- Payment method selection (Bank Transfer, Cash, Cheque, Online)
- Payment reference input
- Notes field
- Confirmation workflow

#### Bulk Operations
- Select multiple employees
- Bulk pay with single click
- Success/failure summary

### 4. Integration

#### Server Integration
Routes mounted in `backend/server.js`:
```javascript
const payrollRoutes = require('./routes/payroll');
app.use('/api/payroll', payrollRoutes);
```

#### Frontend Routing
Already integrated in `school-dashboard/src/pages/staffs/index.jsx`:
- Route: `/staffs/payroll`
- Tab: "Payroll"
- Component: `<StaffPayroll />`

## Usage Guide

### Running Payroll

1. **Navigate to Payroll Tab**
   - Go to Staffs → Payroll

2. **Select Month/Year**
   - Use dropdowns to select payroll period

3. **Click "Run Payroll"**
   - System processes all active staff
   - Applies salary adjustments
   - Generates payslips
   - Shows success/failure summary

4. **Review Generated Records**
   - Check status of each employee
   - Verify amounts
   - Edit if needed (before payment)

5. **Process Payments**
   - Select employees to pay
   - Click "Pay Selected" or individual "Pay" button
   - Enter payment details
   - Confirm payment

### Managing Salary Adjustments

Salary adjustments are applied automatically during payroll run:

1. **Create Adjustment** (via API):
```javascript
POST /api/payroll/adjustments
{
  "employeeId": "EMP001",
  "type": "allowance",
  "category": "HRA",
  "amount": 5000,
  "description": "House Rent Allowance",
  "effectiveMonth": 1,
  "effectiveYear": 2026,
  "isRecurring": true
}
```

2. **Recurring Adjustments**
   - Set `isRecurring: true`
   - Applied every month automatically

3. **One-time Adjustments**
   - Set `isRecurring: false`
   - Applied only for specified month/year

### Filtering & Search

- **Search**: Type employee name or code
- **Status Filter**: Filter by payment status
- **Type Filter**: Filter by employment type
- **Combine Filters**: All filters work together

### Bulk Operations

1. **Select Employees**
   - Click checkboxes for multiple employees
   - Or use "Select All"

2. **Bulk Pay**
   - Click "Pay Selected (X)" button
   - Confirm action
   - View success/failure summary

## Data Flow

### Payroll Run Process

```
1. User clicks "Run Payroll"
   ↓
2. Frontend sends POST /api/payroll/run
   ↓
3. Backend creates/updates PayrollRun
   ↓
4. For each employee:
   - Fetch salary adjustments
   - Calculate allowances & deductions
   - Create/update PayrollRecord
   - Generate Payslip
   ↓
5. Update PayrollRun status
   ↓
6. Return success/failure summary
   ↓
7. Frontend refreshes dashboard & table
```

### Payment Process

```
1. User clicks "Pay" button
   ↓
2. Payment modal opens
   ↓
3. User enters payment details
   ↓
4. Frontend sends PUT /api/payroll/records/:id/pay
   ↓
5. Backend:
   - Updates status to 'paid'
   - Sets payment date
   - Locks record
   ↓
6. Frontend refreshes data
```

## Security Features

### Record Locking
- Records locked after payment
- Cannot edit locked records
- Prevents accidental modifications

### Audit Trail
- `paidBy` - Who processed payment
- `lockedBy` - Who locked record
- `paymentDate` - When payment made
- `paymentReference` - Transaction reference

### Idempotency
- Payroll run can be executed multiple times
- Updates existing records instead of duplicating
- Safe to retry failed runs

## Error Handling

### Payroll Run Errors
- Individual employee failures don't stop entire run
- Error log stored in PayrollRun
- Status set to 'partial' if some fail
- Failed employees can be retried

### Payment Errors
- Validation before payment
- Cannot pay locked records
- Cannot pay non-generated records
- Clear error messages

## Performance Considerations

### Pagination
- Records API supports pagination
- Default limit: 50 records
- Prevents loading thousands of records

### Indexing
- Compound indexes on month/year
- Employee ID indexed
- Status indexed for filtering

### Caching
- Dashboard data cached per month
- Reduces database queries

## Future Enhancements

### Planned Features
1. **Multi-currency Support**
   - Currency field in records
   - Exchange rate handling

2. **Tax Calculations**
   - Automatic tax deductions
   - Tax slabs configuration
   - TDS certificates

3. **Bank Integration**
   - Direct bank transfer API
   - Bulk payment files
   - Payment status tracking

4. **Payslip Generation**
   - PDF generation
   - Email delivery
   - Custom templates

5. **Reporting**
   - Monthly payroll reports
   - Year-end summaries
   - Export to accounting software

6. **Scheduled Payroll**
   - Automatic monthly runs
   - Configurable schedule
   - Email notifications

7. **Bonus & Incentives**
   - Performance-based bonuses
   - One-time incentives
   - Bonus calculation rules

8. **Compliance**
   - PF/ESI calculations
   - Statutory reports
   - Form 16 generation

## Testing

### Test Payroll Run

1. **Ensure Active Staff**
   - Have at least one active staff member
   - Staff should have salary configured

2. **Run Payroll**
   ```bash
   POST http://localhost:3001/api/payroll/run
   {
     "month": 1,
     "year": 2026,
     "employeeIds": ["staff-1", "staff-2"],
     "staffData": [
       {
         "id": "staff-1",
         "name": "John Doe",
         "salary": 50000,
         "employmentType": "full_time"
       }
     ]
   }
   ```

3. **Verify Records**
   ```bash
   GET http://localhost:3001/api/payroll/records?month=1&year=2026
   ```

4. **Check Dashboard**
   ```bash
   GET http://localhost:3001/api/payroll/dashboard/1/2026
   ```

### Test Payment

1. **Get Record ID**
   - From records API response

2. **Mark as Paid**
   ```bash
   PUT http://localhost:3001/api/payroll/records/:id/pay
   {
     "paymentMethod": "bank_transfer",
     "paymentReference": "TXN123456",
     "notes": "Salary for January 2026"
   }
   ```

3. **Verify Status**
   - Check record status is 'paid'
   - Check isLocked is true
   - Check paymentDate is set

## Database Schema Summary

```
PayrollRun
├── month, year (unique)
├── status
├── totalEmployees
├── totalAmount
└── errorLog[]

PayrollRecord
├── employeeId, month, year (unique)
├── payrollRunId → PayrollRun
├── baseSalary
├── allowances[]
├── deductions[]
├── netPay (calculated)
├── status
├── isLocked
└── paymentDate

Payslip
├── payrollRecordId → PayrollRecord
├── employeeId, month, year
├── payslipNumber (unique)
└── downloadCount

SalaryAdjustment
├── employeeId
├── type (allowance/deduction)
├── category
├── amount
├── effectiveMonth, effectiveYear
└── isRecurring
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/dashboard/:month/:year` | Get KPI data |
| GET | `/api/payroll/records` | List payroll records |
| POST | `/api/payroll/run` | Run payroll processing |
| PUT | `/api/payroll/records/:id/pay` | Mark as paid |
| POST | `/api/payroll/records/bulk-pay` | Bulk payment |
| PUT | `/api/payroll/records/:id` | Update record |
| GET | `/api/payroll/payslips/:empId/:month/:year` | Get payslip |
| GET | `/api/payroll/adjustments/:empId` | List adjustments |
| POST | `/api/payroll/adjustments` | Create adjustment |
| DELETE | `/api/payroll/adjustments/:id` | Delete adjustment |

## Status: COMPLETE ✅

The payroll system is fully implemented and ready for use. All core features are functional including:
- ✅ Monthly payroll processing
- ✅ Salary calculations with allowances/deductions
- ✅ Payment tracking and recording
- ✅ Bulk operations
- ✅ Filtering and search
- ✅ Dashboard KPIs
- ✅ Record locking and audit trail
- ✅ Salary adjustments
- ✅ Payslip generation (structure ready)

Navigate to **Staffs → Payroll** to start using the system!
