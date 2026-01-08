# Fee System Setup - Quick Fix

## Issue Fixed
The API URL was being constructed incorrectly, causing `/api/api/fee-heads` instead of `/api/fee-heads`.

## ✅ What Was Fixed
- Removed duplicate `/api` from all fee-heads API calls
- Updated API_URL default to include `/api`
- All endpoints now correctly point to `/api/fee-heads`

## 🚀 How to Use

### Option 1: Use Local Backend (Recommended for Development)

1. **Update .env file** in `school-dashboard/.env`:
   ```env
   # Comment out Render backend
   # VITE_API_URL=https://ems-backend-poms.onrender.com/api

   # Use local backend
   VITE_API_URL=http://localhost:3001/api
   ```

2. **Start local backend**:
   ```bash
   cd backend
   npm start
   ```
   Backend will run on `http://localhost:3001`

3. **Start frontend** (in a new terminal):
   ```bash
   cd school-dashboard
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

4. **Test the fee system**:
   - Go to `http://localhost:5173`
   - Navigate to Settings > Fee Heads
   - Create a new fee head
   - Select classes 1-12
   - Save and verify it works

### Option 2: Use Render Backend (Production)

If you want to use the deployed backend on Render:

1. **Make sure backend is deployed** with the new routes
2. **Deploy the new code** to Render:
   - Push changes to your Git repository
   - Render will auto-deploy
   - Wait for deployment to complete

3. **Keep .env as is**:
   ```env
   VITE_API_URL=https://ems-backend-poms.onrender.com/api
   ```

4. **Restart frontend**:
   ```bash
   cd school-dashboard
   npm run dev
   ```

## 🧪 Testing

### Test 1: Check if backend is running
```bash
# For local backend
curl http://localhost:3001/api/fee-heads

# For Render backend
curl https://ems-backend-poms.onrender.com/api/fee-heads
```

Expected response: `[]` (empty array) or list of fee heads

### Test 2: Create a fee head via API
```bash
curl -X POST http://localhost:3001/api/fee-heads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Fee",
    "category": "Academic",
    "amount": 1000,
    "applicableClasses": ["1", "2"],
    "frequency": "yearly",
    "mandatory": true,
    "autoApply": true
  }'
```

Expected response: Created fee head object

### Test 3: Use the frontend
1. Open `http://localhost:5173`
2. Go to Settings > Fee Heads
3. Click "Add Fee Head"
4. Fill in the form
5. Select classes
6. Click "Create Fee Head"
7. Should see success message

## 🔍 Troubleshooting

### Error: "Failed to fetch fee heads"
**Cause**: Backend is not running or URL is wrong

**Fix**:
1. Check if backend is running: `curl http://localhost:3001/api/fee-heads`
2. Check .env file has correct URL
3. Restart both backend and frontend

### Error: 404 Not Found
**Cause**: Routes not mounted correctly

**Fix**:
1. Check `backend/server.js` has:
   ```javascript
   import feeHeadsRoutes from './routes/feeHeads.js';
   app.use('/api/fee-heads', feeHeadsRoutes);
   ```
2. Restart backend

### Error: "Cannot find module"
**Cause**: New files not recognized

**Fix**:
1. Restart backend completely
2. Check all imports are correct
3. Verify file paths

## 📝 Current API Endpoints

All endpoints are now correctly configured:

```
GET    /api/fee-heads              - Get all fee heads
GET    /api/fee-heads/:id          - Get specific fee head
POST   /api/fee-heads              - Create fee head
PUT    /api/fee-heads/:id          - Update fee head
DELETE /api/fee-heads/:id          - Delete fee head
POST   /api/fee-heads/:id/apply    - Apply to students

GET    /api/student-fees/student/:studentId     - Get student fees
GET    /api/student-fees/all                    - Get all student fees
POST   /api/student-fees/initialize/:studentId  - Initialize student fees
PUT    /api/student-fees/student/:studentId/discount  - Apply discount
POST   /api/student-fees/student/:studentId/payment   - Record payment
GET    /api/student-fees/defaulters              - Get defaulters
```

## ✅ Verification Checklist

- [ ] Backend is running (check terminal)
- [ ] Frontend is running (check terminal)
- [ ] .env file has correct API_URL
- [ ] Can access Settings > Fee Heads page
- [ ] No console errors in browser
- [ ] Can create a fee head
- [ ] Fee head appears in the list
- [ ] Can edit a fee head
- [ ] Can delete a fee head

## 🎉 Success!

Once all checks pass, your fee management system is ready to use!

Go to Settings > Fee Heads and start creating fee heads for classes 1-12.
