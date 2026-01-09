# Testing Real-Time Staff Updates

## Setup

1. **Restart Backend Server**
   ```bash
   cd backend
   node server.js
   ```

2. **Restart Frontend**
   ```bash
   cd school-dashboard
   npm run dev
   ```

## Testing Steps

### Step 1: Open Browser Console
- Open Chrome DevTools (F12)
- Go to Console tab
- Look for these messages:
  ```
  🔌 AppContext: Initializing socket...
  ✅ Socket service imported
  🔌 Initializing socket for user: [USER_ID]
  🔌 Connecting to Socket.IO: http://localhost:3001
  ✅ Socket connected: [SOCKET_ID]
  ✅ Socket authenticated successfully
  ```

### Step 2: Open Two Browser Windows
1. **Window A**: Open `http://localhost:5173` and login
2. **Window B**: Open `http://localhost:5173` in incognito/private mode and login with different account

### Step 3: Test Staff Update
1. **Window A**: 
   - Go to Staff List
   - Click on a staff member
   - Edit their name (e.g., "John" → "John Smith")
   - Save changes

2. **Window B**:
   - Should be on Staff List page
   - Watch the console for:
     ```
     📢 Received staff update: { staffId: "...", name: "John Smith", ... }
     ```
   - The staff name should update automatically
   - A toast notification should appear: "John Smith's profile was updated 🔄"

### Step 4: Verify No Refresh Needed
- In Window B, the staff list should show "John Smith" immediately
- No manual refresh should be needed

## Troubleshooting

### Socket Not Connecting
**Check Console for:**
```
❌ Socket connection error: ...
```

**Solutions:**
1. Make sure backend is running on port 3001
2. Check CORS settings in `backend/server.js`
3. Verify `VITE_API_URL` in `school-dashboard/.env`

### Socket Connects But No Updates
**Check Console for:**
```
🎧 Setting up staff_updated listener
```

**If missing:**
1. Make sure you're on the Staff List page
2. Refresh the page
3. Check if `window.socketService` exists in console

### Updates Not Showing
**Check Backend Console for:**
```
📢 Broadcasting staff update for [NAME] ([ID])
```

**If missing:**
- The backend route might not be emitting the event
- Check `backend/server.js` PUT `/api/staff/:id` route

### Manual Debugging

**In Browser Console:**
```javascript
// Check if socket service exists
window.socketService

// Check if socket is connected
window.socketService.isConnected()

// Manually test event
window.socketService.on('staff_updated', (data) => {
  console.log('TEST:', data);
});
```

**In Backend:**
```javascript
// Add to PUT /api/staff/:id route
console.log('📢 About to emit staff_updated event');
io.emit('staff_updated', { ... });
console.log('✅ Event emitted');
```

## Expected Console Output

### Window A (Editor):
```
PUT /api/staff/123 200 OK
📢 Broadcasting staff update for John Smith (123)
```

### Window B (Viewer):
```
📢 Received staff update: { staffId: "123", name: "John Smith", ... }
🔄 Updating staff in state
✅ Staff updated successfully
```

## Success Criteria

✅ Socket connects automatically on app load
✅ Both users see socket authenticated message
✅ When User A edits staff, User B sees update instantly
✅ Toast notification appears in User B's window
✅ No manual refresh needed
✅ Changes persist after refresh
