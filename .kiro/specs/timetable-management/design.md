# Design Document

## Overview

The Timetable Management System is a comprehensive scheduling solution that enables bidirectional timetable creation and management from both class and staff perspectives. The system maintains synchronization between class schedules and teacher schedules while providing intelligent conflict detection, subject-teacher assignment management, and real-time validation.

The system extends the existing timetable functionality in the school dashboard by adding:
- Subject-teacher-class association management
- Teacher timetable views and editing
- Bidirectional synchronization between class and teacher timetables
- Conflict detection and prevention
- Available teacher filtering based on qualifications and time slot availability
- Class tag management for organizational purposes

## Architecture

### System Components

The system follows a three-tier architecture:

1. **Frontend Layer** (React + HeroUI)
   - Class Timetable Management UI
   - Teacher Timetable Management UI
   - Class Settings UI for tags and subjects
   - Staff Assignment UI for subject-class associations
   - Conflict Resolution UI

2. **Backend Layer** (Node.js + Express)
   - RESTful API endpoints for timetable operations
   - Business logic for conflict detection
   - Synchronization logic for bidirectional updates
   - Validation and authorization middleware

3. **Data Layer** (MongoDB + Mongoose)
   - Timetable documents (existing)
   - Staff documents (extended)
   - Class documents (extended)
   - TeacherAssignment documents (new)

### Data Flow

```
User Action (Class/Teacher View)
    ↓
Frontend Validation
    ↓
API Request
    ↓
Backend Validation & Conflict Check
    ↓
Database Update (Timetable + Related)
    ↓
Synchronization Logic
    ↓
Response + Updated Data
    ↓
UI Update (Both Views if needed)
```

## Components and Interfaces

### Frontend Components

#### 1. ClassTimetableEditor
- **Purpose**: Edit timetables from class perspective
- **Props**: `classId`, `academicYear`
- **State**: `timetable`, `periods`, `schedule`, `availableTeachers`
- **Key Methods**:
  - `handleSlotClick(day, periodIndex)`: Open slot editor
  - `fetchAvailableTeachers(subject, day, periodIndex)`: Get qualified free teachers
  - `handleSaveSlot(slotData)`: Save slot and sync
  - `handleConflictResolution(conflict)`: Handle conflicts

#### 2. TeacherTimetableEditor
- **Purpose**: Edit timetables from teacher perspective
- **Props**: `teacherId`, `academicYear`
- **State**: `teacherSchedule`, `assignedClasses`, `conflicts`
- **Key Methods**:
  - `handleClassSwitch(day, periodIndex, newClassId)`: Switch class assignment
  - `validateClassSwitch(teacherId, classId, subject)`: Check if teacher can teach subject in class
  - `handleSaveSchedule()`: Save and sync with class timetables

#### 3. ClassSettingsPanel
- **Purpose**: Manage class tags and subjects
- **Props**: `classId`
- **State**: `classTag`, `selectedSubjects`
- **Key Methods**:
  - `handleTagUpdate(tag)`: Update class tag
  - `handleSubjectSelection(subjects)`: Update class subjects

#### 4. StaffAssignmentPanel
- **Purpose**: Manage teacher subject-class assignments
- **Props**: `staffId`
- **State**: `assignments`, `availableSubjects`, `availableClasses`
- **Key Methods**:
  - `handleAddAssignment(subject, classes)`: Add new assignment
  - `handleRemoveAssignment(assignmentId)`: Remove assignment
  - `validateAssignment(subject, classes)`: Validate before saving

#### 5. ConflictIndicator
- **Purpose**: Display and resolve scheduling conflicts
- **Props**: `conflicts`, `onResolve`
- **State**: `selectedResolution`
- **Key Methods**:
  - `displayConflictDetails(conflict)`: Show conflict information
  - `suggestResolutions(conflict)`: Provide resolution options

### Backend API Endpoints

#### Timetable Endpoints (Extended)

```
GET    /api/timetable/:classId?academicYear=:year
POST   /api/timetable
PUT    /api/timetable/:classId/slot
DELETE /api/timetable/:classId
```

#### New Teacher Timetable Endpoints

```
GET    /api/teacher-timetable/:teacherId?academicYear=:year
POST   /api/teacher-timetable/:teacherId
PUT    /api/teacher-timetable/:teacherId/slot
GET    /api/teacher-timetable/:teacherId/conflicts
```

#### Teacher Assignment Endpoints

```
GET    /api/teacher-assignments/:teacherId
POST   /api/teacher-assignments
PUT    /api/teacher-assignments/:id
DELETE /api/teacher-assignments/:id
GET    /api/teacher-assignments/available-teachers?classId=:id&subject=:subject&day=:day&period=:period
```

#### Class Settings Endpoints

```
PUT    /api/classes/:id/tag
PUT    /api/classes/:id/subjects
GET    /api/classes/:id/settings
```

### Backend Services

#### 1. TimetableService
- `getClassTimetable(classId, academicYear)`
- `getTeacherTimetable(teacherId, academicYear)`
- `updateClassSlot(classId, day, period, slotData)`
- `updateTeacherSlot(teacherId, day, period, slotData)`
- `syncTimetables(sourceType, sourceId, day, period, slotData)`

#### 2. ConflictDetectionService
- `checkTeacherConflict(teacherId, day, period, excludeClassId)`
- `getTeacherConflicts(teacherId, academicYear)`
- `validateSlotAssignment(teacherId, classId, day, period)`

#### 3. TeacherAssignmentService
- `getTeacherAssignments(teacherId)`
- `createAssignment(teacherId, subject, classIds)`
- `deleteAssignment(assignmentId)`
- `getAvailableTeachers(classId, subject, day, period)`
- `validateTeacherQualification(teacherId, classId, subject)`

## Data Models

### Extended Staff Model

```javascript
const staffSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // New fields for timetable management
  teacherAssignments: [{
    subject: { type: String, required: true },
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
```

### Extended Class Model

```javascript
const classSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // New fields for timetable management
  classTag: { type: String }, // Free-text tag
  assignedSubjects: [{ type: String }] // Subjects for this class
}, { timestamps: true });
```

### Extended Timetable Model

```javascript
const timetableSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear: { type: String, default: '2024-25' },
  periods: [{
    name: String,
    startTime: String,
    endTime: String,
    isBreak: { type: Boolean, default: false }
  }],
  schedule: {
    Monday: [{
      subject: String,
      teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
      room: String,
      // New fields
      lastModified: { type: Date, default: Date.now },
      modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
    }],
    // ... other days ...
  },
  // New fields
  version: { type: Number, default: 1 },
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

### New TeacherTimetable Model

```javascript
const teacherTimetableSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  academicYear: { type: String, default: '2024-25' },
  schedule: {
    Monday: [{
      periodIndex: Number,
      classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
      subject: String,
      room: String,
      lastModified: { type: Date, default: Date.now }
    }],
    // ... other days ...
  },
  totalPeriodsPerWeek: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

teacherTimetableSchema.index({ teacherId: 1, academicYear: 1 }, { unique: true });
```

### Conflict Log Model

```javascript
const conflictLogSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  conflictType: { type: String, enum: ['double_booking', 'unqualified', 'invalid_assignment'], required: true },
  day: { type: String, required: true },
  periodIndex: { type: Number, required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subject: String,
  detectedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  resolution: String,
  status: { type: String, enum: ['active', 'resolved', 'ignored'], default: 'active' }
}, { timestamps: true });
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Class tag persistence
*For any* class, when a class tag is saved, retrieving the class settings should return the same tag value
**Validates: Requirements 1.4**

### Property 2: Subject association persistence
*For any* class and set of subjects, when subjects are assigned to a class, retrieving the class should return the same set of subjects
**Validates: Requirements 1.3**

### Property 3: Teacher assignment persistence
*For any* teacher, subject, and set of classes, when a teacher-subject-class assignment is created, querying the teacher's assignments should include that assignment
**Validates: Requirements 2.4**

### Property 4: Bidirectional synchronization - class to teacher
*For any* class timetable update where a teacher is assigned to a time slot, the teacher's timetable should reflect the same assignment in the corresponding time slot
**Validates: Requirements 8.1**

### Property 5: Bidirectional synchronization - teacher to class
*For any* teacher timetable update where a class is assigned to a time slot, the class timetable should reflect the same teacher assignment in the corresponding time slot
**Validates: Requirements 8.2**

### Property 6: Conflict detection for double booking
*For any* teacher and time slot, if the teacher is already assigned to a class in that time slot, attempting to assign the teacher to a different class in the same time slot should be rejected with a conflict error
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 7: Available teacher filtering by qualification
*For any* class, subject, and time slot, the list of available teachers should only include teachers who have a teacher-subject-class assignment matching that class and subject
**Validates: Requirements 3.2, 7.1**

### Property 8: Available teacher filtering by availability
*For any* class, subject, and time slot, the list of available teachers should exclude teachers who are already assigned to another class in that time slot
**Validates: Requirements 3.3, 7.2**

### Property 9: Class switch validation
*For any* teacher, when switching from one class to another in a time slot, the teacher must have a valid teacher-subject-class assignment for the subject in the new class
**Validates: Requirements 5.4**

### Property 10: Deletion synchronization - class side
*For any* class timetable slot, when a teacher assignment is removed from a class time slot, the corresponding entry should be removed from the teacher's timetable
**Validates: Requirements 8.3**

### Property 11: Deletion synchronization - teacher side
*For any* teacher timetable slot, when a class assignment is removed from a teacher time slot, the corresponding teacher entry should be removed from the class timetable
**Validates: Requirements 8.4**

### Property 12: Conflict error details
*For any* detected conflict, the error message should include the teacher name, conflicting class name, day, and period information
**Validates: Requirements 6.4**

### Property 13: Teacher assignment query correctness
*For any* class and subject, querying available teachers should return only teachers whose teacherAssignments array contains an entry with that subject and that class in the classes array
**Validates: Requirements 9.2**

### Property 14: Empty slot identification
*For any* class timetable, querying for empty slots should return all time slots where the subject field is empty or null
**Validates: Requirements 10.1**

### Property 15: Teacher schedule gap identification
*For any* teacher timetable, querying for unassigned periods should return all time slots where no class is assigned
**Validates: Requirements 10.2**

## Error Handling

### Error Types

1. **ValidationError**: Invalid input data
   - Missing required fields
   - Invalid data types
   - Out-of-range values

2. **ConflictError**: Scheduling conflicts
   - Teacher double-booking
   - Unqualified teacher assignment
   - Invalid class-subject combination

3. **SynchronizationError**: Data consistency issues
   - Failed bidirectional sync
   - Version mismatch
   - Concurrent modification

4. **NotFoundError**: Resource not found
   - Invalid class ID
   - Invalid teacher ID
   - Non-existent timetable

5. **AuthorizationError**: Permission denied
   - Insufficient permissions
   - Invalid authentication token

### Error Handling Strategy

#### Frontend Error Handling

```javascript
try {
  await timetableApi.updateSlot(classId, slotData);
} catch (error) {
  if (error.type === 'ConflictError') {
    // Show conflict resolution UI
    showConflictDialog(error.details);
  } else if (error.type === 'ValidationError') {
    // Show validation errors
    showValidationErrors(error.fields);
  } else {
    // Show generic error
    showErrorToast(error.message);
  }
}
```

#### Backend Error Handling

```javascript
// Conflict detection middleware
async function checkConflicts(req, res, next) {
  try {
    const { teacherId, day, periodIndex, classId } = req.body;
    const conflict = await ConflictDetectionService.checkTeacherConflict(
      teacherId, day, periodIndex, classId
    );
    
    if (conflict) {
      return res.status(409).json({
        type: 'ConflictError',
        message: 'Teacher is already assigned to another class',
        details: conflict
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}
```

### Rollback Strategy

For failed synchronization operations:

1. **Transaction-like behavior**: Store original state before update
2. **Rollback on failure**: Restore original state if sync fails
3. **Conflict logging**: Log all conflicts for audit trail
4. **User notification**: Inform user of partial failure and rollback

```javascript
async function updateWithSync(classId, day, period, slotData) {
  // Store original state
  const originalClassTimetable = await Timetable.findOne({ classId });
  const originalTeacherTimetable = slotData.teacherId 
    ? await TeacherTimetable.findOne({ teacherId: slotData.teacherId })
    : null;
  
  try {
    // Update class timetable
    await updateClassSlot(classId, day, period, slotData);
    
    // Sync to teacher timetable
    if (slotData.teacherId) {
      await syncToTeacherTimetable(slotData.teacherId, classId, day, period, slotData);
    }
    
    return { success: true };
  } catch (error) {
    // Rollback on failure
    await Timetable.findOneAndUpdate(
      { classId },
      { schedule: originalClassTimetable.schedule }
    );
    
    if (originalTeacherTimetable) {
      await TeacherTimetable.findOneAndUpdate(
        { teacherId: slotData.teacherId },
        { schedule: originalTeacherTimetable.schedule }
      );
    }
    
    throw error;
  }
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

**Frontend Unit Tests:**
- Component rendering with various props
- State management and updates
- Event handler logic
- Data transformation functions
- Validation functions

**Backend Unit Tests:**
- API endpoint handlers
- Service layer functions
- Conflict detection logic
- Synchronization logic
- Data model methods

**Example Unit Tests:**
```javascript
// Test conflict detection
describe('ConflictDetectionService', () => {
  test('detects teacher double booking', async () => {
    const conflict = await checkTeacherConflict(teacherId, 'Monday', 1, classId);
    expect(conflict).toBeDefined();
    expect(conflict.type).toBe('double_booking');
  });
  
  test('allows assignment when no conflict', async () => {
    const conflict = await checkTeacherConflict(teacherId, 'Monday', 2, classId);
    expect(conflict).toBeNull();
  });
});

// Test synchronization
describe('TimetableService', () => {
  test('syncs class update to teacher timetable', async () => {
    await updateClassSlot(classId, 'Monday', 1, slotData);
    const teacherTimetable = await getTeacherTimetable(teacherId);
    expect(teacherTimetable.schedule.Monday[1].classId).toBe(classId);
  });
});
```

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript property-based testing library).

Each property-based test will run a minimum of 100 iterations to ensure thorough coverage.

**Property Test Examples:**

```javascript
import fc from 'fast-check';

// Property 1: Class tag persistence
test('Property 1: Class tag persistence', () => {
  fc.assert(
    fc.asyncProperty(
      fc.string(), // Random class tag
      async (classTag) => {
        const classId = await createTestClass();
        await updateClassTag(classId, classTag);
        const retrieved = await getClassSettings(classId);
        return retrieved.classTag === classTag;
      }
    ),
    { numRuns: 100 }
  );
});

// Property 6: Conflict detection for double booking
test('Property 6: Conflict detection for double booking', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        teacherId: fc.string(),
        day: fc.constantFrom('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
        period: fc.integer({ min: 0, max: 7 }),
        class1: fc.string(),
        class2: fc.string()
      }),
      async ({ teacherId, day, period, class1, class2 }) => {
        // Assign teacher to class1
        await assignTeacherToSlot(class1, day, period, teacherId);
        
        // Try to assign same teacher to class2 in same slot
        const result = await assignTeacherToSlot(class2, day, period, teacherId);
        
        // Should be rejected with conflict error
        return result.error && result.error.type === 'ConflictError';
      }
    ),
    { numRuns: 100 }
  );
});

// Property 4: Bidirectional synchronization - class to teacher
test('Property 4: Bidirectional synchronization - class to teacher', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        classId: fc.string(),
        teacherId: fc.string(),
        day: fc.constantFrom('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
        period: fc.integer({ min: 0, max: 7 }),
        subject: fc.string()
      }),
      async ({ classId, teacherId, day, period, subject }) => {
        // Update class timetable
        await updateClassSlot(classId, day, period, { teacherId, subject });
        
        // Check teacher timetable
        const teacherTimetable = await getTeacherTimetable(teacherId);
        const teacherSlot = teacherTimetable.schedule[day][period];
        
        return teacherSlot.classId === classId && teacherSlot.subject === subject;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Test Data Generators:**

```javascript
// Generator for valid teacher assignments
const teacherAssignmentArb = fc.record({
  teacherId: fc.string(),
  subject: fc.constantFrom('Math', 'Science', 'English', 'History'),
  classes: fc.array(fc.string(), { minLength: 1, maxLength: 5 })
});

// Generator for time slots
const timeSlotArb = fc.record({
  day: fc.constantFrom('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
  periodIndex: fc.integer({ min: 0, max: 7 })
});

// Generator for timetable slots
const timetableSlotArb = fc.record({
  subject: fc.string(),
  teacherId: fc.option(fc.string(), { nil: null }),
  room: fc.option(fc.string(), { nil: '' })
});
```

### Integration Testing

Integration tests will verify that multiple components work together correctly:

- API endpoint to database operations
- Frontend to backend communication
- Synchronization between class and teacher timetables
- Conflict detection across multiple operations
- Permission checks and authentication flow

### End-to-End Testing

E2E tests will verify complete user workflows:

- Create class timetable from scratch
- Edit teacher timetable and verify class timetable updates
- Handle conflict scenarios
- Switch classes for a teacher
- Manage teacher assignments
- Validate timetable completeness

## Performance Considerations

### Optimization Strategies

1. **Caching**: Cache frequently accessed data (class lists, teacher lists, subjects)
2. **Lazy Loading**: Load timetables on-demand rather than all at once
3. **Debouncing**: Debounce conflict checks during rapid edits
4. **Batch Operations**: Batch multiple slot updates into single database operations
5. **Indexing**: Add database indexes on frequently queried fields

### Database Indexes

```javascript
// Timetable indexes
timetableSchema.index({ classId: 1, academicYear: 1 }, { unique: true });
timetableSchema.index({ 'schedule.Monday.teacherId': 1 });
timetableSchema.index({ 'schedule.Tuesday.teacherId': 1 });
// ... other days

// TeacherTimetable indexes
teacherTimetableSchema.index({ teacherId: 1, academicYear: 1 }, { unique: true });

// Staff indexes for teacher assignments
staffSchema.index({ 'teacherAssignments.subject': 1 });
staffSchema.index({ 'teacherAssignments.classes': 1 });

// Conflict log indexes
conflictLogSchema.index({ teacherId: 1, status: 1 });
conflictLogSchema.index({ detectedAt: -1 });
```

### Scalability Considerations

- **Horizontal Scaling**: API servers can be scaled horizontally
- **Database Sharding**: Shard by academic year if needed
- **Read Replicas**: Use read replicas for query-heavy operations
- **WebSocket Optimization**: Use Socket.IO rooms for targeted updates

## Security Considerations

### Authentication & Authorization

- All API endpoints require authentication via JWT tokens
- Role-based access control (RBAC) for different operations:
  - **Admin**: Full access to all timetables and settings
  - **Teacher**: View own timetable, limited edit capabilities
  - **Class Teacher**: Edit assigned class timetable
  - **Staff**: View-only access

### Data Validation

- Input sanitization on all user inputs
- Schema validation using Mongoose validators
- Business logic validation before database operations
- XSS prevention on free-text fields (class tags)

### Audit Trail

- Log all timetable modifications with user and timestamp
- Track conflict resolutions
- Maintain version history for timetables
- Store modification metadata in each slot

## Deployment Considerations

### Migration Strategy

1. **Phase 1**: Add new fields to existing models (backward compatible)
2. **Phase 2**: Deploy new API endpoints
3. **Phase 3**: Deploy new UI components
4. **Phase 4**: Migrate existing timetable data to new format
5. **Phase 5**: Enable new features for users

### Rollback Plan

- Feature flags to enable/disable new functionality
- Database migration scripts with rollback capability
- Backup existing timetable data before migration
- Gradual rollout to subset of users first

### Monitoring

- Track API response times
- Monitor conflict detection frequency
- Log synchronization failures
- Alert on high error rates
- Track user adoption metrics
