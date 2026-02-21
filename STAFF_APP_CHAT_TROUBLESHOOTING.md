# Staff App Chat Troubleshooting Guide

## Problem
The staff app is showing these errors:
- `Contacts endpoint not available, returning empty array`
- `Error getting conversations: [Error: Failed to get conversations]`

## Root Cause
These errors indicate the staff app cannot connect to the backend server or the server is returning errors.

## Diagnostic Steps

### 1. Check the Enhanced Error Messages
The app now provides detailed error messages. Check your console for:
- **HTTP Status Code**: Shows what the server returned (401, 403, 404, 500, etc.)
- **Error Message**: The actual error from the server
- **Network Error**: If you see "Network request failed", the app cannot reach the server

### 2. Verify Backend Server is Running
```bash
# Navigate to backend directory
cd backend

# Check if server is running on port 3001
netstat -ano | findstr :3001

# Or start the server
npm start
```

### 3. Verify Correct IP Address
The staff app needs to connect to your computer's IP address.

**For Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**For Mac/Linux:**
```bash
ifconfig
```
Look for the `inet` address under your active network adapter

### 4. Update IP Configuration in Staff App

Edit `staff-app/src/config/index.js`:

```javascript
const SERVER_IP = 'YOUR_ACTUAL_IP_ADDRESS'; // e.g., '192.168.1.100'
const SERVER_PORT = '3001';
```

### 5. Verify Network Connectivity

**For Android Emulator:**
- The emulator uses `10.0.2.2` to reach your computer's localhost
- Update config: `const SERVER_IP = '10.0.2.2';`

**For iOS Simulator:**
- The simulator uses `localhost`
- Update config: `const SERVER_IP = 'localhost';`

**For Physical Device:**
- Device must be on the same WiFi network as your computer
- Use your computer's actual IP address

### 6. Test API Endpoints Directly

Open a browser or Postman and test:
```
http://YOUR_IP:3001/api/messages/contacts?userType=staff
http://YOUR_IP:3001/api/messages/conversations?userId=YOUR_USER_ID&userType=staff
```

### 7. Check Authentication Token

The app needs a valid authentication token. Check if:
- You're logged in successfully
- The token exists in AsyncStorage
- The token hasn't expired

### 8. Check Backend Logs

Look at the backend console for errors:
```
❌ Get conversations error: ...
❌ Get contacts error: ...
```

## Common Issues and Solutions

### Issue 1: "Network request failed"
**Cause:** App cannot reach the server
**Solution:**
1. Verify backend server is running
2. Check IP address is correct
3. Ensure device is on same network (for physical device)
4. Check firewall isn't blocking port 3001

### Issue 2: "401 Unauthorized"
**Cause:** Missing or invalid authentication token
**Solution:**
1. Log out and log back in
2. Check if user account is active
3. Verify backend authentication middleware is working

### Issue 3: "403 Forbidden"
**Cause:** User doesn't have permission to access chat
**Solution:**
1. Check user's chat permissions in database
2. Verify user type matches (staff vs student)
3. Contact administrator to grant permissions

### Issue 4: "404 Not Found"
**Cause:** API endpoint doesn't exist
**Solution:**
1. Verify backend routes are properly configured
2. Check that `/api/messages/contacts` route exists
3. Restart backend server after any changes

### Issue 5: "500 Internal Server Error"
**Cause:** Server-side error
**Solution:**
1. Check backend console for error details
2. Verify database connection is working
3. Check if required models (Staff, Student) exist

## Quick Fix Checklist

- [ ] Backend server is running on port 3001
- [ ] IP address in `staff-app/src/config/index.js` is correct
- [ ] Device can reach the server (same network)
- [ ] User is logged in with valid token
- [ ] User has chat permissions
- [ ] Database connection is working
- [ ] Required collections exist (Staff, Student, Message, Conversation)

## Testing the Fix

After making changes:

1. **Reload the app** (stop and restart the React Native app)
2. **Navigate to Chat screen**
3. **Check console logs** for enhanced error messages
4. **Verify connectivity** by checking the actual error details

## Additional Help

If issues persist after following these steps:

1. Check the backend console for detailed error logs
2. Verify database has the required collections
3. Check if Staff and Student collections have documents
4. Review backend routes in `backend/routes/messages.js`
5. Check authentication middleware in `backend/middleware/auth.js`

## Next Steps

The improved error logging will now show:
- Exact HTTP status codes (401, 403, 404, 500, etc.)
- Detailed error messages from the server
- Network connectivity status
- API URL being accessed

This information will help pinpoint the exact issue and guide you to the correct solution.