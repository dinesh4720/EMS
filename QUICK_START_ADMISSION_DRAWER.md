# Quick Start Guide - Student Admission Drawer

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd backend
npm install
node server.js
```

### 2. Start the Frontend
```bash
cd school-dashboard
npm install
npm run dev
```

### 3. Configure Settings (First Time)
1. Navigate to **Settings → Admission Form**
2. Configure your Admission ID format
3. Add document requirements
4. Save configuration

---

## 📝 Adding a New Student

### Step 1: Open the Drawer
1. Go to **Students** page
2. Click **"New Student"** button
3. Drawer opens with 3 steps

### Step 2: Fill Personal Information
**Required Fields:**
- Full Name ✅
- Admission ID (auto-generated) ✅
- Date of Birth ✅
- Gender ✅
- Class ✅

**Optional Fields:**
- Photo (Upload/Change/Delete)
- Roll Number
- Contact details
- Address
- Other personal info

### Step 3: Add Parent/Guardian
**Required:**
- Parent Name ✅
- Parent Phone ✅

**Optional:**
- Relationship
- Email
- Occupation
- Additional parents (up to 3)

### Step 4: Upload Documents
**All Optional:**
- Birth Certificate
- Transfer Certificate
- Aadhaar Card
- Other Documents (multiple files)

### Step 5: Submit
- Click **"Add Student"** button
- Student is created with auto-generated ID
- Drawer closes automatically

---

## ⚙️ Settings Configuration

### Admission ID Format

**Example Configurations:**

1. **Standard Format:** `ADM-2024-0001`
   - Prefix: `ADM`
   - Year Format: `YYYY`
   - Separator: `-`
   - Padding: `4`

2. **Short Format:** `STU/24/001`
   - Prefix: `STU`
   - Year Format: `YY`
   - Separator: `/`
   - Padding: `3`

3. **Simple Format:** `ADM0001`
   - Prefix: `ADM`
   - Year Format: `none`
   - Separator: `none`
   - Padding: `4`

### Document Configuration

**Example Documents:**

1. **Birth Certificate**
   - Required: Yes
   - Upload Type: Single
   - Max Size: 5 MB
   - Formats: PDF, JPG, PNG

2. **Transfer Certificate**
   - Required: No
   - Upload Type: Single
   - Max Size: 5 MB

3. **Aadhaar Card**
   - Required: No
   - Upload Type: Front-Back
   - Max Size: 5 MB

4. **Other Documents**
   - Required: No
   - Upload Type: Multiple
   - Max Size: 5 MB

---

## 🎨 UI Features

### Drawer
- **Width:** 900px (xl size)
- **Solid borders** throughout
- **Auto-scroll** between steps
- **Single close icon** in header

### Photo Upload
- Shows "Upload Photo" initially
- Changes to "Change Photo" after upload
- Delete button only visible when photo exists

### Validation
- DOB and Gender are mandatory
- Parent name and phone required
- Clear error messages
- Required field indicators (*)

### Navigation
- **Cancel/Back** button on left
- **Continue** button on right (Steps 1-2)
- **Add Student** button on right (Step 3)
- Auto-scroll to top on step change

---

## 🔧 API Endpoints

### Admission Configuration
```
GET    /api/settings/admission-id-config
PUT    /api/settings/admission-id-config
POST   /api/settings/admission-id-config/preview

GET    /api/settings/document-config
POST   /api/settings/document-config
PUT    /api/settings/document-config/:id
DELETE /api/settings/document-config/:id

GET    /api/students/next-admission-id
```

### Usage Example
```javascript
// Get next admission ID
const response = await studentsApi.getNextAdmissionId();
console.log(response.admissionId); // "ADM-2024-0001"

// Get document configuration
const docs = await settingsApi.getDocumentConfig();
console.log(docs); // Array of document configs
```

---

## 🐛 Troubleshooting

### Admission ID Not Auto-Generating
1. Check backend is running
2. Verify API endpoint: `GET /api/students/next-admission-id`
3. Check browser console for errors
4. Ensure settings are configured

### Documents Not Loading
1. Check settings configuration
2. Verify API endpoint: `GET /api/settings/document-config`
3. Check browser console for errors

### Drawer Not Opening
1. Check for JavaScript errors
2. Verify drawer state management
3. Check button click handler

### Form Not Submitting
1. Check validation errors
2. Verify all required fields filled
3. Check API endpoint: `POST /api/students`
4. Check browser console for errors

---

## 📱 Mobile Responsiveness

The drawer is optimized for desktop use. For mobile:
- Drawer takes full width
- Form fields stack vertically
- Touch-friendly buttons
- Scrollable content

---

## 🎯 Best Practices

### For Admins
1. Configure settings before adding students
2. Use consistent admission ID format
3. Mark essential documents as required
4. Review student data before submission

### For Developers
1. Always validate on both client and server
2. Handle API errors gracefully
3. Show loading states during API calls
4. Test with various data inputs

---

## 📚 Related Documentation

- `STUDENT_ADMISSION_DRAWER_TASKS.md` - Original requirements
- `STUDENT_ADMISSION_IMPLEMENTATION_STATUS.md` - Implementation details
- `FINAL_IMPLEMENTATION_COMPLETE.md` - Complete feature list
- `IMPLEMENTATION_COMPLETE_SUMMARY.md` - Summary and statistics

---

## 🆘 Support

For issues or questions:
1. Check documentation files
2. Review browser console for errors
3. Verify backend is running
4. Check API responses
5. Review implementation status document

---

**Version:** 1.0.0  
**Last Updated:** January 1, 2026  
**Status:** Production Ready
