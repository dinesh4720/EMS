# 🧪 Manual UI Testing Checklist

## 📋 Pre-Test Setup

### Step 1: Start Backend Server

```bash
# Terminal 1
cd backend
npm start
```

**Expected output:**
```
✅ MongoDB connected successfully
Server running on port 3001
✅ Chat handlers initialized
✅ All routes mounted
```

---

### Step 2: Start Frontend Server

```bash
# Terminal 2 (new terminal)
cd school-dashboard
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### Step 3: Open Application

Open browser and go to: **http://localhost:5173**

---

## 🎯 TEST 1: STUDENT CREATION

### Steps:

1. **Login** (if required)
   - Use your admin credentials

2. **Navigate to Students**
   - Click "Students" in sidebar
   - Click "Add Student" button

3. **Step 1: Personal Information**
   
   Fill in these fields:
   - [x] Full Name: `UI Test Student`
   - [x] Date of Birth: `01/01/2010`
   - [x] Gender: Select `Male`
   - [x] Admission ID: Auto-generated
   - [x] Class: Select any class
   - [x] Roll Number: Auto-generated
   - [x] **Aadhaar Number:** `123456789012` ⭐ NEW FIELD
   - [x] Blood Group: `A+`
   - [x] Nationality: `Indian`
   - [x] Religion: `Hindu`
   - [x] Category: `General`
   - [x] Mother Tongue: `Hindi`
   - [x] Previous School: `Test School`
   - [x] TC Number: `TC123`
   - [x] Mobile: `9876543210`
   - [x] Email: `test@student.com`
   - [x] Address: `123 Test Street`
   
   **Upload Photo:**
   - [x] Click "Upload Photo"
   - [x] Select an image file
   - [x] Crop if needed
   - [x] Watch console for: `📸 Uploading photo...` then `✅ Photo uploaded`

4. **Step 2: Parent/Guardian Information**
   
   Add Primary Parent:
   - [x] Full Name: `Test Parent`
   - [x] Relationship: `Father`
   - [x] Phone: `9876543211`
   - [x] Email: `parent@test.com`
   - [x] Occupation: `Engineer`
   
   Add Second Parent:
   - [x] Click "+ Add Another Parent"
   - [x] Fill mother's details
   - [x] Verify both parents shown

5. **Step 3: Additional Info**
   
   - [x] Medical Conditions: `None`
   - [x] Emergency Contact: `Test Emergency`
   - [x] Emergency Phone: `9876543212`
   - [x] Transport Required: `No`
   - [x] Hostel Required: `No`

6. **Submit**
   
   - [x] Click "Submit" or "Save"
   - [x] Watch for success toast
   - [x] Student appears in list

---

## ✅ VERIFICATION: Student Data

### Check in Browser:

1. Find the created student in the list
2. Click to view profile
3. Verify all fields are displayed

### Check in MongoDB:

```bash
mongosh school_db

# Find the student
db.students.findOne({ name: "UI Test Student" })

# Check specific new fields
db.students.findOne(
  { name: "UI Test Student" },
  { 
    aadhaarNumber: 1,
    mediumOfInstruction: 1,
    house: 1,
    parents: 1,
    photo: 1
  }
)
```

### Expected Results:
```javascript
{
  _id: ObjectId("..."),
  name: "UI Test Student",
  aadhaarNumber: "123456789012",  // ⭐ NEW FIELD STORED
  mediumOfInstruction: "English",  // ⭐ NEW FIELD STORED
  house: "Red House",              // ⭐ NEW FIELD STORED
  parents: [                        // ⭐ ARRAY WITH BOTH PARENTS
    { name: "Test Parent", relationship: "Father", ... },
    { name: "Test Mother", relationship: "Mother", ... }
  ],
  photo: "https://res.cloudinary.com/...", // ⭐ CLOUDINARY URL
  // ... other fields
}
```

### Check Console Logs:

Look for these messages in browser console (F12):
```
📸 Uploading photo to Cloudinary...
✅ Photo uploaded: https://res.cloudinary.com/...
Submitting student data: { ... }
```

---

## 🎯 TEST 2: STAFF CREATION

### Steps:

1. **Navigate to Staff**
   - Click "Staffs" in sidebar
   - Click "Add Staff" button

2. **Step 1: Personal Information**
   
   - [x] Employment Type: Select `Full-Time`
   - [x] Full Name: `UI Test Staff`
   - [x] Date of Birth: Select date
   - [x] Gender: `Male`
   - [x] Father's Name: `Staff Father`
   - [x] Marital Status: `Single`
   - [x] Mobile: `9876543220`
   - [x] WhatsApp: Check "Same as mobile"
   - [x] Email: `teststaff@school.com`
   - [x] Address: `456 Staff Street`
   
   **Upload Photo:**
   - [x] Click "Upload Photo"
   - [x] Select image
   - [x] Watch console: `📸 Uploading staff photo...`
   - [x] Verify: `✅ Staff photo uploaded`
   
   **Add Emergency Contacts:** ⭐ NEW FEATURE
   - [x] Contact 1: Name, Relationship, Phone
   - [x] Click "Add Contact"
   - [x] Contact 2: Fill details
   - [x] Verify both contacts shown

3. **Step 2: Job Details & Education**
   
   - [x] Staff Role: `Teaching`
   - [x] Staff ID: Auto-generated
   - [x] Department: `Mathematics`
   - [x] Assign Classes: Select classes
   - [x] Class Teacher: Toggle ON
   - [x] Select class for class teacher
   
   **Add Qualifications:** (Mandatory)
   - [x] Click "Add Degree"
   - [x] Degree: `B.Ed`
   - [x] Year: `2015`
   - [x] Click "Upload Certificate"
   - [x] Select PDF file
   - [x] Watch console: `✅ Qualification doc uploaded`
   - [x] Verify file name shown
   
   **Add Experience:**
   - [x] Previous Organization: `Test School`
   - [x] Role/Designation: `Senior Teacher` ⭐ NEW FIELD
   - [x] Experience (Years): `5`

4. **Step 3: Documents**
   
   **Upload ID Documents:** ⭐ TESTING FILE UPLOADS
   - [x] Aadhar Card: Upload file → `✅ Aadhar Card uploaded`
   - [x] PAN Card: Upload file → `✅ PAN Card uploaded`
   - [x] Driving License: Upload file (optional)
   
   **Other Certificates:**
   - [x] Click upload area
   - [x] Select multiple files
   - [x] Watch console for upload logs
   - [x] Verify file chips appear

5. **Step 4: Bank & Salary**
   
   - [x] Account Number: `1234567890`
   - [x] IFSC Code: `TEST0001234`
   - [x] Bank Name: `Test Bank`
   - [x] Branch: `Test Branch`
   - [x] Load salary template (optional)
   - [x] Add salary components

6. **Submit**
   
   - [x] Click "Submit"
   - [x] Watch console logs for uploads
   - [x] Verify success toast
   - [x] Staff appears in list

---

## ✅ VERIFICATION: Staff Data

### Check in Browser:

1. Find staff in list: `UI Test Staff`
2. Click to view profile
3. Verify all fields displayed
4. Check emergency contacts shown
5. Check documents uploaded

### Check Console Logs:

Look for these in browser console:
```
📸 Uploading staff photo to Cloudinary...
✅ Staff photo uploaded: https://res.cloudinary.com/...
✅ Aadhar Card uploaded: https://res.cloudinary.com/...
✅ PAN Card uploaded: https://res.cloudinary.com/...
✅ Qualification doc uploaded: https://res.cloudinary.com/...
Submitting staff data: { ... }
```

### Check in MongoDB:

```bash
mongosh school_db

# Find the staff
db.staffs.findOne({ name: "UI Test Staff" })

# Check specific new fields
db.staffs.findOne(
  { name: "UI Test Staff" },
  {
    emergencyContacts: 1,
    roleInOrganization: 1,
    customDocuments: 1,
    picture: 1,
    idDocuments: 1,
    professionalQualifications: 1
  }
)
```

### Expected Results:
```javascript
{
  _id: ObjectId("..."),
  name: "UI Test Staff",
  emergencyContacts: [              // ⭐ NEW ARRAY
    { 
      name: "Contact 1", 
      relationship: "Spouse", 
      phone: "9876543221" 
    },
    { 
      name: "Contact 2", 
      relationship: "Parent", 
      phone: "9876543222" 
    }
  ],
  roleInOrganization: "Senior Teacher", // ⭐ NEW FIELD
  customDocuments: [                 // ⭐ NEW ARRAY
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ],
  picture: "https://res.cloudinary.com/...", // ⭐ URL NOT FILE
  idDocuments: [                     // ⭐ ARRAY OF URLS
    "https://res.cloudinary.com/.../aadhaar.pdf",
    "https://res.cloudinary.com/.../pan.pdf"
  ],
  professionalQualifications: [
    {
      name: "B.Ed",
      year: "2015",
      documents: [                   // ⭐ URLS NOT FILES
        "https://res.cloudinary.com/.../cert.pdf"
      ]
    }
  ],
  password: "$2b$10$...",            // ⭐ HASHED
  // ... other fields
}
```

---

## 🔍 CRITICAL CHECKS

### ✅ File Upload Verification

**In Browser Console (F12):**
```
✅ Should see: "Uploading..."
✅ Should see: "uploaded: https://res.cloudinary.com/..."
❌ Should NOT see: "File" or "Blob" objects
❌ Should NOT see: Upload errors
```

**In MongoDB:**
```javascript
// All these should be URLs starting with https://
picture: "https://res.cloudinary.com/..."
idDocuments: ["https://...", "https://..."]
customDocuments: ["https://...", "https://..."]
professionalQualifications[0].documents: ["https://..."]

// NOT like this (wrong):
picture: { name: "file.jpg", size: 123, ... } ❌
idDocuments: [File, File] ❌
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: Photo not uploading
**Symptoms:** No console logs, or upload error

**Check:**
```bash
# Verify Cloudinary credentials in backend/.env
cat backend/.env | grep CLOUDINARY

# Should have:
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

**Fix:** Add missing credentials and restart backend

---

### Issue 2: Field not saving
**Symptoms:** Field filled in UI but empty in database

**Check:**
1. Field name in UI matches schema
2. `handleSubmit` includes the field
3. Backend route accepts the field

**Debug:**
```javascript
// In browser console, check submitted data
console.log('Submitting:', studentData);
// All fields should be present
```

---

### Issue 3: Emergency contacts not appearing
**Symptoms:** Array is empty or shows only one

**Check MongoDB:**
```javascript
db.staffs.findOne(
  { name: "UI Test Staff" },
  { emergencyContacts: 1 }
)

// Should show array with multiple objects
```

**If empty:** Check UI code sends `emergencyContacts` array

---

## 📊 SUCCESS CRITERIA

### ✅ Student Creation Success:
- [ ] Form submits without errors
- [ ] Success toast appears
- [ ] Student in list
- [ ] Photo is Cloudinary URL
- [ ] Aadhaar number saved
- [ ] Both parents saved
- [ ] All fields in MongoDB

### ✅ Staff Creation Success:
- [ ] Form submits without errors
- [ ] All files upload to Cloudinary
- [ ] Console shows upload logs
- [ ] Success toast appears
- [ ] Staff in list
- [ ] 2+ emergency contacts saved
- [ ] Role in organization saved
- [ ] All documents are URLs
- [ ] Password is hashed
- [ ] All fields in MongoDB

---

## 📸 SCREENSHOT CHECKLIST

Take screenshots of:
1. [ ] Student form filled out
2. [ ] Student photo upload success
3. [ ] Student list with new student
4. [ ] Staff form with emergency contacts
5. [ ] Staff document uploads
6. [ ] Console logs showing Cloudinary uploads
7. [ ] MongoDB student document
8. [ ] MongoDB staff document

---

## 🎯 FINAL VERIFICATION

After testing both student and staff creation:

```bash
# Count test records
mongosh school_db
db.students.countDocuments({ name: /UI Test/ })
db.staffs.countDocuments({ name: /UI Test/ })

# Verify Cloudinary URLs
db.students.find(
  { name: /UI Test/ },
  { photo: 1, name: 1 }
)

db.staffs.find(
  { name: /UI Test/ },
  { picture: 1, idDocuments: 1, name: 1 }
)

# All URLs should start with: https://res.cloudinary.com/
```

---

## 🧹 CLEANUP AFTER TESTING

```bash
mongosh school_db

# Delete test students
db.students.deleteMany({ name: /UI Test/ })

# Delete test staff
db.staffs.deleteMany({ name: /UI Test/ })

# Verify cleanup
db.students.countDocuments({ name: /UI Test/ })  // Should be 0
db.staffs.countDocuments({ name: /UI Test/ })    // Should be 0
```

---

## ✅ TEST COMPLETION CHECKLIST

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Logged into application
- [ ] Created test student
- [ ] Verified student data in MongoDB
- [ ] Created test staff
- [ ] Verified staff data in MongoDB
- [ ] All files uploaded to Cloudinary
- [ ] No console errors
- [ ] All new fields working
- [ ] Screenshots taken
- [ ] Test data cleaned up

---

**Ready to start? Let me know when you're ready to begin testing!** 🚀

*Or would you like me to:*
- Start the servers for you?
- Create a quick video guide?
- Test something specific first?
