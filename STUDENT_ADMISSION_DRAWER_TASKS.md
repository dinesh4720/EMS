# Student Admission Drawer - Enhancement Tasks

## Overview
This document outlines all the improvements needed for the Student Admission drawer interface and the new Settings module for field configuration.

---

## 🎨 UI/UX Improvements

### Drawer Layout
- [ ] **Increase drawer width** for better content visibility
- [ ] **Adjust padding** in the middle content section
- [ ] **Replace dashed lines** with solid lines throughout the drawer
- [ ] **Fix duplicate close icons** - Only one close icon should be visible in the side panel

### Scroll Behavior
- [ ] **Auto-scroll to top** when clicking "Next" button between steps
- [ ] Ensure smooth scroll transition

---

## 📋 Step 1: Personal & Admission Information

### Field Organization
- [ ] **Reorder sections**: Personal Info should come before Admission Info
- [ ] Group fields logically within each section

### Photo Upload
- [ ] **Hide delete button** until a photo is actually uploaded
- [ ] **Change button text** from "Upload Photo" to "Change Photo" after upload
- [ ] Ensure photo preview displays correctly

### Personal Information Fields
- [ ] **DOB** - Mark as mandatory
- [ ] **Gender** - Mark as mandatory
- [ ] **Remove Medium field** (not required)
- [ ] **Remove House field** (not required)

### Admission Information Fields
- [ ] **Admission ID** - Implement auto-generation
  - Format should be configurable in Settings
  - Example formats: `ADM-2024-001`, `2024/ADM/001`, etc.
- [ ] **Roll Number** - Implement auto-fill functionality
  - Should be based on class/section
  - Allow manual override if needed

---

## 👨‍👩‍👧 Step 2: Parent/Guardian Information

### UI Components
- [ ] **Change "Add Another Parent" button** from filled to link button style
- [ ] **Update checkbox label** from "Same as WhatsApp" to "Same for WhatsApp" or similar logical text

### Parent/Guardian Selection
- [ ] **Add checkbox**: "Is this person a Parent or Guardian?"
  - If Parent: Show "Parent 1", "Parent 2"
  - If Guardian: Show "Guardian 1", "Guardian 2"
- [ ] Update all related labels dynamically based on selection

### Contact Fields
- [ ] **Remove Alternate Contact field** (redundant with "Add Another Parent")
  - OR if keeping it, add dropdown for "Relationship with Student"
- [ ] **Remove Emergency Contact Info section** (not required)

### Additional Requirements
- [ ] **Review "Additional Requirements" section**
  - Plan what information is actually needed
  - Remove if not essential

---

## 📄 Step 3: Document Upload

### Upload Functionality
- [ ] **Enable multiple file uploads** for each document type
  - OR implement separate uploads for Front & Back
- [ ] **Add supporting text** for "Other Documents" explaining what can be uploaded

### Document Configuration
- [ ] **Make document types configurable** in Settings
  - Admin can mark which documents are required
  - Admin can mark which documents are optional
- [ ] **Add mandatory/optional indicators** on each document field

### Document Management
- [ ] **Remove "Student Photograph"** field (already collected in Step 1)
- [ ] **Fix cancel button behavior**:
  - Should remove the attached document
  - Should return to upload state
  - Currently it's not removing the document properly

### Skip Functionality
- [ ] **Add "Skip & Upload Later" option**
  - Admin can skip document upload step
  - Student/Parent can upload documents later from their portal

---

## 🔧 Final Actions

### Form Submission
- [ ] **Fix "Add Student" button** - Currently not creating new students
- [ ] Ensure all validation works correctly
- [ ] Show success/error messages appropriately
- [ ] Clear form after successful submission

---

## ⚙️ Settings Module - Field Configuration

### New Settings Section: "Admission Form Configuration"

#### Student Fields Configuration
- [ ] Create UI for configuring student admission fields
- [ ] For each field, allow admin to set:
  - **Visible** (Show/Hide)
  - **Mandatory** (Required/Optional)
  - **Auto-generate** (For fields like Admission ID, Roll Number)
  - **Default Value** (If applicable)

#### Staff Fields Configuration
- [ ] Create UI for configuring staff onboarding fields
- [ ] Same configuration options as student fields

#### Document Configuration
- [ ] List all document types
- [ ] For each document:
  - **Required** (Yes/No)
  - **Optional** (Yes/No)
  - **Hidden** (Don't show)
  - **Upload Type** (Single/Multiple/Front-Back)
  - **Allowed Formats** (PDF, JPG, PNG, etc.)
  - **Max File Size**

#### Admission ID Configuration
- [ ] **Format Builder** for Admission ID
  - Prefix (e.g., "ADM", "STU")
  - Year format (YYYY, YY)
  - Separator (-, /, _)
  - Number padding (001, 0001)
  - Preview of generated format
- [ ] **Starting Number** configuration
- [ ] **Reset Options** (Yearly, Monthly, Never)

#### Roll Number Configuration
- [ ] **Auto-fill Rules**
  - Based on Class
  - Based on Section
  - Based on Admission Order
- [ ] **Format Configuration**
- [ ] **Allow Manual Override** (Yes/No)

---

## 📊 Implementation Priority

### Phase 1: Critical Fixes (High Priority)
1. Fix "Add Student" button functionality
2. Fix document cancel button behavior
3. Remove duplicate close icons
4. Make DOB & Gender mandatory

### Phase 2: UI/UX Improvements (High Priority)
1. Increase drawer width
2. Adjust padding
3. Replace dashed lines
4. Photo upload button text change
5. Reorder Personal/Admission info sections

### Phase 3: Field Management (Medium Priority)
1. Remove unnecessary fields (Medium, House, Alternate Contact, Emergency Contact)
2. Implement Admission ID auto-generation
3. Implement Roll Number auto-fill
4. Parent/Guardian checkbox and dynamic labels

### Phase 4: Document Management (Medium Priority)
1. Multiple file uploads
2. Document configuration in settings
3. Skip & upload later functionality
4. Add mandatory/optional indicators

### Phase 5: Settings Module (Medium Priority)
1. Create Admission Form Configuration section
2. Implement field visibility/mandatory toggles
3. Implement Admission ID format builder
4. Implement Roll Number configuration

### Phase 6: Polish & Testing (Low Priority)
1. Auto-scroll to top on step change
2. Button style changes
3. Supporting text for document uploads
4. Comprehensive testing of all features

---

## 🗂️ Files to Modify

### Frontend Files
- `school-dashboard/src/pages/students/StudentsList.jsx` - Main drawer component
- `school-dashboard/src/pages/settings/AdmissionFormSettings.jsx` - New settings page
- `school-dashboard/src/pages/settings/index.jsx` - Add new settings route
- `school-dashboard/src/services/api.js` - API calls for field configuration

### Backend Files
- `backend/server.js` - Add endpoints for field configuration
- `backend/database.js` - Add tables for field configuration and admission ID settings

---

## 💾 Database Schema Changes

### New Tables Needed

#### `admission_form_config`
```sql
- id
- field_name
- field_type (student/staff)
- is_visible
- is_mandatory
- auto_generate
- default_value
- field_order
- created_at
- updated_at
```

#### `admission_id_config`
```sql
- id
- prefix
- year_format
- separator
- number_padding
- starting_number
- current_number
- reset_frequency
- created_at
- updated_at
```

#### `document_config`
```sql
- id
- document_name
- is_required
- upload_type (single/multiple/front-back)
- allowed_formats
- max_file_size
- display_order
- created_at
- updated_at
```

---

## ✅ Testing Checklist

### Drawer Functionality
- [ ] Drawer opens and closes properly
- [ ] All three steps navigate correctly
- [ ] Form validation works on each step
- [ ] Photo upload/change/delete works
- [ ] Document upload/cancel works
- [ ] Add Student button creates student successfully

### Settings Configuration
- [ ] Field visibility toggles work
- [ ] Mandatory field settings are enforced
- [ ] Admission ID generates correctly with configured format
- [ ] Roll Number auto-fills correctly
- [ ] Document configuration reflects in drawer

### Data Persistence
- [ ] Settings are saved correctly
- [ ] Settings persist after page refresh
- [ ] Student data saves with correct field values
- [ ] Auto-generated IDs are unique and sequential

---

## 📝 Notes

- All changes should maintain backward compatibility
- Existing student records should not be affected
- Settings should have sensible defaults
- Consider multi-language support for labels
- Ensure mobile responsiveness for drawer
- Add proper error handling and user feedback

---

**Created:** January 1, 2026  
**Status:** Planning Phase  
**Priority:** High
