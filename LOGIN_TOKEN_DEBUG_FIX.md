# Login Token 401 Error - Debug Fix

## Problem Identified
After successful login, API calls were failing with **401 Unauthorized** errors, causing the session to be immediately cleared.

## Root Cause
**Race condition** between:
1. Token being stored in sessionStorage
2. API calls being made that need the token

The `user-logged-in` event was firing too quickly (100ms), before sessionStorage was fully written.

## Changes Made

### 1. AuthContext.jsx
- ✅ Increased delay from 100ms to 200ms for `user-logged-in` event
- ✅ Added detailed logging to track token storage
- ✅ Added verification that token is actually stored before dispatching event

### 2. api.js (API Service)
- ✅ Added logging to show token presence for each request
- ✅ Added logging to confirm Authorization header is added
- ✅ Shows first 20 characters of token for debugging

### 3. backend/middleware/auth.js
- ✅ Added logging to show when auth middleware is called
- ✅ Added logging to show token verification results
- ✅ Added logging for successful authentication

## Testing Steps

1. **Clear your browser cache and sessionStorage:**
   ```javascript
   // In browser console:
   sessionStorage.clear();
   location.reload();
   ```

2. **Login again** and watch the console logs

3. **Look for these log messages in order:**
   ```
   🔑 Login successful, token received: YES
   💾 Token stored in sessionStorage: YES
   📢 Dispatching user-logged-in event
   🔍 handleLogin called, checking sessionStorage...
   📋 User data found: {hasToken: true, ...}
   ✅ Token found, fetching data after login
   📡 API Request: GET http://localhost:3001/api/staff
   🔐 Token for /staff: eyJhbGciOiJIUzI1NiI...
   ✅ Authorization header added for /staff
   ```

4. **Backend logs should show:**
   ```
   🔐 Auth middleware - Header: Bearer eyJhbGciOiJIUzI1...
   ✅ Auth successful: 696198f07685adf76bac0df1 staff
   ```

## Expected Behavior After Fix

✅ Login succeeds  
✅ Token is stored in sessionStorage  
✅ Event fires after 200ms delay  
✅ API calls include Authorization header  
✅ Backend validates token successfully  
✅ Data loads without 401 errors  
✅ Dashboard displays properly  

## If Still Getting 401 Errors

Check these:

1. **Token expiration**: Default is 8 hours. If backend was restarted with different JWT_SECRET, old tokens are invalid
   - Solution: Clear sessionStorage and login again

2. **JWT_SECRET mismatch**: Check backend .env file
   - Should have: `JWT_SECRET=your-secret-key-change-in-production`

3. **Token format**: Should be `Bearer <token>` in Authorization header
   - Check browser Network tab → Headers → Authorization

4. **CORS issues**: Check if backend allows requests from frontend origin
   - Backend should have CORS configured for `http://localhost:5173`

## Quick Fix Commands

```bash
# If backend needs restart:
cd backend
npm start

# If frontend needs restart:
cd school-dashboard
npm run dev
```

## Console Commands for Debugging

```javascript
// Check if token exists
JSON.parse(sessionStorage.getItem('app_user'))?.token

// Check token expiration (decode JWT)
const token = JSON.parse(sessionStorage.getItem('app_user'))?.token;
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Current time:', new Date());
}

// Force re-fetch data
window.dispatchEvent(new Event('user-logged-in'));
```
