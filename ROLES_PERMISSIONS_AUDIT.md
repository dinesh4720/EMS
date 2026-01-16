# Roles & Permissions System - Comprehensive Audit

**Date:** 2026-01-10  
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## 🔍 Audit Summary

### ✅ What Exists
1. ✅ Permission model (`backend/models/UserPermission.js`)
2. ✅ Permission middleware (`backend/middleware/permissions.js`)
3. ✅ Permission routes (`backend/routes/permissions.js`)
4. ✅ Frontend permission context (`PermissionContext.jsx`)
5. ✅ Frontend permission guards (`PermissionGuard.jsx`)
6. ✅ Permission templates for roles

### 🔴 Critical Issues Found
1. ❌ **Permission middleware NOT enforced on backend routes**
2. ❌ **Only 1 route uses `requireAdmin` - permission requests**
3. ❌ **100+ API endpoints have NO permission checks**
4. ❌ **Anyone can CRUD anything if they know the API**
5. ❌ **Frontend guards are UI-only (easily bypassed)**
6. ❌ **No authentication check on most routes**

---

## 🔴 CRITICAL VULNERABILITY

### The Problem
**Backend API routes have NO permission enforcement!**

**What This Means:**
- Any authenticated user can access ANY endpoint
- Teachers can delete students
- Accountants can manage staff
- Receptionists can access payroll
- Frontend permissions are just UI (cosmetic)

### Evidence
```javascript
// backend/server.js - MOST ROUTES LOOK LIKE THIS:

app.post('/api/staff', async (req, res) => {
  // NO permission check ❌
  // Anyone can create staff
});

app.delete('/api/students/:id', async (req, res) => {
  // NO permission check ❌
  // Anyone can delete students
});

app.get('/api/payroll', async (req, res) => {
  // NO permission check ❌
  // Anyone can see payroll
});
```

**Only 1 endpoint has protection:**
```javascript
// backend/routes/permissions.js
router.put('/:userId', requireAdmin, async (req, res) => {
  // ONLY THIS ONE checks if user is admin
});
```

---

## 📊 Route Analysis

### Total API Routes: ~100+

| Category | Routes | Protected | Vulnerable |
|----------|--------|-----------|------------|
| **Auth** | 1 | 1 (rate limited) | 0 |
| **Staff** | 7 | 0 | 7 ❌ |
| **Students** | 8 | 0 | 8 ❌ |
| **Classes** | 6 | 0 | 6 ❌ |
| **Attendance** | 3 | 0 | 3 ❌ |
| **Fees** | 15+ | 0 | 15+ ❌ |
| **Payroll** | 8 | 0 | 8 ❌ |
| **Documents** | 3 | 0 | 3 ❌ |
| **Permissions** | 6 | 1 | 5 ❌ |
| **Messages** | Multiple | 1 (partial) | Most ❌ |
| **TOTAL** | **100+** | **~2** | **~98** ❌ |

---

## 🏗️ Current Architecture

### What Exists (But Not Used)

#### 1. Permission Model
```javascript
// backend/models/UserPermission.js
{
  userId: ObjectId,
  role: 'admin' | 'teacher' | 'accountant' | 'receptionist',
  permissions: [
    {
      module: 'staff' | 'students' | 'fees' | etc,
      canView: Boolean,
      canCreate: Boolean,
      canEdit: Boolean,
      canDelete: Boolean
    }
  ]
}
```

#### 2. Permission Templates
```javascript
PERMISSION_TEMPLATES = {
  admin: {
    // Full access to everything
  },
  teacher: {
    students: { view: true, edit: true, create: false, delete: false },
    // Limited access
  },
  accountant: {
    fees: { view: true, edit: true, create: true, delete: false },
    // Financial access only
  },
  receptionist: {
    visitors: { view: true, create: true, edit: true, delete: false },
    // Front desk access only
  }
}
```

#### 3. Middleware (EXISTS but NOT USED)
```javascript
// backend/middleware/permissions.js

// This exists:
export function requireAdmin(req, res, next) {
  // Check if user is admin
}

export function checkPermission(module, action) {
  return async (req, res, next) => {
    // Check specific permission
  }
}

// But NEVER used on routes! ❌
```

#### 4. Frontend Guards (UI ONLY)
```jsx
// school-dashboard/src/components/PermissionGuard.jsx

<PermissionGuard module="students" action="create">
  <CreateStudentButton />
</PermissionGuard>

// This HIDES the button
// But doesn't stop API call! ❌
```

---

## 🚨 Security Risks

### Risk Level: 🔴 CRITICAL

### Attack Scenarios

**Scenario 1: Teacher Deletes Students**
```javascript
// Teacher opens browser console
fetch('http://localhost:3001/api/students/123', {
  method: 'DELETE'
});
// Success! Student deleted. ❌
```

**Scenario 2: Receptionist Accesses Payroll**
```javascript
fetch('http://localhost:3001/api/payroll')
  .then(r => r.json())
  .then(data => console.log('All salaries:', data));
// Success! Private salary data exposed. ❌
```

**Scenario 3: Accountant Manages Staff**
```javascript
fetch('http://localhost:3001/api/staff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Fake Staff', role: 'Admin' })
});
// Success! Fake admin created. ❌
```

---

## 🎯 What Needs to be Fixed

### Priority 1: Backend Permission Enforcement

**MUST implement on ALL routes:**
1. Authentication check (is user logged in?)
2. Permission check (does user have access?)
3. Role-based access control
4. Audit logging

### Priority 2: Middleware Application

**Apply to ALL routes:**
```javascript
// Instead of:
app.post('/api/staff', async (req, res) => {

// Should be:
app.post('/api/staff', 
  authenticate,  // NEW: Check logged in
  checkPermission('staff', 'create'),  // NEW: Check permission
  async (req, res) => {
```

### Priority 3: Session/Token Management

**Currently missing:**
- No JWT tokens
- No session management
- No "currently logged in user" tracking
- Login returns data but no token

---

## 📋 Implementation Checklist

### Phase 1: Authentication (CRITICAL)
- [ ] Add JWT token generation on login
- [ ] Create authentication middleware
- [ ] Add token validation
- [ ] Track current user in request

### Phase 2: Permission Middleware (CRITICAL)
- [ ] Create `authenticate` middleware
- [ ] Enhance `checkPermission` middleware
- [ ] Apply to ALL routes
- [ ] Test with different roles

### Phase 3: Route Protection (CRITICAL)
- [ ] Protect staff routes (7 routes)
- [ ] Protect student routes (8 routes)
- [ ] Protect class routes (6 routes)
- [ ] Protect fee routes (15+ routes)
- [ ] Protect payroll routes (8 routes)
- [ ] Protect all other routes

### Phase 4: Testing
- [ ] Test admin can access everything
- [ ] Test teacher can only access allowed modules
- [ ] Test accountant limited to finance
- [ ] Test receptionist limited to front desk
- [ ] Test unauthorized access blocked

---

## 🔧 Recommended Architecture

### 1. JWT Authentication
```javascript
// On login
const token = jwt.sign(
  { userId: staff._id, role: staff.role },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

res.json({ 
  ...staffData,
  token  // Return token
});
```

### 2. Auth Middleware
```javascript
// backend/middleware/auth.js
export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 3. Permission Middleware
```javascript
// backend/middleware/permissions.js
export function checkPermission(module, action) {
  return async (req, res, next) => {
    const userId = req.user.userId;
    
    const permissions = await UserPermission.findOne({ userId });
    
    if (!permissions) {
      return res.status(403).json({ error: 'No permissions found' });
    }
    
    const modulePerms = permissions.permissions.find(p => p.module === module);
    
    if (!modulePerms || !modulePerms[`can${capitalize(action)}`]) {
      return res.status(403).json({ 
        error: `You don't have permission to ${action} ${module}` 
      });
    }
    
    next();
  };
}
```

### 4. Route Protection
```javascript
// Apply to all routes
app.post('/api/staff', 
  authenticate,
  checkPermission('staff', 'create'),
  async (req, res) => {
    // Only executes if authenticated AND permitted
  }
);

app.delete('/api/students/:id',
  authenticate,
  checkPermission('students', 'delete'),
  async (req, res) => {
    // Only admins can reach here
  }
);
```

---

## 📊 Permission Matrix

### Default Roles

| Module | Admin | Teacher | Accountant | Receptionist |
|--------|-------|---------|------------|--------------|
| **Staff** | CRUD | View | View | View |
| **Students** | CRUD | View/Edit | View | View/Create |
| **Classes** | CRUD | View | View | View |
| **Attendance** | CRUD | CRUD | View | View |
| **Fees** | CRUD | View | CRUD | View/Create |
| **Payroll** | CRUD | View Own | - | - |
| **Messages** | CRUD | CRUD | CRUD | CRUD |
| **Settings** | CRUD | - | - | - |
| **Permissions** | CRUD | View Own | View Own | View Own |

---

## 🚀 Implementation Steps

### Step 1: Install JWT
```bash
cd backend
npm install jsonwebtoken
```

### Step 2: Create Auth Middleware
```bash
# Create backend/middleware/auth.js
```

### Step 3: Update Login to Return Token
```javascript
// backend/server.js - login route
const token = jwt.sign({ userId: staff._id, role: staff.role }, ...);
res.json({ ...data, token });
```

### Step 4: Apply Middleware to Routes
```javascript
import { authenticate } from './middleware/auth.js';
import { checkPermission } from './middleware/permissions.js';

// Apply to ALL routes
app.use('/api/*', authenticate); // Require auth everywhere
```

### Step 5: Add Permission Checks
```javascript
// Add to specific routes
app.post('/api/staff', checkPermission('staff', 'create'), ...);
app.delete('/api/students/:id', checkPermission('students', 'delete'), ...);
```

### Step 6: Update Frontend
```javascript
// Store token
localStorage.setItem('token', response.token);

// Send with requests
fetch('/api/staff', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## ⚠️ Current State vs Required State

### Current State ❌
- ✅ Permission system exists
- ❌ NOT enforced on backend
- ❌ UI guards only (easily bypassed)
- ❌ No authentication middleware
- ❌ No JWT tokens
- ❌ Anyone can access any API
- 🔴 **SECURITY HOLE**

### Required State ✅
- ✅ Permission system exists
- ✅ ENFORCED on all backend routes
- ✅ Backend validates every request
- ✅ Authentication middleware active
- ✅ JWT tokens issued and validated
- ✅ Role-based access control working
- ✅ **SECURE**

---

## 📝 Conclusion

**The permission system architecture is GOOD, but it's NOT BEING USED!**

### Summary
- ✅ Models exist
- ✅ Middleware exists
- ✅ Frontend guards exist
- ❌ **Backend enforcement MISSING**
- ❌ **98% of routes unprotected**
- 🔴 **CRITICAL security vulnerability**

### Immediate Action Required
1. Implement JWT authentication
2. Apply auth middleware globally
3. Apply permission checks per route
4. Test thoroughly
5. Deploy ASAP

---

**This is a CRITICAL security issue that must be fixed before production deployment!**

---

**Audit by:** AI Assistant  
**Date:** 2026-01-10  
**Severity:** 🔴 CRITICAL  
**Status:** Needs immediate attention
