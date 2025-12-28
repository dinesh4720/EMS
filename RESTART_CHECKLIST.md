# Restart Checklist - Students Still Loading

## ⚠️ CRITICAL: Did You Restart the Frontend?

After changing `.env`, you **MUST** restart the frontend!

### Quick Fix:

```bash
# In the frontend terminal:
# 1. Press Ctrl+C to stop
# 2. Wait for it to fully stop
# 3. Run:
npm run dev
```

---

## Complete Restart Process

### ✅ Step 1: Stop Everything

- [ ] Stop frontend (Ctrl+C in Terminal 2)
- [ ] Stop backend (Ctrl+C in Terminal 1)
- [ ] Wait 2 seconds for processes to fully stop

### ✅ Step 2: Verify Configuration

```bash
# Check .env file
cat school-dashboard/.env
```

**Should show:**
```
VITE_API_URL=http://localhost:3001/api
```

- [ ] .env file is correct

### ✅ Step 3: Start Backend

```bash
cd backend
npm start
```

**Wait for:**
```
Connected to MongoDB
Server running on http://localhost:3001
```

- [ ] Backend started successfully
- [ ] Shows "Connected to MongoDB"
- [ ] Shows "Server running on http://localhost:3001"

### ✅ Step 4: Start Frontend

```bash
cd school-dashboard
npm run dev
```

**Wait for:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

- [ ] Frontend started successfully
- [ ] Shows local URL

### ✅ Step 5: Clear Browser Cache

- [ ] Press Ctrl+Shift+Delete
- [ ] Select "Cached images and files"
- [ ] Click "Clear data"

### ✅ Step 6: Test in Browser

1. Open http://localhost:5174
2. Open DevTools (F12)
3. Go to Console tab
4. Click "Students" in sidebar

**Check:**
- [ ] Page loads in 1-2 seconds
- [ ] Console shows "Students loaded: X"
- [ ] No red error messages
- [ ] Students list appears

---

## If Still Not Working

### Check 1: Is Backend Running?

```bash
curl http://localhost:3001/api/students
```

**Should return**: JSON array of students

**If fails**: Backend not running or wrong port

### Check 2: What URL is Frontend Using?

In browser console, type:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

**Should show**: `http://localhost:3001/api`

**If shows Render URL**: Frontend wasn't restarted!

### Check 3: Any CORS Errors?

Look in browser console for:
```
Access to fetch at 'http://localhost:3001/api/students' 
from origin 'http://localhost:5174' has been blocked by CORS policy
```

**If yes**: Check `backend/server.js` CORS configuration

### Check 4: Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Reload page

**Should see**:
- 3 requests (students, staff, classes)
- All status 200 (green)
- All going to localhost:3001

**If see**:
- Requests to Render URL → Frontend not restarted
- Status 0 or Failed → Backend not running
- 100+ requests → Infinite loop (shouldn't happen with fix)

---

## Common Mistakes

### ❌ Mistake 1: Didn't Restart Frontend

**Symptom**: Still connecting to Render backend

**Fix**: Stop frontend (Ctrl+C) and restart

### ❌ Mistake 2: Backend Not Running

**Symptom**: "Failed to fetch" errors

**Fix**: Start backend with `npm start`

### ❌ Mistake 3: Wrong Terminal

**Symptom**: Commands not working

**Fix**: Make sure you're in the right directory
- Backend commands: `cd backend`
- Frontend commands: `cd school-dashboard`

### ❌ Mistake 4: Port Already in Use

**Symptom**: Backend won't start

**Fix**: Kill process on port 3001
```bash
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

---

## Success Indicators

When everything is working correctly:

✅ Backend terminal shows:
```
Connected to MongoDB
Server running on http://localhost:3001
```

✅ Frontend terminal shows:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

✅ Browser console shows:
```
Students loaded: 50
Payments loaded: 25
```

✅ Network tab shows:
```
/api/students    200    1.2s
/api/staff       200    0.8s
/api/classes     200    0.5s
```

✅ Students page:
- Loads in 1-2 seconds
- Shows list of students
- No spinner stuck
- No errors

---

## Still Stuck?

See `DIAGNOSE_LOADING_ISSUE.md` for detailed debugging steps.

---

## Quick Commands Reference

```bash
# Check .env
cat school-dashboard/.env

# Test backend
curl http://localhost:3001/api/students

# Check port usage (Windows)
netstat -ano | findstr :3001

# Check port usage (Mac/Linux)
lsof -i:3001

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Mac/Linux)
kill -9 <PID>

# Start backend
cd backend && npm start

# Start frontend
cd school-dashboard && npm run dev
```
