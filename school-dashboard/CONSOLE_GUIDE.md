# Console Messages Guide

## What You'll See in Browser Console

### ✅ Good Messages (Normal Operation)

```
🌐 API URL configured: http://localhost:3001/api
📡 API Request: GET http://localhost:3001/api/classes
✅ API Response: 200 http://localhost:3001/api/classes
💾 Cache hit: http://localhost:3001/api/classes
```

**What this means**: Everything is working correctly. Requests are being made, responses are successful, and caching is working.

---

### ⏳ Retry Messages (Automatic Recovery)

```
⏳ Retrying request in 1000ms (attempt 1/2)...
⏳ Retrying request in 2000ms (attempt 2/2)...
```

**What this means**: A request failed (maybe network hiccup or temporary server issue) and the system is automatically retrying. This is normal and expected.

---

### ❌ Error Messages (Need Attention)

#### Rate Limit Error (Should NOT see this anymore)
```
❌ API Error: http://localhost:3001/api/... Error: Too many requests - rate limit exceeded
Failed to load resource: 429 (Too Many Requests)
```

**What this means**: You're still hitting rate limits. This should NOT happen with the new system. If you see this:
1. Make sure backend server was restarted
2. Clear browser cache
3. Check if multiple tabs are open

#### Timeout Error
```
⏱️ API Timeout: http://localhost:3001/api/...
❌ API Error: Request timed out
```

**What this means**: Request took longer than 15 seconds. Could be:
- Backend server is slow or overloaded
- MongoDB is slow
- Network issues

#### Unauthorized Error
```
⚠️ 401 Unauthorized - clearing session
❌ API Error: Request failed with status 401
```

**What this means**: Your session expired. You'll be logged out automatically. Just log in again.

---

## Request Queue Status

You can check the queue status in console:

```javascript
// In browser console, type:
import { requestQueue } from './src/utils/requestQueue.js';
console.log('Pending:', requestQueue.pending);
console.log('Active:', requestQueue.active);
```

**Normal values**:
- Pending: 0-10 (requests waiting)
- Active: 0-5 (requests in progress)

**Problem indicators**:
- Pending: >50 (too many requests queued)
- Active: Always 5 (queue is constantly full)

---

## Performance Monitoring

### Good Performance
```
📡 API Request: GET /api/classes
💾 Cache hit: /api/classes (instant response)
✅ API Response: 200 /api/classes (50ms)
```

### Slow Performance
```
📡 API Request: GET /api/classes
✅ API Response: 200 /api/classes (5000ms)
```

**If you see slow responses (>2000ms)**:
1. Check backend server logs
2. Check MongoDB performance
3. Check network connection
4. Consider adding more caching

---

## Debugging Tips

### Enable Verbose Logging
The system already logs everything. To see more details, open browser DevTools:
1. Press F12
2. Go to Console tab
3. Filter by "API" to see only API-related messages

### Clear Cache
If you suspect stale data:
```javascript
// In browser console:
import { clearApiCache } from './services/api';
clearApiCache();
```

### Check Request Queue
```javascript
// In browser console:
import { requestQueue } from './utils/requestQueue';
console.log('Queue status:', {
  pending: requestQueue.pending,
  active: requestQueue.active
});
```

---

## Common Scenarios

### Scenario 1: Page Loads Slowly
**Console shows**:
```
📡 API Request: GET /api/classes
📡 API Request: GET /api/students
📡 API Request: GET /api/staff
... (many requests)
✅ API Response: 200 (after 2-3 seconds)
```

**This is normal** if:
- First time loading the page
- Cache expired
- Many classes/students to load

**This is a problem** if:
- Happens every time (cache not working)
- Takes >5 seconds consistently

### Scenario 2: Repeated 429 Errors
**Console shows**:
```
❌ API Error: Too many requests
⏳ Retrying request in 2000ms...
❌ API Error: Too many requests
```

**Action needed**:
1. Restart backend server
2. Check if rate limit was increased (should be 300)
3. Check if multiple browser tabs are open
4. Clear browser cache

### Scenario 3: Cache Working Well
**Console shows**:
```
📡 API Request: GET /api/classes (first time)
✅ API Response: 200
💾 Cache hit: /api/classes (second time - instant!)
💾 Cache hit: /api/classes (third time - instant!)
```

**This is perfect!** The cache is reducing server load.

---

## When to Worry

### 🚨 Red Flags
- Continuous 429 errors (rate limiting not working)
- Timeouts on every request (backend/database issues)
- 401 errors on every request (authentication broken)
- No cache hits ever (caching not working)

### ✅ Green Flags
- Occasional retries (normal network hiccups)
- Cache hits on repeated requests (caching working)
- Response times <1000ms (good performance)
- No 429 errors (rate limiting working)

---

## Getting Help

If you see persistent errors:

1. **Copy the error messages** from console
2. **Note what you were doing** when error occurred
3. **Check backend logs** for corresponding errors
4. **Try the fixes** in QUICK_START_RATE_LIMIT_FIX.md

Include this info when asking for help:
- Browser console errors
- Backend server logs
- What page/action triggered the error
- Whether it happens consistently or randomly
