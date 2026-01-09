# Add Socket Test Button

Add this button to your StaffList page to easily test if socket is working.

## Add to StaffList.jsx

Find the section with the search bar and filters, and add this button:

```jsx
{/* Add this button near the top of the page, after the search bar */}
<Button
  color="warning"
  variant="flat"
  onPress={() => {
    console.log('🧪 Testing socket connection...');
    console.log('Socket service:', window.socketService);
    console.log('Is connected:', window.socketService?.isConnected());
    
    if (!window.socketService) {
      alert('❌ Socket service not found!');
      return;
    }
    
    if (!window.socketService.isConnected()) {
      alert('❌ Socket not connected!');
      return;
    }
    
    // Trigger test event from backend
    fetch('http://localhost:3001/api/test/socket-event', {
      method: 'POST'
    })
    .then(r => r.json())
    .then(data => {
      console.log('✅ Test event triggered:', data);
      alert(`✅ Test event sent! Connected clients: ${data.clients}`);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      alert('❌ Error triggering test event');
    });
  }}
>
  🧪 Test Socket
</Button>
```

## How to Use

1. Go to Staff List page
2. Click the "🧪 Test Socket" button
3. Check the alert message:
   - If it says "Socket service not found" → Socket not initialized
   - If it says "Socket not connected" → Socket failed to connect
   - If it says "Test event sent! Connected clients: X" → Socket is working!

4. After clicking, check browser console for the event:
   ```
   🎉 RECEIVED EVENT: { staffId: "123", name: "Test User", ... }
   ```

5. If you see the event in console, socket is working perfectly!

## Alternative: Console Command

If you don't want to add a button, just run this in browser console:

```javascript
// Test socket
if (!window.socketService) {
  console.error('❌ Socket service not found');
} else if (!window.socketService.isConnected()) {
  console.error('❌ Socket not connected');
} else {
  console.log('✅ Socket is connected!');
  
  // Trigger test event
  fetch('http://localhost:3001/api/test/socket-event', {
    method: 'POST'
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Test event triggered:', data);
  });
}
```

Then watch for the event in console.
