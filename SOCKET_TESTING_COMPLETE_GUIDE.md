# Complete Socket Testing Guide

## Prerequisites

1. **Backend running** on port 3001
2. **Frontend running** on port 5173
3. **Logged in** to the app

## Test 1: Check Socket Connection

### In Browser Console:

```javascript
// 1. Check if user is logged in
const user = JSON.parse(sessionStorage.getItem('app_user'));
console.log('✅ User:', user);

// 2. Check if socket service exists
console.log('✅ Socket Service:', window.socketService);

// 3. Check if socket is connected
console.log('✅ Is Connected:', window.socketService?.isConnected());

// 4. Check socket details
if (window.socketService) {
  console.log('Socket ID:', window.socketService.socket?.id);
  console.log('Socket Connected:', window.socketService.socket?.connected);
  console.log('Listeners:', window.socketService.listeners);
}
```

**Expected Output:**
```
✅ User: { id: "67...", name: "...", ... }
✅ Socket Service: SocketService { ... }
✅ Is Connected: true
Socket ID: "abc123..."
Socket Connected: true
Listeners: Map(...)
```

## Test 2: Manual Socket Event Test

### Step 1: Set Up Listener (in Browser Console)

```javascript
// Add a test listener
window.socketService.on('staff_updated', (data) => {
  console.log('🎉 RECEIVED EVENT:', data);
  alert('Staff Updated: ' + data.name);
});

console.log('✅ Listener registered');
```

### Step 2: Trigger Test Event from Backend

Open a new terminal and run:

```bash
curl -X POST http://localhost:3001/api/test/socket-event
```

Or in browser console:

```javascript
fetch('http://localhost:3001/api/test/socket-event', {
  method: 'POST'
}).then(r => r.json()).then(console.log);
```

### Expected Result:

- Browser console shows: `🎉 RECEIVED EVENT: { staffId: "123", name: "Test User", ... }`
- Alert pops up: "Staff Updated: Test User"
- Backend console shows: `✅ Test event emitted`

## Test 3: Real Staff Update

### Window A (Editor):

1. Go to Staff List
2. Click on a staff member
3. Edit their name (e.g., "John" → "John Smith")
4. Click Save
5. Watch backend console

### Window B (Viewer):

1. Open Staff List
2. Open browser console
3. Watch for: `📢 Received staff update: ...`
4. Staff name should update automatically
5. Toast notification should appear

### Backend Console Should Show:

```
PUT /api/staff/67... 200 OK
📢 Broadcasting staff update for John Smith (67...)
```

### Frontend Console Should Show:

```
📢 Received staff update: { staffId: "67...", name: "John Smith", ... }
```

## Troubleshooting

### Problem: Socket Not Connecting

**Check 1: User in sessionStorage**
```javascript
sessionStorage.getItem('app_user')
// Should return: "{\"id\":\"67...\",...}"
```

**Check 2: API URL**
```javascript
import.meta.env.VITE_API_URL
// Should be: "http://localhost:3001/api"
```

**Check 3: Backend Running**
```bash
curl http://localhost:3001/api/staff
# Should return staff list
```

**Fix: Restart Everything**
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
cd school-dashboard
npm run dev
```

Then login again.

### Problem: Socket Connects But No Events

**Check 1: Listener Registered**
```javascript
window.socketService.listeners.get('staff_updated')
// Should return: [function]
```

**Check 2: Navigate to Staff List**
- The listener is only set up when you're on the Staff List page
- Navigate to `/staffs` and check again

**Check 3: Check Backend Clients**
```javascript
// Trigger test event and check response
fetch('http://localhost:3001/api/test/socket-event', {
  method: 'POST'
}).then(r => r.json()).then(data => {
  console.log('Connected clients:', data.clients);
});
```

If `clients: 0`, socket is not connecting to backend.

### Problem: Events Received But UI Not Updating

**Check 1: updateStaffLocal Function**
```javascript
// In StaffList component, check if function exists
// Open React DevTools → Components → StaffList
// Check props for updateStaffLocal
```

**Check 2: Staff State**
```javascript
// In React DevTools
// Find AppContext → Check staff array
// Make a change and see if it updates
```

**Fix: Force Re-render**
```javascript
// In browser console
window.location.reload();
```

## Debug Mode

Add this to `school-dashboard/src/pages/staffs/StaffList.jsx` temporarily:

```javascript
// Add after imports
useEffect(() => {
  console.log('🔍 DEBUG INFO:');
  console.log('- Staff count:', staff.length);
  console.log('- Socket service:', window.socketService);
  console.log('- Socket connected:', window.socketService?.isConnected());
  console.log('- Listeners:', window.socketService?.listeners.get('staff_updated'));
  console.log('- updateStaffLocal:', typeof updateStaffLocal);
}, [staff]);
```

## Success Criteria

✅ Socket connects on app load
✅ `window.socketService.isConnected()` returns `true`
✅ Test event triggers alert
✅ Real staff update shows in console
✅ UI updates without refresh
✅ Toast notification appears

## Still Not Working?

1. **Check browser console for errors**
2. **Check backend console for errors**
3. **Try in incognito mode**
4. **Try different browser**
5. **Check firewall/antivirus**
6. **Restart computer** (seriously, sometimes helps)

## Contact Info

If still not working, provide:
1. Browser console screenshot
2. Backend console screenshot
3. Output of all Test 1 commands
4. Network tab showing WebSocket connection
