# Owlin Tracker

A comprehensive event tracking SDK for web applications. Captures user interactions, navigation, API calls, and errors with minimal performance impact.

## Features

- **Click Tracking**: Every mouse click with element details
- **Input Tracking**: All form inputs, text areas (with masking for sensitive data)
- **Filter Tracking**: All dropdown, checkbox, radio changes
- **Navigation Tracking**: Route changes, page views
- **Action Tracking**: Button clicks, form submissions
- **Session Tracking**: Login, logout, session duration
- **Error Tracking**: Console errors, JavaScript errors
- **API Tracking**: Fetch/XHR interception

## Installation

### CDN

```html
<script src="/path/to/owlin-tracker.js"></script>
```

### ES Modules

```javascript
import { init } from './sdk/src/index.js';
```

## Quick Start

```javascript
// Initialize the tracker
const tracker = OwlinTracker.init({
  endpoint: 'https://your-api.com/events',
  appName: 'My App',
  appVersion: '1.0.0',
  debug: true,
});

// Track a custom event
tracker.trackEvent('button_clicked', {
  buttonId: 'submit-btn',
  page: '/home',
});

// Set user ID
tracker.setUserId('user-123');

// Set user properties
tracker.setUserProperties({
  plan: 'premium',
  role: 'admin',
});
```

## Configuration

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
| `environment` | string | `'production'` | Environment name |

## Event Types

### Click Events

```javascript
{
  type: 'click',
  element: {
    selector: '#submit-btn',
    tagName: 'button',
    text: 'Submit',
    attributes: { type: 'submit', name: 'submit' },
    hierarchy: [...]
  },
  position: { x: 250, y: 100, pageX: 250, pageY: 100 },
  viewport: { width: 1920, height: 1080 },
  scroll: { x: 0, y: 0 },
  meta: { ctrlKey: false, shiftKey: false, button: 0 }
}
```

### Input Events

```javascript
{
  type: 'input',
  action: 'input' | 'change' | 'focus' | 'blur',
  element: {
    selector: 'input[name="email"]',
    tagName: 'input',
    type: 'email',
    name: 'email',
    labelText: 'Email Address',
    placeholder: 'Enter your email',
    required: true
  },
  value: 'user@example.com',  // Masked if sensitive
  valueLength: 17,
  timeSpent: 1500,  // For blur/change events
  validity: { valid: true, ... }  // For blur events
}
```

### Navigation Events

```javascript
{
  type: 'navigation',
  method: 'pushState' | 'replaceState' | 'popstate' | 'hashchange' | 'route',
  from: 'https://example.com/old',
  to: 'https://example.com/new',
  page: {
    url: 'https://example.com/new',
    path: '/new',
    hash: '',
    search: '',
    title: 'New Page'
  }
}
```

### Page View Events

```javascript
{
  type: 'pageview',
  trigger: 'load' | 'navigation' | 'route',
  page: {
    url: 'https://example.com/page',
    path: '/page',
    hash: '',
    search: '?query=value',
    title: 'Page Title',
    referrer: 'https://google.com'
  },
  timing: {
    loadTime: 1250,
    navigationTime: 100
  },
  viewport: { width: 1920, height: 1080 }
}
```

### API Events

```javascript
{
  type: 'api',
  source: 'fetch' | 'xhr',
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | ...
  phase: 'start' | 'complete' | 'error',
  url: {
    full: 'https://api.example.com/users',
    origin: 'https://api.example.com',
    path: '/users',
    search: '?page=1',
    hash: ''
  },
  headers: { 'content-type': 'application/json' },
  status: 200,        // For complete phase
  statusText: 'OK',   // For complete phase
  duration: 245,      // For complete/error phase
  error: 'Network error'  // For error phase
}
```

### Error Events

```javascript
{
  type: 'runtime_error' | 'console_error' | 'unhandled_rejection',
  message: 'TypeError: Cannot read property...',
  source: 'https://example.com/app.js',
  line: 125,
  column: 15,
  stack: 'Error stack trace...',
  error: 'TypeError',
  timestamp: 1234567890,
  page: { url: '...', path: '/...' }
}
```

## API Reference

### Global Methods

```javascript
// Initialize tracker
OwlinTracker.init(config)

// Get tracker instance
OwlinTracker.getTracker()

// Destroy tracker
OwlinTracker.destroy()
```

### Instance Methods

```javascript
// Track custom event
tracker.trackEvent(name, properties)

// Track raw event
tracker.track(event, useBeacon)

// Set user ID
tracker.setUserId(userId)

// Set user properties
tracker.setUserProperties(properties)

// Track session start
tracker.trackSessionStart()

// Track session end
tracker.trackSessionEnd()

// Flush pending events
tracker.flush()

// Enable collector
tracker.enableCollector('click')

// Disable collector
tracker.disableCollector('input')

// Start all collectors
tracker.start()

// Stop all collectors
tracker.stop()

// Destroy tracker
tracker.destroy()
```

## React Integration

```jsx
import { useEffect } from 'react';
import { init } from './sdk/owlin-tracker';

function App() {
  useEffect(() => {
    const tracker = init({
      endpoint: '/api/events',
      appName: 'School Dashboard',
      debug: process.env.NODE_ENV === 'development',
    });

    return () => tracker.destroy();
  }, []);

  return <YourApp />;
}
```

## Sensitive Data Masking

The SDK automatically masks sensitive data:

- Password fields: `***`
- Email addresses: `u***@example.com`
- Credit card numbers: `***`
- Authorization headers: `[REDACTED]`
- Cookies: `[REDACTED]`

## Ignoring Elements

Add `data-owlin-ignore` attribute to elements you don't want to track:

```html
<div data-owlin-ignore>
  <button>Not tracked</button>
</div>
```

## Performance

- **Batches events** to minimize network requests
- **Uses passive event listeners** where possible
- **sendBeacon API** for reliable delivery on page unload
- **Async event sending** to avoid blocking main thread

## License

MIT
