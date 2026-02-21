# Owlin Quick Start Guide

## The Problem You Had

1. ❌ Events showed random user IDs like `6972605d47f5721444d7afb3` instead of "Vikram Patel"
2. ❌ Data only appeared after page refresh
3. ❌ No hierarchical view (School → User → Sessions → Activities)
4. ❌ No page usage analytics

## What Was Fixed

1. ✅ User names now display properly with avatars and role badges
2. ✅ Real-time updates via WebSocket - no refresh needed
3. ✅ New Sessions page showing user → sessions → activities hierarchy
4. ✅ Page Usage analytics with rankings and time filters
5. ✅ Dashboard widgets showing top pages and live sessions

## How to Run Everything

### Terminal 1: Owlin Server
```bash
cd owlin/server
npm start
```
**Expected output:**
```
╔═══════════════════════════════════════════╗
║   Owlin Tracker - Backend Server        ║
╠═══════════════════════════════════════════╣
║   Port: 4001                             ║
║   CORS: 4000, 5173, 5174                 ║
║   Persistence: Enabled                   ║
╚═══════════════════════════════════════════╝
```

### Terminal 2: Owlin Dashboard
```bash
cd owlin
npm run dev
```
**Expected output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Terminal 3: School Dashboard
```bash
cd school-dashboard
npm run dev
```
**Expected output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:4000/
```

## Testing Flow

### Step 1: Generate Data
1. Open **school-dashboard** at http://localhost:4000
2. Log in as **Vikram Patel** (or any user)
3. **Click around** - navigate to different pages:
   - Go to Students
   - Go to Classes
   - Go to Academics
   - Go to Messaging
   - Click on various buttons and links

### Step 2: Check Browser Console
In school-dashboard, open DevTools Console (F12), you should see:
```
[Owlin] Initializing tracker...
[Owlin] SDK script loaded
[Owlin] Tracker initialized successfully
[Owlin] User identified: 6972605d47f5721444d7afb3 Vikram Patel
[Owlin] Session started on server for: Vikram Patel
```

### Step 3: View in Owlin Dashboard
Open **Owlin dashboard** at http://localhost:5173

#### Dashboard Page (/)
- Should show stats: Total Users, Active Sessions, Events Today
- Should show "Live Sessions" with Vikram Patel
- Should show "Top Pages Today" widget

#### Events Page (/events)
- Should show events in real-time
- User column shows "Vikram Patel" with avatar (NOT random ID)
- New events have green background
- Green pulse indicator when live

#### Sessions Page (/sessions)
- Shows Vikram Patel's session
- Click to expand and see:
  - Session duration
  - Event count
  - Pages visited

#### Users Page (/users)
- Shows "Vikram Patel" in table
- Shows email and role
- Shows last login time

#### Page Usage (/page-usage)
- Shows ranked list of pages (1 to N)
- Gold/Silver/Bronze medals for top 3
- Time filters: All, Today, Week, Month
- Progress bars showing relative usage

## Debug Commands

### Check Server State
```bash
cd owlin/server
node debug-state.js
```

This will show:
- Health status
- User count
- Session count
- Recent events
- Top pages

### Check Server Logs
Watch the Owlin server terminal for:
```
POST /api/session/start
POST /api/events
[Server] Event stored and broadcast: click abc123
```

### Check WebSocket Connection
In Owlin dashboard console:
```
Socket connected: xyz789
```

## Common Issues

### Issue: No events appearing
**Solution:**
1. Make sure all 3 servers are running
2. Check school-dashboard console for `[Owlin]` logs
3. Check Owlin server console for incoming requests
4. Verify you're logged in to school-dashboard

### Issue: Shows user ID instead of name
**Solution:**
1. Make sure you're using the updated code
2. Check if user metadata is being sent (look at Network tab)
3. Restart Owlin server to pick up changes

### Issue: No real-time updates
**Solution:**
1. Check if WebSocket connected (Owlin dashboard console)
2. Verify `.env` file exists in `owlin/` folder
3. Restart Owlin dashboard to pick up .env changes

### Issue: No sessions showing
**Solution:**
1. Log out and log back in to school-dashboard
2. Check if `/api/session/start` was called (Network tab)
3. Run `node debug-state.js` to check server state

## File Structure

```
owlin/
├── server/              # Backend server (port 4001)
│   ├── index.js        # API endpoints
│   ├── storage.js      # Data storage
│   └── debug-state.js  # Debug script
├── src/                # Frontend dashboard
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Events.tsx       # Events list with real-time
│   │   ├── Sessions.tsx     # Session hierarchy
│   │   ├── Users.tsx        # User list
│   │   └── PageUsage.tsx    # Analytics
│   └── services/
│       ├── api.ts          # API client
│       └── socket.ts       # WebSocket client
├── sdk/                # Tracking SDK
│   └── owlin-tracker.js
└── .env                # Environment config

school-dashboard/
├── src/hooks/
│   └── useOwlinTracking.js  # Tracking integration
└── public/
    └── owlin-tracker.js     # SDK copy
```

## What Happens Behind the Scenes

1. **User logs in** to school-dashboard
   - `useOwlinTracking` hook initializes
   - Tracker SDK loads
   - User ID and metadata sent to tracker
   - Session started on server via `/api/session/start`

2. **User clicks around**
   - SDK captures clicks, navigation, inputs
   - Events batched and sent to `/api/events`
   - Server stores events and broadcasts via WebSocket
   - Owlin dashboard receives events in real-time

3. **Owlin dashboard displays**
   - Events page subscribes to WebSocket
   - New events prepended to list automatically
   - User names enriched from metadata
   - Sessions grouped by user
   - Page usage aggregated and ranked

## Success Criteria

You'll know it's working when:
- ✅ You see "Vikram Patel" instead of user IDs
- ✅ Events appear instantly without refresh
- ✅ Green pulse indicator shows live activity
- ✅ Sessions page shows your active session
- ✅ Page Usage shows ranked pages
- ✅ Dashboard shows live sessions and top pages

## Next Steps

Once everything is working, you can:
1. Add more users and test multi-user tracking
2. Customize the dashboard widgets
3. Add filters to Events page
4. Export analytics data
5. Set up alerts for specific events
6. Add heatmaps and funnel analysis
