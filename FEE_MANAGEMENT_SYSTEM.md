# Fee Management System - Complete Implementation

## Overview
A comprehensive fee management system where you can declare fee heads for classes 1-12, and they automatically apply to all students in those classes. All data is saved in MongoDB.

## Features

### 1. Fee Head Declaration
- Create fee heads with name, category, amount, and description
- Select applicable classes (1-12) - can select multiple or all classes
- Set frequency (yearly, term, quarterly, monthly, one-time)
- Mark as mandatory or optional
- Auto-apply to students when created/updated

### 2. Automatic Student Application
- When a fee head is created, it automatically applies to all students in the selected classes
- When a fee head is updated, changes are reflected in all student fee structures
- When a new student is added, they automatically get all applicable fee heads for their class

### 3. Database Structure

#### FeeHead Model
```javascript
{
  name: String,                    // e.g., "Tuition Fee"
  category: String,                // Academic, Transport, Extra-curricular, Hostel, Other
  amount: Number,                  // Fee amount
  mandatory: Boolean,              // Required or optional
  description: String,             // Brief description
  applicableClasses: [String],     // ['1', '2', '3', ... '12']
  frequency: String,               // yearly, term, quarterly, monthly, one-time
  academicYear: String,            // e.g., '2024-25'
  isActive: Boolean,               // Active or inactive
  autoApply: Boolean               // Auto-apply to students
}
```

#### StudentFeeStructure Model
```javascript
{
  studentId: ObjectId,             // Reference to Student
  classId: ObjectId,               // Reference to Class
  academicYear: String,            // e.g., '2024-25'
  
  feeHeads: [{
    feeHeadId: ObjectId,           // Reference to FeeHead
    name: String,
    category: String,
    amount: Number,
    mandatory: Boolean,
    frequency: String,
    paidAmount: Number,            // Amount paid so far
    balanceAmount: Number,         // Remaining balance
    status: String                 // pending, partial, paid
  }],
  
  totalFee: Number,                // Sum of all fee heads
  totalPaid: Number,               // Total amount paid
  totalBalance: Number,            // Total remaining
  discountApplied: Number,         // Discount amount
  discountReason: String,          // Reason for discount
  overallStatus: String,           // pending, partial, paid
  lastPaymentDate: Date
}
```

## API Endpoints

### Fee Heads
- `GET /api/fee-heads` - Get all fee heads
- `GET /api/fee-heads/:id` - Get specific fee head
- `POST /api/fee-heads` - Create new fee head (auto-applies to students)
- `PUT /api/fee-heads/:id` - Update fee head (auto-updates students)
- `DELETE /api/fee-heads/:id` - Delete fee head (removes from students)
- `POST /api/fee-heads/:id/apply` - Manually apply fee head to students

### Student Fees
- `GET /api/student-fees/student/:studentId` - Get fee structure for a student
- `GET /api/student-fees/all` - Get all student fee structures
- `POST /api/student-fees/initialize/:studentId` - Initialize fee structure for new student
- `PUT /api/student-fees/student/:studentId/discount` - Apply discount to student
- `POST /api/student-fees/student/:studentId/payment` - Record payment
- `GET /api/student-fees/defaulters` - Get list of fee defaulters

## How It Works

### Creating a Fee Head
1. Admin goes to Settings > Fee Heads
2. Clicks "Add Fee Head"
3. Fills in:
   - Name (e.g., "Tuition Fee")
   - Category (Academic, Transport, etc.)
   - Amount (e.g., 50000)
   - Applicable Classes (Select from 1-12)
   - Frequency (Yearly, Term, etc.)
   - Mandatory/Optional toggle
   - Auto-apply toggle (enabled by default)
4. Clicks "Create Fee Head"
5. System automatically:
   - Saves fee head to database
   - Finds all students in selected classes
   - Creates/updates StudentFeeStructure for each student
   - Adds the fee head to their fee structure

### Example Scenario
**Creating "Tuition Fee" for Classes 1-5:**
1. Create fee head:
   - Name: "Tuition Fee"
   - Amount: ₹50,000
   - Applicable Classes: 1, 2, 3, 4, 5
   - Frequency: Yearly
   - Mandatory: Yes

2. System finds all students in Class 1, 2, 3, 4, 5

3. For each student, creates/updates their fee structure:
   ```javascript
   {
     studentId: "student123",
     classId: "class1A",
     feeHeads: [
       {
         feeHeadId: "feeHead456",
         name: "Tuition Fee",
         amount: 50000,
         paidAmount: 0,
         balanceAmount: 50000,
         status: "pending"
       }
     ],
     totalFee: 50000,
     totalBalance: 50000
   }
   ```

### Adding a New Student
When a new student is added to Class 3:
1. Student is created in the database
2. Call `/api/student-fees/initialize/:studentId`
3. System:
   - Finds all active fee heads for Class 3
   - Creates StudentFeeStructure with all applicable fee heads
   - Student automatically has all fees assigned

## Frontend Features

### Fee Heads Settings Page
- View all fee heads in a table
- See applicable classes for each fee head
- Create/Edit/Delete fee heads
- Apply fee heads to students manually
- Filter by category, class, etc.

### Student Fee Management
- View individual student fee structure
- See all fee heads applicable to the student
- Track payment status for each fee head
- Apply discounts
- Record payments
- View fee defaulters

## Benefits

1. **Centralized Management**: Declare fees once, apply to all students
2. **Automatic Application**: New students automatically get applicable fees
3. **Easy Updates**: Update fee head, all students get updated
4. **Class-Based**: Different fees for different classes
5. **Flexible**: Mandatory/optional, different frequencies
6. **Tracking**: Track payments per fee head
7. **Reporting**: Easy to generate reports on fee collection

## Usage Instructions

### For Administrators

1. **Set Up Fee Heads**
   - Go to Settings > Fee Heads
   - Create fee heads for each class (1-12)
   - Example: Tuition Fee for all classes, Transport Fee for specific classes

2. **Add Students**
   - When adding a student, their fees are automatically assigned based on their class
   - No manual fee assignment needed

3. **Collect Payments**
   - Go to Fees > Payments
   - Select student
   - Record payment against specific fee heads
   - System automatically updates balances

4. **Track Defaulters**
   - Go to Fees > Defaulters
   - See all students with pending fees
   - Send reminders

## Testing

1. **Create Fee Heads**
   ```
   - Tuition Fee: ₹50,000 (Classes 1-12)
   - Transport Fee: ₹10,000 (Classes 1-12)
   - Lab Fee: ₹5,000 (Classes 9-12)
   - Sports Fee: ₹3,000 (Classes 1-12)
   ```

2. **Add Students**
   - Add student in Class 1 → Gets Tuition, Transport, Sports
   - Add student in Class 10 → Gets Tuition, Transport, Lab, Sports

3. **Verify**
   - Check student fee structure
   - Verify all applicable fees are assigned
   - Check totals are calculated correctly

## Database Collections

1. **feeheads** - Stores all fee head definitions
2. **studentfeestructures** - Stores fee structure for each student
3. **students** - Student information
4. **classes** - Class information

## Notes

- All amounts are in INR (₹)
- Academic year is configurable
- Fee heads can be activated/deactivated
- Supports multiple academic years
- Payment tracking per fee head
- Discount management
- Late fee calculation (future enhancement)

## Future Enhancements

1. Late fee calculation
2. Installment plans
3. Fee reminders via SMS/Email
4. Online payment integration
5. Fee receipts generation
6. Refund management
7. Scholarship management
8. Fee concession workflows
