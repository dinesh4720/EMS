# Quick Test Steps - Real-Time Staff Updates

## Step 1: Restart Servers

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd school-dashboard
npm run dev
```

Wait for both to start successfully.

## Step 2: Login

1. Open `http://localhost:5173`
2. Login with your credentials
3. You should see the dashboard

## Step 3: Open Browser Console

Press `F12` to open DevTools, go to Console tab.

## Step 4: Check Socket Connection

Paste this in console and press Enter:

```javascript
console.log('User:', JSON.parse(sessionStorage.getItem('app_user')));
console.log('Socket:', window.socketService);
console.log('Connected:', window.socketService?.isConnected());
```

**Expected output:**
```
User: { id: "67...", name: "...", ... }
Socket: SocketService { ... }
Connected: true
```

If `Connected: false` or `Socket: undefined`, **STOP HERE** and check:
- Is backend running?
- Did you login?
- Any errors in console?

## Step 5: Set Up Test Listener

Paste this in console:

```javascript
window.socketService.on('staff_updated', (data) => {
  console.log('🎉 EVENT RECEIVED:', data);
  alert('Staff Updated: ' + data.name);
});
console.log('✅ Listener set up');
```

## Step 6: Trigger Test Event

Paste this in console:

```javascript
fetch('http://localhost:3001/api/test/socket-event', {
  method: 'POST'
}).then(r => r.json()).then(console.log);
```

**Expected result:**
- Alert pops up: "Staff Updated: Test User"
- Console shows: `🎉 EVENT RECEIVED: { staffId: "123", name: "Test User", ... }`

If you see the alert and console message, **SOCKET IS WORKING!** ✅

## Step 7: Test Real Update

### Window A:
1. Go to Staff List
2. Click on any staff member
3. Change their name
4. Click Save

### Window B (or same window):
- Watch console for: `🎉 EVENT RECEIVED: ...`
- Staff list should update automatically
- Toast notification should appear

## If It's Not Working

### Check 1: Backend Console

Look for:
```
✅ Socket.IO initialized
Server running on port 3001
```

### Check 2: Frontend Console

Look for:
```
🔌 AppContext: Initializing socket for user: 67...
✅ Socket service imported
✅ Socket authenticated successfully
```

### Check 3: Network Tab

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. You should see a WebSocket connection to `localhost:3001`
4. Status should be "101 Switching Protocols" (green)

### Quick Fix

If nothing works, try this:

```javascript
// In console
sessionStorage.clear();
location.reload();
```

Then login again and repeat from Step 3.

## Success!

If you see:
✅ Socket connected
✅ Test event triggers alert
✅ Real updates show in console
✅ UI updates without refresh

Then real-time updates are working! 🎉

Your friend can now update their profile and you'll see it instantly without refreshing.
