# 🚀 Start Your Servers - Quick Guide

## Current Status
- ❌ Backend NOT running (port 3001 is free)
- ✅ Frontend running (showing connection errors)

## ✅ Solution: Start Backend

### Open New Terminal (PowerShell)

**Option 1: Use Helper Script**
```powershell
cd backend
.\start-backend.ps1
```

**Option 2: Regular Start**
```powershell
cd backend
node server.js
```

### Expected Output
```
✅ MongoDB Connected
✅ Socket.IO initialized
✅ Chat handlers initialized
✅ Message routes mounted
🚀 Server running on http://localhost:3001
🔌 Socket.IO ready for connections
```

### Then Refresh Frontend
Once backend is running:
1. Go back to browser (`http://localhost:5173`)
2. Press `Ctrl + R` to refresh
3. Errors should disappear
4. App should load normally

---

## 📋 Step-by-Step

### Step 1: Open New Terminal
- In VS Code: Click `Terminal` → `New Terminal`
- Or use Windows Terminal
- Or use PowerShell

### Step 2: Navigate to Backend
```powershell
cd C:\Users\bdk47\Desktop\kiro bp\EMS\backend
```

### Step 3: Start Server
```powershell
node server.js
```

### Step 4: Wait for Success Messages
Look for:
- ✅ MongoDB Connected
- ✅ Socket.IO initialized
- 🚀 Server running on http://localhost:3001

### Step 5: Keep Terminal Open
**IMPORTANT:** Don't close this terminal! Backend must stay running.

### Step 6: Refresh Browser
- Go to `http://localhost:5173`
- Press `Ctrl + R`
- App should load without errors

---

## 🎯 Quick Test

Once both servers are running:

1. **Login** to the app
2. **Click Messaging** → **Chat**
3. **Look for green dot** = "Connected" ✅
4. **Click "+"** to start new conversation
5. **Send a message** to test

---

## 🔧 Troubleshooting

### Backend won't start?
```powershell
# Kill any process on port 3001
cd backend
.\kill-port-3001.ps1

# Then start again
node server.js
```

### Still getting errors?
1. Check backend terminal - is it running?
2. Check for error messages in backend
3. Verify MongoDB connection
4. Check `.env` files are correct

### MongoDB connection error?
Check `backend/.env` has correct `MONGO_URI`

---

## 📁 Terminal Setup

You should have **2 terminals open**:

### Terminal 1: Backend
```
C:\Users\bdk47\Desktop\kiro bp\EMS\backend> node server.js
✅ MongoDB Connected
🚀 Server running on http://localhost:3001
```

### Terminal 2: Frontend
```
C:\Users\bdk47\Desktop\kiro bp\EMS\school-dashboard> npm run dev
➜ Local: http://localhost:5173/
```

---

## ✅ Success Indicators

### Backend Running
- No errors in terminal
- Shows "Server running on http://localhost:3001"
- MongoDB connected

### Frontend Working
- No red errors in browser console
- App loads normally
- Can navigate pages

### Chat Working
- Green dot shows "Connected"
- Can start conversations
- Can send messages

---

## 🎉 Next Steps

Once both servers are running:

1. ✅ Test basic navigation
2. ✅ Test chat system (Messaging → Chat)
3. ✅ Follow `CHAT_TESTING_GUIDE.md` for full testing

---

**Quick Command Reference:**

```powershell
# Start Backend (Terminal 1)
cd backend
node server.js

# Frontend is already running (Terminal 2)
# Just refresh browser: Ctrl + R
```

**That's it! Start the backend and you're good to go! 🚀**
