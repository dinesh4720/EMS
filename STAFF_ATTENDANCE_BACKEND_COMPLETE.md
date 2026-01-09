# Staff Attendance Backend System - Complete Implementation ✅

## Overview

Comprehensive backend system for staff attendance management with database persistence and mobile app integration support.

## Database Model

### StaffAttendance Schema

```javascript
{
  staffId: ObjectId (ref: Staff),
  date: String (YYYY-MM-DD),
  status: enum ['present', 'absent', 'leave', 'halfday', 'unmarked'],
  checkInTime: String,
  checkOutTime: String,
  reason: String,
  
  // Mobile app integration
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkInMethod: enum ['manual', 'mobile', 'biometric', 'admin'],
  checkOutMethod: enum ['manual', 'mobile', 'biometric', 'admin'],
  
  // Leave application
  leaveApplication: {
    appliedAt: Date,
    leaveType: String,
    startDate: String,
    endDate: String,
    numberOfDays: Number,
    approvalStatus: enum ['pending', 'approved', 'rejected'],
    approvedBy: ObjectId (ref: Staff),
    approvedAt: Date,
    rejectionReason: String
  },
  
  // Regularization
  regularization: {
    regularizedBy: ObjectId (ref: Staff),
    regularizedAt: Date,
    previousStatus: String,
    regularizationReason: String
  },
  
  markedBy: ObjectId (ref: Staff),
  lastModifiedBy: ObjectId (ref: Staff),
  timestamps: true
}
```

## API Endpoints

### Admin Dashboard Endpoints

#### 1. Get Attendance for a Date
```http
GET /api/staff-attendance/date/:date
```
Returns all staff attendance for a specific date.

**Response:**
```json
[
  {
    "_id": "...",
    "staffId": { "name": "John Doe", "code": "EMP001" },
    "date": "2026-01-09",
    "status": "present",
    "checkInTime": "09:00",
    "checkOutTime": "17:00"
  }
]
```

#### 2. Get Staff Attendance History
```http
GET /api/staff-attendance/staff/:staffId?startDate=2026-01-01&endDate=2026-01-31
```
Returns attendance history for a specific staff member.

#### 3. Mark Attendance (Manual/Admin)
```http
POST /api/staff-attendance
Content-Type: application/json

{
  "staffId": "staff_id",
  "date": "2026-01-09",
  "status": "present",
  "checkInTime": "09:00",
  "checkOutTime": "17:00",
  "reason": "Optional reason",
  "markedBy": "admin_id"
}
```

#### 4. Bulk Mark Attendance
```http
POST /api/staff-attendance/bulk
Content-Type: application/json

{
  "date": "2026-01-09",
  "staffIds": ["id1", "id2", "id3"],
  "status": "present",
  "markedBy": "admin_id"
}
```

#### 5. Regularize Attendance
```http
PUT /api/staff-attendance/:id/regularize
Content-Type: application/json

{
  "status": "present",
  "checkInTime": "09:30",
  "checkOutTime": "17:00",
  "reason": "Regularization reason",
  "regularizedBy": "admin_id"
}
```

#### 6. Get Pending Leave Applications
```http
GET /api/staff-attendance/leave/pending
```
Returns all pending leave applications for admin approval.

#### 7. Approve/Reject Leave
```http
PUT /api/staff-attendance/leave/:id/approve
Content-Type: application/json

{
  "approvalStatus": "approved", // or "rejected"
  "approvedBy": "admin_id",
  "rejectionReason": "Optional reason if rejected"
}
```

#### 8. Get Attendance Summary
```http
GET /api/staff-attendance/summary/:staffId?month=1&year=2026
```
Returns monthly attendance summary for a staff member.

**Response:**
```json
{
  "present": 20,
  "absent": 2,
  "leave": 3,
  "halfday": 1,
  "unmarked": 5,
  "total": 31
}
```

### Mobile App Endpoints

#### 1. Check-In
```http
POST /api/staff-attendance/mobile/checkin
Content-Type: application/json

{
  "staffId": "staff_id",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "School Address"
  }
}
```

**Response:**
```json
{
  "success": true,
  "attendance": {
    "staffId": "...",
    "date": "2026-01-09",
    "status": "present",
    "checkInTime": "09:15",
    "checkInLocation": { ... },
    "checkInMethod": "mobile"
  }
}
```

#### 2. Check-Out
```http
POST /api/staff-attendance/mobile/checkout
Content-Type: application/json

{
  "staffId": "staff_id",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "School Address"
  }
}
```

#### 3. Apply for Leave
```http
POST /api/staff-attendance/mobile/leave/apply
Content-Type: application/json

{
  "staffId": "staff_id",
  "leaveType": "sick", // or "casual", "emergency", "personal"
  "startDate": "2026-01-10",
  "endDate": "2026-01-12",
  "reason": "Medical reasons"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave application submitted successfully",
  "numberOfDays": 3,
  "modified": 0,
  "upserted": 3
}
```

## Features

### 1. Database Persistence
- All attendance data stored in MongoDB
- Efficient indexing for fast queries
- Compound index on staffId + date for uniqueness

### 2. Mobile App Integration
- Check-in/out with GPS location tracking
- Leave application from mobile
- Real-time status updates
- Method tracking (mobile, manual, biometric, admin)

### 3. Leave Management
- Staff can apply for leave from mobile app
- Admin can approve/reject leave applications
- Automatic attendance marking for leave period
- Leave type categorization
- Approval workflow

### 4. Regularization
- Admin can regularize attendance
- Tracks previous status
- Records regularization reason
- Audit trail maintained

### 5. Attendance Tracking
- Check-in/out times
- Location tracking (GPS coordinates + address)
- Multiple check-in methods
- Reason for absence/leave/half day

### 6. Reporting
- Daily attendance reports
- Monthly summaries
- Staff-wise attendance history
- Pending leave applications

## Integration Points

### Frontend Integration

Update `AppContext.jsx` to fetch from backend:

```javascript
// Fetch attendance from backend
const fetchStaffAttendance = async (date) => {
  const response = await fetch(`http://localhost:3001/api/staff-attendance/date/${date}`);
  const data = await response.json();
  return data;
};

// Mark attendance via backend
const markStaffAttendance = async (staffId, date, status, checkInTime, checkOutTime, reason) => {
  const response = await fetch('http://localhost:3001/api/staff-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      staffId,
      date,
      status,
      checkInTime,
      checkOutTime,
      reason,
      markedBy: currentUserId
    })
  });
  return await response.json();
};
```

### Mobile App Integration

The mobile app should:

1. **Check-In Flow**:
   - Get GPS location
   - Call `/api/staff-attendance/mobile/checkin`
   - Show confirmation

2. **Check-Out Flow**:
   - Get GPS location
   - Call `/api/staff-attendance/mobile/checkout`
   - Show summary (total hours worked)

3. **Leave Application Flow**:
   - Select leave type and dates
   - Enter reason
   - Call `/api/staff-attendance/mobile/leave/apply`
   - Show pending status

4. **View Attendance**:
   - Call `/api/staff-attendance/staff/:staffId`
   - Display calendar with attendance status

## Security Considerations

### Authentication
- All endpoints should be protected with JWT authentication
- Verify staff identity before check-in/out
- Admin-only endpoints for approval/regularization

### Authorization
- Staff can only access their own attendance
- Admins can access all staff attendance
- Leave approval requires admin role

### Data Validation
- Validate date formats
- Prevent duplicate check-ins
- Validate GPS coordinates
- Sanitize input data

## Future Enhancements

### 1. Biometric Integration
- Fingerprint scanner support
- Face recognition
- RFID card readers

### 2. Geofencing
- Restrict check-in to school premises
- Alert if check-in from outside geofence
- Multiple location support (branches)

### 3. Shift Management
- Multiple shift support
- Shift-wise attendance
- Overtime tracking

### 4. Advanced Reporting
- Export to Excel/PDF
- Graphical reports
- Attendance trends
- Comparison reports

### 5. Notifications
- Push notifications for check-in reminders
- Leave approval notifications
- Attendance alerts
- Monthly summary emails

### 6. Integration
- Payroll system integration
- HR management system
- Email/SMS notifications
- Calendar sync

## Testing

### Test Check-In
```bash
curl -X POST http://localhost:3001/api/staff-attendance/mobile/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff_id_here",
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "School Address"
    }
  }'
```

### Test Leave Application
```bash
curl -X POST http://localhost:3001/api/staff-attendance/mobile/leave/apply \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff_id_here",
    "leaveType": "sick",
    "startDate": "2026-01-10",
    "endDate": "2026-01-12",
    "reason": "Medical reasons"
  }'
```

## Status: ✅ COMPLETE

All backend infrastructure is ready for:
- ✅ Database model created
- ✅ API routes implemented
- ✅ Mobile app endpoints ready
- ✅ Leave management system
- ✅ Regularization support
- ✅ Location tracking
- ✅ Approval workflow
- ✅ Reporting endpoints

The system is now ready for mobile app integration and frontend updates!
