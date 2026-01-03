# ⚠️ Backend Not Running - Fix Now!

## 🔴 Problem
Your frontend is running but showing these errors:
```
ERR_CONNECTION_REFUSED
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Cause:** Backend server is NOT running on port 3001

---

## ✅ Solution (30 seconds)

### 1. Open New Terminal Window
```
Click: Terminal → New Terminal
```

### 2. Go to Backend Folder
```powershell
cd backend
```

### 3. Start Backend
```powershell
node server.js
```

### 4. Wait for Success
```
✅ MongoDB Connected
✅ Socket.IO initialized
🚀 Server running on http://localhost:3001
```

### 5. Refresh Browser
```
Press: Ctrl + R
```

**Done! ✅**

---

## 📺 Visual Guide

### Before (Current State)
```
┌─────────────────────────────────────┐
│ Terminal 1: Frontend                │
│ ✅ Running on port 5173             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 2: Backend                 │
│ ❌ NOT RUNNING                      │
└─────────────────────────────────────┘

Result: ❌ Connection errors in browser
```

### After (What You Need)
```
┌─────────────────────────────────────┐
│ Terminal 1: Frontend                │
│ ✅ Running on port 5173             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Terminal 2: Backend                 │
│ ✅ Running on port 3001             │
└─────────────────────────────────────┘

Result: ✅ Everything works!
```

---

## 🎯 Quick Commands

### Windows PowerShell
```powershell
# Open new terminal, then:
cd C:\Users\bdk47\Desktop\kiro bp\EMS\backend
node server.js
```

### Alternative (Using Helper Script)
```powershell
cd backend
.\start-backend.ps1
```

---

## 🔍 How to Verify Backend is Running

### Check Terminal Output
Should see:
```
✅ MongoDB Connected
✅ Socket.IO initialized
✅ Chat handlers initialized
✅ Message routes mounted
🚀 Server running on http://localhost:3001
🔌 Socket.IO ready for connections
```

### Check Browser
1. Refresh page (Ctrl + R)
2. Errors should disappear
3. App should load data

### Check Port
```powershell
netstat -ano | findstr :3001
```
Should show LISTENING on port 3001

---

## ⚡ Common Mistakes

### ❌ Wrong: Closing Backend Terminal
```
Started backend → Closed terminal → Backend stops
```

### ✅ Right: Keep Backend Terminal Open
```
Started backend → Keep terminal open → Backend runs
```

### ❌ Wrong: Running in Same Terminal
```
Terminal 1: npm run dev (frontend)
Terminal 1: node server.js (backend) ← Won't work!
```

### ✅ Right: Use Separate Terminals
```
Terminal 1: npm run dev (frontend)
Terminal 2: node server.js (backend) ← Correct!
```

---

## 📋 Checklist

Before testing chat:
- [ ] Backend terminal is open
- [ ] Backend shows "Server running on http://localhost:3001"
- [ ] Frontend terminal is open
- [ ] Frontend shows "Local: http://localhost:5173/"
- [ ] Browser is open to http://localhost:5173
- [ ] No connection errors in browser console

---

## 🆘 Still Having Issues?

### Issue: "Port 3001 already in use"
```powershell
cd backend
.\kill-port-3001.ps1
node server.js
```

### Issue: "MongoDB connection failed"
Check `backend/.env` has correct `MONGO_URI`

### Issue: "Module not found"
```powershell
cd backend
npm install
node server.js
```

---

## 🎉 Success!

Once backend is running, you should see:

### In Backend Terminal
```
🚀 Server running on http://localhost:3001
```

### In Browser Console
```
✅ API URL configured: http://localhost:3001/api
✅ Loaded contacts: 57
✅ Socket connected
```

### In Chat Page
```
● Connected (green dot)
```

---

## 📚 Related Docs

- `START_SERVERS_NOW.md` - Detailed startup guide
- `PORT_3001_FIX.md` - Port conflict solutions
- `CHAT_QUICK_START.md` - Chat testing guide

---

**TL;DR: Open new terminal → `cd backend` → `node server.js` → Refresh browser ✅**
