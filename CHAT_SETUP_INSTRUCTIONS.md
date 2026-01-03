# Chat Messaging Setup Instructions

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install socket.io
```

### Frontend
```bash
cd school-dashboard
npm install socket.io-client
```

## Step 2: Update Backend Database

Add the new models to your `backend/database.js`:

```javascript
// Import new models
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import UserPresence from './models/UserPresence.js';

// Export them
export { Message, Conversation, UserPresence };
```

## Step 3: Update Backend Server

Modify your `backend/server.js` to integrate Socket.IO:

```javascript
// Add these imports at the top
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeChatHandlers } from './socket/chatHandler.js';
import messageRoutes from './routes/messages.js';

// After creating Express app, wrap with HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO (add after CORS setup)
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://school-dashboard-ivory.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Initialize chat handlers
initializeChatHandlers(io);

// Add message routes
app.use('/api/messages', messageRoutes);

// Make io accessible to routes
app.set('io', io);

// Change app.listen to httpServer.listen at the end
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});

// Export io
export { io };
```

## Step 4: Update Frontend

### Option A: Replace existing Chat component
Replace the content of `school-dashboard/src/pages/messaging/Chat.jsx` with the content from `ChatRealtime.jsx`

### Option B: Use as new component
Keep both and update your routing to use `ChatRealtime.jsx`

## Step 5: Environment Variables

Make sure your frontend has the API URL configured:

```env
# school-dashboard/.env
VITE_API_URL=http://localhost:3001
```

For production:
```env
VITE_API_URL=https://your-backend-url.com
```

## Step 6: Test the Implementation

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd school-dashboard
npm run dev
```

### Test Checklist
- [ ] Open two browser windows/tabs
- [ ] Login as different users in each
- [ ] Navigate to Chat/Messaging
- [ ] Send messages between users
- [ ] Verify real-time delivery
- [ ] Check online/offline status
- [ ] Test typing indicators
- [ ] Verify read receipts

## Step 7: Mobile App Preparation (Future)

When you're ready to build mobile apps:

### iOS (Swift)
```swift
// Install Socket.IO client
// Add to Podfile:
pod 'Socket.IO-Client-Swift', '~> 16.0.1'

// Usage:
import SocketIO

let manager = SocketManager(socketURL: URL(string: "https://api.yourschool.com")!)
let socket = manager.defaultSocket

socket.on(clientEvent: .connect) {data, ack in
    socket.emit("authenticate", ["userId": userId, "userType": "staff"])
}

socket.on("new_message") {data, ack in
    // Handle new message
}
```

### Android (Kotlin)
```kotlin
// Add to build.gradle:
implementation 'io.socket:socket.io-client:2.1.0'

// Usage:
import io.socket.client.IO
import io.socket.client.Socket

val socket = IO.socket("https://api.yourschool.com")

socket.on(Socket.EVENT_CONNECT) {
    val data = JSONObject()
    data.put("userId", userId)
    data.put("userType", "staff")
    socket.emit("authenticate", data)
}

socket.on("new_message") { args ->
    // Handle new message
}

socket.connect()
```

### React Native
```javascript
// Install:
npm install socket.io-client

// Usage (same as web):
import io from 'socket.io-client';
import socketService from './services/socketService';

// Use the same socketService.js file!
socketService.connect(userId, userType);
```

## Features Implemented

### ✅ Current Features
- Real-time messaging
- Online/offline status
- Typing indicators
- Read receipts
- Message history
- Conversation list
- Search conversations
- File/image sharing (via existing upload endpoint)

### 🚀 Future Enhancements
- Group chats
- Voice messages
- Video calls
- Push notifications (mobile)
- Message reactions
- Message forwarding
- Delete for everyone
- Message editing
- Starred messages
- Chat backup/export

## Troubleshooting

### Socket not connecting
1. Check if backend server is running
2. Verify CORS settings in Socket.IO config
3. Check browser console for errors
4. Ensure firewall allows WebSocket connections

### Messages not delivering
1. Check if user is authenticated
2. Verify conversation exists
3. Check backend logs for errors
4. Ensure MongoDB is running

### Typing indicator not working
1. Verify socket connection is active
2. Check if conversation room is joined
3. Look for JavaScript errors in console

### Read receipts not updating
1. Ensure messages are marked as read
2. Check if socket events are being emitted
3. Verify receiver is in conversation room

## Performance Optimization

### For High Traffic
1. Use Redis adapter for Socket.IO:
```bash
npm install @socket.io/redis-adapter redis
```

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

2. Enable message pagination
3. Implement lazy loading for conversations
4. Add caching layer (Redis)
5. Use CDN for media files

## Security Best Practices

1. **Authentication**: Always verify JWT tokens
2. **Authorization**: Check user permissions before message delivery
3. **Rate Limiting**: Prevent spam
4. **Input Validation**: Sanitize message content
5. **Encryption**: Use HTTPS/WSS in production
6. **Content Moderation**: Filter inappropriate content

## Deployment

### Backend (Render/Heroku)
- Ensure WebSocket support is enabled
- Set environment variables
- Configure CORS for production domain

### Frontend (Vercel/Netlify)
- Update VITE_API_URL to production backend
- Enable WebSocket proxy if needed

## Support

For issues or questions:
1. Check backend logs
2. Check browser console
3. Review Socket.IO documentation
4. Test with Socket.IO client tester

## Next Steps

1. ✅ Install dependencies
2. ✅ Update backend server
3. ✅ Update frontend component
4. ✅ Test locally
5. ⏳ Deploy to staging
6. ⏳ Test in production
7. ⏳ Build mobile apps
8. ⏳ Add push notifications
