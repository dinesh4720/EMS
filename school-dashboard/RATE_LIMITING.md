# Rate Limiting Solution

## Problem
The application was hitting 429 (Too Many Requests) errors because:
- Frontend was making too many simultaneous API requests
- Backend rate limiter was set to 100 requests per 15 minutes
- Multiple components loading data in parallel without coordination

## Solution Implemented

### 1. Request Queue System (`src/utils/requestQueue.js`)
- **Request Queue**: Limits concurrent requests to 5 with 100ms minimum delay between requests
- **Request Batching**: `batchRequests()` function to process requests in controlled batches
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
- **Request Cache**: 30-second cache for GET requests to reduce duplicate calls

### 2. Updated API Service (`src/services/api.js`)
- All requests now go through the request queue
- Automatic retry on rate limit errors (429)
- Request caching for GET requests
- Better error handling and logging
- Increased timeout to 15 seconds

### 3. Backend Rate Limit Increase (`backend/server.js`)
- Increased from 100 to 300 requests per 15 minutes
- More appropriate for a school management system with multiple users

### 4. Component Updates
- **ClassesList**: Batches academic performance requests (3 at a time with 300ms delay)
- **FrontDeskDashboard**: Sequential loading with 100ms delays between requests
- **GatePassLog**: Sequential data loading to avoid overwhelming the API

## Usage

### Request Queue (Automatic)
All API calls automatically use the request queue. No changes needed in most cases.

### Manual Batching
```javascript
import { batchRequests } from '../utils/requestQueue';

// Process requests in batches
const requests = items.map(item => () => api.getData(item.id));
const results = await batchRequests(requests, 5, 200); // 5 per batch, 200ms delay
```

### Clear Cache
```javascript
import { clearApiCache } from '../services/api';

// Clear cache when needed (e.g., after data updates)
clearApiCache();
```

### Retry with Backoff
```javascript
import { retryRequest } from '../utils/requestQueue';

// Retry a request up to 3 times with exponential backoff
const data = await retryRequest(() => api.getData(), 3, 1000);
```

## Best Practices

1. **Avoid Promise.all() for many requests**: Use batching instead
2. **Add delays between batches**: 100-300ms is usually sufficient
3. **Use caching**: GET requests are cached for 30 seconds by default
4. **Sequential loading**: For non-critical data, load sequentially
5. **Lazy loading**: Load data only when needed (e.g., on tab switch)

## Monitoring

Check browser console for:
- `📡 API Request`: All outgoing requests
- `✅ API Response`: Successful responses
- `💾 Cache hit`: Cached responses
- `⏳ Retrying request`: Automatic retries
- `❌ API Error`: Failed requests

## Configuration

### Request Queue Settings
```javascript
// In src/utils/requestQueue.js
export const requestQueue = new RequestQueue({
  maxConcurrent: 5,    // Max simultaneous requests
  minDelay: 100,       // Min delay between requests (ms)
});
```

### Cache TTL
```javascript
// In src/utils/requestQueue.js
export const requestCache = new RequestCache(30000); // 30 seconds
```

### Backend Rate Limit
```javascript
// In backend/server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // Max requests per window
});
```
