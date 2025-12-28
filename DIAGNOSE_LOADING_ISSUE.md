# Diagnose Students Loading Issue

## Quick Diagnosis Steps

### Step 1: Check if Frontend Was Restarted

**IMPORTANT**: After changing `.env`, you MUST restart the frontend!

```bash
# In the frontend terminal:
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

Vite only reads `.env` on startup, not during runtime!

---

### Step 2: Check Browser Console (F12)

Open browser console and look for:

**Good Signs:**
```
Students loaded: 50
Payments loaded: 25
```

**Bad Signs:**
```
Failed to fetch
Network Error
CORS policy error
(continuous error messages)
```

---

### Step 3: Check Network Tab (F12 → Network)

Filter by "Fetch/XHR" and look for:

**Good:**
- `/api/students` → Status 200 (green)
- `/api/staff` → Status 200 (green)
- `/api/classes` → Status 200 (green)
- Total: 3 requests, then stops

**Bad:**
- `/api/students` → Status 0 or Failed (red)
- Continuous requests (100+)
- No requests at all

---

### Step 4: Check Backend Terminal

**Good:**
```
Connected to MongoDB
Server running on http://localhost:3001
```

**Bad:**
```
(no output - backend not running)
Error: EADDRINUSE (port already in use)
MongoDB connection error
```

---

### Step 5: Test Backend Directly

Open a new terminal and run:

```bash
curl http://localhost:3001/api/students
```

**Good Response:**
```json
[
  {
    "id": "...",
    "name": "Student Name",
    ...
  }
]
```

**Bad Response:**
```
curl: (7) Failed to connect to localhost port 3001
```

---

## Common Issues & Solutions

### Issue 1: Frontend Not Restarted After .env Change

**Symptom**: Still trying to connect to Render backend

**Solution**:
```bash
# Stop frontend (Ctrl+C)
# Restart
npm run dev
```

### Issue 2: Backend Not Running

**Symptom**: "Failed to fetch" or "Network Error"

**Solution**:
```bash
cd backend
npm start
```

### Issue 3: Port 3001 Already in Use

**Symptom**: Backend won't start, says "EADDRINUSE"

**Solution (Windows)**:
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Solution (Mac/Linux)**:
```bash
lsof -ti:3001 | xargs kill -9
```

### Issue 4: Wrong API URL

**Symptom**: Requests going to wrong URL

**Check**:
```bash
# Check .env file
cat school-dashboard/.env

# Should show:
# VITE_API_URL=http://localhost:3001/api
```

**Fix**:
Edit `school-dashboard/.env` and restart frontend

### Issue 5: CORS Error

**Symptom**: "blocked by CORS policy" in console

**Check**: `backend/server.js` CORS configuration includes:
```javascript
origin: [
  'http://localhost:5173',
  'http://localhost:5174', // Your frontend port
  ...
]
```

**Fix**: Add your frontend port to CORS origins

### Issue 6: MongoDB Connection Error

**Symptom**: Backend shows "Failed to connect to MongoDB"

**Check**: Internet connection (MongoDB Atlas is cloud-based)

**Fix**: Check `backend/.env` has correct `MONGODB_URI`

---

## Detailed Debugging

### Check What URL Frontend is Using

Add this to browser console:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

**Should show**: `http://localhost:3001/api`

**If shows**: `https://ems-backend-poms.onrender.com/api`
→ Frontend wasn't restarted after .env change!

### Check if Backend is Responding

```bash
# Test students endpoint
curl http://localhost:3001/api/students

# Test health check (if you have one)
curl http://localhost:3001/api/health
```

### Check Browser Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Reload page
5. Look at the requests:
   - What URL are they going to?
   - What status code?
   - What response?

---

## Step-by-Step Restart Process

### 1. Stop Everything

```bash
# Terminal 1 (Backend): Ctrl+C
# Terminal 2 (Frontend): Ctrl+C
```

### 2. Verify .env File

```bash
cat school-dashboard/.env
```

Should show:
```
# Local Backend (for development)
VITE_API_URL=http://localhost:3001/api
```

### 3. Start Backend

```bash
cd backend
npm start
```

Wait for:
```
Connected to MongoDB
Server running on http://localhost:3001
```

### 4. Start Frontend

```bash
cd school-dashboard
npm run dev
```

Wait for:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

### 5. Test in Browser

1. Open http://localhost:5174
2. Open DevTools (F12)
3. Go to Console tab
4. Click "Students" in sidebar
5. Watch for:
   - "Students loaded: X" message
   - No error messages
   - Page loads in 1-2 seconds

---

## Still Not Working?

### Collect This Information:

1. **Frontend Terminal Output**:
   ```
   (paste the output here)
   ```

2. **Backend Terminal Output**:
   ```
   (paste the output here)
   ```

3. **Browser Console Errors**:
   ```
   (paste any red errors here)
   ```

4. **Network Tab**:
   - What URL are requests going to?
   - What status codes?
   - Screenshot if possible

5. **.env File Content**:
   ```bash
   cat school-dashboard/.env
   ```

6. **Test Backend Directly**:
   ```bash
   curl http://localhost:3001/api/students
   ```

---

## Nuclear Option: Fresh Start

If nothing works, try a complete fresh start:

```bash
# 1. Stop everything (Ctrl+C in all terminals)

# 2. Kill any processes on port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9

# 3. Clear node_modules and reinstall (if needed)
cd backend
rm -rf node_modules
npm install

cd ../school-dashboard
rm -rf node_modules
npm install

# 4. Verify .env
cat school-dashboard/.env

# 5. Start backend
cd backend
npm start

# 6. Start frontend (new terminal)
cd school-dashboard
npm run dev

# 7. Clear browser cache
# In browser: Ctrl+Shift+Delete → Clear cache

# 8. Open http://localhost:5174
```

---

## Expected Behavior

When everything is working:

1. **Backend starts**: Shows "Connected to MongoDB" and "Server running"
2. **Frontend starts**: Shows "Local: http://localhost:5174/"
3. **Browser loads**: Students page appears in 1-2 seconds
4. **Console shows**: "Students loaded: X", "Payments loaded: X"
5. **Network shows**: 3 requests to localhost:3001, all status 200
6. **No errors**: No red messages in console

---

## Quick Test Commands

```bash
# Check if backend is running
curl http://localhost:3001/api/students

# Check .env
cat school-dashboard/.env

# Check if port 3001 is in use
# Windows:
netstat -ano | findstr :3001

# Mac/Linux:
lsof -i:3001

# Check if frontend is using correct URL (in browser console):
console.log(import.meta.env.VITE_API_URL)
```

---

## Most Likely Cause

**90% of the time, the issue is**: Frontend wasn't restarted after changing `.env`

**Solution**: Stop frontend (Ctrl+C) and restart (`npm run dev`)
