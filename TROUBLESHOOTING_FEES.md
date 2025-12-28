# Troubleshooting Fee Management Issues

## Issue: "Failed to load data" or No Data Showing

### Quick Fixes

#### 1. Check if Backend is Running

**Option A: Using Production Backend (Render.com)**
- The `.env` file points to: `https://ems-backend-poms.onrender.com/api`
- This backend needs to be deployed with the new fee endpoints
- Check if it's running by visiting: https://ems-backend-poms.onrender.com/api/health

**Option B: Using Local Backend**
```bash
# Terminal 1 - Start backend
cd backend
npm install  # if not already installed
npm start    # Should show "Connected to MongoDB" and "Server running on http://localhost:3001"

# Terminal 2 - Start frontend
cd school-dashboard
npm run dev  # Should show running on http://localhost:5174
```

If using local backend, update `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

#### 2. Check CORS Configuration

The backend CORS is now configured for:
- `http://localhost:5173`
- `http://localhost:5174` ✅ (just added)
- `http://localhost:3000`
- `https://school-dashboard-ivory.vercel.app`

If your frontend runs on a different port, add it to `backend/server.js`:
```javascript
origin: [
  'http://localhost:YOUR_PORT',
  // ... other origins
]
```

#### 3. Check Browser Console

Open browser DevTools (F12) and check:

**Console Tab:**
- Look for error messages
- Check if API calls are being made
- Look for CORS errors (red text mentioning "CORS" or "Access-Control-Allow-Origin")

**Network Tab:**
- Filter by "Fetch/XHR"
- Look for requests to `/api/fees/payments`, `/api/students`, etc.
- Check if they're failing (red) or succeeding (green)
- Click on failed requests to see error details

#### 4. Test API Endpoints Directly

Open these URLs in your browser to test if backend is responding:

**Production Backend:**
- Health check: https://ems-backend-poms.onrender.com/api/health
- Students: https://ems-backend-poms.onrender.com/api/students
- Payments: https://ems-backend-poms.onrender.com/api/fees/payments

**Local Backend:**
- Health check: http://localhost:3001/api/health
- Students: http://localhost:3001/api/students
- Payments: http://localhost:3001/api/fees/payments

If these return JSON data, the backend is working!

#### 5. Check Database Connection

**Local MongoDB:**
```bash
# Check if MongoDB is running
# Windows:
services.msc  # Look for "MongoDB" service

# Mac/Linux:
brew services list  # or
sudo systemctl status mongod
```

**Remote MongoDB (Atlas):**
- Check `backend/.env` for `MONGODB_URI`
- Verify connection string is correct
- Check if IP is whitelisted in MongoDB Atlas

#### 6. Restart Everything

Sometimes a simple restart fixes issues:

```bash
# Stop all running processes (Ctrl+C in terminals)

# Clear node_modules and reinstall (if needed)
cd backend
rm -rf node_modules
npm install

cd ../school-dashboard
rm -rf node_modules
npm install

# Start fresh
cd backend
npm start

# In another terminal
cd school-dashboard
npm run dev
```

---

## Common Error Messages

### "Failed to fetch"
**Cause:** Backend is not running or wrong URL
**Fix:** Start backend or check `VITE_API_URL` in `.env`

### "CORS policy: No 'Access-Control-Allow-Origin' header"
**Cause:** CORS not configured for your frontend URL
**Fix:** Add your frontend URL to CORS origins in `backend/server.js`

### "Network Error"
**Cause:** Backend is not reachable
**Fix:** Check if backend is running and URL is correct

### "404 Not Found"
**Cause:** API endpoint doesn't exist
**Fix:** Make sure backend has the new fee endpoints (check `backend/server.js`)

### "500 Internal Server Error"
**Cause:** Backend error (database connection, code error)
**Fix:** Check backend terminal for error messages

---

## Verify Backend Has Fee Endpoints

Check if `backend/server.js` has these routes:
```javascript
app.get('/api/fees/payments', ...)
app.post('/api/fees/payments', ...)
app.get('/api/fees/refunds', ...)
app.get('/api/fees/defaulters', ...)
```

If not, the backend needs to be updated with the new code.

---

## Deploy Backend to Render.com

If using production backend, you need to deploy the updated code:

1. **Push to Git:**
```bash
cd backend
git add .
git commit -m "Add fee management endpoints"
git push
```

2. **Render.com will auto-deploy** (if connected to GitHub)
   - Or manually deploy from Render dashboard

3. **Wait for deployment** (check Render logs)

4. **Test the endpoints** using the URLs above

---

## Check Frontend API Configuration

Verify `school-dashboard/src/services/api.js` has:
```javascript
export const feesApi = {
  getPayments: (filters) => { ... },
  getRefunds: (filters) => { ... },
  getDefaulters: (filters) => { ... },
  // ... other methods
};
```

---

## Still Not Working?

### Enable Detailed Logging

The components now have console.log statements:
- Open browser console (F12)
- Navigate to Fees page
- Look for messages like:
  - "Students loaded: X"
  - "Payments loaded: X"
  - "Error fetching data: ..."

### Check Network Requests

1. Open DevTools → Network tab
2. Reload the Fees page
3. Look for requests to:
   - `/api/students`
   - `/api/fees/payments`
   - `/api/fees/refunds`
   - `/api/fees/defaulters`
4. Click on each request to see:
   - Request URL
   - Response status (200 = success, 4xx/5xx = error)
   - Response data

### Test with Postman/Thunder Client

Test API endpoints directly:
```
GET http://localhost:3001/api/students
GET http://localhost:3001/api/fees/payments
GET http://localhost:3001/api/fees/defaulters
```

---

## Quick Checklist

- [ ] Backend is running (check terminal)
- [ ] Frontend is running (check terminal)
- [ ] CORS includes your frontend URL
- [ ] `.env` has correct `VITE_API_URL`
- [ ] Database is connected (check backend logs)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] Backend has fee endpoints in code

---

## Need More Help?

Share these details:
1. Backend terminal output
2. Frontend terminal output
3. Browser console errors (screenshot)
4. Network tab showing failed requests (screenshot)
5. Which backend you're using (local or production)
6. Your `.env` file content (hide sensitive data)
