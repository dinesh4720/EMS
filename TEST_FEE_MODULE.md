# Quick Test Guide - Fee Module

## 🚀 Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm start
```
**Expected Output:**
```
Connected to MongoDB
Server running on http://localhost:3001
```

### Terminal 2 - Frontend
```bash
cd school-dashboard
npm run dev
```
**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

---

## ✅ Test Checklist

### Test 1: Defaulters Page
1. Open http://localhost:5174
2. Click "Fees" in sidebar
3. Click "Defaulters" button (top right)
4. **Expected**: See list of students with pending fees
5. **Check Console**: Should see "Found X active students for defaulters check"

**✅ PASS**: List shows students with pending amounts
**❌ FAIL**: Empty list or error message

---

### Test 2: Payment Collection
1. Go to Fees → Payments tab
2. Find a student with "Pending" status
3. Click "Collect" button
4. Select one or more fee heads
5. Choose payment mode (Cash/Cheque/Online)
6. Click "Collect ₹X,XXX"
7. **Expected**: 
   - Receipt modal appears
   - Student's pending amount decreases
   - If fully paid, status changes to "Paid"

**✅ PASS**: Payment recorded, status updated, data refreshed
**❌ FAIL**: Status doesn't update or error occurs

---

### Test 3: Send Reminder (Bell Icon)
1. Go to Fees → Payments or Defaulters
2. Click the bell icon 🔔 next to any student
3. **Expected**: Alert shows "Reminder will be sent to [Student] at [Phone]"

**✅ PASS**: Alert appears with student info
**❌ FAIL**: Nothing happens or error

---

### Test 4: Export to CSV
1. Go to Fees → Payments
2. Click "Export" button (top right)
3. **Expected**: CSV file downloads automatically
4. Open the CSV file
5. **Expected**: Contains student data in proper format

**✅ PASS**: CSV downloads with correct data
**❌ FAIL**: Nothing happens or file is empty

---

### Test 5: Defaulters Export
1. Go to Fees → Defaulters
2. Click "Export" button
3. **Expected**: CSV file downloads with defaulters data

**✅ PASS**: CSV downloads with defaulter info
**❌ FAIL**: Nothing happens

---

## 🔍 Debugging

### Check Backend Logs
Look for these messages in backend terminal:
```
Found 50 active students for defaulters check
Returning 15 defaulters
Payment created: RCP-2024-001, Total paid: 5000, Pending: 55000
```

### Check Browser Console (F12)
Look for these messages:
```
Students loaded: 50
Payments loaded: 25
Defaulters loaded: 15
```

### Check Network Tab (F12 → Network)
Filter by "Fetch/XHR" and look for:
- `/api/students` → Status 200
- `/api/fees/payments` → Status 200
- `/api/fees/defaulters` → Status 200

---

## 🐛 Common Issues

### Issue: "Failed to load data"
**Solution**: 
- Check if backend is running
- Check `.env` file has correct `VITE_API_URL`
- Check CORS settings in `backend/server.js`

### Issue: Defaulters list is empty
**Solution**:
- Check backend logs for "Found X active students"
- Verify students exist in database
- Check if students have payments recorded

### Issue: Payment doesn't update status
**Solution**:
- Check backend logs for "Payment created" message
- Verify calculation: totalPaid vs totalAnnualFee
- Check if frontend refreshes after payment

### Issue: Export doesn't work
**Solution**:
- Check browser console for errors
- Verify data exists in filteredPayments/filteredDefaulters
- Check browser's download settings

---

## 📊 Sample Test Data

### Create Test Student with Pending Fees
```javascript
// In MongoDB or via API
{
  name: "Test Student",
  admissionId: "TEST001",
  rollNo: 99,
  classId: "existing_class_id",
  status: "active",
  feeStatus: "pending",
  parentPhone: "9999999999"
}
```

### Create Test Payment
```javascript
// POST /api/fees/payments
{
  studentId: "test_student_id",
  classId: "test_class_id",
  paymentDate: "2024-12-29",
  amount: 5000,
  paymentMode: "cash",
  feeHeads: [
    { name: "Tuition Fee", amount: 5000, month: "December 2024" }
  ]
}
```

---

## 📝 Test Scenarios

### Scenario 1: Partial Payment
1. Student owes ₹60,000
2. Collect ₹20,000
3. **Expected**: Pending = ₹40,000, Status = "Pending"

### Scenario 2: Full Payment
1. Student owes ₹60,000
2. Collect ₹60,000
3. **Expected**: Pending = ₹0, Status = "Paid"

### Scenario 3: Multiple Payments
1. Student owes ₹60,000
2. Collect ₹20,000 (Pending = ₹40,000)
3. Collect ₹20,000 (Pending = ₹20,000)
4. Collect ₹20,000 (Pending = ₹0, Status = "Paid")

### Scenario 4: Filter Defaulters
1. Go to Defaulters page
2. Click ">7 Days" filter
3. **Expected**: Only shows defaulters overdue by 7+ days

### Scenario 5: Search and Export
1. Go to Payments page
2. Search for "Rahul"
3. Click Export
4. **Expected**: CSV contains only filtered results

---

## ✨ Success Criteria

All tests pass when:
- ✅ Defaulters page shows accurate list
- ✅ Payment collection updates status correctly
- ✅ Frontend refreshes after payment
- ✅ Bell icon shows confirmation
- ✅ Export downloads CSV files
- ✅ No console errors
- ✅ Backend logs show correct calculations
- ✅ Data persists after page refresh

---

## 📞 Need Help?

If tests fail, provide:
1. Screenshot of error in browser console
2. Backend terminal output
3. Network tab showing failed requests
4. Which test failed and what happened

Check these files for details:
- `FEE_MODULE_FIXES.md` - Technical details
- `FEE_MODULE_BEFORE_AFTER.md` - Visual comparisons
- `TROUBLESHOOTING_FEES.md` - Connection issues
