# Error Fixes Summary - Staff App

## Date: 2026-02-19

## Issues Fixed

### 1. ✅ 404 Error - Missing `/api/messages/unread-count` Endpoint

**Error:**
```
:3001/api/messages/unread-count?userId=69875624ac6f5423e3141a5c&userType=staff:1 Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Solution:**
- Added new GET endpoint `/api/messages/unread-count` to `backend/routes/messages.js`
- Endpoint accepts `userId` and `userType` query parameters
- Returns total unread count across all conversations for the user

**Implementation:**
```javascript
router.get('/unread-count', async (req, res) => {
  const { userId, userType } = req.query;
  // Find all conversations for this user
  const conversations = await Conversation.find({
    'participants.userId': userId,
    isArchived: false
  }).lean();
  
  // Calculate total unread count
  let totalUnread = 0;
  conversations.forEach(conv => {
    const participant = conv.participants.find(p => p.userId.toString() === userId);
    if (participant && participant.unreadCount) {
      totalUnread += participant.unreadCount;
    }
  });
  
  res.json({ count: totalUnread });
});
```

---

### 2. ✅ Haptics Crash - `Haptic.impactAsync` Not Available on Web

**Error:**
```
Uncaught (in promise) UnavailabilityError: The method or property Haptic.impactAsync is not available on web
```

**Solution:**
- Created platform-safe Haptic utility functions in `staff-app/src/utils/helpers.js`
- Added `Platform.OS` checks to prevent calling haptic functions on web
- Updated `NotificationsScreen.jsx` to use the new utility functions

**Implementation:**

Created two utility functions:
```javascript
export const triggerHaptic = async (style = 'light') => {
  if (Platform.OS !== 'web') {
    try {
      const Haptics = require('expo-haptics');
      const styleMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(styleMap[style] || Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not available:', error.message);
    }
  }
};

export const triggerNotificationHaptic = async (type = 'success') => {
  if (Platform.OS !== 'web') {
    try {
      const Haptics = require('expo-haptics');
      // Similar implementation for notification haptics
    } catch (error) {
      console.warn('Notification haptic not available:', error.message);
    }
  }
};
```

**Updated usage in NotificationsScreen:**
```javascript
// Before:
import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// After:
import { triggerHaptic } from '../utils/helpers';
triggerHaptic('light');
```

---

### 3. ✅ Navigation Issue - No Back Button in Notifications Screen

**Error:**
User reported: "Once I'm inside notifications, I'm not able to go back"

**Solution:**
- Added back button to `staff-app/src/screens/NotificationsScreen.jsx`
- Implemented `handleBackPress` callback with haptic feedback
- Styled the back button with proper press states

**Implementation:**
```javascript
const handleBackPress = useCallback(() => {
  triggerHaptic('light');
  navigation.goBack();
}, [navigation]);

// In render:
<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
  <Pressable
    onPress={handleBackPress}
    style={({ pressed }) => [
      styles.backButton,
      pressed && { opacity: 0.6 }
    ]}
  >
    <ChevronLeft size={24} color={colors.onSurface} />
  </Pressable>
  <View style={styles.headerContent}>
    <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>Notifications</Text>
    <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
      {notifications.filter(n => !n.read).length} unread
    </Text>
  </View>
</View>
```

---

### 4. ⚠️ Text Node Warning - "A text node cannot be a child of a <View>"

**Status:** Unable to locate specific issue from logs provided.

**Recommended Investigation:**
- Search for loose text content inside `<View>` components
- Wrap all text content in `<Text>` components
- Common patterns to look for:
  ```jsx
  <View>
    Hello World  {/* This should be wrapped in <Text> */}
  </View>
  
  // Should be:
  <View>
    <Text>Hello World</Text>
  </View>
  ```

**Search suggestions:**
```bash
# Look for View tags followed by text
grep -r "<View.*>" staff-app/src/screens | grep -v "</View>" | grep -v "<Text"

# Or look for literal periods or other text content
grep -rn "^[ \t]*\\.[ \t]*$" staff-app/src/screens/*.jsx
```

---

### 5. ℹ️ Reanimated Warning - Reading from `value` During Render

**Status:** Warning (non-critical)

**Warning:**
```
[Reanimated] Reading from `value` during component render. Please ensure that you do not access the `value` property or use `get` method of a shared value while React is rendering a component.
```

**Recommendation:**
- This is a development warning from React Native Reanimated library
- Doesn't affect functionality
- Can be suppressed by disabling strict mode in Reanimated configuration
- Or refactored to avoid reading shared values during render (more complex)

---

## Files Modified

1. **backend/routes/messages.js**
   - Added `/unread-count` endpoint

2. **staff-app/src/utils/helpers.js**
   - Added `triggerHaptic()` utility function
   - Added `triggerNotificationHaptic()` utility function
   - Imported `Platform` from react-native

3. **staff-app/src/screens/NotificationsScreen.jsx**
   - Added back button with `ChevronLeft` icon
   - Implemented `handleBackPress` callback
   - Updated imports to include `ChevronLeft` and `X`
   - Changed haptic calls to use new `triggerHaptic` utility
   - Updated header styling to accommodate back button

---

## Testing Recommendations

1. **Backend Endpoint:**
   ```bash
   # Test the new unread-count endpoint
   curl "http://localhost:3001/api/messages/unread-count?userId=<USER_ID>&userType=staff"
   ```

2. **Navigation:**
   - Navigate to Notifications screen
   - Verify back button appears and works
   - Test on both mobile and web platforms

3. **Haptics:**
   - Test notification interactions on mobile device
   - Verify no haptic errors on web platform
   - Check console for successful haptic calls on mobile

4. **General:**
   - Reload the app and verify no 404 errors
   - Test refreshing notifications list
   - Verify notification count updates correctly

---

## Next Steps (Optional)

1. **Investigate Text Node Warning:**
   - Run the app with detailed error logging
   - Look for specific component causing the warning
   - Add proper `<Text>` wrapping to all loose text content

2. **Address Reanimated Warning:**
   - Disable strict mode in Reanimated config (simplest)
   - OR refactor to use `useDerivedValue` and `useAnimatedProps` (more complex)

3. **Consider Additional Improvements:**
   - Add loading states for haptic feedback
   - Implement retry logic for failed API calls
   - Add error boundaries for better error handling