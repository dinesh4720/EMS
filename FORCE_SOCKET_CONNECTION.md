# Force Socket Connection

The socket shows `Connected: false`. Let's manually connect it.

## Step 1: Check What We Have

```javascript
console.log('User:', JSON.parse(sessionStorage.getItem('app_user')));
console.log('Socket Service:', window.socketService);
```

## Step 2: Manually Import and Connect

Paste this entire block in console:

```javascript
(async () => {
  console.log('🔌 Manual socket connection starting...');
  
  // Get user
  const user = JSON.parse(sessionStorage.getItem('app_user'));
  if (!user || !user.id) {
    console.error('❌ No user found!');
    return;
  }
  console.log('✅ User found:', user.id);
  
  // Import socket service
  const { default: socketService } = await import('/src/services/socketService.js');
  console.log('✅ Socket service imported');
  
  // Store globally
  window.socketService = socketService;
  
  // Connect
  socketService.connect(user.id, 'staff');
  console.log('✅ Connection initiated');
  
  // Wait a bit for connection
  setTimeout(() => {
    console.log('🔍 Connection status:', socketService.isConnected());
    console.log('🔍 Socket:', socketService.socket);
    console.log('🔍 Socket connected:', socketService.socket?.connected);
  }, 2000);
  
  // Set up listener
  socketService.on('authenticated', () => {
    console.log('✅ AUTHENTICATED!');
  });
  
  socketService.on('connect_error', (err) => {
    console.error('❌ CONNECTION ERROR:', err);
  });
  
  // Set up test listener
  socketService.on('staff_updated', (data) => {
    console.log('🎉 STAFF UPDATED EVENT:', data);
    alert('Staff Updated: ' + data.name);
  });
  
  console.log('✅ All listeners set up');
})();
```

## Step 3: Wait 2 Seconds

After running the above, wait 2 seconds and check:

```javascript
window.socketService.isConnected()
```

Should return `true`.

## Step 4: Test Event

```javascript
fetch('http://localhost:3001/api/test/socket-event', {method: 'POST'});
```

You should see an alert!

## If Still Not Connecting

Check backend console for:
```
🔌 New socket connection: [SOCKET_ID]
✅ User authenticated: [USER_ID] (staff)
```

If you don't see this, the backend is not receiving the connection.

### Check Backend is Running

```bash
curl http://localhost:3001/api/staff
```

Should return staff list.

### Check CORS

The issue might be CORS. Check backend console for CORS errors.

### Check Port

Make sure backend is on port 3001:

```javascript
import.meta.env.VITE_API_URL
// Should be: "http://localhost:3001/api"
```

## Nuclear Option

If nothing works, restart EVERYTHING:

1. Close all browser tabs
2. Stop backend (Ctrl+C)
3. Stop frontend (Ctrl+C)
4. Start backend: `cd backend && node server.js`
5. Start frontend: `cd school-dashboard && npm run dev`
6. Open fresh browser tab
7. Login
8. Run the manual connection script above
