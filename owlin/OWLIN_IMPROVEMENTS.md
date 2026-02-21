# Owlin Activity Tracker - Improvements Plan

## Current Issues

1. **Random Numbers Instead of Names**: The Events page shows user IDs (like `6972605d47f5721444d7afb3`) instead of readable names
2. **Data Only After Refresh**: Events don't appear in real-time, requiring page refresh
3. **Poor Data Hierarchy**: Need structure: School → User → Sessions → Activities
4. **Missing Usage Analytics**: No page ranking or usage statistics

## Root Causes

### Issue 1: User Display
- The SDK sends `userId` but not user metadata with every event
- The server stores user metadata separately but doesn't join it when returning events
- The frontend displays raw `userId` instead of looking up user details

### Issue 2: Real-time Updates
- WebSocket events are emitted but not properly consumed by the frontend
- The Events page doesn't subscribe to real-time updates
- No automatic refresh mechanism

### Issue 3: Data Structure
- Events are flat, not grouped by session or user
- No hierarchical view component
- Missing session grouping logic

### Issue 4: Analytics
- No page usage aggregation
- No ranking/statistics endpoint
- Dashboard doesn't show usage metrics

## Solutions

### 1. Fix User Display
**Backend Changes:**
- Modify `/api/events` to include user details with each event
- Add user lookup when returning events
- Include `userName`, `userRole`, `userEmail` in event response

**Frontend Changes:**
- Display `userName` instead of `userId`
- Add user avatar/icon
- Show role badge

### 2. Enable Real-time Updates
**Frontend Changes:**
- Connect to WebSocket in Events page
- Subscribe to `event:new` and `events:batch` events
- Prepend new events to the list without refresh
- Add visual indicator for new events

### 3. Hierarchical View
**New Components:**
- `SessionView`: Groups events by session
- `UserActivityView`: Shows user → sessions → events
- `SchoolActivityView`: Shows school → users → sessions → events

**New API Endpoints:**
- `GET /api/schools/:schoolId/activity` - School-level activity
- `GET /api/users/:userId/sessions` - User sessions with events
- `GET /api/sessions/:sessionId/events` - Session events

### 4. Usage Analytics Dashboard
**New Backend Endpoint:**
- `GET /api/analytics/page-usage` - Returns page visit counts ranked

**New Frontend Page:**
- `PageUsage.tsx` - Shows ranked list of pages by usage
- Bar chart visualization
- Time range filter (today, week, month, all)

## Implementation Plan

### Phase 1: Fix User Display (Quick Win)
1. Update server to enrich events with user data
2. Update Events.tsx to display user names
3. Add user metadata to SDK tracking

### Phase 2: Real-time Updates
1. Add WebSocket connection to Events page
2. Implement event streaming
3. Add live indicator

### Phase 3: Hierarchical Views
1. Create new view components
2. Add session grouping
3. Implement drill-down navigation

### Phase 4: Analytics Dashboard
1. Create analytics aggregation logic
2. Build page usage endpoint
3. Create PageUsage component with charts

## File Changes Required

### Backend
- `owlin/server/index.js` - Add user enrichment to events endpoint
- `owlin/server/storage.js` - Add analytics methods
- `owlin/server/index.js` - Add analytics endpoints

### Frontend
- `owlin/src/pages/Events.tsx` - Add WebSocket, display user names
- `owlin/src/pages/Dashboard.tsx` - Add page usage widget
- `owlin/src/pages/PageUsage.tsx` - New analytics page
- `owlin/src/services/socket.ts` - Enhance WebSocket service
- `owlin/src/hooks/useEvents.ts` - Add real-time updates
- `owlin/src/components/SessionView.tsx` - New component
- `owlin/src/components/UserActivityView.tsx` - New component

### SDK
- `owlin/sdk/owlin-tracker.js` - Include user metadata in every event
- `school-dashboard/src/hooks/useOwlinTracking.js` - Pass full user object
