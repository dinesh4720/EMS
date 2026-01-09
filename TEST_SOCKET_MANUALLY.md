# Manual Socket Test

## Step 1: Check if User is Logged In

Open browser console and run:

```javascript
// Check if user exists in sessionStorage
const user = JSON.parse(sessionStorage.getItem('app_user'));
console.log('User:', user);
```

Expected output:
```javascript
User: { id: "67...", name: "...", role: "...", ... }
```

## Step 2: Check if Socket Service Exists

```javascript
// Check if socket service is available
console.log('Socket Service:', window.socketService);
console.log('Is Connected:', window.socketService?.isConnected());
```

Expected output:
```javascript
Socket Service: SocketService { socket: Socket, connected: true, ... }
Is Connected: true
```

## Step 3: Manually Test Socket Event

In **Browser Window A** (where you'll make changes), run:

```javascript
// Check if socket is connected
window.socketService.isConnected()
```

In **Browser Window B** (where you'll watch for updates), run:

```javascript
// Set up a test listener
window.socketService.on('staff_updated', (data) => {
  console.log('🧪 TEST: Received staff_updated event:', data);
  alert('Staff updated: ' + data.name);
});

console.log('✅ Test listener registered');
```

## Step 4: Make a Change

In **Browser Window A**:
1. Go to Staff List
2. Click on any staff member
3. Change their name
4. Click Save

## Step 5: Check Backend Console

In your backend terminal, you should see:

```
PUT /api/staff/67... 200 OK
📢 Broadcasting staff update for John Smith (67...)
```

## Step 6: Check Frontend Console (Window B)

You should see:

```
🧪 TEST: Received staff_updated event: { staffId: "67...", name: "John Smith", ... }
```

And an alert should pop up!

## If Nothing Happens

### Check 1: Is Socket Connected?

```javascript
window.socketService.socket.connected
// Should be: true
```

### Check 2: Check Socket ID

```javascript
window.socketService.socket.id
// Should be: "abc123..." (some random string)
```

### Check 3: Manually Emit Test Event

In backend, add this temporarily to test:

```javascript
// In backend/server.js, add after io initialization
setInterval(() => {
  io.emit('test_event', { message: 'Hello from server', time: new Date() });
  console.log('📢 Sent test event');
}, 5000);
```

Then in frontend console:

```javascript
window.socketService.on('test_event', (data) => {
  console.log('🧪 TEST EVENT:', data);
});
```

You should see a message every 5 seconds.

### Check 4: Verify Backend is Emitting

Add this to `backend/server.js` in the PUT `/api/staff/:id` route:

```javascript
// Right before io.emit
console.log('📢 About to emit staff_updated');
console.log('📢 Connected clients:', io.engine.clientsCount);
console.log('📢 Event data:', {
  staffId: staff._id.toString(),
  name: staff.name
});

io.emit('staff_updated', { ... });

console.log('✅ Event emitted');
```

## Quick Fix: Force Reconnect

If socket is not connecting, try this in console:

```javascript
// Disconnect
window.socketService.disconnect();

// Wait 2 seconds, then reconnect
setTimeout(() => {
  const user = JSON.parse(sessionStorage.getItem('app_user'));
  window.socketService.connect(user.id, 'staff');
}, 2000);
```

## Nuclear Option: Clear Everything and Restart

```javascript
// Clear all storage
sessionStorage.clear();
localStorage.clear();

// Hard refresh
location.reload(true);
```

Then login again and test.
