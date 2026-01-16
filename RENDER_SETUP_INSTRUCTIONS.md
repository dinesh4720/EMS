# Render Deployment Setup

## Backend Environment Variables

Your backend is already configured to use environment variables. You just need to add them in Render:

### Steps:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your backend service**
3. **Click "Environment" in the left sidebar**
4. **Add these environment variables** (one by one):

```
MONGO_URI=mongodb+srv://eguser1:dummy123@cluster0.vy5smtv.mongodb.net/school_db?retryWrites=true&w=majority&appName=Cluster0
PORT=10000
NODE_ENV=production
JWT_SECRET=6a837d4861a66eefe4cc3c9984ee7de9ff8e8f4b68aac2c6f62ac7506c3f30e9fa4c98df2822846ff985d9c2101888fa683b9aec13bc191954262f5558a8a371
CLOUDINARY_CLOUD_NAME=dfh1ktxvo
CLOUDINARY_API_KEY=498734373498696
CLOUDINARY_API_SECRET=kjgoYkcvsvL1asQXRiLL72iB4dE
LOG_LEVEL=INFO
```

5. **After adding all variables, click "Save Changes"**
6. **Render will automatically redeploy** your backend

### Update CORS_ORIGIN after frontend deployment:

Once your frontend is deployed, add:
```
CORS_ORIGIN=https://your-frontend-app.onrender.com
```

Or for multiple origins:
```
CORS_ORIGIN=https://your-frontend-app.onrender.com,http://localhost:5173
```

## Frontend Environment Variables

Update your frontend to point to the deployed backend:

1. **Go to your frontend service in Render**
2. **Add environment variable**:

```
VITE_API_URL=https://your-backend-app.onrender.com
```

3. **Update your frontend code** (if not already done):

In `school-dashboard/src/services/api.js`, make sure it uses:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

## Verification

After deployment:
- Backend should be accessible at: `https://your-backend-app.onrender.com`
- Test health endpoint: `https://your-backend-app.onrender.com/health`
- Frontend should connect to backend automatically

## Troubleshooting

If deployment still fails:
1. Check Render logs for specific errors
2. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Ensure all environment variables are saved
4. Try manual redeploy from Render dashboard
