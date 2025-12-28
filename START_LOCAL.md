# Start Local Development - Quick Guide

## ✅ Current Configuration

Your frontend is now configured to use **local backend** at `http://localhost:3001/api`

---

## 🚀 Start Everything

### Step 1: Start Backend (Terminal 1)

```bash
cd backend
npm start
```

**Wait for:**
```
Connected to MongoDB
Server running on http://localhost:3001
```

### Step 2: Start Frontend (Terminal 2)

```bash
cd school-dashboard
npm run dev
```

**Wait for:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

### Step 3: Open Browser

Navigate to: **http://localhost:5174**

---

## ✅ Verify Everything Works

### 1. Check Students Page
- Click "Students" in sidebar
- Should load in 1-2 seconds
- Should see list of students
- Try adding a student

### 2. Check Fees Page
- Click "Fees" in sidebar
- Click "Defaulters" button
- Should see list of students with pending fees
- Click "Collect" on any student
- Fee heads should match pending amount
- Try collecting a payment

### 3. Check Browser Console (F12)
- Should see: "Students loaded: X"
- Should see: "Payments loaded: X"
- Should NOT see: Continuous errors or infinite API calls

### 4. Check Network Tab (F12 → Network)
- Filter by "Fetch/XHR"
- Should see: 3 requests (students, staff, classes)
- Should NOT see: 100+ continuous requests

---

## 🐛 If Something Doesn't Work

### Backend Won't Start

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**: Port 3001 is already in use. Kill the process:

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

### Frontend Shows "Failed to fetch"

**Check:**
1. Is backend running? (check Terminal 1)
2. Is backend on port 3001? (check backend terminal output)
3. Did you restart frontend after changing .env?

**Solution:**
```bash
# Stop frontend (Ctrl+C in Terminal 2)
# Restart it
npm run dev
```

### CORS Error

**Error**: "blocked by CORS policy"

**Solution**: Backend CORS is already configured for `http://localhost:5174`. If your frontend runs on a different port, update `backend/server.js`.

### Database Connection Error

**Error**: "Failed to connect to MongoDB"

**Check**: Internet connection (MongoDB Atlas is cloud-based)

**Solution**: Check `backend/.env` has correct `MONGODB_URI`

---

## 📊 What You Should See

### Backend Terminal:
```
> backend@1.0.0 start
> node server.js

Connected to MongoDB
Server running on http://localhost:3001
```

### Frontend Terminal:
```
VITE v5.x.x ready in 500 ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Browser:
- Students list loads quickly
- Fees module shows defaulters
- No console errors
- Smooth navigation

---

## 🎯 All Fixed Issues

✅ Students list loads without infinite loop
✅ Can add/edit/delete students
✅ Defaulters page shows accurate list
✅ Payment status updates correctly
✅ Fee heads match pending amount
✅ Export downloads CSV files
✅ Bell icon shows reminders
✅ No browser freezing

---

## 📝 Quick Commands

```bash
# Start backend
cd backend && npm start

# Start frontend (new terminal)
cd school-dashboard && npm run dev

# Check if backend is running
curl http://localhost:3001/api/students

# Check frontend .env
cat school-dashboard/.env
```

---

## 🔄 Switch to Production Later

When ready to deploy, see `SWITCH_BACKEND_GUIDE.md` for instructions on switching to Render backend.

---

## 📚 More Help

- `ALL_FIXES_SUMMARY.md` - What was fixed
- `QUICK_FIX_REFERENCE.md` - Quick testing guide
- `TROUBLESHOOTING_FEES.md` - Connection issues
- `SWITCH_BACKEND_GUIDE.md` - Switch between local/production

---

## ✨ You're All Set!

Everything is configured and ready. Just start the backend and frontend, then test all the features!
