# Owlin Tracker

> For ownership, repository boundaries, and the decision to keep Owlin inside the EMS monorepo for now, see [`OWNERSHIP.md`](./OWNERSHIP.md).

Internal analytics subsystem for EMS. Owlin currently tracks `school-dashboard` usage and ships with its own SDK, event collector server, and analytics dashboard.

## What Owlin Tracks

- **All Clicks**: Every mouse click with element details (id, class, text, position)
- **All Inputs**: Form inputs, text areas, dropdowns (with sensitive data masking)
- **Filter Changes**: All dropdown, checkbox, radio button changes
- **Navigation**: Route changes, page views, hash changes
- **Form Submissions**: All form submit events
- **API Calls**: Fetch/XHR interception with request/response details
- **Errors**: Console errors, JavaScript runtime errors, unhandled rejections
- **User Sessions**: Login, logout, session duration, idle time

## Project Structure

```
owlin/
├── src/                    # React Dashboard
│   ├── components/         # UI components
│   ├── pages/              # Page components (Dashboard, Events, Users)
│   ├── hooks/              # React hooks for data fetching
│   ├── services/           # API & Socket services
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── sdk/                    # Tracking SDK
│   ├── owlin-tracker.js    # Main SDK file (include in school-dashboard)
│   └── src/                # SDK source code
├── server/                 # Backend Server
│   ├── index.js            # Express server with Socket.IO
│   └── storage.js          # In-memory event storage
└── public/                 # Static assets
```

## Quick Start

### 1. Install Dependencies

```bash
# Install dashboard dependencies
cd owlin
npm install

# Install server dependencies
cd server
npm install
```

### 2. Start the Servers

```bash
# Terminal 1: Start backend server (port 4001)
cd owlin/server
npm start

# Terminal 2: Start dashboard (port 4000)
cd owlin
npm run dev
```

### 3. Access the Dashboard

Open http://localhost:4000 in your browser.

## Integrating with School Dashboard

Current integration status:

- `school-dashboard` consumes `@owlin/tracker-sdk` as a local package dependency
- the tracking hook lives at `school-dashboard/src/hooks/useOwlinTracking.js`
- the legacy `owlin-tracker.js` bundle remains available for manual or non-module integrations, but it is not the primary EMS integration path

Example:

```javascript
import { init } from '@owlin/tracker-sdk'

const tracker = init({
  endpoint: 'http://localhost:4001/api/events',
  appName: 'School Dashboard',
  appVersion: '1.0.0',
  debug: true,
})

tracker.setUserId('user-123')
tracker.setUserProperties({ name: 'John Doe', role: 'admin' })
```

## API Endpoints

### Events
- `POST /api/events` - Create a single event
- `POST /api/events/batch` - Create multiple events (batch)
- `GET /api/events` - Get events with filtering (userId, type, startDate, endDate)
- `GET /api/events/:id` - Get a single event

### Users
- `GET /api/users` - Get all tracked users
- `GET /api/users/:id` - Get user details with recent activity

### Sessions
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/session/start` - Start a new session
- `POST /api/session/end` - End a session

### Stats
- `GET /api/stats` - Get dashboard statistics
- `GET /api/health` - Health check

## WebSocket Events

### Client -> Server
- `user:subscribe` - Subscribe to user-specific updates
- `session:subscribe` - Subscribe to session updates
- `ping` - Ping server

### Server -> Client
- `event:new` - New event received
- `events:batch` - Batch of events received
- `session:started` - New session started
- `session:ended` - Session ended

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | string | `'/api/events'` | API endpoint for events |
| `batchSize` | number | `10` | Events per batch |
| `flushInterval` | number | `5000` | Flush interval (ms) |
| `autoStart` | boolean | `true` | Auto-start tracking |
| `debug` | boolean | `false` | Enable debug logs |
| `userId` | string | `null` | User ID |
| `sessionId` | string | auto-generated | Session ID |
| `appName` | string | `''` | Application name |
| `appVersion` | string | `''` | Application version |

## SDK API

```javascript
// Initialize
const tracker = OwlinTracker.init(config);

// Set user
tracker.setUserId('user-123');
tracker.setUserProperties({ name: 'John', role: 'admin' });

// Track custom events
tracker.trackEvent('button_clicked', { buttonId: 'submit' });

// Session tracking
tracker.trackSessionStart();
tracker.trackSessionEnd();

// Control collectors
tracker.enableCollector('click');
tracker.disableCollector('input');
tracker.start();
tracker.stop();
tracker.flush();
tracker.destroy();
```

## Sensitive Data Masking

The SDK automatically masks:
- Password fields: `***`
- Email addresses: `u***@example.com`
- Credit card fields: `***`
- Authorization headers: `[REDACTED]`
- Cookies: `[REDACTED]`

## Ignoring Elements

Add `data-owlin-ignore` to elements you don't want tracked:

```html
<div data-owlin-ignore>
  <button>Not tracked</button>
</div>
```

## License

MIT
