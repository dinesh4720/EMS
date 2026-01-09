# Production Real-Time Deployment Guide

## Overview

To make real-time updates work in production (Render backend + Vercel frontend), you need to configure CORS and WebSocket settings properly.

## Backend Configuration (Render)

### 1. Update CORS Settings

In `backend/server.js`, make sure your production frontend URL is in the CORS config:

```javascript
// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://school-dashboard-ivory.vercel.app',  // ← Your Vercel URL
    'https://your-custom-domain.com'  // ← Add your custom domain if you have one
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Socket.IO CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://school-dashboard-ivory.vercel.app',  // ← Your Vercel URL
      'https://your-custom-domain.com'  // ← Add your custom domain
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  transports: ['websocket', 'polling']  // ← Important for production
});
```

### 2. Environment Variables on Render

Set these environment variables in your Render dashboard:

```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PORT=3001
NODE_ENV=production
```

### 3. Deploy to Render

```bash
cd backend
git add .
git commit -m "Add real-time updates with Socket.IO"
git push
```

Render will automatically deploy your backend.

## Frontend Configuration (Vercel)

### 1. Update Environment Variables

In your Vercel project settings, set:

```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_GROQ_API_KEY=your_groq_key
VITE_GEMINI_API_KEY=your_gemini_key
```

**Important**: Make sure `VITE_API_URL` points to your Render backend URL.

### 2. Socket Connection

The socket service will automatically connect to the correct URL because it uses:

```javascript
// In socketService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = API_URL.replace('/api', '');
```

So if `VITE_API_URL=https://your-backend.onrender.com/api`, the socket will connect to `https://your-backend.onrender.com`.

### 3. Deploy to Vercel

```bash
cd school-dashboard
git add .
git commit -m "Add real-time updates support"
git push
```

Vercel will automatically deploy your frontend.

## Testing Production Deployment

### 1. Check Backend is Running

Visit: `https://your-backend.onrender.com/api/staff`

You should see your staff list.

### 2. Check Frontend Loads

Visit: `https://school-dashboard-ivory.vercel.app`

You should see your app.

### 3. Test Socket Connection

Open browser console on your Vercel app and run:

```javascript
// Check if socket is connected
window.socketService?.isConnected()
// Should return: true
```

### 4. Test Real-Time Updates

1. Open your Vercel app in two different browsers
2. Login as different users
3. Make a change in one browser (e.g., edit staff name)
4. Watch it update instantly in the other browser

## Common Issues

### Issue 1: Socket Not Connecting

**Symptom**: `window.socketService.isConnected()` returns `false`

**Solution**: Check CORS configuration in backend. Make sure your Vercel URL is in the allowed origins.

### Issue 2: CORS Errors

**Symptom**: Console shows CORS errors

**Solution**: 
1. Add your Vercel URL to both `app.use(cors(...))` and `new SocketIOServer(..., { cors: ... })`
2. Redeploy backend to Render

### Issue 3: WebSocket Connection Failed

**Symptom**: Console shows "WebSocket connection failed"

**Solution**: 
1. Make sure Render backend supports WebSockets (it does by default)
2. Check that `transports: ['websocket', 'polling']` is set in Socket.IO config
3. Try using polling first: `transports: ['polling', 'websocket']`

### Issue 4: Events Not Received

**Symptom**: Socket connects but events don't arrive

**Solution**:
1. Check backend console logs - are events being emitted?
2. Check frontend console - are listeners set up?
3. Make sure both backend and frontend are using the latest code

## Render-Specific Configuration

### Enable WebSockets

Render supports WebSockets by default, but make sure:

1. Your service type is "Web Service" (not "Background Worker")
2. Health check path is set (optional): `/api/staff`
3. Auto-deploy is enabled

### Check Logs

In Render dashboard:
1. Go to your service
2. Click "Logs"
3. Look for:
   ```
   ✅ Socket.IO initialized
   Server running on port 3001
   🔌 New socket connection: [SOCKET_ID]
   ```

## Vercel-Specific Configuration

### Build Settings

Make sure your Vercel build settings are:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://your-backend.onrender.com/api
```

**Important**: After adding/changing environment variables, redeploy!

## Performance Considerations

### 1. Connection Limits

- Render free tier: Limited concurrent connections
- Consider upgrading if you have many users

### 2. Cold Starts

- Render free tier: Backend sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading to paid plan for always-on service

### 3. WebSocket Timeouts

- Render has a 55-second timeout for idle WebSocket connections
- Socket.IO handles reconnection automatically
- Users might see brief disconnections

## Monitoring

### Backend Monitoring

Check Render logs for:
```
📢 Broadcasting staff update for John (67...)
📢 Broadcasting student attendance update for 67... on 2025-01-09
📢 Broadcasting fee payment for student 67...
```

### Frontend Monitoring

Check browser console for:
```
✅ Socket connected: abc123
✅ Socket authenticated successfully
📢 Global: Staff updated { staffId: "67...", ... }
📢 Global: Attendance updated { type: "staff", ... }
```

## Troubleshooting Checklist

- [ ] Backend deployed to Render successfully
- [ ] Frontend deployed to Vercel successfully
- [ ] `VITE_API_URL` set correctly in Vercel
- [ ] Vercel URL added to CORS in backend
- [ ] Socket.IO CORS includes Vercel URL
- [ ] Backend logs show Socket.IO initialized
- [ ] Frontend console shows socket connected
- [ ] Test real-time update works

## Quick Test Script

Run this in production browser console:

```javascript
// 1. Check connection
console.log('Connected:', window.socketService?.isConnected());

// 2. Set up test listener
window.socketService?.on('staff_updated', (data) => {
  console.log('🎉 RECEIVED:', data);
  alert('Real-time update works! ' + data.name);
});

// 3. Make a change in another browser
// You should see the alert!
```

## Summary

To deploy real-time updates to production:

1. **Backend (Render)**:
   - Add Vercel URL to CORS
   - Set environment variables
   - Deploy

2. **Frontend (Vercel)**:
   - Set `VITE_API_URL` to Render backend
   - Deploy

3. **Test**:
   - Open two browsers
   - Make changes
   - Watch real-time updates work!

The real-time system will work exactly the same in production as it does locally. Socket.IO handles all the complexity of WebSocket connections, fallbacks, and reconnections automatically.
