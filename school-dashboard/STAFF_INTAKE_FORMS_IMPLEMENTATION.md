# Staff Intake Forms - Complete Implementation Plan

## Overview
Transform the existing Intake Forms feature into a complete staff onboarding workflow where admins create forms, send them to new teachers via the Teacher App, review submissions, and auto-populate staff records upon approval.

## Current State
- ✅ Intake Forms Settings page exists with form builder
- ✅ Basic form field types (text, email, phone, date, dropdown, file upload)
- ✅ Add Staff drawer with manual data entry
- ❌ No form assignment/distribution system
- ❌ No Teacher App integration
- ❌ No submission review workflow
- ❌ No approval → auto-populate mechanism

---

## Phase 1: Backend Infrastructure

### 1.1 Database Schema Updates
**File:** `backend/database.js`

```sql
-- Intake Forms table
CREATE TABLE intake_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_name TEXT NOT NULL,
  form_type TEXT DEFAULT 'staff', -- 'staff', 'student', 'parent'
  fields JSON NOT NULL, -- Array of field definitions
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form Assignments table
CREATE TABLE form_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL,
  assigned_to_email TEXT,
  assigned_to_phone TEXT,
  assigned_by INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'approved', 'rejected'
  access_token TEXT UNIQUE, -- Unique token for Teacher App access
  expires_at DATETIME,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES intake_forms(id)
);

-- Form Submissions table
CREATE TABLE form_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  form_id INTEGER NOT NULL,
  submission_data JSON NOT NULL, -- All form field responses
  submitted_by_email TEXT,
  submitted_by_phone TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  review_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  review_notes TEXT,
  staff_id INTEGER, -- Populated after approval
  FOREIGN KEY (assignment_id) REFERENCES form_assignments(id),
  FOREIGN KEY (form_id) REFERENCES intake_forms(id),
  FOREIGN KEY (staff_id) REFERENCES staffs(id)
);

-- Notifications table (for Teacher App)
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT,
  user_phone TEXT,
  notification_type TEXT, -- 'form_assignment', 'form_reminder', 'form_approved'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSON, -- Additional data (form_id, assignment_id, etc.)
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Tasks:**
- [ ] Add all new tables to database.js
- [ ] Create migration script for existing databases
- [ ] Add indexes for performance (email, phone, access_token)

### 1.2 API Endpoints - Intake Forms Management
**File:** `backend/server.js`

#### Forms CRUD
- [ ] `POST /api/intake-forms` - Create new intake form
- [ ] `GET /api/intake-forms` - List all forms (with filters)
- [ ] `GET /api/intake-forms/:id` - Get single form
- [ ] `PUT /api/intake-forms/:id` - Update form
- [ ] `DELETE /api/intake-forms/:id` - Delete/archive form
- [ ] `POST /api/intake-forms/:id/duplicate` - Duplicate existing form

#### Form Assignment
- [ ] `POST /api/intake-forms/:id/assign` - Assign form to teacher(s)
  - Input: `{ emails: [], phones: [], expiresInDays: 30 }`
  - Generate unique access tokens
  - Send notifications
  - Return assignment details
- [ ] `GET /api/form-assignments` - List all assignments (with filters)
- [ ] `GET /api/form-assignments/:id` - Get assignment details
- [ ] `PUT /api/form-assignments/:id/resend` - Resend notification
- [ ] `DELETE /api/form-assignments/:id` - Cancel assignment

#### Form Submissions
- [ ] `GET /api/form-submissions` - List all submissions (with filters)
- [ ] `GET /api/form-submissions/:id` - Get submission details
- [ ] `PUT /api/form-submissions/:id/review` - Approve/reject submission
  - Input: `{ status: 'approved'|'rejected', notes: '' }`
  - If approved: auto-create staff record
  - Send notification to teacher
- [ ] `DELETE /api/form-submissions/:id` - Delete submission

#### Notifications
- [ ] `GET /api/notifications` - Get notifications for user (email/phone)
- [ ] `PUT /api/notifications/:id/read` - Mark as read
- [ ] `PUT /api/notifications/read-all` - Mark all as read

### 1.3 Teacher App API Endpoints
**File:** `backend/server.js`

#### Public/Token-based Access (No auth required, uses access_token)
- [ ] `GET /api/public/form-assignment/:token` - Get form by access token
  - Validate token not expired
  - Return form fields and assignment details
- [ ] `POST /api/public/form-submission/:token` - Submit form
  - Validate token
  - Save submission
  - Update assignment status
  - Create notification for admin
  - Return success message
- [ ] `GET /api/public/form-submission/:token/status` - Check submission status

### 1.4 File Upload Handling
- [ ] Configure multer for file uploads
- [ ] Create uploads directory structure: `/uploads/intake-forms/:submission_id/`
- [ ] Add file validation (size, type)
- [ ] Store file paths in submission_data JSON
- [ ] Add endpoint: `POST /api/upload/intake-form/:token` - Upload files during form fill

---

## Phase 2: Dashboard - Intake Forms Management

### 2.1 Enhanced Intake Forms Settings
**File:** `school-dashboard/src/pages/settings/IntakeFormsSettings.jsx`

**Current Features:**
- ✅ Form builder with field types
- ✅ Add/edit/delete fields
- ✅ Save form

**New Features to Add:**
- [ ] **Form Templates**
  - Pre-built "Staff Onboarding" template with all fields from Add Staff drawer
  - Pre-built "Student Admission" template
  - "Start from Blank" option
  
- [ ] **Form List View**
  - Table showing all created forms
  - Columns: Name, Type, Fields Count, Assignments, Submissions, Status, Actions
  - Filter by type and status
  - Search by name
  
- [ ] **Form Actions**
  - Edit form
  - Duplicate form
  - Archive/Activate form
  - View assignments
  - View submissions
  - Assign form (opens assignment modal)
  
- [ ] **Assignment Modal**
  - Input: Email addresses (comma-separated or one per line)
  - Input: Phone numbers (comma-separated or one per line)
  - Expiry date picker (default 30 days)
  - Preview message that will be sent
  - Send button
  
- [ ] **Field Mapping Configuration**
  - Map form fields to staff table columns
  - Used during auto-populate on approval
  - Example: "Full Name" field → `first_name` + `last_name` columns

### 2.2 Form Assignments Page (New)
**File:** `school-dashboard/src/pages/intake-forms/FormAssignments.jsx`

- [ ] Create new page component
- [ ] Add route: `/intake-forms/assignments`
- [ ] **Features:**
  - Table of all assignments
  - Columns: Form Name, Assigned To, Assigned By, Status, Assigned Date, Expires, Actions
  - Filter by status (pending, in_progress, submitted, approved, rejected)
  - Filter by form
  - Search by email/phone
  - Actions: View details, Resend notification, Cancel assignment
  - Status badges with colors
  
- [ ] **Assignment Details Modal**
  - Form name and fields
  - Assigned to (email/phone)
  - Access link (for manual sharing)
  - QR code for easy mobile access
  - Status timeline
  - Resend button

### 2.3 Form Submissions Review Page (New)
**File:** `school-dashboard/src/pages/intake-forms/FormSubmissions.jsx`

- [ ] Create new page component
- [ ] Add route: `/intake-forms/submissions`
- [ ] **Features:**
  - Table of all submissions
  - Columns: Form Name, Submitted By, Submitted Date, Status, Reviewer, Actions
  - Filter by status (pending, approved, rejected)
  - Filter by form
  - Search by email/phone/name
  - Bulk actions: Approve selected, Reject selected
  
- [ ] **Submission Review Modal**
  - Display all submitted data in organized sections
  - Show uploaded files with download links
  - Side-by-side comparison with existing staff (if duplicate detected)
  - Approve button (with confirmation)
  - Reject button (with reason input)
  - Add notes field
  - Preview of staff record that will be created
  
- [ ] **Auto-populate Logic**
  - On approve: Create staff record with submitted data
  - Map form fields to staff table columns
  - Handle file uploads (move to staff documents)
  - Update assignment status
  - Send approval notification to teacher
  - Show success toast with link to new staff record

### 2.4 Navigation Updates
**File:** `school-dashboard/src/components/Sidebar.jsx` or navigation config

- [ ] Add "Intake Forms" section to sidebar
  - Submenu: Forms, Assignments, Submissions
- [ ] Add notification badge for pending submissions
- [ ] Update Settings → Intake Forms to link to new forms management page

### 2.5 Dashboard Widgets (Optional)
**File:** `school-dashboard/src/pages/Dashboard.jsx`

- [ ] Add "Pending Form Submissions" widget
  - Count of pending submissions
  - Quick link to review page
- [ ] Add "Recent Form Assignments" widget
  - List of recently assigned forms
  - Status indicators

---

## Phase 3: Teacher App Integration

### 3.1 Notifications Screen
**File:** `teacher-app/src/screens/NotificationsScreen.jsx` (New)

- [ ] Create notifications screen
- [ ] **Features:**
  - List all notifications
  - Group by type (form assignments, approvals, general)
  - Unread badge
  - Tap to open form or view details
  - Mark as read
  - Pull to refresh
  
- [ ] Add notifications icon to app header
- [ ] Show unread count badge

### 3.2 Form Filling Screen
**File:** `teacher-app/src/screens/IntakeFormScreen.jsx` (New)

- [ ] Create form filling screen
- [ ] **Features:**
  - Fetch form by access token (from notification deep link)
  - Display form title and description
  - Render all form fields dynamically based on field type:
    - Text input
    - Email input
    - Phone input
    - Date picker
    - Dropdown/select
    - File upload (camera + gallery)
    - Checkbox
    - Radio buttons
  - Form validation (required fields, email format, phone format)
  - Save draft (local storage)
  - Submit button
  - Progress indicator
  
- [ ] **File Upload Component**
  - Camera capture
  - Gallery selection
  - Multiple file support
  - Preview uploaded files
  - Remove file option
  - Upload progress indicator
  
- [ ] **Submission Confirmation**
  - Success screen after submission
  - "Your form has been submitted for review"
  - Estimated review time
  - Back to home button

### 3.3 Form Status Screen
**File:** `teacher-app/src/screens/FormStatusScreen.jsx` (New)

- [ ] Create form status screen
- [ ] **Features:**
  - View submitted form data (read-only)
  - Current status (pending, approved, rejected)
  - Review notes (if any)
  - Timeline of events
  - Resubmit option (if rejected)

### 3.4 Deep Linking
**File:** `teacher-app/src/navigation/` or app config

- [ ] Configure deep linking for form access
- [ ] URL scheme: `teacherapp://form/:token`
- [ ] Handle notification taps to open form
- [ ] Handle external links (SMS, email) to open form

### 3.5 Push Notifications (Optional)
- [ ] Set up Firebase Cloud Messaging (FCM) or similar
- [ ] Send push notifications for:
  - New form assignment
  - Form approval
  - Form rejection
  - Form expiring soon (3 days before)

---

## Phase 4: Communication & Notifications

### 4.1 Email Notifications
**File:** `backend/services/emailService.js` (New)

- [ ] Set up email service (Nodemailer, SendGrid, etc.)
- [ ] Create email templates:
  - **Form Assignment Email**
    - Subject: "Complete Your Staff Onboarding Form"
    - Body: Personalized message, form link, expiry date
  - **Form Approved Email**
    - Subject: "Your Staff Application Has Been Approved"
    - Body: Welcome message, next steps
  - **Form Rejected Email**
    - Subject: "Your Staff Application Needs Revision"
    - Body: Reason, resubmit instructions
  - **Form Expiring Soon Email**
    - Subject: "Reminder: Complete Your Form"
    - Body: Expiry warning, form link

### 4.2 SMS Notifications (Optional)
**File:** `backend/services/smsService.js` (New)

- [ ] Set up SMS service (Twilio, etc.)
- [ ] Create SMS templates:
  - Form assignment with short link
  - Form approved
  - Form expiring soon

### 4.3 In-App Notifications
- [ ] Create notification service in backend
- [ ] Store notifications in database
- [ ] API endpoints for fetching/marking read
- [ ] Real-time updates (WebSocket or polling)

---

## Phase 5: Staff Onboarding Template

### 5.1 Pre-built Staff Form Template
**File:** `school-dashboard/src/data/formTemplates.js` (New)

Create a comprehensive staff onboarding form template with all fields from the Add Staff drawer:

```javascript
export const staffOnboardingTemplate = {
  name: "Staff Onboarding Form",
  type: "staff",
  fields: [
    // Personal Information
    { id: 1, label: "First Name", type: "text", required: true, mapTo: "first_name" },
    { id: 2, label: "Last Name", type: "text", required: true, mapTo: "last_name" },
    { id: 3, label: "Email", type: "email", required: true, mapTo: "email" },
    { id: 4, label: "Phone", type: "phone", required: true, mapTo: "phone" },
    { id: 5, label: "Date of Birth", type: "date", required: true, mapTo: "date_of_birth" },
    { id: 6, label: "Gender", type: "dropdown", options: ["Male", "Female", "Other"], required: true, mapTo: "gender" },
    { id: 7, label: "Address", type: "textarea", required: true, mapTo: "address" },
    
    // Employment Information
    { id: 8, label: "Employee ID", type: "text", required: false, mapTo: "employee_id" },
    { id: 9, label: "Department", type: "dropdown", options: [], required: true, mapTo: "department_id" },
    { id: 10, label: "Designation", type: "text", required: true, mapTo: "designation" },
    { id: 11, label: "Date of Joining", type: "date", required: true, mapTo: "date_of_joining" },
    { id: 12, label: "Employment Type", type: "dropdown", options: ["Full-time", "Part-time", "Contract"], required: true, mapTo: "employment_type" },
    
    // Qualifications
    { id: 13, label: "Highest Qualification", type: "text", required: true, mapTo: "qualification" },
    { id: 14, label: "Years of Experience", type: "number", required: true, mapTo: "experience_years" },
    { id: 15, label: "Specialization", type: "text", required: false, mapTo: "specialization" },
    
    // Documents
    { id: 16, label: "Resume/CV", type: "file", required: true, mapTo: "resume_file" },
    { id: 17, label: "Photo", type: "file", required: true, mapTo: "photo" },
    { id: 18, label: "ID Proof", type: "file", required: true, mapTo: "id_proof_file" },
    { id: 19, label: "Educational Certificates", type: "file", required: true, mapTo: "certificates_file" },
    
    // Emergency Contact
    { id: 20, label: "Emergency Contact Name", type: "text", required: true, mapTo: "emergency_contact_name" },
    { id: 21, label: "Emergency Contact Phone", type: "phone", required: true, mapTo: "emergency_contact_phone" },
    { id: 22, label: "Emergency Contact Relationship", type: "text", required: true, mapTo: "emergency_contact_relation" },
    
    // Bank Details (Optional)
    { id: 23, label: "Bank Account Number", type: "text", required: false, mapTo: "bank_account" },
    { id: 24, label: "Bank Name", type: "text", required: false, mapTo: "bank_name" },
    { id: 25, label: "IFSC Code", type: "text", required: false, mapTo: "ifsc_code" },
  ]
};
```

- [ ] Create template file
- [ ] Add template selection in form builder
- [ ] Auto-populate fields when template selected
- [ ] Allow customization after template selection

### 5.2 Field Mapping System
**File:** `school-dashboard/src/utils/formFieldMapper.js` (New)

- [ ] Create utility to map form fields to staff table columns
- [ ] Handle data transformation (e.g., split full name)
- [ ] Handle file uploads (move to correct directories)
- [ ] Validate mapped data before creating staff record

---

## Phase 6: Testing & Quality Assurance

### 6.1 Backend Testing
- [ ] Test all API endpoints with Postman/Insomnia
- [ ] Test form assignment flow
- [ ] Test form submission flow
- [ ] Test approval/rejection flow
- [ ] Test file upload handling
- [ ] Test token expiry logic
- [ ] Test notification creation
- [ ] Test duplicate detection

### 6.2 Dashboard Testing
- [ ] Test form creation and editing
- [ ] Test form assignment
- [ ] Test submission review
- [ ] Test approval → auto-populate
- [ ] Test rejection flow
- [ ] Test file downloads
- [ ] Test filters and search
- [ ] Test responsive design

### 6.3 Teacher App Testing
- [ ] Test notification display
- [ ] Test form loading
- [ ] Test form filling (all field types)
- [ ] Test file upload from camera
- [ ] Test file upload from gallery
- [ ] Test form validation
- [ ] Test form submission
- [ ] Test status checking
- [ ] Test deep linking
- [ ] Test offline handling (save draft)

### 6.4 Integration Testing
- [ ] End-to-end flow: Create → Assign → Fill → Submit → Review → Approve
- [ ] Test email notifications
- [ ] Test SMS notifications (if implemented)
- [ ] Test push notifications (if implemented)
- [ ] Test with multiple simultaneous users
- [ ] Test with large file uploads
- [ ] Test with expired tokens

---

## Phase 7: Documentation & Deployment

### 7.1 User Documentation
- [ ] Admin guide: Creating and managing intake forms
- [ ] Admin guide: Reviewing and approving submissions
- [ ] Teacher guide: Filling intake forms
- [ ] Video tutorials (optional)

### 7.2 Technical Documentation
- [ ] API documentation (endpoints, request/response formats)
- [ ] Database schema documentation
- [ ] Field mapping documentation
- [ ] Deployment guide

### 7.3 Deployment Checklist
- [ ] Run database migrations
- [ ] Configure email service credentials
- [ ] Configure SMS service credentials (if used)
- [ ] Set up file upload storage
- [ ] Configure deep linking in Teacher App
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor for errors

---

## Estimated Timeline

### Sprint 1 (Week 1-2): Backend Foundation
- Database schema
- Core API endpoints
- File upload handling

### Sprint 2 (Week 3-4): Dashboard - Forms Management
- Enhanced Intake Forms Settings
- Form templates
- Assignment modal

### Sprint 3 (Week 5-6): Dashboard - Submissions Review
- Submissions page
- Review modal
- Auto-populate logic

### Sprint 4 (Week 7-8): Teacher App
- Notifications screen
- Form filling screen
- File upload
- Deep linking

### Sprint 5 (Week 9-10): Communication & Polish
- Email notifications
- SMS notifications (optional)
- Testing and bug fixes
- Documentation

**Total Estimated Time: 10-12 weeks**

---

## Priority Levels

### P0 (Must Have - MVP)
- Database schema
- Form CRUD APIs
- Form assignment API
- Form submission API (Teacher App)
- Basic form builder in dashboard
- Form filling screen in Teacher App
- Submission review page in dashboard
- Approve → auto-populate staff record
- Email notifications for assignment

### P1 (Should Have)
- Form templates (Staff Onboarding)
- Assignment management page
- File upload support
- Submission status tracking
- Rejection workflow
- Resend notifications
- Field mapping configuration

### P2 (Nice to Have)
- SMS notifications
- Push notifications
- QR code for form access
- Bulk approval/rejection
- Form analytics (completion rate, avg time)
- Draft saving in Teacher App
- Duplicate detection
- Form versioning

### P3 (Future Enhancements)
- Multi-language support
- Conditional fields (show/hide based on answers)
- Digital signature field
- Payment integration (for application fees)
- Interview scheduling integration
- Background verification integration

---

## Technical Considerations

### Security
- [ ] Validate access tokens on every request
- [ ] Implement rate limiting on public endpoints
- [ ] Sanitize file uploads (virus scan)
- [ ] Encrypt sensitive data in database
- [ ] HTTPS only for form access
- [ ] CORS configuration for Teacher App

### Performance
- [ ] Index database tables properly
- [ ] Implement pagination for large lists
- [ ] Lazy load form submissions
- [ ] Optimize file upload size
- [ ] Cache form templates
- [ ] Implement request throttling

### Scalability
- [ ] Use cloud storage for file uploads (S3, etc.)
- [ ] Queue system for email/SMS sending
- [ ] Database connection pooling
- [ ] Load balancing for API servers

### Accessibility
- [ ] Form fields with proper labels
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Error messages clearly visible

---

## Success Metrics

### Adoption Metrics
- Number of forms created
- Number of forms assigned
- Form completion rate
- Average time to complete form
- Approval rate

### Efficiency Metrics
- Time saved vs manual data entry
- Reduction in data entry errors
- Time from assignment to approval
- Admin time spent on review

### User Satisfaction
- Teacher feedback on form filling experience
- Admin feedback on review process
- Support tickets related to intake forms

---

## Risks & Mitigation

### Risk 1: Low Teacher App Adoption
**Mitigation:** 
- Make form filling mobile-friendly
- Provide web-based form filling as alternative
- Send clear instructions with form links

### Risk 2: File Upload Failures
**Mitigation:**
- Implement retry logic
- Allow multiple upload attempts
- Provide clear error messages
- Support multiple file formats

### Risk 3: Token Expiry Issues
**Mitigation:**
- Send reminder emails before expiry
- Allow admins to extend expiry
- Provide easy resend option

### Risk 4: Data Mapping Errors
**Mitigation:**
- Thorough testing of field mapping
- Preview before approval
- Allow manual correction after auto-populate
- Audit log of all changes

---

## Next Steps

1. **Review this document** with stakeholders
2. **Prioritize features** (MVP vs future enhancements)
3. **Assign tasks** to development team
4. **Set up project tracking** (Jira, Trello, etc.)
5. **Begin Sprint 1** - Backend foundation

---

## Questions to Resolve

1. Should we support multiple form types (staff, student, parent) or focus on staff only?
2. What email service should we use? (SendGrid, AWS SES, etc.)
3. Do we need SMS notifications or email only?
4. Should forms be editable after submission (before review)?
5. What file size limits for uploads?
6. Should we implement digital signatures?
7. Do we need multi-step forms or single page?
8. Should admins be able to request additional information after initial submission?

---

**Document Version:** 1.0  
**Last Updated:** December 27, 2025  
**Status:** Draft - Pending Review
