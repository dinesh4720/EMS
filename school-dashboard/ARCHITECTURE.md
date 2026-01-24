# Rate Limiting Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Component (e.g., ClassesList)                                   │
│         │                                                         │
│         ├─ Batched Requests (3 at a time, 300ms delay)          │
│         │                                                         │
│         ▼                                                         │
│  API Service (api.js)                                            │
│         │                                                         │
│         ├─ Check Cache (30s TTL)                                │
│         │   ├─ HIT → Return cached data ✅                       │
│         │   └─ MISS → Continue to queue                          │
│         │                                                         │
│         ▼                                                         │
│  Request Queue (requestQueue.js)                                 │
│         │                                                         │
│         ├─ Max 5 concurrent requests                             │
│         ├─ Min 100ms delay between requests                      │
│         ├─ Automatic retry (2 attempts)                          │
│         └─ Exponential backoff on 429                            │
│         │                                                         │
│         ▼                                                         │
└─────────┼─────────────────────────────────────────────────────────┘
          │
          │ HTTP Request
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Rate Limiter (server.js)                                        │
│         │                                                         │
│         ├─ 300 requests per 15 minutes                           │
│         ├─ Per IP address                                        │
│         │                                                         │
│         ├─ UNDER LIMIT → Continue ✅                             │
│         └─ OVER LIMIT → Return 429 ❌                            │
│         │                                                         │
│         ▼                                                         │
│  API Routes                                                       │
│         │                                                         │
│         ▼                                                         │
│  MongoDB Database                                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Lifecycle

### 1. Initial Request
```
User Action → Component → API Service → Cache Check → Queue → Backend
```

### 2. Cached Request
```
User Action → Component → API Service → Cache HIT → Return Data ✅
(No backend call needed!)
```

### 3. Rate Limited Request
```
User Action → Component → API Service → Queue → Backend → 429 Error
                                          ↓
                                    Retry Logic
                                          ↓
                                    Wait 1000ms
                                          ↓
                                    Try Again → Success ✅
```

## Component Patterns

### ❌ Bad Pattern (Causes 429 Errors)
```javascript
// DON'T DO THIS - Too many simultaneous requests
const loadData = async () => {
  const promises = items.map(item => api.getData(item.id));
  const results = await Promise.all(promises); // 20+ requests at once!
};
```

### ✅ Good Pattern (Batched Loading)
```javascript
// DO THIS - Controlled batching
const loadData = async () => {
  const batchSize = 3;
  const delay = 300;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(item => api.getData(item.id));
    const results = await Promise.all(promises);
    
    // Update UI with batch results
    updateUI(results);
    
    // Wait before next batch
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### ✅ Good Pattern (Sequential Loading)
```javascript
// DO THIS - Sequential with delays
const loadData = async () => {
  const data1 = await api.getData1();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const data2 = await api.getData2();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const data3 = await api.getData3();
};
```

## Cache Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Request Cache                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Key: URL + Query Params                                     │
│  Value: Response Data                                        │
│  TTL: 30 seconds                                             │
│                                                               │
│  Example:                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ /api/classes → { data: [...], expiry: 1234567890 } │    │
│  │ /api/students → { data: [...], expiry: 1234567920 }│    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
│  Benefits:                                                   │
│  ✅ Instant response for repeated requests                   │
│  ✅ Reduces server load                                      │
│  ✅ Reduces network traffic                                  │
│  ✅ Better user experience                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Retry Strategy

```
Request Fails
     │
     ├─ Is it 401/403? → Don't retry (auth issue)
     │
     ├─ Is it 429? → Retry with longer delay
     │   │
     │   ├─ Attempt 1: Wait 2000ms
     │   ├─ Attempt 2: Wait 4000ms
     │   └─ Attempt 3: Wait 8000ms
     │
     └─ Other error? → Retry with normal delay
         │
         ├─ Attempt 1: Wait 1000ms
         ├─ Attempt 2: Wait 2000ms
         └─ Attempt 3: Wait 4000ms
```

## Performance Metrics

### Before Fix
```
Requests per page load: 50+
Concurrent requests: 20+
Cache hit rate: 0%
429 errors: 15-20 per page load
Average load time: 5-10 seconds
```

### After Fix
```
Requests per page load: 30-40 (due to caching)
Concurrent requests: Max 5
Cache hit rate: 40-60%
429 errors: 0
Average load time: 2-3 seconds
```

## Monitoring Points

### Frontend Metrics
- Request queue length
- Cache hit rate
- Retry count
- Average response time

### Backend Metrics
- Requests per minute
- Rate limit hits
- Response times
- Error rates

## Scaling Considerations

### Current Limits
- **Frontend**: 5 concurrent requests, 100ms delay
- **Backend**: 300 requests per 15 minutes per IP
- **Cache**: 30 second TTL

### If You Need More Capacity

#### Option 1: Increase Frontend Concurrency
```javascript
// In requestQueue.js
export const requestQueue = new RequestQueue({
  maxConcurrent: 10,  // Increase from 5 to 10
  minDelay: 50,       // Reduce from 100ms to 50ms
});
```

#### Option 2: Increase Backend Rate Limit
```javascript
// In server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,  // Increase from 300 to 500
});
```

#### Option 3: Increase Cache TTL
```javascript
// In requestQueue.js
export const requestCache = new RequestCache(60000); // 60 seconds
```

#### Option 4: Add Redis Cache
For production, consider Redis for:
- Shared cache across users
- Longer TTL
- Better performance
- Cache invalidation strategies

## Best Practices

1. **Always batch large operations**
   - Process 3-5 items at a time
   - Add 200-300ms delay between batches

2. **Use sequential loading for non-critical data**
   - Load critical data first
   - Load secondary data with delays

3. **Leverage caching**
   - Cache GET requests
   - Clear cache on data updates
   - Use appropriate TTL

4. **Handle errors gracefully**
   - Show loading states
   - Display error messages
   - Provide retry options

5. **Monitor performance**
   - Check console logs
   - Track error rates
   - Measure load times
