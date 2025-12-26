# Settings Module - Quick Reference Guide

## 🚀 Quick Start

All settings are accessible from the main navigation under **Settings** or directly at `/settings`.

---

## 📑 Settings Tabs Overview

### 1. Institution Settings (`/settings`)
**Purpose:** Basic school information and configuration

**Features:**
- School name, address, contact info
- UDISE No., Affiliation No.
- Logo upload
- Board of Education
- Academic year configuration
- School timings
- Working days
- Subjects management

**Actions:**
- Update school details
- Add/Edit/Delete subjects
- Configure academic year

---

### 2. Sections (`/settings/sections`)
**Purpose:** Manage class sections and capacity

**Features:**
- Class and section creation
- Strength limits with warnings
- Room and block assignment
- HOD (Head of Department) assignment
- Groups for higher secondary (Science/Commerce/Arts)
- Real-time student count

**Actions:**
- Add new section
- Edit section details
- Delete section
- Assign class teacher
- Set capacity limits

---

### 3. Hierarchy (`/settings/hierarchy`)
**Purpose:** Organizational reporting structure

**Features:**
- Reporter-reportee relationships
- Multi-level hierarchy support
- Reporting chain visualization
- Circular reference prevention
- Bulk assignment
- Hierarchy statistics

**Actions:**
- Assign reporter to staff
- Bulk assign reporters
- View reporting chain
- See direct and total reportees

---

### 4. Roles (`/settings/roles`)
**Purpose:** Granular permission management

**Features:**
- Permission matrix (11 modules × 4 actions)
- Lock/unlock permissions
- Permission templates (Admin, Teacher, Accountant, Receptionist)
- Copy permissions from existing roles
- Role-based access control

**Modules:**
- Dashboard, Staff, Students, Classes
- Attendance, Timetable, Fees, Payroll
- Communication, Reports, Settings

**Actions:**
- View, Create, Edit, Delete (per module)

---

### 5. Users (`/settings/users`)
**Purpose:** User account management

**Features:**
- User list with roles
- User status (active/inactive)
- Role assignment
- User details

**Actions:**
- View users
- Edit user roles
- Activate/deactivate users

---

### 6. Intake Forms (`/settings/intake-forms`)
**Purpose:** Custom form builder for admissions

**Features:**
- Drag-and-drop form builder
- 10 field types (text, number, email, phone, date, textarea, select, radio, checkbox, file)
- Form preview
- Form versioning
- Form duplication
- Submission tracking

**Actions:**
- Create new form
- Edit existing form
- Preview form
- Duplicate form
- Delete form

---

### 7. Attendance (`/settings/attendance-rules`)
**Purpose:** Attendance policies and rules

**Features:**
- Minimum attendance percentage
- Edit permissions
- Notification settings
- Late/half-day rules

**Actions:**
- Update attendance rules
- Configure notifications

---

### 8. Fee Heads (`/settings/fee-heads`)
**Purpose:** Fee structure management

**Features:**
- Fee head categories
- Mandatory/optional fees
- Fee amounts
- Fee head list

**Actions:**
- Add fee head
- Edit fee head
- Delete fee head

---

### 9. Fee Rules (`/settings/fee-rules`)
**Purpose:** Fee policies and calculations

**Features:**
- Late fee rules
- Fine calculations
- Payment modes
- Receipt numbering
- Discount rules

**Actions:**
- Update fee rules
- Configure late fees
- Set discount policies

---

### 10. Holidays (`/settings/holidays`)
**Purpose:** Holiday calendar management

**Features:**
- Holiday list
- Holiday types (National, Regional, etc.)
- Date management
- Holiday calendar

**Actions:**
- Add holiday
- Edit holiday
- Delete holiday

---

### 11. Leaves (`/settings/leaves`)
**Purpose:** Leave type configuration

**Features:**
- Leave types (Sick, Casual, Earned, Medical)
- Applicable to (Staff/Students/Both)
- Leave quota
- Approval workflow
- Approver selection (Reporter, Principal, Admin)

**Actions:**
- Add leave type
- Edit leave type
- Delete leave type

---

### 12. Communication (`/settings/communication`)
**Purpose:** Communication settings and templates

**Features:**
- SMS provider settings
- Email provider settings
- Message templates
- Notification toggles
- Automated alerts

**Actions:**
- Configure SMS/Email
- Create message templates
- Enable/disable notifications

---

### 13. Payroll (`/settings/payroll`)
**Purpose:** Salary structure and payroll settings

**Features:**
- Salary components (Earnings/Deductions)
- Payroll cycle
- Salary templates
- Allowances and deductions

**Actions:**
- Add salary components
- Configure payroll cycle
- Manage templates

---

### 14. Subscription (`/settings/subscription`)
**Purpose:** Billing and subscription management

**Features:**
- Current plan overview
- Usage tracking (Students, Staff, Storage, SMS)
- Plan comparison (Basic, Professional, Enterprise)
- Invoice history
- Payment processing
- Upgrade/downgrade

**Actions:**
- View usage
- Upgrade plan
- Download invoices
- Update payment method

---

### 15. Backup (`/settings/backup`)
**Purpose:** Data backup and recovery

**Features:**
- Manual backup trigger
- Automatic backup scheduling
- Backup history
- Backup download
- Restore from backup
- Retention policy
- Storage tracking

**Actions:**
- Create backup now
- Schedule automatic backups
- Download backup
- Restore from backup
- Configure retention

---

## 🔑 Key Shortcuts

### Navigation
- `/settings` - Institution Settings
- `/settings/sections` - Class Sections
- `/settings/hierarchy` - Organizational Hierarchy
- `/settings/roles` - Roles & Permissions
- `/settings/intake-forms` - Form Builder
- `/settings/subscription` - Billing
- `/settings/backup` - Backup & Recovery

### Common Actions
- **Add New:** Look for the blue "Add" or "Create" button in the top-right
- **Edit:** Click the edit icon (pencil) in the actions column
- **Delete:** Click the delete icon (trash) in the actions column
- **Save:** All forms have a "Save" or "Update" button at the bottom

---

## 💡 Tips & Best Practices

### 1. Class Sections
- Set strength limits to prevent overcrowding
- Assign class teachers for better management
- Use groups for higher secondary classes

### 2. Hierarchy
- Always check for circular references
- Use bulk assignment for efficiency
- Review reporting chains regularly

### 3. Permissions
- Start with templates, then customize
- Lock critical permissions to prevent changes
- Test permissions after changes

### 4. Intake Forms
- Preview forms before activating
- Use clear field labels
- Mark required fields appropriately
- Test form submissions

### 5. Subscription
- Monitor usage regularly
- Download invoices for records
- Upgrade before hitting limits

### 6. Backup
- Enable automatic backups
- Set appropriate retention period
- Test restore process periodically
- Download critical backups locally

---

## 🔔 Notifications

All actions trigger toast notifications:
- ✅ **Success:** Green notification (3 seconds)
- ❌ **Error:** Red notification (4 seconds)
- ⏳ **Loading:** Shows during async operations

---

## 🎨 UI Elements

### Inputs
- All inputs use `variant="bordered"`
- Required fields marked with red asterisk
- Validation messages appear below inputs

### Tables
- Lazy loading enabled (no pagination)
- Sortable columns
- Search/filter available
- Actions in last column

### Buttons
- **Primary:** Blue - Main actions
- **Secondary:** Gray - Cancel/Back
- **Danger:** Red - Delete actions
- **Warning:** Orange - Caution actions

### Cards
- Rounded corners (`rounded-lg`)
- Consistent padding
- Shadow on hover

---

## 🔗 Cross-Module Integration

Settings affect other modules:

**Classes Module:**
- Uses sections from Class Sections Settings
- Uses subjects from Institution Settings
- Uses fee heads from Fee Heads Settings

**Staff Module:**
- Uses hierarchy from Hierarchy Settings
- Uses permissions from Roles Settings
- Uses leave types from Leave Settings

**Students Module:**
- Uses fee heads from Fee Heads Settings
- Uses leave types from Leave Settings
- Uses intake forms from Intake Forms Settings

**Attendance Module:**
- Uses attendance rules from Attendance Settings
- Uses holidays from Holiday Settings
- Uses leave types from Leave Settings

**Fees Module:**
- Uses fee heads from Fee Heads Settings
- Uses fee rules from Fee Rules Settings

**Payroll Module:**
- Uses salary components from Payroll Settings
- Uses payroll cycle from Payroll Settings

**Communication Module:**
- Uses templates from Communication Settings
- Uses notification settings from Communication Settings

---

## 🐛 Troubleshooting

### Issue: Changes not saving
**Solution:** Check for validation errors, ensure all required fields are filled

### Issue: API errors
**Solution:** Check network connection, verify backend is running

### Issue: Permission denied
**Solution:** Check user role and permissions in Roles Settings

### Issue: Form not loading
**Solution:** Refresh page, clear browser cache

### Issue: Backup failing
**Solution:** Check storage space, verify backup settings

---

## 📞 Support

For technical issues or questions:
1. Check this quick reference guide
2. Review SETTINGS_IMPLEMENTATION_SUMMARY.md
3. Check MASTER_TASK_LIST.md for detailed implementation
4. Contact system administrator

---

## 🔄 Updates & Maintenance

### Regular Tasks
- [ ] Review and update school information (quarterly)
- [ ] Update holiday calendar (annually)
- [ ] Review user permissions (monthly)
- [ ] Check subscription usage (weekly)
- [ ] Verify backup completion (daily)
- [ ] Update fee structures (annually)
- [ ] Review leave policies (annually)

### Recommended Schedule
- **Daily:** Check backups
- **Weekly:** Review usage and notifications
- **Monthly:** Update user roles and permissions
- **Quarterly:** Review all settings
- **Annually:** Update academic year, holidays, fee structures

---

**Last Updated:** December 26, 2024  
**Version:** 1.0  
**Status:** Production Ready

---

## 🎯 Quick Action Checklist

### New Academic Year Setup
- [ ] Update academic year in Institution Settings
- [ ] Update holiday calendar
- [ ] Review and update fee heads
- [ ] Update class sections
- [ ] Review staff hierarchy
- [ ] Update leave quotas
- [ ] Configure new intake forms

### New Staff Onboarding
- [ ] Create user account in Users Settings
- [ ] Assign role in Roles Settings
- [ ] Set reporter in Hierarchy Settings
- [ ] Assign to class (if teacher) in Sections Settings

### New Student Admission
- [ ] Use intake form from Intake Forms Settings
- [ ] Assign to section from Sections Settings
- [ ] Apply fee structure from Fee Heads Settings

---

**End of Quick Reference Guide**
