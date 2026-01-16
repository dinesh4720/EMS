# TODO Items Tracking

**Generated:** 2026-01-10  
**Total TODO Items Found:** 5

---

## 📋 Outstanding TODO Items

### 1. Bulk SMS/Email Reminders for Fee Defaulters
**Location:** `school-dashboard/src/pages/fees/FeeDefaulters.jsx:99`

**Code:**
```javascript
// TODO: Implement bulk SMS/Email reminder functionality
const handleBulkReminder = () => {
  console.log('Send bulk reminder to:', selectedDefaulters);
};
```

**Priority:** Medium  
**Effort:** Medium (2-3 days)  
**Dependencies:** 
- SMS gateway integration (Twilio, AWS SNS, etc.)
- Email service (SendGrid, AWS SES, etc.)
- Template management

**Recommendation:** 
- Create a messaging service abstraction
- Implement template system for SMS/Email
- Add delivery status tracking
- Consider rate limiting for bulk operations

---

### 2. SMS/Email Reminder for Individual Payments
**Location:** `school-dashboard/src/pages/fees/Payments.jsx:282`

**Code:**
```javascript
// TODO: Implement SMS/Email reminder
```

**Priority:** Medium  
**Effort:** Small (1 day)  
**Dependencies:** Same as #1

**Recommendation:**
- Reuse messaging service from #1
- Single reminder per student
- Include payment link if applicable

---

### 3. Fee Report Generation
**Location:** `school-dashboard/src/pages/fees/index.jsx:22`

**Code:**
```javascript
// TODO: Implement fee report generation
const generateReport = () => {
  console.log('Generate fee report');
};
```

**Priority:** Medium  
**Effort:** Medium (2-3 days)  
**Dependencies:**
- Reporting library (jsPDF, pdfmake)
- Excel generation (xlsx, exceljs)
- Data aggregation logic

**Recommendation:**
- Support multiple formats (PDF, Excel, CSV)
- Include filters (date range, class, status)
- Add summary statistics
- Schedule automated reports

---

### 4. API Sync for Teacher App Regularization
**Location:** `Teacher app/teacher-app/src/context/AppContext.js:369`

**Code:**
```javascript
// TODO: Sync with API when available
const submitRegularization = async (requestData) => {
  const newRequest = {
    id: Date.now().toString(),
    ...requestData,
    status: 'pending',
    submittedDate: new Date().toISOString(),
  };
  
  setRegularizationRequests([...regularizationRequests, newRequest]);
  await AsyncStorage.setItem('regularization_requests', JSON.stringify([...regularizationRequests, newRequest]));
};
```

**Priority:** High  
**Effort:** Small (1 day)  
**Dependencies:**
- Backend API endpoint for regularization
- Request/response schema definition

**Recommendation:**
- Connect to existing `staffAttendanceRoutes.js`
- Implement offline queue for failed requests
- Add sync status indicator

---

### 5. API Sync for Teacher App Leave Applications
**Location:** `Teacher app/teacher-app/src/context/AppContext.js:389`

**Code:**
```javascript
// TODO: Sync with API when available
const submitLeave = async (leaveData) => {
  const newLeave = {
    id: Date.now().toString(),
    ...leaveData,
    status: 'pending',
    appliedDate: new Date().toISOString(),
  };
  
  setLeaveApplications([...leaveApplications, newLeave]);
  await AsyncStorage.setItem('leave_applications', JSON.stringify([...leaveApplications, newLeave]));
};
```

**Priority:** High  
**Effort:** Small (1 day)  
**Dependencies:**
- Backend API endpoint for leave management
- Leave approval workflow

**Recommendation:**
- Create leave management routes in backend
- Implement approval workflow
- Add leave balance tracking
- Email notifications for approval/rejection

---

### 6. API Sync for Teacher App Substitution
**Location:** `Teacher app/teacher-app/src/context/AppContext.js:404`

**Code:**
```javascript
// TODO: Sync with API when available
const submitSubstitution = async (substitutionData) => {
  const newSubstitution = {
    id: Date.now().toString(),
    ...substitutionData,
    status: 'pending',
    requestedDate: new Date().toISOString(),
  };
  
  setSubstitutionRequests([...substitutionRequests, newSubstitution]);
  await AsyncStorage.setItem('substitution_requests', JSON.stringify([...substitutionRequests, newSubstitution]));
};
```

**Priority:** High  
**Effort:** Small (1 day)  
**Dependencies:**
- Backend substitution routes (already exists)
- Connect to existing Substitution model

**Recommendation:**
- Connect to existing substitution endpoints
- Implement real-time notifications
- Add availability checking

---

## 📊 Summary by Priority

| Priority | Count | Total Effort |
|----------|-------|--------------|
| High | 3 | ~3 days |
| Medium | 3 | ~6 days |
| **Total** | **6** | **~9 days** |

---

## 🚀 Recommended Implementation Order

1. **Teacher App API Sync (TODOs #4, #5, #6)** - 3 days
   - Complete API integration for teacher app
   - High impact for teacher users
   - Backend endpoints mostly exist

2. **Fee Report Generation (TODO #3)** - 2-3 days
   - High value for administrators
   - Reusable reporting infrastructure

3. **SMS/Email Reminder System (TODOs #1, #2)** - 3-4 days
   - Shared infrastructure
   - Implement together for consistency
   - High ROI for fee collection

---

## 🔧 Implementation Notes

### Messaging Service Template

```javascript
// backend/services/messaging.js
export class MessagingService {
  async sendSMS(phone, message) {
    // Implement SMS gateway integration
  }
  
  async sendEmail(email, subject, body) {
    // Implement email service integration
  }
  
  async sendBulk(recipients, message, type) {
    // Implement bulk sending with rate limiting
  }
}
```

### Report Generation Template

```javascript
// backend/services/reportGenerator.js
export class ReportGenerator {
  async generateFeeReport(filters, format) {
    // Implement report generation
  }
  
  async exportToExcel(data, filename) {
    // Implement Excel export
  }
  
  async exportToPDF(data, filename) {
    // Implement PDF export
  }
}
```

### Teacher App API Integration

```javascript
// Teacher app/teacher-app/src/services/api.js
export const teacherApi = {
  submitRegularization: async (data) => {
    return await api.post('/staff-attendance/regularize', data);
  },
  
  submitLeave: async (data) => {
    return await api.post('/leave-applications', data);
  },
  
  submitSubstitution: async (data) => {
    return await api.post('/substitutions', data);
  }
};
```

---

## ✅ Next Steps

1. Create Jira tickets for each TODO item
2. Prioritize based on business needs
3. Assign to development team
4. Set sprint goals
5. Track completion

---

**Note:** All TODO items have been documented and tracked. Remove TODO comments from code once corresponding tickets are created in your project management system.
