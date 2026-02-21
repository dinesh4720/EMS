# Staff App - EMS

A beautiful Apple-style mobile app for staff members to view their daily timetable.

## Features

- **Apple-Style UI**: Large typography, fluid animations, and iOS-native feel
- **Today's Timetable**: View all classes for the day with current class highlighted
- **Bottom Sheet Modals**: iOS-style popover sheets that slide up from the bottom
- **Haptic Feedback**: Tactile feedback on interactions
- **Pull to Refresh**: Standard iOS refresh gesture
- **Smooth Animations**: Powered by React Native Reanimated

## Getting Started

### Quick Start (Windows)
```bash
cd staff-app
start.bat
```

### Quick Start (Mac/Linux)
```bash
cd staff-app
chmod +x start.sh
./start.sh
```

### Manual Start

```bash
cd staff-app
npm install
npx expo start
```

Then scan the QR code with:
- **iOS**: Use the Camera app
- **Android**: Use the Expo Go app

## Project Structure

```
staff-app/
├── App.js                          # App entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── start.bat / start.sh            # Quick start scripts
│
├── src/
│   ├── components/
│   │   ├── LargeTitle.jsx          # Apple-style large title
│   │   ├── BottomSheet.jsx         # iOS-style bottom sheet modal
│   │   ├── Card.jsx                # Card component with animations
│   │   ├── TimetableCard.jsx       # Timetable item card
│   │   ├── Icon.jsx                # Emoji-based icon component
│   │   ├── EmptyState.jsx          # Empty state display
│   │   ├── LoadingShimmer.jsx      # Loading skeleton
│   │   └── index.js                # Component exports
│   │
│   ├── screens/
│   │   └── HomeScreen.jsx          # Main home screen
│   │
│   ├── data/
│   │   └── mockData.js             # Mock timetable data
│   │
│   ├── theme/
│   │   └── index.js                # Colors, typography, spacing
│   │
│   └── utils/
│       └── helpers.js              # Utility functions
│
└── assets/                         # App icons and images
```

## Custom Components

### LargeTitle
Huge title component with optional subtitle and fade-in animation.
```jsx
<LargeTitle subtitle="Monday, January 15">Good Morning</LargeTitle>
```

### BottomSheet
iOS-style modal that slides up from the bottom.
```jsx
<BottomSheet
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Class Details"
>
  <Text>Content here</Text>
</BottomSheet>
```

### TimetableCard
Card displaying class information.
```jsx
<TimetableCard
  item={classData}
  index={0}
  onPress={handlePress}
  isCurrent={true}
/>
```

## Theme System

The app includes a comprehensive theme system:

```js
import { Colors, Typography, Spacing } from './src/theme';

// Use system colors
Colors.blue       // #007AFF
Colors.green      // #34C759

// Use typography presets
Typography.largeTitle
Typography.body

// Use spacing values
Spacing.md        // 16
Spacing.lg        // 24
```

## Tech Stack

| Package | Purpose |
|---------|---------|
| React Native | Cross-platform mobile framework |
| Expo | Development tooling |
| React Native Reanimated | Smooth 60fps animations |
| React Native Gesture Handler | Touch gestures |
| Expo Haptics | Tactile feedback |
| Expo Linear Gradient | Gradient backgrounds |
| Expo Blur | Blur effects |

## Development

### Run on specific platform
```bash
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator
npx expo start --web      # Web browser
```

### Clear cache
```bash
npx expo start --clear
```

## Customization

### Adding new subjects
Edit `src/data/mockData.js` to add your own timetable data.

### Changing colors
Edit `src/theme/index.js` to customize the color palette.

### Adding new screens
Create a new file in `src/screens/` and update the navigation.
