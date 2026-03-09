# AGENTS.md - AI Agent Guide for EMS (Education Management System)

> **Last Updated:** 2026-03-05  
> **Project Type:** Full-stack Education Management System (MERN + React Native)  
> **Platform:** Windows Development Environment

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Essential Commands](#essential-commands)
4. [Development Workflow](#development-workflow)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Mobile Apps Architecture](#mobile-apps-architecture)
8. [Database Patterns](#database-patterns)
9. [Testing Strategy](#testing-strategy)
10. [Common Patterns & Conventions](#common-patterns--conventions)
11. [Critical Gotchas](#critical-gotchas)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

This is a comprehensive Education Management System (EMS) consisting of:

- **Backend API**: Express.js + MongoDB (Node >=18.0.0)
- **School Dashboard**: React + Vite (Admin/Teacher web interface)
- **Parent App**: React Native + Expo (Mobile app for parents)
- **Staff App**: React Native + Expo (Mobile app for staff)
- **Owlin Tracker**: React + TypeScript (Tracking/analytics module)

**Tech Stack:**
- Backend: Express.js, MongoDB (Mongoose), Socket.IO, JWT, Firebase Admin
- Frontend: React 18, Vite, React Router v7, HeroUI, Tailwind CSS v4
- Mobile: React Native 0.76, Expo SDK 52, React Navigation v7
- Testing: Vitest (backend), Playwright (frontend e2e)
- Real-time: Socket.IO for chat, notifications, live updates

---

## Project Structure

```
EMS/
├── backend/                 # Express.js API server
│   ├── routes/             # API route handlers (resource-based)
│   ├── models/             # Mongoose schemas
│   ├── services/           # Business logic services
│   ├── middleware/         # Auth, permissions, validation
│   ├── socket/             # Socket.IO handlers
│   ├── tests/              # Vitest test files
│   ├── scripts/            # Utility scripts (DB fixes, migrations)
│   ├── jobs/               # Background job definitions (Agenda)
│   ├── config/             # Environment config, constants
│   ├── utils/              # Helper utilities
│   ├── migrations/         # Database migration scripts
│   ├── server.js           # Main server entry point
│   ├── database.js         # MongoDB connection + models
│   ├── package.json        # Backend dependencies
│   └── vitest.config.js    # Vitest configuration
│
├── school-dashboard/        # React admin/teacher dashboard
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # Base UI components (Button, Input, etc.)
│   │   ├── pages/          # Page-level components (route handlers)
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API integration (api.js)
│   │   ├── utils/          # Helper functions
│   │   └── App.jsx         # Main app component
│   ├── tests/              # Playwright e2e tests
│   ├── package.json
│   ├── vite.config.js
│   └── playwright.config.ts
│
├── parent-app/              # React Native parent mobile app
│   ├── src/
│   ├── App.js
│   └── package.json
│
├── staff-app/               # React Native staff mobile app
│   ├── src/
│   ├── App.js
│   └── package.json
│
├── owlin/                   # Tracking/analytics module
│   ├── src/
│   ├── server/             # Owlin backend
│   ├── sdk/                # Owlin SDK
│   └── package.json
│
├── MDs/                     # Documentation & guidelines
│   ├── CLAUDE_NOT_TO_DO.md # Lessons learned, common mistakes
│   ├── STYLE_GUIDE.md      # Design/UI style guide
│   └── TASK_INITIATOR.md   # Development workflow guide
│
└── package.json             # Root package (workspace utilities)
```

---

## Essential Commands

### Backend (Express API)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start server (production mode)
npm start

# Start server with auto-reload (development)
npm run dev

# Run tests
npm test              # Run all tests once
npm run test:watch    # Watch mode

# Database operations
npm run seed          # Seed database with sample data
npm run db:check      # Check for database issues
npm run db:fix        # Fix database issues
npm run db:health     # Monitor database health

# Utility scripts
node seed.js                              # Seed database
node scripts/fixDuplicateClassTeachers.js # Fix duplicate class teachers
node scripts/check-pagination-issues.js   # Check pagination
node scripts/fix-database-issues.js       # Fix database issues
node scripts/monitor-database-health.js   # Monitor health
node scripts/check-5a-data.js            # Check specific class data

# Port management (Windows PowerShell)
./kill-port-3001.ps1      # Kill process on port 3001
./start-backend.ps1       # Start backend with port cleanup
```

**Default Port:** 3001

### School Dashboard (React + Vite)

```bash
# Navigate to dashboard
cd school-dashboard

# Install dependencies
npm install

# Start development server
npm run dev           # Usually runs on port 5173

# Build for production
npm run build

# Preview production build
npm run preview

# Run Playwright tests
npm test              # Run all tests
npm run test:headed   # Run with browser UI
npm run test:debug    # Debug mode
npm run test:ui       # Interactive UI mode
npm run test:report   # Show test report
npm run test:install  # Install Playwright browsers

# Clear Vite cache (if issues)
./fix-vite-cache.bat  # Windows
./fix-vite-cache.sh   # Linux/Mac

# Console error checking
node check-console.js http://localhost:5173
./test-console-errors.bat  # Windows
./test-console-errors.sh   # Linux/Mac
```

**Default Port:** 5173

### Parent App (React Native + Expo)

```bash
# Navigate to parent app
cd parent-app

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Staff App (React Native + Expo)

```bash
# Navigate to staff app
cd staff-app

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Quick start (Windows)
./start.bat
./start.sh  # Linux/Mac
```

### Owlin Tracker

```bash
# Navigate to owlin
cd owlin

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Development Workflow

### Pre-Flight Checklist (CRITICAL)

**Before starting any development or testing, verify:**

#### 1. MongoDB Status
```bash
# Windows: Check if MongoDB is running
tasklist | findstr mongod

# Start MongoDB service
net start MongoDB

# Or start manually (if installed locally)
"C:\Program Files\MongoDB\Server\X.X\bin\mongod.exe" --dbpath "C:\data\db"
```

#### 2. Backend Server Status
```bash
# Check if backend is running
curl http://localhost:3001/api

# Check port usage
netstat -ano | findstr :3001

# Start backend
cd backend
npm start

# Or with auto-reload
npm run dev
```

#### 3. Frontend Dev Server Status
```bash
# Check if Vite is running
curl http://localhost:5173

# Start frontend
cd school-dashboard
npm run dev
```

#### 4. Quick Health Check
```bash
# Test API endpoints (should return JSON, not hang)
curl http://localhost:3001/api/announcements
curl http://localhost:3001/api/reminders

# If requests hang → MongoDB is likely not running!
```

#### 5. Backend Log Monitoring (CRITICAL)

**Always check backend logs when APIs fail or timeout!**

```bash
# Method 1: Terminal Output (Most Common)
# Simply watch the terminal where you ran: cd backend && npm start

# Method 2: Real-time Log Monitoring (if logging to file)
tail -f backend/logs/error.log
tail -f backend/logs/combined.log

# Method 3: PM2 Process Manager (if using PM2)
pm2 logs
pm2 logs backend --lines 100

# Method 4: Docker/Container (if containerized)
docker logs <container-name> -f
docker-compose logs backend -f
```

**Common Backend Log Patterns to Watch For:**

```bash
# MongoDB Connection Issues
❌ MongooseError: Connection failed
❌ MongoServerError: Authentication failed
❌ ECONNREFUSED mongodb://localhost:27017
✅ Solution: Start MongoDB service

# Port Conflict Issues
❌ EADDRINUSE: address already in use :::3001
✅ Solution: Kill process using port 3001 (netstat -ano | findstr :3001)

# Database Validation Errors
❌ ValidationError: <field> is required
❌ CastError: Cast to ObjectId failed
✅ Solution: Check data matches schema, verify required fields

# Authentication/Authorization Errors
❌ Unauthorized: Invalid token
❌ JWT malformed
❌ 401 Unauthorized / 403 Forbidden
✅ Solution: Check token in storage, verify permissions

# Import/Module Errors
❌ Cannot find module './routes/xxx'
❌ SyntaxError: Unexpected token
✅ Solution: Check import paths, verify dependencies installed
```

### Standard Development Flow

1. **Investigation Phase**
   - Read component/file structure
   - Check imports and dependencies
   - Verify data sources (state, context, props)
   - Look for similar patterns in codebase
   - Check database schema if touching queries

2. **Implementation Phase**
   - Follow existing patterns
   - Match code style exactly
   - Add error handling
   - Update related files (tests, docs)

3. **Testing Phase**
   - Run relevant tests first (unit → integration → e2e)
   - Check console for errors
   - Verify in browser/app
   - Run full test suite if major changes

4. **Verification Phase**
   - Check backend logs for errors
   - Verify no console errors in frontend
   - Test edge cases
   - Ensure no regressions

### Autonomous Development Rules

**✅ DO Automatically (No Permission Needed):**
- Install packages/dependencies
- Create new files
- Modify existing files
- Execute commands (npm, git, curl, etc.)
- Fix errors and bugs
- Refactor code
- Run tests and checks
- Make decisions based on best practices
- Continue iterating on errors

**⚠️ ASK Before:**
- Deleting files
- Major architecture changes
- Breaking API changes
- Database migrations (destructive)
- Production deployments

### Error Handling Flow

When errors occur:

1. Read complete error message
2. **Check backend logs** (if API-related)
3. Understand root cause
4. Try different approach (don't repeat same action)
5. Search for similar code that works
6. Make targeted fix
7. Test to verify
8. Document if it's a new pattern

**Common Mistakes to Avoid:** See `MDs/CLAUDE_NOT_TO_DO.md` for detailed lessons learned.

---

## Backend Architecture

### Tech Stack

- **Framework:** Express.js (ES modules)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (access + refresh tokens)
- **Real-time:** Socket.IO
- **File Storage:** Cloudinary (with base64 fallback)
- **File Upload:** Multer (memory storage, 10MB limit)
- **Rate Limiting:** express-rate-limit
- **Background Jobs:** Agenda (MongoDB-based)
- **Validation:** Joi
- **Email:** Nodemailer (SMTP)
- **SMS/WhatsApp:** MSG91
- **Firebase:** Firebase Admin SDK (push notifications, OTP)
- **Video Calls:** PeerJS
- **Testing:** Vitest + mongodb-memory-server

### Server Configuration

**Rate Limiting:**
- Global: 3000 requests per 15 minutes (per IP, skips localhost in dev)
- Auth: 5 login attempts per 15 minutes (skips successful requests)
- Upload: 50 uploads per hour

**CORS:**
- Development: Allow all origins
- Production: Whitelist-based with wildcard support
- Credentials: Enabled
- Methods: GET, POST, PUT, DELETE, OPTIONS

**Body Parsing:**
- JSON: 50MB limit
- URL-encoded: 50MB limit

**Port:** 3001 (configurable via `PORT` env var)

### Directory Structure

```
backend/
├── routes/          # API route handlers (one file per resource)
├── models/          # Mongoose schemas
├── services/        # Business logic services
│   ├── timetableService.js
│   ├── conflictDetectionService.js
│   ├── batchOperationsService.js
│   └── cacheService.js
├── middleware/      # Express middleware
│   ├── auth.js              # JWT authentication
│   ├── permissions.js       # Role-based access control
│   └── validation.js        # Request validation (Joi)
├── socket/          # Socket.IO event handlers
│   └── chatHandler.js
├── tests/           # Vitest test files
│   └── timetable/   # Feature-specific test suites
├── scripts/         # Utility scripts
├── jobs/            # Background job definitions
├── config/          # Environment configuration
├── utils/           # Helper utilities
│   └── socketEmitter.js
├── migrations/      # Database migration scripts
├── server.js        # Main entry point
├── database.js      # MongoDB connection + model exports
└── vitest.config.js # Test configuration
```

### Route Organization

**Pattern:** Resource-based files

```javascript
// Example: routes/staffAttendance.js
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import StaffAttendance from '../models/StaffAttendance.js';

const router = express.Router();

// RESTful endpoints
router.get('/', authenticate, async (req, res) => {
  try {
    // Implementation
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, checkPermission('staff_attendance', 'create'), async (req, res) => {
  // Implementation
});

export default router;
```

**Naming Conventions:**
- File names: camelCase (e.g., `staffAttendance.js`, `parentAuth.js`)
- Routes: RESTful paths with kebab-case (e.g., `/mobile/mark`, `/leave/pending`)
- Handlers: Async arrow functions
- Actions: `/bulk`, `/regularize`, `/verify-otp`, `/send-otp`
- Nested resources: `/staff/:staffId/today`, `/class/:classId/report`

**Common Patterns:**
- Try-catch blocks in all route handlers
- Consistent error response format: `{ error: error.message }`
- Middleware applied per-route: `router.get('/payments', authenticate, async (req, res) => {`
- Manual validation in route handlers (check Joi schemas in `middleware/validation.js`)

### Authentication & Authorization

**JWT-based Authentication:**
- Bearer token in `Authorization` header
- Token payload: `{ userId, role, userType }`
- Access token: 15 minutes expiry
- Refresh token: 30 days expiry
- Tokens stored in sessionStorage (frontend)

**Multiple Auth Methods:**
- Password-based: email/phone + password (bcrypt)
- Firebase OTP: Phone verification with Firebase Admin SDK
- Parent-specific: `userType: 'parent'` in JWT

**Middleware:**
- `authenticate`: Verifies JWT token, attaches `req.user`
- `requireAdmin`: Checks `UserPermission` model for admin role
- `checkPermission(resource, action)`: RBAC permission checking
- `optionalAuth`: Allows both authenticated and guest access

**Roles:**
- `admin`: Full system access
- `teacher`: Teaching-related features
- `parent`: Parent-specific features
- Custom permissions via `UserPermission` model

### Database Models

**Schema Definition Pattern:**

```javascript
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  // Fields with validation
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  
  // Arrays
  subjects: [{ type: String }],
  
  // Nested objects
  address: {
    street: String,
    city: String,
    pincode: String
  }
}, {
  timestamps: true  // Adds createdAt, updatedAt
});

// Indexes
schema.index({ email: 1 });
schema.index({ status: 1, createdAt: -1 });

// Pre-save hooks
schema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Instance methods
schema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static methods
schema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Virtual properties
schema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('ModelName', schema);
```

**Naming Conventions:**
- Model names: PascalCase (e.g., `Staff`, `Student`, `TeacherLeave`)
- Field names: camelCase (e.g., `firstName`, `createdAt`)
- ID references: `teacherId`, `staffId`, `studentId`
- Date fields: `createdAt`, `updatedAt`, `deletedAt`, `appliedAt`
- Status fields: `status`, `approvalStatus`
- Refs: `type: mongoose.Schema.Types.ObjectId, ref: 'ModelName'`

**Common Validation Patterns:**
- `required: true` for mandatory fields
- `enum: [...]` for restricted values
- `trim: true`, `lowercase: true` for string normalization
- `maxlength` for length constraints
- `unique: true` with `sparse: true` for optional unique fields
- `default` values extensively used

**Soft-Delete Pattern:**
- Uses separate `TrashItem` model (not inline `isDeleted` flags)
- TrashItem stores: `deletedAt`, `deletedBy`, `expiresAt`, `originalData`
- Original documents are deleted from collection, stored in trash
- Trash items auto-expire after configured period

### API Response Patterns

**Success Responses:**
```javascript
// List/Collection
res.json({ data: items, total: count, page, limit });

// Single item
res.json({ data: item });

// Action result
res.json({ success: true, message: 'Action completed', data: result });
```

**Error Responses:**
```javascript
// Generic error
res.status(500).json({ error: error.message });

// Validation error
res.status(400).json({ error: 'Validation failed', details: validationErrors });

// Not found
res.status(404).json({ error: 'Resource not found' });

// Unauthorized
res.status(401).json({ error: 'Unauthorized' });

// Forbidden
res.status(403).json({ error: 'Forbidden - Insufficient permissions' });

// Rate limit
res.status(429).json({ error: 'Too many requests' });
```

### Services Layer

**Location:** `backend/services/`

**Purpose:** Business logic separation from route handlers

**Key Services:**
- `timetableService.js`: Timetable generation, conflict resolution
- `conflictDetectionService.js`: Teacher/room conflict detection
- `batchOperationsService.js`: Batch processing utilities
- `cacheService.js`: In-memory caching for performance

**Pattern:**
```javascript
// services/exampleService.js
export const exampleService = {
  async processData(data) {
    // Business logic
    return result;
  },
  
  async validateInput(input) {
    // Validation logic
    return isValid;
  }
};

// Usage in route
import { exampleService } from '../services/exampleService.js';

router.post('/process', async (req, res) => {
  try {
    const result = await exampleService.processData(req.body);
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Socket.IO Integration

**Initialization:** `server.js` creates Socket.IO server, attaches to Express

**Event Handlers:** `socket/chatHandler.js` and similar

**Access in Routes:**
```javascript
// Emit from route handler
const io = req.app.get('io');
io.to(roomId).emit('message', data);

// Using socket emitter utility
import { emitToRoom, emitToUser } from '../utils/socketEmitter.js';
emitToRoom(roomId, 'event', data);
emitToUser(userId, 'notification', data);
```

**Common Events:**
- `chat:message`: New chat message
- `notification:new`: New notification
- `attendance:updated`: Attendance changes
- `timetable:changed`: Timetable updates

### Background Jobs

**Framework:** Agenda (MongoDB-based job scheduler)

**Location:** `backend/jobs/`

**Configuration:**
```javascript
// .env
AGENDA_DB_COLLECTION=jobs
AGENDA_PROCESS_EVERY=5_seconds
```

**Job Definition Pattern:**
```javascript
// jobs/exampleJob.js
export default function defineJob(agenda) {
  agenda.define('job-name', async (job) => {
    const { data } = job.attrs;
    // Job logic
  });
}

// Schedule job
await agenda.schedule('in 5 minutes', 'job-name', { data });
await agenda.every('0 9 * * *', 'daily-report');  // Cron syntax
```

### Environment Variables

**Required Variables:** See `backend/.env.example`

**Key Variables:**
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret for JWT signing
- `CLOUDINARY_*`: Cloudinary credentials (optional)
- `SMTP_*`: Email service configuration
- `MSG91_*`: SMS/WhatsApp service configuration
- `FIREBASE_*`: Firebase Admin SDK config
- `FRONTEND_URL`: Frontend URL for CORS

**Validation:** `config/environment.js` validates environment on startup

---

## Frontend Architecture

### Tech Stack (School Dashboard)

- **Framework:** React 18.3.1
- **Build Tool:** Vite 6.0.3
- **Router:** React Router v7.10.1
- **UI Library:** HeroUI 2.8.7 (Next UI fork)
- **Styling:** Tailwind CSS v4.1.18
- **Icons:** Lucide React 0.468.0
- **State Management:** React Context API
- **HTTP Client:** Fetch API (custom wrapper)
- **Real-time:** Socket.IO Client 4.8.3
- **Notifications:** React Hot Toast 2.6.0
- **Animation:** Framer Motion 11.15.0
- **3D Graphics:** Three.js + React Three Fiber (for visualizations)
- **Testing:** Playwright 1.57.0

### Directory Structure

```
school-dashboard/src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components (Button, Input, Modal, etc.)
│   │   └── index.js    # Barrel export for cleaner imports
│   ├── onboarding/     # Onboarding flow components
│   ├── AiAssistant/    # AI assistant panel
│   └── ...             # Other shared components
│
├── pages/              # Page-level components (route handlers)
│   ├── students/       # Student management pages
│   │   ├── index.jsx   # Re-exports for cleaner imports
│   │   ├── StudentsList.jsx
│   │   ├── StudentDetails.jsx
│   │   └── components/ # Page-specific components
│   ├── staffs/         # Staff management pages
│   ├── classes/        # Class management pages
│   ├── messaging/      # Messaging/communication pages
│   └── ...             # Other feature pages
│
├── context/            # React Context providers
│   ├── AuthContext.jsx        # Authentication & user session
│   ├── AppContext.jsx         # Global app state (students, staff, classes)
│   ├── PermissionContext.jsx  # Role-based access control
│   ├── ChatNotificationContext.jsx  # Real-time chat notifications
│   ├── StaffContext.jsx       # Staff-specific state
│   └── StudentsContext.jsx    # Students-specific state
│
├── hooks/              # Custom React hooks
│   ├── useOwlinTracking.js
│   ├── useScrollVisibility.js
│   ├── useSettingsForm.js
│   └── ...
│
├── services/           # API integration
│   └── api.js          # Centralized API service with request queue
│
├── utils/              # Helper utilities
│
└── App.jsx             # Main app component (routing, context providers)
```

### Component Organization

**Patterns:**
- Shared components → `src/components/`
- Page components → `src/pages/{feature}/`
- Feature-specific components → `src/pages/{feature}/components/`
- UI primitives → `src/components/ui/` (exported via index.js)

**Import Example:**
```javascript
// Instead of:
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// Use barrel export:
import { Button, Input, Modal } from '../components/ui';
```

### State Management

**Primary Approach:** React Context API

**Context Hierarchy:**
```
App
├── AuthContext (authentication, session)
├── PermissionContext (RBAC)
└── AppContext (global app state)
    ├── ChatNotificationContext
    ├── StaffContext
    └── StudentsContext
```

**Context Pattern:**
```javascript
// context/ExampleContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ExampleContext = createContext();

export const ExampleProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.getData();
      setData(response);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExampleContext.Provider value={{ data, loading, loadData, setData }}>
      {children}
    </ExampleContext.Provider>
  );
};

export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample must be used within ExampleProvider');
  }
  return context;
};
```

**Usage in Components:**
```javascript
import { useExample } from '../context/ExampleContext';

function MyComponent() {
  const { data, loading, loadData } = useExample();
  
  if (loading) return <Loading />;
  
  return <div>{data.map(item => ...)}</div>;
}
```

**Local State:** Use `useState` for component-level state

**Custom Hooks:** Extract reusable logic into custom hooks in `src/hooks/`

### Routing

**Router:** React Router v7 (latest)

**Pattern:** Nested routes with lazy loading

```javascript
// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PermissionGuard from './components/PermissionGuard';

// Lazy load pages
const StudentsList = lazy(() => import('./pages/students/StudentsList'));
const StaffsList = lazy(() => import('./pages/staffs/StaffsList'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<PermissionGuard />}>
          <Route path="/students" element={<StudentsList />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          <Route path="/staffs" element={<StaffsList />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
}
```

**Route Guards:** `PermissionGuard` component wraps routes requiring authentication/authorization

**Lazy Loading:** All pages lazy-loaded with `React.lazy()` and `Suspense`

**Layout:** Sidebar + Topbar persistent, main content swapped via routes

### API Integration

**Centralized Service:** `src/services/api.js`

**Features:**
- Request queue to prevent rate limiting (max 5 concurrent, 100ms delay)
- Automatic retry with exponential backoff
- Response caching for GET requests (30s TTL)
- Global error handling (401 → clear session)
- Bearer token authentication from `sessionStorage`
- 15-second timeout with AbortController

**API Module Pattern:**
```javascript
// services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const studentsApi = {
  getAll: (skipCache = false) => request('/students', { skipCache }),
  getById: (id) => request(`/students/${id}`),
  create: (data) => request('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => request(`/students/${id}`, {
    method: 'DELETE'
  })
};

export const staffApi = { /* ... */ };
export const classesApi = { /* ... */ };
```

**Usage in Components:**
```javascript
import { studentsApi } from '../services/api';
import toast from 'react-hot-toast';

function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (error) {
      toast.error(`Failed to load students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return /* JSX */;
}
```

**Error Handling Pattern:**
```javascript
try {
  const result = await api.someAction(data);
  toast.success('Action completed successfully');
  return result;
} catch (error) {
  // Check for specific error types
  if (error.message.includes('Unauthorized')) {
    toast.error('Session expired. Please login again.');
    // Clear session and redirect
  } else if (error.message.includes('Network')) {
    toast.error('Network error. Please check your connection.');
  } else {
    toast.error(`Failed: ${error.message}`);
  }
  throw error;  // Re-throw if caller needs to handle
}
```

### Rate Limiting (Frontend)

**CRITICAL:** Backend has rate limits (3000 req/15min). Frontend implements:

1. **Request Queue:** Max 5 concurrent requests, 100ms delay between requests
2. **Response Caching:** 30s TTL for GET requests
3. **Batch Loading:** Process 3-5 items at a time with delays

**❌ Bad Pattern (Causes 429 Errors):**
```javascript
// DON'T DO THIS - Too many simultaneous requests
const loadData = async () => {
  const promises = items.map(item => api.getData(item.id));
  const results = await Promise.all(promises); // 20+ requests at once!
};
```

**✅ Good Pattern (Batched Loading):**
```javascript
// DO THIS - Controlled batching
const loadData = async () => {
  const batchSize = 3;
  const delay = 300;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(item => api.getData(item.id));
    const results = await Promise.all(promises);
    
    updateUI(results);
    
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

**See:** `school-dashboard/RATE_LIMITING.md` for detailed architecture

### Styling

**Framework:** Tailwind CSS v4 + HeroUI components

**Theme:** Supports light/dark mode (next-themes)

**Design System:** See `school-dashboard/STYLE_GUIDE.md` for:
- Layout & structure
- Typography (Inter font, weights, sizes)
- Color palette (light/dark mode)
- Component states (idle, hover, active)
- Visual effects (shadows, borders, transitions)

**Common Patterns:**
```javascript
// HeroUI components
import { Button, Input, Modal, Card } from '@heroui/react';

// Styling with Tailwind
<div className="flex items-center gap-4 p-6 bg-white dark:bg-zinc-900 rounded-lg">
  <Button color="primary" size="md">Click Me</Button>
</div>

// Conditional classes
<div className={`base-classes ${condition ? 'active-classes' : 'inactive-classes'}`}>
```

**Icons:** Lucide React
```javascript
import { ChevronRight, User, Settings } from 'lucide-react';

<ChevronRight size={20} className="text-gray-500" />
```

### Real-time Features (Socket.IO)

**Initialization:**
```javascript
// Connect to Socket.IO server
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: sessionStorage.getItem('token')
  }
});

// Listen for events
socket.on('notification:new', (data) => {
  toast.info(data.message);
});

// Emit events
socket.emit('chat:join', { roomId: 'room123' });
```

**Common Events:**
- `notification:new`: New notification
- `chat:message`: New chat message
- `attendance:updated`: Attendance changes
- `timetable:changed`: Timetable updates

**Context Integration:** `ChatNotificationContext` manages socket connection and state

---

## Mobile Apps Architecture

### Parent App & Staff App

**Framework:** React Native 0.76 + Expo SDK 52

**Navigation:** React Navigation v7 (native-stack, bottom-tabs, stack)

**Storage:** AsyncStorage + Expo SecureStore (for tokens)

**Features:**
- Bottom tab navigation
- Stack navigation for detail screens
- Secure token storage
- Push notifications (Expo Notifications)
- Image picker (Expo Image Picker)
- Camera access (Expo Camera)
- Haptic feedback (Expo Haptics)

**Key Dependencies:**
- `expo`: ~52.0.0
- `react-native`: 0.76.x
- `@react-navigation/*`: v7.x
- `socket.io-client`: ^4.7.2
- `lucide-react-native`: ^0.460.0
- `@react-native-async-storage/async-storage`: 1.23.1
- `expo-secure-store`: For secure token storage

**Start Commands:**
```bash
# Parent App
cd parent-app
npm start        # Start Expo dev server
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run in web browser

# Staff App
cd staff-app
npm start        # Start Expo dev server
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run in web browser

# Quick start (Windows)
./start.bat      # Runs npm start
```

**API Integration:** Uses same backend API (http://localhost:3001/api in dev)

**Authentication:** JWT tokens stored in SecureStore, sent in Authorization header

---

## Database Patterns

### MongoDB Connection

**File:** `backend/database.js`

**Connection:**
```javascript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

export default mongoose;
```

### Schema Patterns

**Basic Schema:**
```javascript
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
}, {
  timestamps: true  // Adds createdAt, updatedAt
});

// Indexes
schema.index({ email: 1 });
schema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ModelName', schema);
```

**Avoid Duplicate Model Registration:**
```javascript
// Use this pattern to prevent model recompilation errors
export default mongoose.models.ModelName || mongoose.model('ModelName', schema);
```

### Soft Delete Pattern

**Implementation:** Separate `TrashItem` model (not inline `isDeleted` flags)

**TrashItem Schema:**
```javascript
const trashItemSchema = new mongoose.Schema({
  itemType: { type: String, required: true },  // 'Student', 'Staff', etc.
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  originalData: { type: mongoose.Schema.Types.Mixed, required: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  deletedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },  // Auto-delete after 30 days
});
```

**Usage:**
```javascript
// Soft delete a student
const student = await Student.findById(id);
await TrashItem.create({
  itemType: 'Student',
  itemId: student._id,
  originalData: student.toObject(),
  deletedBy: req.user.userId,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days
});
await Student.findByIdAndDelete(id);

// Restore from trash
const trashItem = await TrashItem.findOne({ itemId, itemType: 'Student' });
await Student.create(trashItem.originalData);
await TrashItem.findByIdAndDelete(trashItem._id);
```

**CRITICAL:** Always filter deleted items in list queries if using inline soft-delete:
```javascript
// If schema has isDeleted field
const query = classId 
  ? { classId, isDeleted: false } 
  : { isDeleted: false };
```

### Common Query Patterns

**Find with Pagination:**
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const items = await Model.find(query)
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 })
  .populate('teacherId', 'name email');

const total = await Model.countDocuments(query);

res.json({ data: items, total, page, limit });
```

**Search/Filter:**
```javascript
const query = {};

// Text search
if (req.query.search) {
  query.$or = [
    { name: { $regex: req.query.search, $options: 'i' } },
    { email: { $regex: req.query.search, $options: 'i' } }
  ];
}

// Status filter
if (req.query.status) {
  query.status = req.query.status;
}

// Date range
if (req.query.startDate && req.query.endDate) {
  query.createdAt = {
    $gte: new Date(req.query.startDate),
    $lte: new Date(req.query.endDate)
  };
}

const items = await Model.find(query);
```

**Aggregation:**
```javascript
const results = await Model.aggregate([
  { $match: { status: 'active' } },
  { $group: {
    _id: '$classId',
    count: { $sum: 1 },
    avgScore: { $avg: '$score' }
  }},
  { $sort: { count: -1 } },
  { $limit: 10 }
]);
```

### Indexes

**Always index fields used in:**
- Queries (find, aggregate)
- Sorts (sort)
- Unique constraints (unique: true)

**Example:**
```javascript
// Single field index
schema.index({ email: 1 });

// Compound index
schema.index({ status: 1, createdAt: -1 });

// Text search index
schema.index({ name: 'text', description: 'text' });

// Sparse unique index (for optional unique fields)
schema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
```

### Validation Helpers

**Check required fields before querying:**
```javascript
if (!id || !mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ error: 'Invalid or missing ID' });
}
```

**Validate enum values:**
```javascript
const validStatuses = ['active', 'inactive', 'pending'];
if (!validStatuses.includes(req.body.status)) {
  return res.status(400).json({ error: 'Invalid status' });
}
```

**Type coercion:**
```javascript
// String to ObjectId
const staffId = mongoose.Types.ObjectId(req.params.staffId);

// String to Number
const age = parseInt(req.body.age);
const score = parseFloat(req.body.score);

// String to Date
const date = new Date(req.body.date);
```

---

## Testing Strategy

### Backend Testing (Vitest)

**Framework:** Vitest + mongodb-memory-server

**Config:** `backend/vitest.config.js`

**Test Location:** `backend/tests/`

**Commands:**
```bash
cd backend
npm test              # Run all tests once
npm run test:watch    # Watch mode
```

**Test Pattern:**
```javascript
// tests/timetable/validation.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Timetable from '../../models/Timetable.js';

describe('Timetable Validation', () => {
  let mongoServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should validate required fields', async () => {
    const timetable = new Timetable({});
    await expect(timetable.validate()).rejects.toThrow();
  });

  it('should create valid timetable', async () => {
    const timetable = await Timetable.create({
      classId: new mongoose.Types.ObjectId(),
      day: 'Monday',
      periods: [{ /* ... */ }]
    });
    expect(timetable._id).toBeDefined();
  });
});
```

**Test Organization:**
- Feature-based directories (e.g., `tests/timetable/`)
- Test types: validation, integration, conflict scenarios
- Use mongodb-memory-server for isolated DB tests

### Frontend Testing (Playwright)

**Framework:** Playwright 1.57.0

**Config:** `school-dashboard/playwright.config.ts`

**Test Location:** `school-dashboard/tests/`

**Commands:**
```bash
cd school-dashboard
npm test              # Run all tests
npm run test:headed   # Run with browser UI
npm run test:debug    # Debug mode
npm run test:ui       # Interactive UI mode
npm run test:report   # Show test report
npm run test:install  # Install Playwright browsers (first time)
```

**Test Pattern:**
```javascript
// tests/students.spec.js
import { test, expect } from '@playwright/test';

test.describe('Students Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('[name="email"]', 'admin@school.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display students list', async ({ page }) => {
    await page.goto('http://localhost:5173/students');
    await expect(page.locator('h1')).toContainText('Students');
    await expect(page.locator('table tbody tr')).toHaveCount(10);
  });

  test('should create new student', async ({ page }) => {
    await page.goto('http://localhost:5173/students');
    await page.click('text=Add Student');
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Student created successfully')).toBeVisible();
  });
});
```

### Console Error Detection

**Tool:** Puppeteer-based console checker

**Script:** `school-dashboard/check-console.js` (if exists) or create custom

**Usage:**
```bash
# Start dev server first
cd school-dashboard
npm run dev

# In another terminal
node check-console.js http://localhost:5173

# Windows batch
./test-console-errors.bat
```

**Pattern:**
```javascript
// check-console.js
const puppeteer = require('puppeteer');

async function checkConsoleErrors(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto(url);
  await page.waitForTimeout(2000);

  await browser.close();

  if (errors.length > 0) {
    console.log(JSON.stringify({ errors }, null, 2));
    process.exit(1);
  } else {
    console.log('No errors detected');
    process.exit(0);
  }
}

checkConsoleErrors(process.argv[2] || 'http://localhost:5173');
```

**See:** `MDs/TASK_INITIATOR.md` for complete testing workflow

---

## Common Patterns & Conventions

### Code Style

**General:**
- ES modules (`import`/`export`, not `require`)
- Async/await (not callbacks or raw promises)
- Arrow functions for callbacks and short functions
- Destructuring for cleaner code
- Template literals for strings

**JavaScript/JSX:**
```javascript
// Imports
import { useState, useEffect } from 'react';
import api from '../services/api';

// Component definition
export default function MyComponent({ prop1, prop2 }) {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const loadData = async () => {
    try {
      const result = await api.getData();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Early returns
  if (loading) return <Loading />;
  if (!data.length) return <Empty />;

  // Render
  return (
    <div className="container">
      {data.map(item => (
        <Card key={item.id}>
          {item.name}
        </Card>
      ))}
    </div>
  );
}
```

**Backend:**
```javascript
// Route handler
router.get('/items', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const items = await Model.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Model.countDocuments(query);
    
    res.json({ data: items, total, page, limit });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Naming Conventions

**Files:**
- Components: PascalCase (e.g., `StudentsList.jsx`, `FeeCard.jsx`)
- Utilities: camelCase (e.g., `apiHelpers.js`, `dateUtils.js`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_CONSTANTS.js`)
- Contexts: PascalCase with "Context" suffix (e.g., `AuthContext.jsx`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth.js`, `useStudents.js`)
- Routes: camelCase (e.g., `staffAttendance.js`, `parentAuth.js`)
- Models: PascalCase (e.g., `Student.js`, `Staff.js`, `TeacherLeave.js`)

**Variables:**
- camelCase for variables and functions (e.g., `const userName`, `function loadData()`)
- PascalCase for components and classes (e.g., `StudentCard`, `AuthService`)
- UPPER_SNAKE_CASE for constants (e.g., `const API_URL`, `const MAX_RETRIES`)

**Database Fields:**
- camelCase (e.g., `firstName`, `createdAt`, `isActive`)
- ID references: suffix with "Id" (e.g., `teacherId`, `staffId`)
- Boolean fields: prefix with "is", "has", "should" (e.g., `isActive`, `hasPermission`)
- Date fields: suffix with "At" (e.g., `createdAt`, `updatedAt`, `deletedAt`)

### Error Handling

**Frontend:**
```javascript
try {
  const result = await api.action(data);
  toast.success('Action completed');
  return result;
} catch (error) {
  // Specific error handling
  if (error.message.includes('Unauthorized')) {
    toast.error('Session expired');
    // Clear session and redirect
  } else if (error.message.includes('already exists')) {
    toast.error('Duplicate entry');
  } else {
    toast.error(`Failed: ${error.message}`);
  }
  // Optional: Re-throw if caller needs to handle
  throw error;
}
```

**Backend:**
```javascript
try {
  // Business logic
  const result = await processData(data);
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error in handler:', error);
  
  // Specific error handling
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  // Generic error
  res.status(500).json({ error: error.message });
}
```

**Defensive Programming:**
```javascript
// Always validate array operations
if (!Array.isArray(items)) {
  console.warn('⚠️ items is not an array:', items);
  items = [];
}

// Optional chaining for nested properties
const name = user?.profile?.name ?? 'Unknown';

// Type checks before operations
if (typeof value === 'string' && value.length > 0) {
  value.toLowerCase();
}

// Handle both array and string formats
const roleStr = Array.isArray(userRole) ? userRole[0] : userRole;
if (!roleStr || typeof roleStr !== 'string') {
  return 'teacher'; // Safe default
}
```

### Data Validation

**Backend (Joi):**
```javascript
import Joi from 'joi';

const schema = Joi.object({
  name: Joi.string().required().trim().min(3).max(100),
  email: Joi.string().email().required().lowercase(),
  age: Joi.number().integer().min(5).max(100),
  status: Joi.string().valid('active', 'inactive').default('active'),
  subjects: Joi.array().items(Joi.string()).min(1)
});

// Validate
const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

**Frontend:**
```javascript
// Manual validation
const validateForm = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  }
  
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (data.age < 5 || data.age > 100) {
    errors.age = 'Age must be between 5 and 100';
  }
  
  return errors;
};

// Usage
const errors = validateForm(formData);
if (Object.keys(errors).length > 0) {
  setValidationErrors(errors);
  return;
}
```

### Pagination

**Backend:**
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const items = await Model.find(query)
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });

const total = await Model.countDocuments(query);

res.json({
  data: items,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
});
```

**Frontend:**
```javascript
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const limit = 20;

const loadData = async () => {
  const response = await api.getData({ page, limit });
  setItems(response.data);
  setTotal(response.pagination.total);
};

// HeroUI Pagination
<Pagination
  total={Math.ceil(total / limit)}
  page={page}
  onChange={setPage}
/>
```

### Memoization (React)

**CRITICAL:** Always memoize array/object values passed to hooks or used in useEffect dependencies

```javascript
// Component with expensive computation
const visibleStudentIds = useMemo(() => {
  return visibleItems.map(s => s.id);
}, [visibleItems]);

// Custom hook with array dependency
const studentIdsKey = JSON.stringify(studentIds);
useEffect(() => {
  const parsedIds = JSON.parse(studentIdsKey);
  if (!parsedIds || parsedIds.length === 0) return;
  fetchBatchFees(parsedIds);
}, [studentIdsKey, academicYear]);

// Memoize callback functions
const handleDelete = useCallback((id) => {
  deleteItem(id);
}, [deleteItem]);
```

**See:** `MDs/CLAUDE_NOT_TO_DO.md` #6 for infinite loop prevention

---

## Critical Gotchas

### 1. MongoDB Must Be Running

**Issue:** API requests hang/timeout if MongoDB is not running

**Check:**
```bash
# Windows
tasklist | findstr mongod

# Start MongoDB
net start MongoDB
```

**Symptoms:**
- API requests timeout (90+ seconds)
- Backend logs show "ECONNREFUSED mongodb://localhost:27017"
- Frontend shows "Request timeout" errors

**Solution:** Always check MongoDB status before starting backend

### 2. Backend Logs Are Critical

**Issue:** Errors often show in backend logs, not frontend console

**Always Check:**
- Terminal where backend is running
- Look for MongoDB connection errors
- Check for validation errors
- Check for authentication errors

**See:** [Development Workflow](#development-workflow) → Pre-Flight Checklist #5

### 3. Array vs String Type Confusion

**Issue:** Some fields (like `role`) are arrays `['Teacher']`, not strings `'Teacher'`

**Bad:**
```javascript
userRole.toLowerCase();  // Error if userRole is ['Teacher']
```

**Good:**
```javascript
const roleStr = Array.isArray(userRole) ? userRole[0] : userRole;
if (roleStr && typeof roleStr === 'string') {
  roleStr.toLowerCase();
}
```

**See:** `MDs/CLAUDE_NOT_TO_DO.md` #7

### 4. Soft-Delete Filtering

**Issue:** Deleted items may still appear in queries if not filtered

**Always Filter:**
```javascript
// If using inline soft-delete (isDeleted field)
const query = { isDeleted: false };
if (classId) query.classId = classId;

const items = await Model.find(query);
```

**This Project:** Uses separate `TrashItem` model, so original items are removed from collection

### 5. Rate Limiting

**Issue:** Frontend can trigger 429 errors if too many requests sent simultaneously

**Avoid:**
```javascript
// DON'T DO THIS
const promises = items.map(item => api.getData(item.id));
const results = await Promise.all(promises); // 20+ requests at once!
```

**Use:**
- Request queue (already implemented in `services/api.js`)
- Batch loading (3-5 items at a time, 300ms delay)
- Response caching (30s TTL for GET requests)

**See:** `school-dashboard/RATE_LIMITING.md`

### 6. Infinite Loops (React)

**Issue:** Array/object dependencies in useEffect cause infinite re-renders

**Bad:**
```javascript
useEffect(() => {
  fetchData();
}, [studentIds]);  // studentIds is a new array every render!
```

**Good:**
```javascript
const studentIdsKey = useMemo(() => JSON.stringify(studentIds), [studentIds]);
useEffect(() => {
  const parsedIds = JSON.parse(studentIdsKey);
  fetchData(parsedIds);
}, [studentIdsKey]);
```

**See:** `MDs/CLAUDE_NOT_TO_DO.md` #6

### 7. Port Conflicts

**Issue:** Port 3001 already in use

**Solution:**
```bash
# Windows PowerShell
./backend/kill-port-3001.ps1

# Or manual
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

### 8. State from Context vs Local State

**Issue:** Trying to modify context data with local setState

**Bad:**
```javascript
const { students } = useApp();  // From context
setStudents(newData);  // Error: setStudents doesn't exist!
```

**Good:**
```javascript
const { students, refreshStudents } = useApp();
// After API action
await api.deleteStudent(id);
refreshStudents();  // Use context refresh method
// OR
window.location.reload();  // Simple solution
```

**See:** `MDs/CLAUDE_NOT_TO_DO.md` #1, #4

### 9. Exact Whitespace Matching (Edit Tool)

**Issue:** Edit tool requires EXACT text match including all whitespace

**Always:**
- View file first and copy exact text
- Include 3-5 lines of context
- Match indentation precisely (count spaces/tabs)
- Include blank lines if they exist
- Don't approximate - get exact text

**See:** `MDs/CLAUDE_NOT_TO_DO.md` for detailed examples

### 10. Environment Variables

**Issue:** Missing or incorrect environment variables cause failures

**Check:**
- Backend: `.env` file exists with required variables (see `.env.example`)
- Frontend: `VITE_API_URL` in environment (Vite requires `VITE_` prefix)

**Required Backend Vars:**
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret for JWT signing
- `FRONTEND_URL`: Frontend URL for CORS

**Optional but Recommended:**
- `CLOUDINARY_*`: File upload service
- `SMTP_*`: Email service
- `MSG91_*`: SMS/WhatsApp service

---

## Deployment

### Backend Deployment (Render)

**Config:** `backend/render.yaml`

**Steps:**
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Create Web Service from `backend/render.yaml`
4. Set environment variables in Render dashboard
5. Deploy

**Environment Variables on Render:**
- `NODE_ENV=production`
- `PORT=3001`
- `MONGODB_URI`: MongoDB Atlas connection string
- `FRONTEND_URL`: Production frontend URL
- All other required vars from `.env.example`

**Build Command:** `npm install`

**Start Command:** `npm start`

### Frontend Deployment (Vercel)

**Config:** `school-dashboard/vercel.json` (if exists)

**Steps:**
1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Set root directory to `school-dashboard`
4. Set environment variables:
   - `VITE_API_URL`: Production backend URL
5. Deploy

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Framework Preset:** Vite

### Mobile App Deployment (Expo)

**Parent App & Staff App:**

**Development Build:**
```bash
cd parent-app  # or staff-app
expo build:android
expo build:ios
```

**Production Build (EAS):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure
eas build:configure

# Build
eas build --platform android
eas build --platform ios
eas build --platform all

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

**Update OTA (Over-The-Air):**
```bash
eas update --branch production
```

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Failed:**
```bash
❌ Error: ECONNREFUSED mongodb://localhost:27017

✅ Solution:
1. Check MongoDB is running: tasklist | findstr mongod
2. Start MongoDB: net start MongoDB
3. Verify connection string in .env
```

**Port Already in Use:**
```bash
❌ Error: EADDRINUSE: address already in use :::3001

✅ Solution:
./backend/kill-port-3001.ps1
# Or: netstat -ano | findstr :3001 then taskkill /F /PID <PID>
```

**JWT Token Invalid:**
```bash
❌ Error: jwt malformed

✅ Solution:
1. Check JWT_SECRET in .env
2. Clear frontend sessionStorage/localStorage
3. Login again
```

**Rate Limit Exceeded:**
```bash
❌ Error: 429 Too Many Requests

✅ Solution:
1. Check frontend request batching
2. Verify request queue is working
3. Increase rate limit in development (server.js)
4. Clear browser cache
```

### Frontend Issues

**Vite Build Errors:**
```bash
❌ Error: Failed to resolve import

✅ Solution:
1. Clear Vite cache: ./school-dashboard/fix-vite-cache.bat
2. Delete node_modules and reinstall: rm -rf node_modules && npm install
3. Check import paths are correct
```

**API Timeout:**
```bash
❌ Error: Request timeout - please check if backend is running

✅ Solution:
1. Verify backend is running: curl http://localhost:3001/api
2. Check MongoDB is running
3. Check backend logs for errors
4. Verify VITE_API_URL is correct
```

**Console Errors:**
```bash
❌ Error: Cannot read property 'X' of undefined

✅ Solution:
1. Add optional chaining: obj?.prop
2. Add null checks: if (obj && obj.prop) { ... }
3. Check data structure from API
4. Add defensive programming
```

**Infinite Loop / React Re-renders:**
```bash
❌ Symptom: Page freezes, console spam, many API calls

✅ Solution:
1. Check useEffect dependencies
2. Memoize array/object dependencies with useMemo
3. Use JSON.stringify for deep comparison
4. See MDs/CLAUDE_NOT_TO_DO.md #6
```

### Mobile App Issues

**Expo Dev Server Won't Start:**
```bash
❌ Error: Metro bundler error

✅ Solution:
1. Clear cache: expo start -c
2. Delete node_modules: rm -rf node_modules && npm install
3. Check port 19000 is free
```

**Socket.IO Connection Failed:**
```bash
❌ Error: WebSocket connection failed

✅ Solution:
1. Check backend URL is correct (use IP address, not localhost)
2. Verify backend Socket.IO CORS settings
3. Check network connectivity
4. Use polling transport as fallback
```

**API Requests Fail:**
```bash
❌ Error: Network request failed

✅ Solution:
1. Use device IP instead of localhost (e.g., http://192.168.1.x:3001/api)
2. Verify backend is accessible from device network
3. Check firewall settings
4. Use Expo tunnel if needed: expo start --tunnel
```

### Database Issues

**Validation Error:**
```bash
❌ Error: ValidationError: name is required

✅ Solution:
1. Check Mongoose schema for required fields
2. Verify request body has all required fields
3. Check data types match schema
4. Review schema validation rules
```

**Duplicate Key Error:**
```bash
❌ Error: E11000 duplicate key error

✅ Solution:
1. Check unique indexes on schema
2. Verify data doesn't already exist
3. Use updateOne with upsert if appropriate
4. Handle error gracefully in frontend
```

**Cast Error:**
```bash
❌ Error: CastError: Cast to ObjectId failed

✅ Solution:
1. Validate ID format: mongoose.Types.ObjectId.isValid(id)
2. Check ID is not undefined or null
3. Verify ID string format (24 hex characters)
```

---

## Additional Resources

### Documentation Files

- `MDs/CLAUDE_NOT_TO_DO.md`: Lessons learned, common mistakes, best practices
- `MDs/STYLE_GUIDE.md`: UI/design style guide
- `MDs/TASK_INITIATOR.md`: Development workflow, autonomous mode rules, testing guide
- `school-dashboard/ARCHITECTURE.md`: Frontend architecture details
- `school-dashboard/RATE_LIMITING.md`: Rate limiting architecture
- `school-dashboard/STYLE_GUIDE.md`: Design system, color palette, typography
- `school-dashboard/CONSOLE_GUIDE.md`: Console error debugging
- `school-dashboard/VALIDATION_RULES.md`: Form validation rules
- `backend/PERFORMANCE_OPTIMIZATIONS.md`: Backend performance tips
- `backend/TIMETABLE_ENDPOINT_UPDATES.md`: Timetable API documentation

### Key Audit/Issue Documents

- `CODE_STRUCTURE_AUDIT.md`: Code structure analysis
- `CRITICAL_ISSUES.md`: Critical bugs and fixes needed
- `DASHBOARD_AUDIT.md`: Dashboard component audit
- `DEVOPS_ISSUES.md`: DevOps and deployment issues
- `ENGINEERING_GAPS.md`: Technical debt and gaps
- `PRODUCT_ISSUES.md`: Product-level issues
- `SAAS_ARCHITECTURE_ISSUES.md`: SaaS architecture concerns

### External Resources

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [HeroUI Documentation](https://heroui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## Quick Reference Commands

```bash
# Backend
cd backend && npm install && npm run dev
cd backend && npm test
cd backend && node seed.js
./backend/kill-port-3001.ps1

# Frontend
cd school-dashboard && npm install && npm run dev
cd school-dashboard && npm test
cd school-dashboard && npm run build

# Mobile Apps
cd parent-app && npm install && npm start
cd staff-app && npm install && npm start

# Health Checks
curl http://localhost:3001/api
curl http://localhost:5173
tasklist | findstr mongod
netstat -ano | findstr :3001
```

---

**End of AGENTS.md**

This guide is maintained to help AI agents work effectively in this codebase. Update this file when:
- Project structure changes significantly
- New patterns or conventions are adopted
- Critical gotchas are discovered
- Development workflow changes
- New documentation is added

**Last Updated:** 2026-03-05  
**Next Review:** When significant project changes occur
