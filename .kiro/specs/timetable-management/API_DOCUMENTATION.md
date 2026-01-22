# Timetable Management API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Class Settings Endpoints](#class-settings-endpoints)
4. [Teacher Assignment Endpoints](#teacher-assignment-endpoints)
5. [Class Timetable Endpoints](#class-timetable-endpoints)
6. [Teacher Timetable Endpoints](#teacher-timetable-endpoints)
7. [Validation Endpoints](#validation-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

## Overview

Base URL: `https://api.school.edu/api`

All endpoints require authentication via JWT token in the Authorization header.

### API Versioning
Current Version: `v1`

### Response Format
All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-01-23T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2025-01-23T10:30:00Z"
}
```

## Authentication

All API requests require a valid JWT token.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Obtaining a Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@school.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "role": "admin"
    }
  }
}
```

## Class Settings Endpoints

### Update Class Tag

Update the free-text tag for a class.

```http
PUT /api/classes/:id/tag
```

**Path Parameters:**
- `id` (string, required): Class ID

**Request Body:**
```json
{
  "classTag": "Science Stream"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "classTag": "Science Stream",
    "updatedAt": "2025-01-23T10:30:00Z"
  }
}
```

**Permissions Required:** `classes.edit`

---

### Update Class Subjects

Update the subjects assigned to a class.

```http
PUT /api/classes/:id/subjects
```

**Path Parameters:**
- `id` (string, required): Class ID

**Request Body:**
```json
{
  "assignedSubjects": ["Mathematics", "Physics", "Chemistry", "English"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "assignedSubjects": ["Mathematics", "Physics", "Chemistry", "English"],
    "updatedAt": "2025-01-23T10:30:00Z"
  }
}
```

**Permissions Required:** `classes.edit`

---

### Get Class Settings

Retrieve class settings including tag and subjects.

```http
GET /api/classes/:id/settings
```

**Path Parameters:**
- `id` (string, required): Class ID

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "className": "Class 10A",
    "classTag": "Science Stream",
    "assignedSubjects": ["Mathematics", "Physics", "Chemistry", "English"],
    "createdAt": "2024-09-01T00:00:00Z",
    "updatedAt": "2025-01-23T10:30:00Z"
  }
}
```

**Permissions Required:** `classes.view`

## Teacher Assignment Endpoints

### Get Teacher Assignments

Retrieve all subject-class assignments for a teacher.

```http
GET /api/teacher-assignments/:teacherId
```

**Path Parameters:**
- `teacherId` (string, required): Teacher/Staff ID

**Response:**
```json
{
  "success": true,
  "data": {
    "teacherId": "teacher_123",
    "teacherName": "John Smith",
    "assignments": [
      {
        "id": "assignment_1",
        "subject": "Mathematics",
        "classes": [
          {
            "id": "class_123",
            "name": "Class 10A"
          },
          {
            "id": "class_124",
            "name": "Class 10B"
          }
        ],
        "createdAt": "2024-09-01T00:00:00Z"
      },
      {
        "id": "assignment_2",
        "subject": "Physics",
        "classes": [
          {
            "id": "class_123",
            "name": "Class 10A"
          }
        ],
        "createdAt": "2024-09-01T00:00:00Z"
      }
    ]
  }
}
```

**Permissions Required:** `assignments.view`

---

### Create Teacher Assignment

Create a new subject-class assignment for a teacher.

```http
POST /api/teacher-assignments
```

**Request Body:**
```json
{
  "teacherId": "teacher_123",
  "subject": "Mathematics",
  "classes": ["class_123", "class_124", "class_125"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assignment_1",
    "teacherId": "teacher_123",
    "subject": "Mathematics",
    "classes": ["class_123", "class_124", "class_125"],
    "createdAt": "2025-01-23T10:30:00Z"
  },
  "message": "Teacher assignment created successfully"
}
```

**Permissions Required:** `assignments.edit`

---

### Update Teacher Assignment

Update an existing teacher assignment.

```http
PUT /api/teacher-assignments/:id
```

**Path Parameters:**
- `id` (string, required): Assignment ID

**Request Body:**
```json
{
  "subject": "Mathematics",
  "classes": ["class_123", "class_124"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assignment_1",
    "teacherId": "teacher_123",
    "subject": "Mathematics",
    "classes": ["class_123", "class_124"],
    "updatedAt": "2025-01-23T10:30:00Z"
  },
  "message": "Teacher assignment updated successfully"
}
```

**Permissions Required:** `assignments.edit`

---

### Delete Teacher Assignment

Remove a teacher assignment.

```http
DELETE /api/teacher-assignments/:id
```

**Path Parameters:**
- `id` (string, required): Assignment ID

**Response:**
```json
{
  "success": true,
  "message": "Teacher assignment deleted successfully"
}
```

**Permissions Required:** `assignments.edit`

---

### Get Available Teachers

Get list of teachers available for a specific class, subject, and time slot.

```http
GET /api/teacher-assignments/available-teachers
```

**Query Parameters:**
- `classId` (string, required): Class ID
- `subject` (string, required): Subject name
- `day` (string, required): Day of week (Monday-Saturday)
- `period` (integer, required): Period index (0-7)
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "data": {
    "availableTeachers": [
      {
        "id": "teacher_123",
        "name": "John Smith",
        "subject": "Mathematics",
        "currentLoad": 18,
        "maxLoad": 30
      },
      {
        "id": "teacher_124",
        "name": "Jane Doe",
        "subject": "Mathematics",
        "currentLoad": 15,
        "maxLoad": 30
      }
    ],
    "unavailableTeachers": [
      {
        "id": "teacher_125",
        "name": "Bob Johnson",
        "reason": "Already assigned to Class 10B at this time"
      }
    ]
  }
}
```

**Permissions Required:** `timetable.view`

## Class Timetable Endpoints

### Get Class Timetable

Retrieve the complete timetable for a class.

```http
GET /api/timetable/:classId
```

**Path Parameters:**
- `classId` (string, required): Class ID

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "className": "Class 10A",
    "academicYear": "2024-25",
    "periods": [
      {
        "name": "Period 1",
        "startTime": "08:00",
        "endTime": "08:45",
        "isBreak": false
      },
      {
        "name": "Break",
        "startTime": "10:30",
        "endTime": "10:45",
        "isBreak": true
      }
    ],
    "schedule": {
      "Monday": [
        {
          "subject": "Mathematics",
          "teacherId": "teacher_123",
          "teacherName": "John Smith",
          "room": "101",
          "lastModified": "2025-01-23T10:30:00Z",
          "modifiedBy": "admin_123"
        },
        {
          "subject": "Physics",
          "teacherId": "teacher_124",
          "teacherName": "Jane Doe",
          "room": "Lab 1",
          "lastModified": "2025-01-23T10:30:00Z",
          "modifiedBy": "admin_123"
        }
      ],
      "Tuesday": [ ... ],
      "Wednesday": [ ... ],
      "Thursday": [ ... ],
      "Friday": [ ... ],
      "Saturday": [ ... ]
    },
    "version": 5,
    "lastSyncedAt": "2025-01-23T10:30:00Z"
  }
}
```

**Permissions Required:** `timetable.view`

---

### Create/Update Class Timetable

Create or update a complete class timetable.

```http
POST /api/timetable
```

**Request Body:**
```json
{
  "classId": "class_123",
  "academicYear": "2024-25",
  "periods": [
    {
      "name": "Period 1",
      "startTime": "08:00",
      "endTime": "08:45",
      "isBreak": false
    }
  ],
  "schedule": {
    "Monday": [
      {
        "subject": "Mathematics",
        "teacherId": "teacher_123",
        "room": "101"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "academicYear": "2024-25",
    "version": 1,
    "createdAt": "2025-01-23T10:30:00Z"
  },
  "message": "Timetable created successfully"
}
```

**Permissions Required:** `timetable.edit`

---

### Update Class Timetable Slot

Update a specific time slot in a class timetable.

```http
PUT /api/timetable/:classId/slot
```

**Path Parameters:**
- `classId` (string, required): Class ID

**Request Body:**
```json
{
  "day": "Monday",
  "periodIndex": 0,
  "subject": "Mathematics",
  "teacherId": "teacher_123",
  "room": "101",
  "academicYear": "2024-25"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "day": "Monday",
    "periodIndex": 0,
    "slot": {
      "subject": "Mathematics",
      "teacherId": "teacher_123",
      "teacherName": "John Smith",
      "room": "101",
      "lastModified": "2025-01-23T10:30:00Z",
      "modifiedBy": "admin_123"
    },
    "synchronized": true,
    "teacherTimetableUpdated": true
  },
  "message": "Slot updated and synchronized successfully"
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "error": {
    "type": "ConflictError",
    "message": "Teacher is already assigned to another class",
    "details": {
      "teacherId": "teacher_123",
      "teacherName": "John Smith",
      "conflictingClass": "Class 10B",
      "day": "Monday",
      "periodIndex": 0,
      "suggestions": [
        {
          "teacherId": "teacher_124",
          "teacherName": "Jane Doe"
        }
      ]
    }
  }
}
```

**Permissions Required:** `timetable.edit`

---

### Delete Class Timetable

Delete an entire class timetable.

```http
DELETE /api/timetable/:classId
```

**Path Parameters:**
- `classId` (string, required): Class ID

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "message": "Timetable deleted successfully"
}
```

**Permissions Required:** `timetable.delete`

## Teacher Timetable Endpoints

### Get Teacher Timetable

Retrieve the complete timetable for a teacher.

```http
GET /api/teacher-timetable/:teacherId
```

**Path Parameters:**
- `teacherId` (string, required): Teacher/Staff ID

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "data": {
    "teacherId": "teacher_123",
    "teacherName": "John Smith",
    "academicYear": "2024-25",
    "schedule": {
      "Monday": [
        {
          "periodIndex": 0,
          "classId": "class_123",
          "className": "Class 10A",
          "subject": "Mathematics",
          "room": "101",
          "lastModified": "2025-01-23T10:30:00Z"
        },
        {
          "periodIndex": 1,
          "classId": "class_124",
          "className": "Class 10B",
          "subject": "Mathematics",
          "room": "102",
          "lastModified": "2025-01-23T10:30:00Z"
        }
      ],
      "Tuesday": [ ... ]
    },
    "totalPeriodsPerWeek": 24,
    "version": 3,
    "lastSyncedAt": "2025-01-23T10:30:00Z"
  }
}
```

**Permissions Required:** `timetable.view` or own teacher ID

---

### Create/Update Teacher Timetable

Create or update a teacher's timetable.

```http
POST /api/teacher-timetable/:teacherId
```

**Path Parameters:**
- `teacherId` (string, required): Teacher/Staff ID

**Request Body:**
```json
{
  "academicYear": "2024-25",
  "schedule": {
    "Monday": [
      {
        "periodIndex": 0,
        "classId": "class_123",
        "subject": "Mathematics",
        "room": "101"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teacherId": "teacher_123",
    "academicYear": "2024-25",
    "totalPeriodsPerWeek": 24,
    "version": 1,
    "createdAt": "2025-01-23T10:30:00Z"
  },
  "message": "Teacher timetable created successfully"
}
```

**Permissions Required:** `timetable.edit`

---

### Update Teacher Timetable Slot

Update a specific time slot in a teacher's timetable.

```http
PUT /api/teacher-timetable/:teacherId/slot
```

**Path Parameters:**
- `teacherId` (string, required): Teacher/Staff ID

**Request Body:**
```json
{
  "day": "Monday",
  "periodIndex": 0,
  "classId": "class_123",
  "subject": "Mathematics",
  "room": "101",
  "academicYear": "2024-25"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teacherId": "teacher_123",
    "day": "Monday",
    "periodIndex": 0,
    "slot": {
      "classId": "class_123",
      "className": "Class 10A",
      "subject": "Mathematics",
      "room": "101",
      "lastModified": "2025-01-23T10:30:00Z"
    },
    "synchronized": true,
    "classTimetableUpdated": true
  },
  "message": "Slot updated and synchronized successfully"
}
```

**Permissions Required:** `timetable.edit`

---

### Get Teacher Conflicts

Retrieve all scheduling conflicts for a teacher.

```http
GET /api/teacher-timetable/:teacherId/conflicts
```

**Path Parameters:**
- `teacherId` (string, required): Teacher/Staff ID

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)
- `status` (string, optional): Filter by status (active, resolved, ignored)

**Response:**
```json
{
  "success": true,
  "data": {
    "teacherId": "teacher_123",
    "teacherName": "John Smith",
    "conflicts": [
      {
        "id": "conflict_1",
        "type": "double_booking",
        "day": "Monday",
        "periodIndex": 0,
        "classes": [
          {
            "id": "class_123",
            "name": "Class 10A"
          },
          {
            "id": "class_124",
            "name": "Class 10B"
          }
        ],
        "subject": "Mathematics",
        "detectedAt": "2025-01-23T10:30:00Z",
        "status": "active"
      }
    ],
    "totalConflicts": 1,
    "activeConflicts": 1
  }
}
```

**Permissions Required:** `timetable.view`

## Validation Endpoints

### Validate Class Timetable

Check completeness and identify issues in a class timetable.

```http
GET /api/validation/class/:classId
```

**Path Parameters:**
- `classId` (string, required): Class ID

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "className": "Class 10A",
    "completeness": {
      "percentage": 85,
      "totalSlots": 40,
      "filledSlots": 34,
      "emptySlots": 6
    },
    "emptySlots": [
      {
        "day": "Monday",
        "periodIndex": 5,
        "periodName": "Period 6"
      },
      {
        "day": "Wednesday",
        "periodIndex": 3,
        "periodName": "Period 4"
      }
    ],
    "conflicts": [],
    "status": "incomplete"
  }
}
```

**Permissions Required:** `validation.view`

---

### Validate Teacher Timetable

Check teacher schedule for gaps and overload.

```http
GET /api/validation/teacher/:teacherId
```

**Path Parameters:**
- `teacherId` (string, required): Teacher/Staff ID

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "data": {
    "teacherId": "teacher_123",
    "teacherName": "John Smith",
    "workload": {
      "totalPeriods": 24,
      "targetPeriods": 30,
      "percentage": 80,
      "status": "underloaded"
    },
    "gaps": [
      {
        "day": "Tuesday",
        "periodIndex": 2,
        "periodName": "Period 3"
      }
    ],
    "conflicts": [],
    "status": "incomplete"
  }
}
```

**Permissions Required:** `validation.view`

---

### Get Validation Summary

Get overall validation summary for all classes and teachers.

```http
GET /api/validation/summary
```

**Query Parameters:**
- `academicYear` (string, optional): Academic year (default: current)

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-25",
    "classes": {
      "total": 20,
      "complete": 15,
      "incomplete": 5,
      "averageCompleteness": 92
    },
    "teachers": {
      "total": 30,
      "complete": 25,
      "underloaded": 3,
      "overloaded": 2,
      "averageWorkload": 85
    },
    "conflicts": {
      "total": 2,
      "active": 2,
      "resolved": 0
    },
    "lastUpdated": "2025-01-23T10:30:00Z"
  }
}
```

**Permissions Required:** `validation.view`

## Error Handling

### Error Types

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| ValidationError | 400 | Invalid input data |
| AuthenticationError | 401 | Invalid or missing token |
| AuthorizationError | 403 | Insufficient permissions |
| NotFoundError | 404 | Resource not found |
| ConflictError | 409 | Scheduling conflict |
| SynchronizationError | 500 | Sync failure |
| ServerError | 500 | Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": {
      "field": "teacherId",
      "reason": "Teacher ID is required"
    },
    "code": "VALIDATION_FAILED"
  },
  "timestamp": "2025-01-23T10:30:00Z"
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse.

### Limits
- **Standard Users**: 100 requests per minute
- **Admin Users**: 500 requests per minute
- **Bulk Operations**: 10 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642953600
```

### Rate Limit Exceeded Response (429)
```json
{
  "success": false,
  "error": {
    "type": "RateLimitError",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

---

**Version:** 1.0  
**Last Updated:** January 2025
