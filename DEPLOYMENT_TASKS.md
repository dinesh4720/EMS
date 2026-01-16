# 🚀 Deployment Tasks - Permission System

**Project:** School Management System  
**Feature:** Complete Permission & Authentication System  
**Status:** Backend Complete, Frontend Integration Pending  
**Priority:** HIGH (Security Fix)

---

## 📋 TASK LIST

### ✅ COMPLETED (By AI Assistant)

- [x] Create JWT authentication middleware
- [x] Enhance permission middleware with RBAC
- [x] Add jsonwebtoken dependency
- [x] Protect all staff routes (7 routes)
- [x] Protect all student routes (8 routes)
- [x] Protect all class routes (4 routes)
- [x] Protect all attendance routes (2 routes)
- [x] Protect all fee routes (15 routes)
- [x] Protect all payroll routes (12 routes)
- [x] Protect all settings routes (32 routes)
- [x] Protect upload route (1 route)
- [x] Update login endpoint to return JWT token
- [x] Create comprehensive documentation
- [x] Test backend authentication flow

---

## 🔴 CRITICAL TASKS (Must Do Before Production)

### Task 1: Change JWT Secret ⚠️ SECURITY CRITICAL
**Priority:** CRITICAL  
**Time:** 2 minutes  
**Assigned To:** Developer/DevOps

**Steps:**
```bash
# 1. Generate secure secret
cd backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Copy the output (will look like: 9f2b3d8e7a6c5b4f1e0d9c8b7a6f5e4d...)

# 3. Add to backend/.env
echo JWT_SECRET=<paste-generated-secret-here> >> .env

# 4. Verify it's added
cat .env | grep JWT_SECRET
```

**Verification:**
- [ ] .env file has JWT_SECRET with long random string
- [ ] JWT_SECRET is NOT 'your-secret-key-change-in-production'
- [ ] JWT_SECRET is at least 32 characters long
- [ ] JWT_SECRET is kept secret (not in git)

**Why Critical:** Default secret allows anyone to create fake admin tokens!

---

### Task 2: Install Backend Dependencies
**Priority:** CRITICAL  
**Time:** 2 minutes  
**Assigned To:** Developer

**Steps:**
```bash
cd backend
npm install
```

**Verification:**
- [ ] jsonwebtoken package installed
- [ ] No npm errors
- [ ] package-lock.json updated
- [ ] Backend starts without errors

---

### Task 3: Update Frontend - Store JWT Token on Login
**Priority:** HIGH  
**Time:** 10 minutes  
**Assigned To:** Frontend Developer

**File to Modify:** `school-dashboard/src/context/AuthContext.jsx` (or wherever login is handled)

**Find this code:**
```javascript
const login = async (phone, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password })
  });
  
  const data = await response.json();
  setUser(data);
  // ... rest of code
};
```

**Add these lines:**
```javascript
const login = async (phone, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const data = await response.json();
  
  // ✅ ADD THESE LINES:
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
  }
  
  setUser(data);
  return data;
};
```

**Verification:**
- [ ] Login successful stores token in localStorage
- [ ] Can see 'auth_token' in browser DevTools → Application → Local Storage
- [ ] Token is a long string (JWT format)

---

### Task 4: Update Frontend - Send Token with API Requests
**Priority:** HIGH  
**Time:** 15 minutes  
**Assigned To:** Frontend Developer

**File to Modify:** `school-dashboard/src/services/api.js`

**Current code (approximate):**
```javascript
const api = {
  get: (url) => fetch(`http://localhost:3001${url}`),
  post: (url, data) => fetch(`http://localhost:3001${url}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  // ... etc
};
```

**Replace with:**
```javascript
const api = {
  // Helper to get token
  getToken: () => localStorage.getItem('auth_token'),

  // Helper to get headers with token
  getHeaders: () => {
    const token = api.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Base request
  request: async (url, options = {}) => {
    const response = await fetch(`http://localhost:3001${url}`, {
      ...options,
      headers: {
        ...api.getHeaders(),
        ...options.headers
      }
    });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Handle 403 - no permission
    if (response.status === 403) {
      const error = await response.json();
      throw new Error(error.message || 'Permission denied');
    }

    return response;
  },

  // Convenience methods
  get: async (url) => {
    const response = await api.request(url);
    return response.json();
  },

  post: async (url, data) => {
    const response = await api.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  put: async (url, data) => {
    const response = await api.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  delete: async (url) => {
    const response = await api.request(url, {
      method: 'DELETE'
    });
    return response.json();
  }
};

export default api;
```

**Verification:**
- [ ] API requests include Authorization header
- [ ] Can see token in Network tab → Headers → Authorization: Bearer ...
- [ ] API calls succeed (no 401 errors)
- [ ] App functions normally after login

---

### Task 5: Add Logout Functionality
**Priority:** MEDIUM  
**Time:** 5 minutes  
**Assigned To:** Frontend Developer

**File to Modify:** `school-dashboard/src/context/AuthContext.jsx`

**Add logout function:**
```javascript
const logout = () => {
  // Clear token and user data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  
  // Clear state
  setUser(null);
  
  // Redirect to login
  window.location.href = '/login';
};
```

**Verification:**
- [ ] Logout button clears token
- [ ] Redirects to login page
- [ ] Can't access protected pages after logout

---

## 🟡 TESTING TASKS

### Task 6: Test Admin Access
**Priority:** HIGH  
**Time:** 15 minutes  
**Assigned To:** QA/Developer

**Test Cases:**
- [ ] Login as Admin
- [ ] Can view staff list
- [ ] Can create new staff
- [ ] Can edit staff
- [ ] Can delete staff
- [ ] Can view students
- [ ] Can delete students
- [ ] Can view payroll
- [ ] Can access settings
- [ ] All operations successful

**If any fail:** Check user has 'admin' role in UserPermission collection

---

### Task 7: Test Teacher Access (Limited)
**Priority:** HIGH  
**Time:** 15 minutes  
**Assigned To:** QA/Developer

**Test Cases:**
- [ ] Login as Teacher
- [ ] Can view students (should work)
- [ ] Can edit student attendance (should work)
- [ ] Cannot delete students (should show error)
- [ ] Cannot create staff (should show error)
- [ ] Cannot view payroll (should show error)
- [ ] Cannot access settings (should show error)
- [ ] Can view own payslip (should work)

**Expected:** Limited access based on teacher permissions

---

### Task 8: Test Accountant Access (Finance Only)
**Priority:** MEDIUM  
**Time:** 10 minutes  
**Assigned To:** QA/Developer

**Test Cases:**
- [ ] Login as Accountant
- [ ] Can view fees (should work)
- [ ] Can create fee payments (should work)
- [ ] Can view students (should work)
- [ ] Cannot delete students (should show error)
- [ ] Cannot view payroll (should show error)
- [ ] Cannot manage staff (should show error)

**Expected:** Access to fees and student viewing only

---

### Task 9: Test No Token Access
**Priority:** HIGH  
**Time:** 5 minutes  
**Assigned To:** QA/Developer

**Test Cases:**
- [ ] Clear localStorage
- [ ] Try to access /students page
- [ ] Should redirect to login
- [ ] Try API call without token (use browser console)
- [ ] Should get 401 error

**Expected:** All protected routes require login

---

## 🟢 OPTIONAL TASKS (Post-Deployment)

### Task 10: Add Token Refresh Mechanism
**Priority:** LOW  
**Time:** 2 hours  
**Assigned To:** Backend Developer

**Description:** Current tokens expire after 8 hours. Implement refresh tokens so users don't get logged out suddenly.

---

### Task 11: Add Audit Logging
**Priority:** LOW  
**Time:** 4 hours  
**Assigned To:** Backend Developer

**Description:** Log all permission checks and access attempts for security audit trail.

---

### Task 12: Create Admin Panel for Permission Management
**Priority:** LOW  
**Time:** 8 hours  
**Assigned To:** Full Stack Developer

**Description:** UI for admins to grant/revoke permissions without database access.

---

## 📊 TASK SUMMARY

| Priority | Tasks | Est. Time | Status |
|----------|-------|-----------|--------|
| **CRITICAL** | 2 | 5 min | ⏳ Pending |
| **HIGH** | 5 | 1 hour | ⏳ Pending |
| **MEDIUM** | 2 | 25 min | ⏳ Pending |
| **LOW** | 3 | 14 hours | 📋 Future |
| **TOTAL** | **12** | **~15 hours** | |

**Immediate Required: ~1 hour**

---

## 🚨 BLOCKERS & DEPENDENCIES

### Blockers
- None - all code is ready to deploy

### Dependencies
- Task 2 depends on Task 1 (need JWT_SECRET to start backend)
- Task 4 depends on Task 3 (need token before sending it)
- Tasks 6-9 depend on Tasks 1-5 (need system running)

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Complete Tasks 1-2 (Backend setup)
- [ ] Complete Tasks 3-5 (Frontend integration)
- [ ] Complete Tasks 6-9 (Testing)
- [ ] Backup database
- [ ] Document JWT_SECRET location

### Deployment
- [ ] Deploy backend with new code
- [ ] Verify JWT_SECRET in production .env
- [ ] Deploy frontend with token integration
- [ ] Smoke test login and basic operations
- [ ] Monitor error logs for 24 hours

### Post-Deployment
- [ ] Verify all staff can login
- [ ] Check permission errors in logs
- [ ] Update documentation
- [ ] Train users on any changes

---

## 🆘 TROUBLESHOOTING

### Issue: "401 Unauthorized" on all requests
**Solution:** 
- Check JWT_SECRET is set in .env
- Check frontend is sending Authorization header
- Check token format: "Bearer <token>"

### Issue: "403 Forbidden" errors
**Solution:**
- User logged in but no permission
- Check UserPermission collection for user
- Grant appropriate permissions

### Issue: Frontend shows blank/errors after login
**Solution:**
- Check browser console for errors
- Verify API calls include token
- Check network tab for 401/403 responses

---

## 📚 REFERENCE DOCUMENTS

- `ROLES_PERMISSIONS_AUDIT.md` - Original security audit
- `FRONTEND_TOKEN_INTEGRATION.md` - Detailed frontend guide
- `PERMISSION_SYSTEM_COMPLETE.md` - Complete implementation details
- `backend/middleware/auth.js` - Authentication code
- `backend/middleware/permissions.js` - Permission code

---

## 👥 TEAM ASSIGNMENTS

| Task | Role | Estimated Time |
|------|------|----------------|
| Tasks 1-2 | DevOps/Backend Dev | 5 min |
| Tasks 3-5 | Frontend Dev | 30 min |
| Tasks 6-9 | QA/Tester | 45 min |
| Tasks 10-12 | Optional/Future | 14 hours |

---

## ✅ SIGN-OFF

**Prepared by:** AI Assistant  
**Date:** 2026-01-10  
**Status:** Ready for Implementation  
**Approval Required:** Team Lead

---

## 📞 QUESTIONS?

Refer to documentation or contact:
- Backend issues: Check `backend/middleware/auth.js`
- Frontend issues: Check `FRONTEND_TOKEN_INTEGRATION.md`
- Permission setup: Check `PERMISSION_SYSTEM_COMPLETE.md`

---

**START WITH TASKS 1-2, THEN 3-5, THEN TEST!**

**Total time to deployment: ~1 hour of actual work!**
