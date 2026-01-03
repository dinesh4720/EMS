# Multi-Account Testing Guide

## Problem
When testing chat with 2 accounts in the same browser, sessions collide because:
- localStorage is shared across all tabs in the same browser
- Auth tokens overwrite each other
- Socket service is a singleton that gets confused
- Both windows end up logged in as the same user

## Solution: Use Separate Browser Contexts

### Option 1: Different Browsers (Recommended)
- **User A**: Chrome (normal)
- **User B**: Firefox or Edge

### Option 2: Incognito/Private Windows
- **User A**: Chrome (normal window)
- **User B**: Chrome (incognito window)

Incognito windows have separate localStorage from normal windows.

### Option 3: Different Browser Profiles
Chrome/Edge allow multiple profiles:
1. Click your profile icon in top-right
2. Click "Add" to create a new profile
3. Each profile has its own localStorage

### Option 4: Different Devices
- **User A**: Your computer
- **User B**: Your phone or another computer

## Testing Steps

### Setup
1. Open Browser 1 (e.g., Chrome normal)
2. Login as User A (vikram@school.com)
3. Open Browser 2 (e.g., Chrome incognito)
4. Login as User B (dkumdesigns@gmail.com)

### Test Real-Time Chat
1. In Browser 1 (User A): Navigate to Messages
2. In Browser 2 (User B): Navigate to Messages
3. User A: Start chat with User B
4. User A: Send message "Hello from A"
5. **Expected**: Message appears on RIGHT side in Browser 1 (sent)
6. **Expected**: Message appears on LEFT side in Browser 2 (received)
7. User B: Reply "Hello from B"
8. **Expected**: Message appears on RIGHT side in Browser 2 (sent)
9. **Expected**: Message appears on LEFT side in Browser 1 (received)

### Test Global Notifications
1. In Browser 1 (User A): Navigate to Dashboard (NOT messaging)
2. In Browser 2 (User B): Navigate to Messages
3. User B: Send message to User A
4. **Expected in Browser 1**: 
   - Toast notification appears
   - Sound plays
   - Unread badge shows on sidebar

### Test Auto-Scroll
1. Both users in Messages with chat open
2. Send multiple messages back and forth
3. **Expected**: Chat auto-scrolls to bottom after each message

## Current Issues (Same Browser Testing)

### What Happens
```
Window 1: Login as User A (ID: 123)
Window 2: Login as User B (ID: 456)
Window 1: Refreshes → Now shows User B (ID: 456) ❌
Window 2: Still User B (ID: 456)
```

### Why It Happens
1. Both windows share the same localStorage
2. When User B logs in, their token overwrites User A's token
3. When Window 1 refreshes, it reads the token from localStorage
4. It finds User B's token and logs in as User B

### Symptoms
- Both windows show the same user after refresh
- Messages appear on wrong side
- Can't test real-time chat properly
- Socket confusion (one socket for two users)

## Recommended Testing Setup

```
┌─────────────────────────────────────┐
│  Chrome (Normal Window)             │
│  User: vikram@school.com            │
│  ID: 694cc1c40c8a43491fb321dc       │
│  localStorage: { token: "ABC..." }  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Chrome (Incognito Window)          │
│  User: dkumdesigns@gmail.com        │
│  ID: 694cf3affb45d2a3dbedd108       │
│  localStorage: { token: "XYZ..." }  │
│  (Separate from normal window)      │
└─────────────────────────────────────┘
```

## Quick Test
To verify you're using separate contexts:
1. Login as User A in Window 1
2. Login as User B in Window 2
3. Refresh Window 1
4. **Check**: Does Window 1 still show User A?
   - ✅ YES → Separate contexts working
   - ❌ NO (shows User B) → Same context, use different browser/incognito

## Admin Credentials for Testing
- User A: `vikram@school.com` / `password123`
- User B: `dkumdesigns@gmail.com` / `QpCZjRvW`
- User C: `Bdk472000@gmail.com` / `w9WQjBat`

## Summary
✅ Use different browsers or incognito windows
✅ Each user needs their own browser context
✅ Verify by refreshing - users should stay logged in as themselves
❌ Don't use multiple tabs in the same browser
❌ Don't expect different users in the same browser context
