# Testing Owlin Tracking

## Setup Steps

1. **Start Owlin Server**
   ```bash
   cd owlin/server
   npm start
   ```
   Should see: "Owlin Tracker - Backend Server" on port 4001

2. **Start Owlin Dashboard**
   ```bash
   cd owlin
   npm run dev
   ```
   Should run on http://localhost:5173

3. **Start School Dashboard**
   ```bash
   cd school-dashboard
   npm run dev
   ```
   Should run on http://localhost:4000

## Testing Checklist

### 1. User Tracking
- [ ] Open school-dashboard at http://localhost:4000
- [ ] Log in as any user (e.g., Vikram Patel)
- [ ] Check browser console for `[Owlin]` logs
- [ ] Should see: "User identified: [userId] Vikram Patel"
- [ ] Should see: "Session started on server for: Vikram Patel"

### 2. Events Page
- [ ] Open Owlin dashboard at http://localhost:5173/events
- [ ] Should see events appearing in real-time
- [ ] User column should show "Vikram Patel" with avatar (not random ID)
- [ ] New events should have green background
- [ ] Green pulse indicator should appear when events stream

### 3. Users Page
- [ ] Go to http://localhost:5173/users
- [ ] Should see "Vikram Patel" in the list
- [ ] Should show email and role
- [ ] Should show last login time

### 4. Sessions Page
- [ ] Go to http://localhost:5173/sessions
- [ ] Should see active session for "Vikram Patel"
- [ ] Should show event count and duration
- [ ] Click to expand - should show pages visited

### 5. Page Usage
- [ ] Navigate around school-dashboard (click different pages)
- [ ] Go to http://localhost:5173/page-usage
- [ ] Should see ranked list of pages
- [ ] Top pages should have gold/silver/bronze badges
- [ ] Try different time filters (Today, Week, Month, All)

### 6. Dashboard
- [ ] Go to http://localhost:5173
- [ ] Should see stats cards with numbers
- [ ] Should see "Live Sessions" with Vikram Patel
- [ ] Should see "Top Pages Today" widget

## Troubleshooting

### No events appearing
1. Check browser console in school-dashboard for errors
2. Check Owlin server console for incoming events
3. Verify CORS is allowing localhost:4000
4. Check Network tab for failed requests to localhost:4001

### Users not showing
1. Make sure you logged in to school-dashboard
2. Check if session was started (look for console log)
3. Verify user metadata is being sent with events

### Sessions not showing
1. Check if `/api/session/start` was called
2. Look at Owlin server logs for session creation
3. Try refreshing the Sessions page

### Real-time not working
1. Check if WebSocket connected (browser console)
2. Verify socket URL in owlin/.env
3. Check Owlin server for WebSocket connections

## Expected Console Logs

### School Dashboard Console
```
[Owlin] Initializing tracker...
[Owlin] SDK script loaded
[Owlin] Config: {...}
[Owlin] Tracker initialized successfully
[Owlin] User identified: 6972605d47f5721444d7afb3 Vikram Patel
[Owlin] Session started on server for: Vikram Patel
```

### Owlin Server Console
```
POST /api/session/start
[Server] Session started for user: 6972605d47f5721444d7afb3
POST /api/events
[Server] Received single event: click
[Server] Event stored and broadcast: click abc123
```

### Owlin Dashboard Console
```
Socket connected: xyz789
[Events] New event received: {...}
```
