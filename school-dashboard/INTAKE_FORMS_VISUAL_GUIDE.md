# Staff Intake Forms - Visual Guide 🎨

## 📱 User Interface Overview

### 1. Settings → Intake Forms (Form Builder)
```
┌─────────────────────────────────────────────────────────────┐
│ Intake Forms                          [View Assignments] [+Create Form] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FORM NAME          TYPE    STATUS   FIELDS  SUBMISSIONS │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Staff Onboarding   staff   active   24      12          │ │
│ │ Student Admission  student active   26      45          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- 👁️ Preview - View form as it will appear
- ✏️ Edit - Open form builder
- 📋 Duplicate - Create a copy
- 🗑️ Delete - Remove form

---

### 2. Template Selection Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Choose a Template                                      [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────────┐  ┌──────────────────────┐        │
│ │ 📄 Staff Onboarding  │  │ 🎓 Student Admission │        │
│ │                      │  │                      │        │
│ │ Complete staff       │  │ Student admission    │        │
│ │ onboarding form      │  │ form with academic   │        │
│ │                      │  │ and parent info      │        │
│ │ [24 fields]          │  │ [26 fields]          │        │
│ └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│ ┌──────────────────────┐                                   │
│ │ ⭐ Start from Blank  │                                   │
│ │                      │                                   │
│ │ Create a custom form │                                   │
│ │ from scratch         │                                   │
│ │                      │                                   │
│ └──────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Form Builder Interface
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Create Form                                    [Preview] [Save]     [X] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌──────────┐  ┌────────────────────────────┐  ┌──────────────────┐   │
│ │ PALETTE  │  │        CANVAS              │  │  FIELD SETTINGS  │   │
│ ├──────────┤  ├────────────────────────────┤  ├──────────────────┤   │
│ │          │  │                            │  │                  │   │
│ │ Form     │  │  Staff Onboarding Form     │  │ Field Label:     │   │
│ │ Details  │  │  ─────────────────────     │  │ [First Name]     │   │
│ │          │  │                            │  │                  │   │
│ │ [T] Text │  │  ┌──────────────────────┐  │  │ Placeholder:     │   │
│ │ [#] Num  │  │  │ First Name *         │  │  │ [Enter name]     │   │
│ │ [@] Email│  │  │ [____________]       │  │  │                  │   │
│ │ [☎] Phone│  │  └──────────────────────┘  │  │ ☑ Required       │   │
│ │ [📅] Date│  │                            │  │                  │   │
│ │ [¶] Area │  │  ┌──────────────────────┐  │  │ Layout:          │   │
│ │ [▼] Drop │  │  │ Email *              │  │  │ [Full] [Half]    │   │
│ │ [◉] Radio│  │  │ [____________]       │  │  │                  │   │
│ │ [☑] Check│  │  └──────────────────────┘  │  │ Validation:      │   │
│ │ [📎] File│  │                            │  │ Min Length: [2]  │   │
│ │          │  │  ┌──────────────────────┐  │  │ Max Length: [50] │   │
│ │          │  │  │ Phone *              │  │  │                  │   │
│ │          │  │  │ +91 [__________]     │  │  │ [Apply Changes]  │   │
│ │          │  │  └──────────────────────┘  │  │                  │   │
│ │          │  │                            │  │                  │   │
│ │          │  │  24 Fields                 │  │                  │   │
│ │          │  │                            │  │                  │   │
│ └──────────┘  └────────────────────────────┘  └──────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop field reordering
- Live preview
- Field validation rules
- Full/half width layout
- 10 field types

---

### 4. Intake Forms → Assignments
```
┌─────────────────────────────────────────────────────────────┐
│ Form Assignments                            [Assign Form]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Pending] [Submitted] [Approved] [Rejected] [All]          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FORM NAME    ASSIGNED TO      STATUS    EXPIRES    ⋮   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Staff Form   teacher@sch.com  pending   Jan 15     ⋮   │ │
│ │ Staff Form   john@school.com  submitted Jan 20     ⋮   │ │
│ │ Staff Form   mary@school.com  approved  Jan 10     ⋮   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Actions (⋮ menu):**
- 👁️ View Details - See assignment info
- 📋 Copy Link - Copy access URL
- 🔄 Resend - Send notification again
- 🗑️ Cancel - Cancel assignment

---

### 5. Assign Form Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Assign Form                                            [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select Form:                                                │
│ [Staff Onboarding Form ▼]                                   │
│                                                             │
│ Email Addresses:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ teacher1@school.com                                     │ │
│ │ teacher2@school.com                                     │ │
│ │ teacher3@school.com                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Enter email addresses (one per line or comma-separated)    │
│                                                             │
│ Phone Numbers:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ +919876543210                                           │ │
│ │ +919876543211                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Enter phone numbers (one per line or comma-separated)      │
│                                                             │
│ Expires In (Days): [30]                                     │
│                                                             │
│                                    [Cancel] [Assign Form]   │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. Intake Forms → Submissions
```
┌─────────────────────────────────────────────────────────────┐
│ Form Submissions                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Pending] [Approved] [Rejected] [All]                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FORM NAME    SUBMITTED BY     DATE        STATUS    ⋮   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Staff Form   john@school.com  Dec 20      ⚠ pending ⋮   │ │
│ │ Staff Form   mary@school.com  Dec 18      ✓ approved⋮   │ │
│ │ Staff Form   bob@school.com   Dec 15      ✗ rejected⋮   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Badge Colors:**
- 🟡 Pending (Yellow)
- 🟢 Approved (Green)
- 🔴 Rejected (Red)

---

### 7. Review Submission Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Review Submission                                      [X]  │
│ Staff Onboarding Form - Submitted by john@school.com       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Submitted Information                                       │
│ ─────────────────────                                       │
│                                                             │
│ First Name:          John                                   │
│ Last Name:           Doe                                    │
│ Email:               john@school.com                        │
│ Phone:               +919876543210                          │
│ Date of Birth:       1990-05-15                             │
│ Gender:              Male                                   │
│ Address:             123 Main St, City                      │
│                                                             │
│ Department:          Mathematics                            │
│ Designation:         Senior Teacher                         │
│ Date of Joining:     2024-01-15                             │
│ Employment Type:     Full-time                              │
│                                                             │
│ Qualification:       M.Sc Mathematics                       │
│ Experience Years:    5                                      │
│                                                             │
│ Resume/CV:           [Download File]                        │
│ Photo:               [Download File]                        │
│ ID Proof:            [Download File]                        │
│                                                             │
│ Emergency Contact:   Jane Doe                               │
│ Emergency Phone:     +919876543211                          │
│ Relationship:        Spouse                                 │
│                                                             │
│ ─────────────────────                                       │
│                                                             │
│ Review Decision                                             │
│ ─────────────────────                                       │
│                                                             │
│ Review Notes:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ All documents verified. Approved for hiring.            │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Cancel] [✗ Reject] [✓ Approve & Create Staff] │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. CREATE FORM                   │
        │  Settings → Intake Forms          │
        │  - Choose template                │
        │  - Customize fields               │
        │  - Save form                      │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  2. ASSIGN FORM                   │
        │  Intake Forms → Assignments       │
        │  - Select form                    │
        │  - Enter emails/phones            │
        │  - Set expiry                     │
        │  - Send                           │
        └───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SENT                        │
│  Email: "You have been assigned to fill Staff Form"        │
│  Link: https://app.com/form/abc123token                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER APP                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  3. FILL FORM                     │
        │  - Open notification              │
        │  - Fill all fields                │
        │  - Upload documents               │
        │  - Submit                         │
        └───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUBMISSION RECEIVED                      │
│  Status: Pending Review                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  4. REVIEW SUBMISSION             │
        │  Intake Forms → Submissions       │
        │  - View submitted data            │
        │  - Check documents                │
        │  - Add review notes               │
        │  - Approve or Reject              │
        └───────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐
    │  5a. APPROVED     │   │  5b. REJECTED     │
    │  ✓ Staff record   │   │  ✗ Send back with │
    │    auto-created   │   │    notes          │
    │  ✓ Credentials    │   │  ✗ Teacher can    │
    │    generated      │   │    resubmit       │
    │  ✓ Notification   │   │                   │
    │    sent           │   │                   │
    └───────────────────┘   └───────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │  NEW STAFF RECORD CREATED     │
    │  - Code: EMP001               │
    │  - Username: john             │
    │  - Password: Abc12345         │
    │  - Status: Active             │
    └───────────────────────────────┘
```

---

## 🎨 Color Coding

### Status Colors
- 🟡 **Pending** - Yellow/Warning
- 🔵 **In Progress** - Blue/Primary
- 🟢 **Approved** - Green/Success
- 🔴 **Rejected** - Red/Danger
- ⚪ **Expired** - Gray/Default

### Badge Examples
```
┌──────────────────────────────────────┐
│ Status Badges:                       │
│                                      │
│ ⚠ pending    (yellow dot)            │
│ ✓ approved   (green dot)             │
│ ✗ rejected   (red dot)               │
│ ⏳ in_progress (blue dot)            │
│ ⏰ expired    (gray dot)             │
└──────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop View (1920px)
```
┌────────────────────────────────────────────────────────────────┐
│ [Sidebar]  [Main Content Area - Full Width]                   │
│            ┌──────────────────────────────────────────────┐   │
│            │  Form Builder / Assignments / Submissions    │   │
│            │                                              │   │
│            │  [Large tables, 3-column layouts]           │   │
│            └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px)
```
┌──────────────────────────────────────────┐
│ [Collapsed Sidebar]  [Main Content]     │
│                      ┌──────────────┐   │
│                      │ 2-col layout │   │
│                      │ Stacked      │   │
│                      └──────────────┘   │
└──────────────────────────────────────────┘
```

### Mobile View (375px)
```
┌────────────────────┐
│ [Hidden Sidebar]   │
│ ┌────────────────┐ │
│ │ Single column  │ │
│ │ Stacked cards  │ │
│ │ Full width     │ │
│ └────────────────┘ │
└────────────────────┘
```

---

## 🎯 Key UI Elements

### Form Field Types Preview
```
┌─────────────────────────────────────────────────────────┐
│ Text Input:      [_____________________________]        │
│                                                         │
│ Email Input:     [@_____________________________]       │
│                                                         │
│ Phone Input:     +91 [_________________________]        │
│                                                         │
│ Date Picker:     [📅 DD/MM/YYYY ▼]                     │
│                                                         │
│ Dropdown:        [Select option ▼]                     │
│                                                         │
│ Radio Buttons:   ◉ Option 1  ○ Option 2  ○ Option 3   │
│                                                         │
│ Checkboxes:      ☑ Option 1  ☐ Option 2  ☐ Option 3   │
│                                                         │
│ Text Area:       ┌─────────────────────────────────┐   │
│                  │                                 │   │
│                  │                                 │   │
│                  └─────────────────────────────────┘   │
│                                                         │
│ File Upload:     ┌─────────────────────────────────┐   │
│                  │ 📎 Click to upload or drag      │   │
│                  │    and drop                     │   │
│                  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔔 Notification Examples

### In-App Notification
```
┌─────────────────────────────────────────────────────────┐
│ 🔔 New Form Assignment                                  │
│ You have been assigned to fill the form:               │
│ "Staff Onboarding Form"                                 │
│ Expires: January 15, 2025                               │
│ [Open Form]                                             │
└─────────────────────────────────────────────────────────┘
```

### Email Notification
```
Subject: Complete Your Staff Onboarding Form

Dear Teacher,

You have been assigned to complete the Staff Onboarding Form.

Form Details:
- Form Name: Staff Onboarding Form
- Assigned By: Admin
- Expires On: January 15, 2025

Please click the link below to access and fill the form:
https://app.com/form/abc123token

If you have any questions, please contact the administration.

Best regards,
School Administration
```

---

**Last Updated:** December 27, 2025  
**Version:** 1.0.0
