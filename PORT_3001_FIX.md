# 🔧 Port 3001 Already in Use - Quick Fix

## Problem
```
Error: listen EADDRINUSE: address already in use :::3001
```

This means another process is already using port 3001.

---

## ✅ Solution (3 Methods)

### Method 1: Use Helper Script (Easiest)
```powershell
cd backend
.\start-backend.ps1
```

This script automatically:
1. Kills any process on port 3001
2. Starts the backend server

---

### Method 2: Kill Port Manually
```powershell
# Step 1: Find process using port 3001
netstat -ano | findstr :3001

# Step 2: Kill the process (replace XXXX with PID)
taskkill /F /PID XXXX

# Step 3: Start backend
cd backend
node server.js
```

---

### Method 3: Use Different Port
Edit `backend/.env`:
```env
PORT=3002
```

Then update `school-dashboard/.env`:
```env
VITE_API_URL=http://localhost:3002/api
```

---

## 🚀 Quick Start (After Fix)

### Terminal 1: Backend
```powershell
cd backend
.\start-backend.ps1
```

**Expected Output:**
```
✅ Port 3001 is now free!
🚀 Starting server on port 3001...
✅ MongoDB Connected
✅ Socket.IO initialized
🚀 Server running on http://localhost:3001
```

### Terminal 2: Frontend
```powershell
cd school-dashboard
npm run dev
```

---

## 🔍 Why This Happens

Common causes:
1. **Previous server still running** - You started the server before and didn't stop it
2. **npm run dev still running** - The watch mode keeps the server alive
3. **Crashed server** - Server crashed but process didn't terminate
4. **Another app using port** - Different application using port 3001

---

## 🛠️ Helper Scripts Created

### `backend/start-backend.ps1`
Automatically kills port 3001 and starts server
```powershell
.\start-backend.ps1
```

### `backend/kill-port-3001.ps1`
Just kills the process on port 3001
```powershell
.\kill-port-3001.ps1
```

---

## 📋 Troubleshooting

### Script won't run?
Enable PowerShell scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Still getting error?
1. Close all terminals
2. Restart VS Code
3. Run `.\start-backend.ps1` again

### Port still in use?
Check what's using it:
```powershell
netstat -ano | findstr :3001
```

Then kill all PIDs shown:
```powershell
taskkill /F /PID XXXX
```

---

## ✅ Prevention Tips

1. **Always stop server properly** - Use Ctrl+C in terminal
2. **Close terminals when done** - Don't leave servers running
3. **Use helper script** - `.\start-backend.ps1` handles cleanup
4. **Check before starting** - Run `netstat -ano | findstr :3001` first

---

## 🎯 Current Status

✅ Port 3001 has been freed
✅ Helper scripts created
✅ Ready to start backend

**Next Step:** Run `.\start-backend.ps1` in backend folder

---

## 📚 Related Files

- `backend/start-backend.ps1` - Start server with auto-cleanup
- `backend/kill-port-3001.ps1` - Kill port 3001 only
- `CHAT_QUICK_START.md` - Chat system quick start
- `CHAT_TESTING_GUIDE.md` - Full testing guide
