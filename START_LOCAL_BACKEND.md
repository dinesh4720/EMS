# Start Local Backend for Fee Management

## Quick Start

### 1. Update Frontend to Use Local Backend

Edit `school-dashboard/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 2. Start Backend

Open a terminal in the `backend` folder:

```bash
cd backend
npm start
```

You should see:
```
Connected to MongoDB
Server running on http://localhost:3001
```

### 3. Start Frontend

Open another terminal in the `school-dashboard` folder:

```bash
cd school-dashboard
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
```

### 4. Test the Application

1. Open http://localhost:5174 in your browser
2. Navigate to Fees → Payments
3. Check browser console (F12) for any errors
4. You should see data loading

---

## If Backend Won't Start

### Check MongoDB

**Windows:**
```bash
# Check if MongoDB service is running
services.msc
# Look for "MongoDB" and make sure it's "Running"
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Check Environment Variables

Make sure `backend/.env` exists with:
```env
MONGODB_URI=mongodb://localhost:27017/school_db
PORT=3001
```

### Install Dependencies

If you haven't installed backend dependencies:
```bash
cd backend
npm install
```

---

## Alternative: Use Production Backend

If you don't want to run backend locally, keep using production:

`school-dashboard/.env`:
```env
VITE_API_URL=https://ems-backend-poms.onrender.com/api
```

**BUT** you need to deploy the updated backend code to Render.com first!

### Deploy to Render.com

1. Commit and push backend changes:
```bash
cd backend
git add .
git commit -m "Add fee management endpoints and CORS for localhost:5174"
git push
```

2. Render.com will auto-deploy (if connected to GitHub)

3. Wait for deployment to complete (check Render dashboard)

4. Test: https://ems-backend-poms.onrender.com/api/health

---

## Verify Everything is Working

### Test Backend Directly

Open these URLs in your browser:

**Local:**
- http://localhost:3001/api/health
- http://localhost:3001/api/students
- http://localhost:3001/api/fees/payments

**Production:**
- https://ems-backend-poms.onrender.com/api/health
- https://ems-backend-poms.onrender.com/api/students
- https://ems-backend-poms.onrender.com/api/fees/payments

If you see JSON data, the backend is working!

### Check Frontend

1. Open http://localhost:5174
2. Open browser console (F12)
3. Navigate to Fees → Payments
4. Look for console messages:
   - "Students loaded: X"
   - "Payments loaded: X"
5. Check Network tab for API calls

---

## Current Status

✅ Backend code updated with fee endpoints
✅ CORS configured for localhost:5174
✅ Frontend components updated to use API
✅ Error handling added with console logs

⚠️ **You need to:**
1. Start local backend OR deploy to production
2. Make sure MongoDB is running
3. Restart frontend to pick up changes
