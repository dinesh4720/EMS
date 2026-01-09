# Debug Real-Time Staff Updates

## Quick Debug Steps

### 1. Check if Backend is Running
```bash
cd backend
node server.js
```

Look for:
```
✅ Socket.IO initialized
✅ Chat handlers initialized
Server running on port 3001
```

### 2. Check Frontend Console

Open browser console (F12) and look for these logs in order:

```
🔌 AppContext: Initializing socket...
✅ Socket service imported
🔌 Initializing socket for user: 67...
🔌 Connecting to Socket.IO: http://localhost:3001
✅ Socket connected: abc123
✅ Authenticated: { userId: "67...", userType: "staff" }
✅ Socket authenticated successfully
```

### 3. Test Socket Connection

In browser console, run:
```javascript
// Check if socket exists
window.socketService

// Check connection status
window.socketService.isConnected()
// Should return: true

// Check socket object
window.socketService.socket
// Should show: Socket { connected: true, ... }
```

### 4. Test Event Emission

**In Window A (make a change):**
1. Go to Staff List
2. Edit a staff member's name
3. Save

**Check Backend Console:**
```
📢 Broadcasting staff update for John Smith (67...)
```

**Check Window B Console:**
```
📢 Received staff update: { staffId: "67...", name: "John Smith", ... }
```

### 5. Manual Event Test

**In Browser Console:**
```javascript
// Listen for events
window.socketService.on('staff_updated', (data) => {
  console.log('🧪 TEST EVENT RECEIVED:', data);
});

// Check if listener is registered
window.socketService.listeners.get('staff_updated')
// Should show array with functions
```

## Common Issues

### Issue 1: Socket Not Connecting

**Symptoms:**
- No "Socket connected" message
- `window.socketService` is undefined

**Solutions:**
1. Check if user is logged in:
   ```javascript
   localStorage.getItem('user')
   ```

2. Check API URL:
   ```javascript
   import.meta.env.VITE_API_URL
   ```

3. Restart frontend:
   ```bash
   npm run dev
   ```

### Issue 2: Socket Connects But No Events

**Symptoms:**
- Socket connected ✅
- But no "Received staff update" message

**Check:**
1. Are you on the Staff List page?
2. Check if listener is set up:
   ```javascript
   window.socketService.listeners.get('staff_updated')
   ```

3. Navigate to Staff List page and check console for:
   ```
   🎧 Setting up staff_updated listener
   ```

### Issue 3: Events Received But UI Not Updating

**Symptoms:**
- Console shows "Received staff update" ✅
- But UI doesn't change

**Check:**
1. Is `updateStaffLocal` function defined?
   ```javascript
   // In StaffList component
   console.log(typeof updateStaffLocal)
   // Should be: "function"
   ```

2. Check React DevTools:
   - Open React DevTools
   - Find StaffList component
   - Check if `staff` prop is updating

### Issue 4: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Check `backend/server.js` CORS config:
```javascript
cors({
  origin: [
    'http://localhost:5173',  // ← Your frontend URL
    'http://localhost:5174',
    // ...
  ]
})
```

## Force Refresh Test

If nothing works, try this:

1. **Clear everything:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Hard refresh:**
   - Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or: Right-click refresh button → "Empty Cache and Hard Reload"

3. **Restart both servers:**
   ```bash
   # Terminal 1
   cd backend
   node server.js

   # Terminal 2
   cd school-dashboard
   npm run dev
   ```

4. **Login again and test**

## Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Socket connects on app load
- [ ] `window.socketService.isConnected()` returns `true`
- [ ] Listener registered: `window.socketService.listeners.get('staff_updated')`
- [ ] Backend emits event when staff updated
- [ ] Frontend receives event in console
- [ ] UI updates without refresh
- [ ] Toast notification appears

## Still Not Working?

Add this to `school-dashboard/src/pages/staffs/StaffList.jsx` temporarily:

```javascript
// Add after the useEffect with socket listener
useEffect(() => {
  console.log('🔍 DEBUG: Staff list has', staff.length, 'members');
  console.log('🔍 DEBUG: Socket service:', window.socketService);
  console.log('🔍 DEBUG: Socket connected:', window.socketService?.isConnected());
  console.log('🔍 DEBUG: Listeners:', window.socketService?.listeners);
}, [staff]);
```

This will help identify where the issue is.
