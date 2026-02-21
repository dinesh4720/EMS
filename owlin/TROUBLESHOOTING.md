# Owlin Troubleshooting Guide

## Your Specific Issues

### Issue 1: "I see random numbers instead of user names"

**Symptom:** Events show `6972605d47f5721444d7afb3` instead of "Vikram Patel"

**Root Cause:** User metadata wasn't being sent with events or enriched on the backend

**Solution Applied:**
1. ✅ SDK now includes user metadata in every event
2. ✅ Backend enriches events with user data before returning
3. ✅ Frontend displays userName field instead of userId

**How to verify it's fixed:**
```bash
# 1. Check school-dashboard console
# Should see: [Owlin] User identified: [id] Vikram Patel

# 2. Check Owlin server console
# Should see: POST /api/events with user metadata

# 3. Check Owlin dashboard Events page
# Should see "Vikram Patel" with avatar, not random ID
```

**If still showing IDs:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart Owlin server
3. Log out and log back in to school-dashboard
4. Check if user metadata is in the event (Network tab → /api/events)

---

### Issue 2: "Data only appears after refresh"

**Symptom:** Have to refresh page to see new events

**Root Cause:** No WebSocket subscription in Events page

**Solution Applied:**
1. ✅ Added WebSocket connection in main.tsx
2. ✅ Events page subscribes to real-time events
3. ✅ New events prepended automatically

**How to verify it's fixed:**
```bash
# 1. Open Owlin dashboard console
# Should see: Socket connected: [id]

# 2. Click around in school-dashboard
# Events should appear instantly in Owlin dashboard

# 3. Look for green pulse indicator
# Should appear when new events arrive
```

**If not working:**
1. Check if `.env` file exists in `owlin/` folder
2. Verify `VITE_SOCKET_URL=http://localhost:4001` in .env
3. Restart Owlin dashboard (npm run dev)
4. Check browser console for WebSocket errors
5. Verify Owlin server is running on port 4001

---

### Issue 3: "No sessions showing"

**Symptom:** Sessions page is empty

**Root Cause:** Sessions weren't being created when users log in

**Solution Applied:**
1. ✅ Added session start API call in useOwlinTracking hook
2. ✅ Sessions endpoint enriches with user data
3. ✅ Created Sessions page component

**How to verify it's fixed:**
```bash
# 1. Check school-dashboard console when logging in
# Should see: [Owlin] Session started on server for: Vikram Patel

# 2. Check Owlin server console
# Should see: POST /api/session/start

# 3. Run debug script
cd owlin/server
node debug-state.js
# Should show sessions in output
```

**If no sessions:**
1. Log out of school-dashboard
2. Log back in (this triggers session creation)
3. Check Network tab for `/api/session/start` request
4. Verify request succeeded (status 201)
5. Refresh Sessions page in Owlin dashboard

---

### Issue 4: "Users page is empty"

**Symptom:** No users showing in Users page

**Root Cause:** Users are created when events are tracked, but metadata wasn't being stored properly

**Solution Applied:**
1. ✅ Updated getUser() to merge metadata
2. ✅ Users endpoint flattens metadata
3. ✅ Session start includes user metadata

**How to verify it's fixed:**
```bash
# 1. Run debug script
cd owlin/server
node debug-state.js
# Should show users with names

# 2. Check API directly
curl http://localhost:4001/api/users
# Should return users array with name, email, role
```

**If no users:**
1. Make sure you're logged in to school-dashboard
2. Click around to generate events
3. Check if events are being tracked (Events page)
4. Verify user metadata in events (Network tab)
5. Restart Owlin server to pick up changes

---

## General Troubleshooting Steps

### Step 1: Verify All Servers Running

```bash
# Check Owlin server (port 4001)
curl http://localhost:4001/api/health
# Should return: {"status":"healthy",...}

# Check Owlin dashboard (port 5173)
# Open http://localhost:5173 in browser

# Check school-dashboard (port 4000)
# Open http://localhost:4000 in browser
```

### Step 2: Check Console Logs

**School Dashboard Console (F12):**
```
✅ [Owlin] Initializing tracker...
✅ [Owlin] SDK script loaded
✅ [Owlin] Tracker initialized successfully
✅ [Owlin] User identified: [id] Vikram Patel
✅ [Owlin] Session started on server for: Vikram Patel
```

**Owlin Dashboard Console:**
```
✅ Socket connected: [id]
✅ [Events] New event received: {...}
```

**Owlin Server Console:**
```
✅ POST /api/session/start
✅ POST /api/events
✅ [Server] Event stored and broadcast: click [id]
```

### Step 3: Check Network Tab

**In school-dashboard:**
1. Open DevTools → Network tab
2. Filter by "4001" (Owlin server)
3. Should see requests to:
   - `/api/session/start` (once on login)
   - `/api/events` (frequently)
4. Check request payload - should include user metadata

**In Owlin dashboard:**
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Should see WebSocket connection to localhost:4001
4. Check Messages tab - should see events streaming

### Step 4: Run Debug Script

```bash
cd owlin/server
node debug-state.js
```

This will show:
- ✅ Server health
- ✅ User count and details
- ✅ Session count and details
- ✅ Event count and samples
- ✅ Page usage data

### Step 5: Check Data Persistence

```bash
# Check if data file exists
ls owlin/server/data.json

# View contents
cat owlin/server/data.json | jq .
# or
cat owlin/server/data.json
```

Should contain:
- `events` array
- `users` array with metadata
- `sessions` array

---

## Common Error Messages

### "Socket connection error"
**Cause:** Owlin server not running or wrong URL
**Fix:**
1. Start Owlin server: `cd owlin/server && npm start`
2. Check `.env` has correct URL
3. Restart Owlin dashboard

### "Failed to fetch users"
**Cause:** API endpoint error or CORS issue
**Fix:**
1. Check Owlin server console for errors
2. Verify CORS allows localhost:5173
3. Check server/index.js CORS config

### "Tracker not initialized"
**Cause:** SDK script failed to load
**Fix:**
1. Check if `/owlin-tracker.js` exists in school-dashboard/public/
2. Check browser console for 404 errors
3. Verify script tag in HTML

### "Session not found"
**Cause:** Session expired or not created
**Fix:**
1. Log out and log back in
2. Check if session start was called
3. Verify session ID in events

---

## Quick Fixes

### Reset Everything
```bash
# Stop all servers (Ctrl+C in each terminal)

# Clear Owlin data
rm owlin/server/data.json

# Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear browsing data

# Restart servers
cd owlin/server && npm start
cd owlin && npm run dev
cd school-dashboard && npm run dev

# Log in fresh to school-dashboard
```

### Force Session Creation
```bash
# In browser console (school-dashboard):
fetch('http://localhost:4001/api/session/start', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    userId: 'test-user-123',
    metadata: {name: 'Test User', email: 'test@example.com', role: 'admin'}
  })
}).then(r => r.json()).then(console.log)
```

### Test Event Tracking
```bash
# In browser console (school-dashboard):
window.__OWLIN_TRACKER__.track({
  type: 'test',
  message: 'Testing tracking'
})
```

### Check WebSocket
```bash
# In browser console (Owlin dashboard):
console.log('Socket connected:', window.socketService?.isConnected)
```

---

## Still Not Working?

1. **Check file changes were applied:**
   ```bash
   git status
   git diff
   ```

2. **Verify Node modules are up to date:**
   ```bash
   cd owlin && npm install
   cd owlin/server && npm install
   cd school-dashboard && npm install
   ```

3. **Check for port conflicts:**
   ```bash
   # Windows
   netstat -ano | findstr :4001
   netstat -ano | findstr :5173
   netstat -ano | findstr :4000
   
   # Mac/Linux
   lsof -i :4001
   lsof -i :5173
   lsof -i :4000
   ```

4. **Review documentation:**
   - `owlin/QUICK_START.md` - Setup guide
   - `owlin/test-tracking.md` - Testing checklist
   - `owlin/IMPLEMENTATION_SUMMARY.md` - Technical details

5. **Check browser compatibility:**
   - Use Chrome, Firefox, or Edge (latest version)
   - Enable JavaScript
   - Disable ad blockers that might block WebSocket

---

## Success Checklist

- [ ] All 3 servers running without errors
- [ ] School-dashboard console shows `[Owlin]` logs
- [ ] Owlin server console shows incoming requests
- [ ] Owlin dashboard shows "Socket connected"
- [ ] Events page shows user names (not IDs)
- [ ] Events appear in real-time (no refresh needed)
- [ ] Sessions page shows active sessions
- [ ] Users page shows user list
- [ ] Page Usage shows ranked pages
- [ ] Dashboard shows live sessions and top pages

If all checked ✅, everything is working correctly!
