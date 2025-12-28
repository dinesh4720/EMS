# Backend Switching Guide

## Current Setup: Local Backend ✅

The frontend is now configured to use your **local backend** for testing.

---

## How to Start Local Development

### Terminal 1 - Start Backend
```bash
cd backend
npm start
```

**Expected Output:**
```
Connected to MongoDB
Server running on http://localhost:3001
```

### Terminal 2 - Start Frontend
```bash
cd school-dashboard
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

### Open Browser
Navigate to: http://localhost:5174

---

## Configuration Files

### Frontend: `school-dashboard/.env`
```env
# Local Backend (for development) ✅ ACTIVE
VITE_API_URL=http://localhost:3001/api

# Production Backend (for deployment - uncomment when pushing)
# VITE_API_URL=https://ems-backend-poms.onrender.com/api
```

### Backend: `backend/.env`
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://eguser1:kttjJ9YiAZUWVnKe@cluster0.vy5smtv.mongodb.net/school_db

PORT=3001
```

---

## Switching to Production (Render)

When you're ready to deploy or test with production backend:

### Option 1: Edit .env File

**File**: `school-dashboard/.env`

```env
# Local Backend (for development - comment out)
# VITE_API_URL=http://localhost:3001/api

# Production Backend (for deployment) ✅ ACTIVE
VITE_API_URL=https://ems-backend-poms.onrender.com/api
```

### Option 2: Use Environment Variables

For deployment platforms (Vercel, Netlify, etc.):

Set environment variable:
```
VITE_API_URL=https://ems-backend-poms.onrender.com/api
```

---

## Important Notes

### 1. Restart Frontend After Changing .env

After editing `.env`, you MUST restart the frontend:

```bash
# Stop the frontend (Ctrl+C)
# Then restart:
npm run dev
```

Vite only reads `.env` on startup!

### 2. CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173`
- `http://localhost:5174` ✅
- `http://localhost:3000`
- `https://school-dashboard-ivory.vercel.app`

If your frontend runs on a different port, add it to `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:YOUR_PORT', // Add your port here
    'https://school-dashboard-ivory.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Database

Both local and production backends use the **same MongoDB Atlas database**:
- Database: `school_db`
- Connection: MongoDB Atlas (cloud)

This means:
- Changes made locally will affect production data
- No need to sync databases
- Be careful when testing!

---

## Testing Checklist

### Local Backend Test:
1. ✅ Backend running on http://localhost:3001
2. ✅ Frontend running on http://localhost:5174
3. ✅ `.env` points to `http://localhost:3001/api`
4. ✅ Can see students list
5. ✅ Can add/edit students
6. ✅ Fee module works
7. ✅ No CORS errors

### Production Backend Test:
1. ✅ `.env` points to `https://ems-backend-poms.onrender.com/api`
2. ✅ Frontend restarted after .env change
3. ✅ Can see students list
4. ✅ Can add/edit students
5. ✅ Fee module works
6. ✅ No CORS errors

---

## Troubleshooting

### Issue: "Failed to fetch" or "Network Error"

**Check:**
1. Is backend running? (check terminal)
2. Is `.env` correct? (check file)
3. Did you restart frontend after changing `.env`?
4. Check browser console for CORS errors

**Solution:**
```bash
# Stop frontend (Ctrl+C)
# Check .env file
cat school-dashboard/.env

# Restart frontend
npm run dev
```

### Issue: CORS Error

**Error Message:**
```
Access to fetch at 'http://localhost:3001/api/students' from origin 'http://localhost:5174' 
has been blocked by CORS policy
```

**Solution:**
Check `backend/server.js` includes your frontend URL in CORS origins.

### Issue: Backend Not Starting

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
Another process is using port 3001. Kill it:

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

Or change port in `backend/.env`:
```env
PORT=3002
```

Then update frontend `.env`:
```env
VITE_API_URL=http://localhost:3002/api
```

---

## Quick Reference

| Environment | Backend URL | .env Setting |
|-------------|-------------|--------------|
| **Local Development** | http://localhost:3001 | `VITE_API_URL=http://localhost:3001/api` |
| **Production (Render)** | https://ems-backend-poms.onrender.com | `VITE_API_URL=https://ems-backend-poms.onrender.com/api` |

---

## Deployment Workflow

### 1. Development (Local)
```bash
# Use local backend
VITE_API_URL=http://localhost:3001/api

# Test all features
# Fix bugs
# Make changes
```

### 2. Testing (Production Backend)
```bash
# Switch to production backend
VITE_API_URL=https://ems-backend-poms.onrender.com/api

# Test with production data
# Verify everything works
```

### 3. Deploy Frontend
```bash
# Push to Git
git add .
git commit -m "Your changes"
git push

# Vercel/Netlify will auto-deploy
# Set environment variable in platform:
# VITE_API_URL=https://ems-backend-poms.onrender.com/api
```

### 4. Deploy Backend (if needed)
```bash
# Push backend changes
cd backend
git add .
git commit -m "Backend updates"
git push

# Render will auto-deploy
```

---

## Current Status

✅ **Frontend**: Configured for local backend (http://localhost:3001/api)
✅ **Backend**: Ready to run locally on port 3001
✅ **Database**: MongoDB Atlas (shared between local and production)
✅ **All fixes applied**: Ready for testing

---

## Next Steps

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd school-dashboard && npm run dev`
3. **Test All Features**: Students, Fees, Staff, etc.
4. **When Ready**: Switch to production backend and deploy

---

## Need Help?

- Check `TROUBLESHOOTING_FEES.md` for connection issues
- Check `ALL_FIXES_SUMMARY.md` for what was fixed
- Check `QUICK_FIX_REFERENCE.md` for quick testing guide
