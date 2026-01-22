# Timetable Management System - Administrator Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Initial Setup](#initial-setup)
3. [Teacher Assignment Configuration](#teacher-assignment-configuration)
4. [Permission Management](#permission-management)
5. [Data Migration](#data-migration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

## System Overview

### Architecture
The Timetable Management System consists of:
- **Frontend**: React-based UI with real-time updates
- **Backend**: Node.js/Express API with MongoDB
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for performance optimization
- **Synchronization**: Bidirectional sync between class and teacher timetables

### Key Components
- **Class Timetable Editor**: Manage schedules from class perspective
- **Teacher Timetable Editor**: Manage schedules from teacher perspective
- **Conflict Detection Service**: Prevents double-booking
- **Synchronization Service**: Maintains data consistency
- **Validation Service**: Checks timetable completeness

## Initial Setup

### Prerequisites
Before enabling the timetable management system:

1. **Database Setup**
   - MongoDB 4.4 or higher
   - Sufficient storage for timetable data
   - Proper indexes configured (see migration scripts)

2. **System Requirements**
   - Node.js 16+ on backend
   - Modern browsers for frontend (Chrome, Firefox, Edge, Safari)
   - Redis for caching (optional but recommended)

3. **Data Prerequisites**
   - Classes created in the system
   - Staff members added with roles
   - Subjects defined
   - Academic year configured

### Installation Steps

1. **Run Database Migrations**
   ```bash
   cd backend
   node migrations/001_add_timetable_fields.js
   ```

2. **Configure Environment Variables**
   ```bash
   # Add to backend/.env
   ENABLE_TIMETABLE_MANAGEMENT=true
   TIMETABLE_CACHE_TTL=3600
   CONFLICT_CHECK_ENABLED=true
   ```

3. **Restart Backend Server**
   ```bash
   npm restart
   ```

4. **Verify Installation**
   - Check backend logs for successful migration
   - Access the Classes module and verify Timetable tab appears
   - Access the Staff module and verify Timetable tab appears

### Post-Installation Verification

Run the verification script:
```bash
node scripts/verify_timetable_setup.js
```

This checks:
- Database schema is correct
- Indexes are created
- API endpoints are accessible
- Permissions are configured

## Teacher Assignment Configuration

### Understanding Teacher Assignments

Teacher assignments define the **three-way relationship** between:
- **Teacher**: The staff member
- **Subject**: What they can teach
- **Classes**: Where they can teach it

**Format:** "Teacher Name - Subject - Class"

**Example:**
- John Smith - Mathematics - Class 10A
- John Smith - Mathematics - Class 10B
- John Smith - Physics - Class 10A

This means John Smith can teach Mathematics in Class 10A and 10B, and Physics in Class 10A.

### Setting Up Teacher Assignments

#### Method 1: Through Staff Module (Recommended for Individual Teachers)

1. Navigate to **Staff** > Select Teacher
2. Click **Assignments** tab
3. Click **Add Assignment**
4. Select Subject
5. Select one or more Classes
6. Click **Save**

#### Method 2: Bulk Import via API

For setting up multiple teachers at once:

```javascript
// Example bulk import script
const assignments = [
  {
    teacherId: "teacher_id_1",
    subject: "Mathematics",
    classes: ["class_id_1", "class_id_2", "class_id_3"]
  },
  {
    teacherId: "teacher_id_1",
    subject: "Physics",
    classes: ["class_id_1"]
  },
  // ... more assignments
];

// POST to /api/teacher-assignments/bulk
await fetch('/api/teacher-assignments/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ assignments })
});
```

#### Method 3: Import from CSV

Use the provided import script:

```bash
node scripts/import_teacher_assignments.js assignments.csv
```

**CSV Format:**
```csv
teacher_id,teacher_name,subject,class_ids
T001,John Smith,Mathematics,"C10A,C10B,C10C"
T001,John Smith,Physics,C10A
T002,Jane Doe,English,"C10A,C10B"
```

### Best Practices for Teacher Assignments

1. **Complete Setup Before Timetabling**
   - Set up all teacher assignments before creating timetables
   - Incomplete assignments will limit available teachers

2. **Regular Updates**
   - Update assignments when teachers join/leave
   - Update when subjects or classes change
   - Review assignments at the start of each academic year

3. **Validation**
   - Verify each teacher has at least one assignment
   - Ensure all subjects in all classes have qualified teachers
   - Check for balanced workload distribution

4. **Documentation**
   - Maintain a spreadsheet of teacher qualifications
   - Document any special arrangements or constraints
   - Keep records of assignment changes

### Validation Queries

Check for common issues:

```javascript
// Teachers with no assignments
db.staff.find({
  role: "teacher",
  $or: [
    { teacherAssignments: { $exists: false } },
    { teacherAssignments: { $size: 0 } }
  ]
});

// Subjects with no qualified teachers
db.classes.aggregate([
  { $unwind: "$assignedSubjects" },
  {
    $lookup: {
      from: "staff",
      let: { subject: "$assignedSubjects", classId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $in: ["$$subject", "$teacherAssignments.subject"] },
                { $in: ["$$classId", "$teacherAssignments.classes"] }
              ]
            }
          }
        }
      ],
      as: "qualifiedTeachers"
    }
  },
  { $match: { qualifiedTeachers: { $size: 0 } } }
]);
```

## Permission Management

### Role-Based Access Control

The system uses role-based permissions:

| Role | Class Timetable | Teacher Timetable | Assignments | Validation |
|------|----------------|-------------------|-------------|------------|
| **Admin** | Full Access | Full Access | Full Access | Full Access |
| **Principal** | Full Access | Full Access | Full Access | Full Access |
| **Vice Principal** | Full Access | Full Access | Read Only | Full Access |
| **Class Teacher** | Own Class Only | Read Only | Read Only | Read Only |
| **Teacher** | Read Only | Own Only | Read Only | Read Only |
| **Staff** | Read Only | Read Only | No Access | No Access |

### Configuring Permissions

1. **Navigate to Settings** > **Roles & Access**
2. Select a role
3. Configure timetable permissions:
   - `timetable.view`: View timetables
   - `timetable.edit`: Edit timetables
   - `timetable.delete`: Delete timetable entries
   - `assignments.view`: View teacher assignments
   - `assignments.edit`: Edit teacher assignments
   - `validation.view`: View validation reports

### Custom Permission Rules

For advanced scenarios, create custom permission rules:

```javascript
// Example: Allow department heads to edit timetables for their department
{
  role: "department_head",
  permissions: {
    "timetable.edit": {
      condition: "department_match",
      scope: "department_classes"
    }
  }
}
```

### Permission Troubleshooting

**User cannot edit timetable:**
1. Check user's role in User Management
2. Verify role has `timetable.edit` permission
3. Check if user is assigned to the class (for class teachers)
4. Review audit logs for permission denials

## Data Migration

### Migrating Existing Timetables

If you have existing timetable data, use the migration script:

```bash
node migrations/migrate_existing_timetables.js
```

**What it does:**
1. Backs up existing timetable data
2. Adds new fields (version, lastSyncedAt, modifiedBy)
3. Creates teacher timetables from class timetables
4. Validates data integrity
5. Creates indexes

### Migration Steps

1. **Backup Database**
   ```bash
   mongodump --db school_db --out backup_$(date +%Y%m%d)
   ```

2. **Run Pre-Migration Validation**
   ```bash
   node migrations/validate_pre_migration.js
   ```

3. **Execute Migration**
   ```bash
   node migrations/001_add_timetable_fields.js
   ```

4. **Verify Migration**
   ```bash
   node migrations/verify_migration.js
   ```

5. **Test System**
   - Create a test timetable entry
   - Verify synchronization works
   - Check conflict detection
   - Test validation reports

### Rollback Procedure

If migration fails:

```bash
# Restore from backup
mongorestore --db school_db backup_YYYYMMDD/school_db

# Disable feature flag
# In backend/.env
ENABLE_TIMETABLE_MANAGEMENT=false

# Restart server
npm restart
```

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Performance Metrics**
   - API response times (target: < 500ms)
   - Database query times
   - Cache hit rates
   - Synchronization latency

2. **Usage Metrics**
   - Number of timetable edits per day
   - Conflict detection rate
   - Validation report requests
   - Active users

3. **Error Metrics**
   - Synchronization failures
   - Conflict detection errors
   - API errors (4xx, 5xx)
   - Database connection issues

### Monitoring Tools

**Backend Logging:**
```javascript
// Check logs for timetable operations
tail -f backend/logs/timetable.log

// Filter for errors
grep "ERROR" backend/logs/timetable.log

// Monitor synchronization
grep "sync" backend/logs/timetable.log
```

**Database Monitoring:**
```javascript
// Check slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(10);

// Monitor collection sizes
db.stats();
db.timetables.stats();
db.teacherTimetables.stats();
```

**Performance Dashboard:**
Access the admin dashboard at `/admin/timetable-metrics` to view:
- Real-time operation counts
- Average response times
- Error rates
- Cache statistics

### Maintenance Tasks

#### Daily
- Review error logs
- Check for unresolved conflicts
- Monitor system performance

#### Weekly
- Analyze usage patterns
- Review validation reports
- Check for data inconsistencies
- Clear old conflict logs

#### Monthly
- Database optimization (reindex)
- Archive old academic year data
- Review and update teacher assignments
- Performance tuning

#### Quarterly
- Full system audit
- Update documentation
- Review and adjust permissions
- Plan for next academic year

### Database Maintenance

**Reindex Collections:**
```javascript
db.timetables.reIndex();
db.teacherTimetables.reIndex();
db.staff.reIndex();
```

**Clean Up Old Conflict Logs:**
```javascript
// Remove resolved conflicts older than 90 days
db.conflictLogs.deleteMany({
  status: "resolved",
  resolvedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
});
```

**Archive Old Academic Years:**
```bash
node scripts/archive_academic_year.js 2023-24
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Synchronization Failures

**Symptoms:**
- Changes in class timetable don't appear in teacher timetable
- Error messages about sync failures

**Diagnosis:**
```bash
# Check sync logs
grep "syncTimetables" backend/logs/timetable.log

# Check for version conflicts
db.timetables.find({ version: { $exists: false } });
```

**Solution:**
1. Run sync repair script:
   ```bash
   node scripts/repair_sync.js
   ```
2. Verify data consistency
3. Clear cache if using Redis

#### Issue: Performance Degradation

**Symptoms:**
- Slow timetable loading
- Timeout errors
- High database CPU usage

**Diagnosis:**
```javascript
// Check for missing indexes
db.timetables.getIndexes();
db.teacherTimetables.getIndexes();

// Check query performance
db.setProfilingLevel(2);
// ... perform slow operation ...
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

**Solution:**
1. Ensure all indexes are created
2. Enable caching:
   ```bash
   # In backend/.env
   ENABLE_TIMETABLE_CACHE=true
   CACHE_TTL=3600
   ```
3. Optimize queries (see performance guide)
4. Consider database scaling

#### Issue: Conflicts Not Detected

**Symptoms:**
- Teachers double-booked
- No conflict warning shown

**Diagnosis:**
```bash
# Check conflict detection service
node scripts/test_conflict_detection.js

# Verify middleware is active
grep "conflictDetection" backend/server.js
```

**Solution:**
1. Verify conflict detection is enabled in config
2. Check middleware is properly registered
3. Review conflict detection logic
4. Run manual conflict scan:
   ```bash
   node scripts/scan_conflicts.js
   ```

#### Issue: Data Inconsistency

**Symptoms:**
- Class timetable shows different data than teacher timetable
- Missing entries

**Diagnosis:**
```bash
# Run consistency check
node scripts/check_consistency.js
```

**Solution:**
1. Identify inconsistent records
2. Run repair script:
   ```bash
   node scripts/repair_inconsistencies.js
   ```
3. Verify synchronization is working
4. Check for concurrent modification issues

### Emergency Procedures

#### Complete System Reset

**WARNING: This will delete all timetable data**

```bash
# Backup first!
mongodump --db school_db --out emergency_backup_$(date +%Y%m%d)

# Reset timetables
node scripts/reset_timetables.js

# Reinitialize
node migrations/001_add_timetable_fields.js
```

#### Disable Feature Temporarily

```bash
# In backend/.env
ENABLE_TIMETABLE_MANAGEMENT=false

# Restart server
npm restart
```

## Advanced Configuration

### Caching Configuration

```javascript
// backend/config/cache.js
module.exports = {
  timetable: {
    enabled: true,
    ttl: 3600, // 1 hour
    keys: {
      classTimetable: 'timetable:class:{classId}:{year}',
      teacherTimetable: 'timetable:teacher:{teacherId}:{year}',
      availableTeachers: 'teachers:available:{classId}:{subject}:{day}:{period}'
    }
  }
};
```

### Conflict Detection Tuning

```javascript
// backend/config/conflicts.js
module.exports = {
  detection: {
    enabled: true,
    checkOnSave: true,
    checkOnLoad: false,
    logConflicts: true,
    preventSave: true
  },
  resolution: {
    autoResolve: false,
    suggestAlternatives: true,
    maxSuggestions: 5
  }
};
```

### Performance Optimization

```javascript
// backend/config/performance.js
module.exports = {
  batchOperations: {
    enabled: true,
    maxBatchSize: 50,
    batchDelay: 100 // ms
  },
  lazyLoading: {
    enabled: true,
    pageSize: 20
  },
  debouncing: {
    conflictCheck: 300, // ms
    validation: 500 // ms
  }
};
```

### Custom Validation Rules

Add custom validation rules:

```javascript
// backend/services/customValidation.js
module.exports = {
  rules: [
    {
      name: 'max_periods_per_day',
      check: (teacherSchedule, day) => {
        const periods = teacherSchedule.schedule[day].filter(p => p.classId);
        return periods.length <= 6;
      },
      message: 'Teacher cannot have more than 6 periods per day'
    },
    {
      name: 'min_break_between_classes',
      check: (teacherSchedule, day) => {
        // Custom logic to ensure breaks
        return true;
      },
      message: 'Teacher must have at least one break period'
    }
  ]
};
```

## Support and Resources

### Documentation
- User Guide: `USER_GUIDE.md`
- API Documentation: `API_DOCUMENTATION.md`
- Migration Guide: `migrations/README.md`

### Scripts
- Verification: `scripts/verify_timetable_setup.js`
- Repair: `scripts/repair_sync.js`
- Import: `scripts/import_teacher_assignments.js`
- Archive: `scripts/archive_academic_year.js`

### Contact
For technical support or questions:
- System Administrator: admin@school.edu
- Development Team: dev@school.edu
- Emergency Hotline: +1-XXX-XXX-XXXX

---

**Version:** 1.0  
**Last Updated:** January 2025
