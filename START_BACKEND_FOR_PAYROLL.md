# Start Backend Server for Payroll System

## Error
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

This means the backend server at `http://localhost:3001` is not running.

## Solution: Start the Backend Server

### Step 1: Open Terminal in Backend Directory
```bash
cd backend
```

### Step 2: Start the Server
```bash
node server.js
```

Or if you have nodemon installed:
```bash
nodemon server.js
```

### Expected Output
You should see:
```
✅ Connected to MongoDB
✅ Fee management routes mounted
✅ Staff attendance routes mounted
✅ Payroll routes mounted
🚀 Server running on port 3001
```

### Step 3: Verify Backend is Running
Open your browser and check:
- http://localhost:3001/api/staff - Should return staff data
- http://localhost:3001/api/payroll/dashboard/1/2026 - Should return payroll dashboard

## If Backend Doesn't Start

### Check MongoDB Connection
Make sure MongoDB is running and the connection string in `backend/.env` is correct:
```
MONGODB_URI=mongodb://localhost:27017/school-management
```

### Check Port 3001
Make sure port 3001 is not already in use:
```bash
# Windows
netstat -ano | findstr :3001

# If port is in use, kill the process or change the port in backend/.env
```

### Install Dependencies
If you haven't installed backend dependencies:
```bash
cd backend
npm install
```

## Quick Start Commands

### Terminal 1 (Backend):
```bash
cd backend
node server.js
```

### Terminal 2 (Frontend):
```bash
cd school-dashboard
npm run dev
```

## After Backend Starts

1. Refresh your browser (http://localhost:5173)
2. Navigate to **Staffs → Payroll**
3. The payroll system should now load without errors

## Troubleshooting

### Still Getting Connection Errors?
1. Check `school-dashboard/.env` has correct API URL:
   ```
   VITE_API_URL=http://localhost:3001
   ```

2. Restart both frontend and backend

3. Clear browser cache and reload

### Backend Crashes?
Check the error message in the terminal. Common issues:
- MongoDB not running
- Missing environment variables
- Port already in use
- Missing npm packages

## Status Check

✅ Backend running on port 3001
✅ Frontend running on port 5173
✅ MongoDB connected
✅ No connection errors in browser console

Once all three are checked, the payroll system will work perfectly!
