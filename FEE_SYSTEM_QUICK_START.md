# Fee Management System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Start the Backend
```bash
cd backend
npm start
```
Backend will run on `http://localhost:3001`

### Step 2: Start the Frontend
```bash
cd school-dashboard
npm run dev
```
Frontend will run on `http://localhost:5173`

## 📋 Quick Setup (5 Minutes)

### 1. Create Fee Heads for Classes 1-12

Go to **Settings > Fee Heads** and create these fee heads:

#### Example 1: Tuition Fee (All Classes)
- **Name**: Tuition Fee
- **Category**: Academic
- **Amount**: ₹50,000
- **Applicable Classes**: Select All (1-12)
- **Frequency**: Yearly
- **Mandatory**: Yes
- **Auto-Apply**: Yes

#### Example 2: Transport Fee (All Classes)
- **Name**: Transport Fee
- **Category**: Transport
- **Amount**: ₹12,000
- **Applicable Classes**: Select All (1-12)
- **Frequency**: Yearly
- **Mandatory**: No
- **Auto-Apply**: Yes

#### Example 3: Lab Fee (Classes 9-12 only)
- **Name**: Lab Fee
- **Category**: Academic
- **Amount**: ₹8,000
- **Applicable Classes**: 9, 10, 11, 12
- **Frequency**: Yearly
- **Mandatory**: Yes
- **Auto-Apply**: Yes

#### Example 4: Sports Fee (All Classes)
- **Name**: Sports Fee
- **Category**: Extra-curricular
- **Amount**: ₹3,000
- **Applicable Classes**: Select All (1-12)
- **Frequency**: Yearly
- **Mandatory**: Yes
- **Auto-Apply**: Yes

### 2. Add Students

When you add a student to any class:
- Go to **Students > Add Student**
- Fill in student details
- Select their class (e.g., Class 10-A)
- Save

**The system automatically:**
- Finds all fee heads for Class 10
- Creates a fee structure for the student
- Assigns all applicable fees
- Calculates total fees

### 3. View Student Fees

To see a student's fee structure:
```
GET /api/student-fees/student/:studentId
```

Or use the frontend:
- Go to **Students > [Student Name]**
- Click on "Fees" tab
- See all assigned fee heads
- See payment status

## 🎯 What Happens Automatically

### When You Create a Fee Head
1. Fee head is saved to database
2. System finds all students in applicable classes
3. Fee head is added to each student's fee structure
4. Totals are recalculated

### When You Add a Student
1. Student is saved to database
2. System finds all fee heads for their class
3. Fee structure is created with all applicable fees
4. Student is ready for fee collection

### When You Update a Fee Head
1. Fee head is updated in database
2. All students with this fee head are updated
3. Amounts and details are synchronized
4. Totals are recalculated

## 📊 Example Scenario

### Scenario: Setting up fees for a new academic year

**Classes in School**: 1 to 12

**Fee Structure**:
- Tuition Fee: ₹50,000 (All classes)
- Transport Fee: ₹12,000 (Optional, All classes)
- Lab Fee: ₹8,000 (Classes 9-12 only)
- Computer Fee: ₹5,000 (Classes 6-12 only)
- Sports Fee: ₹3,000 (All classes)
- Library Fee: ₹2,000 (All classes)

**Steps**:

1. **Create 6 Fee Heads** (5 minutes)
   - Each with appropriate classes selected
   - Set mandatory/optional as needed

2. **Add Students** (ongoing)
   - Add students to their respective classes
   - Fees are automatically assigned

3. **Result**:
   - Class 1 student gets: Tuition + Sports + Library = ₹55,000
   - Class 10 student gets: Tuition + Lab + Computer + Sports + Library = ₹68,000
   - Plus optional Transport if needed

## 🔍 Verification

### Check Fee Heads
```bash
curl http://localhost:3001/api/fee-heads
```

### Check Student Fee Structure
```bash
curl http://localhost:3001/api/student-fees/student/STUDENT_ID
```

### Check All Students with Fees
```bash
curl http://localhost:3001/api/student-fees/all
```

## 💡 Pro Tips

1. **Use "Select All" for common fees** like Tuition and Sports that apply to all classes

2. **Use specific classes** for specialized fees like Lab Fee (9-12) or Kindergarten Fee (1-2)

3. **Enable Auto-Apply** to automatically assign fees to existing and new students

4. **Use Categories** to organize fees (Academic, Transport, Extra-curricular, etc.)

5. **Set Frequency** appropriately (Yearly for annual fees, Monthly for recurring fees)

## 🎨 Frontend Features

### Fee Heads Settings Page
- **Location**: Settings > Fee Heads
- **Features**:
  - Create/Edit/Delete fee heads
  - View all fee heads in a table
  - See applicable classes
  - Apply to students manually
  - Filter and search

### Student Fee View
- **Location**: Students > [Student] > Fees
- **Features**:
  - View all assigned fee heads
  - See payment status
  - Track balance
  - Apply discounts
  - Record payments

## 🔧 API Reference

### Create Fee Head
```javascript
POST /api/fee-heads
{
  "name": "Tuition Fee",
  "category": "Academic",
  "amount": 50000,
  "applicableClasses": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  "frequency": "yearly",
  "mandatory": true,
  "autoApply": true
}
```

### Initialize Student Fees
```javascript
POST /api/student-fees/initialize/:studentId
{
  "academicYear": "2024-25"
}
```

### Record Payment
```javascript
POST /api/student-fees/student/:studentId/payment
{
  "amount": 10000,
  "feeHeadPayments": [
    {
      "feeHeadId": "fee123",
      "amount": 10000
    }
  ]
}
```

## ✅ Testing Checklist

- [ ] Create fee heads for all classes
- [ ] Add a student to Class 1
- [ ] Verify student has correct fees assigned
- [ ] Add a student to Class 10
- [ ] Verify student has correct fees (including Lab Fee)
- [ ] Update a fee head amount
- [ ] Verify all students' fees are updated
- [ ] Delete a fee head
- [ ] Verify it's removed from all students
- [ ] Apply discount to a student
- [ ] Record a payment
- [ ] Check fee defaulters list

## 🎉 You're Ready!

Your fee management system is now set up and ready to use. Students will automatically get the correct fees based on their class, and you can manage everything from one central location.

## 📞 Need Help?

Check the detailed documentation in `FEE_MANAGEMENT_SYSTEM.md` for more information about:
- Database structure
- API endpoints
- Advanced features
- Troubleshooting
