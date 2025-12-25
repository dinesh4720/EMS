# Comprehensive Staff Management System

## Overview
A complete 4-step staff onboarding system with detailed personal information, qualifications, staff info, and salary management. The entire flow is contained within a compact 600px side drawer for a focused, distraction-free data entry experience.

## Features Implemented

### 1. Add Staff Form (Multi-Step)

#### Step 1: Personal Details
- **Basic Information**
  - First Name & Last Name
  - Date of Birth
  - Expertise/Specialization
  - Profile Picture Upload
  
- **Contact Information**
  - Mobile Number
  - WhatsApp checkbox (auto-fills WhatsApp number if checked)
  - Separate WhatsApp Number field
  - Email ID
  
- **Personal Details**
  - Father's Name
  - Blood Group (dropdown)
  - Gender (Male/Female/Other)
  - Marital Status (Single/Married/Divorced/Widowed)
  - Employment Type (Full-time/Part-time/Contract/Temporary)
  - Father/Mother Contact Number
  
- **Documents**
  - ID Documents Upload (multiple files)
  - Custom Document Categories (add custom categories with names and upload files)
  
- **Emergency Contact**
  - Emergency Contact Name
  - Emergency Phone Number
  
- **Address**
  - Full Address (textarea)

#### Step 2: Qualifications and Experience
- **Professional Qualifications**
  - Add multiple qualifications
  - Each qualification has: Name and Year
  - Custom qualifications can be added
  
- **Experience**
  - Total Experience (in years)
  - Previous Organization
  
- **Documents**
  - Upload related qualification documents (certificates, etc.)

#### Step 3: Staff Information
- **Staff Number**
  - Pre-assigned staff number (editable input field)
  
- **Staff Type** (dropdown)
  - Teaching
  - Non-Teaching
  - Admin
  - Lab Assistant
  - Accountant
  - Others
  
- **For Teaching Staff**
  - Assign Classes (multi-select from all available classes)
  - Is Class Teacher (switch/toggle)
  - If Class Teacher, select which class from assigned classes

#### Step 4: Salary Details
- **Bank Account Details**
  - Account Number
  - IFSC Code
  - Bank Name
  - Branch Name
  
- **Salary Template**
  - Select from predefined templates:
    - Teacher
    - Lab Assistant
    - Lab Incharge
    - Accountant
    - Others
  
- **Salary Breakdown**
  - Displays selected template breakdown
  - Fully editable (can modify amounts)
  - Can add new components
  - Can remove components
  - Shows total monthly salary
  - Components include:
    - Basic Salary
    - HRA (House Rent Allowance)
    - Special Allowance
    - Transport Allowance
    - Responsibility Allowance (for certain roles)

### 2. Staff Dashboard Enhancements
- Displays all comprehensive staff information
- Shows additional details section when available:
  - Date of Birth
  - Blood Group
  - Gender
  - Marital Status
  - Employment Type
  - Total Experience
  - Staff Number
  - Emergency Contact Details
  
- **Salary Information Display**
  - Shows complete salary breakdown
  - Displays all components with amounts
  - Shows total monthly salary

### 3. Salary Templates Management (Settings)
Located in: Settings → Payroll → Salary Templates

- **View Templates**
  - Grid view of all salary templates
  - Shows template name and total amount
  - Displays all salary components
  
- **Create Template**
  - Add new salary template
  - Define template name
  - Add multiple salary components
  - Set amount for each component
  - Real-time total calculation
  
- **Edit Template**
  - Modify existing templates
  - Update component names and amounts
  - Add/remove components
  
- **Delete Template**
  - Remove templates with confirmation

## File Structure

```
src/
├── pages/
│   ├── staffs/
│   │   ├── AddStaff.jsx          # New comprehensive 4-step form
│   │   ├── index.jsx             # Updated to use new AddStaff component
│   │   ├── StaffDashboard.jsx    # Enhanced to show comprehensive data
│   │   ├── StaffList.jsx         # Existing staff list
│   │   └── StaffAttendance.jsx   # Existing attendance
│   └── settings/
│       ├── PayrollSettings.jsx   # Updated with Salary Templates tab
│       └── SalaryTemplates.jsx   # New salary template management
```

## Usage

### Adding a New Staff Member
1. Navigate to Staffs → All Staff
2. Click "Create Staff" button
3. A side drawer opens with the 4-step form
4. Complete all 4 steps:
   - Fill personal details
   - Add qualifications
   - Set staff information
   - Configure salary details
5. Click "Save Staff"
6. The drawer closes and the new staff member is added to the list

### Managing Salary Templates
1. Navigate to Settings → Payroll
2. Click "Salary Templates" tab
3. Create/Edit/Delete templates as needed
4. Templates are available when adding new staff

### Viewing Staff Details
1. Click on any staff member from the list
2. View comprehensive information in the drawer
3. All additional details are displayed in organized sections
4. Salary breakdown is shown if configured

## UI/UX Features
- **Compact Drawer Interface**: 600px width drawer (max 90vw on mobile) for focused data entry
- **Single Column Layout**: All form fields in single column for better readability in narrow drawer
- **Compact Step Indicator**: Smaller icons and text for space efficiency
- **Step Icons**: Each step has a unique icon (User, FileText, Briefcase, DollarSign)
- **Validation**: Real-time validation with error messages
- **Navigation**: Smaller Previous/Next buttons with Cancel option
- **Sticky Footer**: Navigation buttons stay visible while scrolling
- **Responsive**: Works on all screen sizes
- **File Upload**: Click to upload documents with visual chips
- **Multi-select**: Easy class assignment with visual chips
- **Real-time Calculations**: Salary totals update as you type
- **Compact Components**: Smaller buttons, inputs, and spacing for drawer context

## Data Storage
All comprehensive staff data is stored in the `fullData` property of each staff member, allowing backward compatibility with existing staff records while supporting the new detailed information.

## Future Enhancements
- Document preview functionality
- Bulk staff import
- Salary history tracking
- Performance review integration
- Leave management integration
