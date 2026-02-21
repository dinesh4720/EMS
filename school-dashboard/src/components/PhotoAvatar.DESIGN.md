# PhotoModal & PhotoAvatar - Design Guide

## Visual Design System

### Aesthetic Direction
**Modern, Clean, Accessible** - The components embrace a contemporary design language with smooth animations, glassmorphism effects, and thoughtful interactions.

### Color Palette

#### Avatar Gradients (5 Variants)
```css
/* Secondary - Default Teal */
from-secondary to-secondary/60

/* Primary - Blue */
from-primary to-primary/60

/* Success - Green */
from-success to-success/60

/* Warning - Orange */
from-warning to-warning/60

/* Danger - Red */
from-danger to-danger/60
```

#### Modal Colors
```css
/* Backdrop */
bg-black/70 with backdrop-blur-sm

/* Loading Spinner */
border-primary/30 (track)
border-t-primary (active)

/* Close Button */
text-white/90 hover:text-white
hover:bg-white/10
ring-2 ring-white/50 (focus)

/* Error State */
text-default-400 (icon)
text-default-500 (message)
```

### Typography

```css
/* Initials Text */
font-semibold
sm: text-xs (32px avatar)
md: text-sm (40px avatar)
lg: text-xl (64px avatar)
xl: text-2xl (80px avatar)

/* Photo Title Overlay */
text-white text-sm font-medium
bg-gradient-to-t from-black/60

/* Keyboard Hint */
text-white/60 text-xs
```

### Spacing & Sizing

```css
/* Avatar Sizes */
sm:  w-8 h-8   (32px) - ring-2
md:  w-10 h-10 (40px) - ring-2
lg:  w-16 h-16 (64px) - ring-3
xl:  w-20 h-20 (80px) - ring-4

/* Modal */
max-w-5xl (max width)
max-h-[80vh] (max height)
p-4 (padding)
rounded-2xl (border radius)

/* Close Button */
-top-12 right-0 (position)
p-2 (padding)
rounded-lg (border radius)
```

## Animation System

### PhotoAvatar Animations

```javascript
// Hover Effect
whileHover: { scale: 1.05 }
// Tap Effect
whileTap: { scale: 0.95 }
// Transition
{
  type: "spring",
  stiffness: 400,
  damping: 17
}
```

**Feel:** Responsive, playful, immediate

### PhotoModal Animations

```javascript
// Backdrop Fade
initial: { opacity: 0 }
animate: { opacity: 1 }
exit: { opacity: 0 }
duration: 0.2

// Modal Scale
initial: { opacity: 0, scale: 0.95 }
animate: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 0.95 }
duration: 0.3
ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier

// Loading Spinner
animate: { rotate: 360 }
duration: 1
repeat: Infinity
ease: "linear"
```

**Feel:** Cinematic, smooth, premium

## Interaction Design

### Hover States

1. **Avatar with Photo**
   - Scale up to 1.05x
   - Show subtle overlay (bg-black/10)
   - Cursor changes to pointer

2. **Avatar without Photo (Initials)**
   - No scale (indicates not clickable)
   - Cursor remains default

3. **Close Button**
   - Background appears (bg-white/10)
   - Icon brightens (text-white)

### Focus States

```css
/* Keyboard Focus */
ring-2 ring-white/50 (on close button)
outline-none (remove default outline)
```

### Active States

```css
/* Tap/Click */
scale: 0.95 (avatar shrinks slightly)
```

## Layout Patterns

### Inline Usage (Table Lists)
```jsx
<div className="flex items-center gap-3">
  <PhotoAvatar size="md" />
  <div className="flex flex-col">
    <span className="font-medium">Name</span>
    <span className="text-xs text-default-500">Details</span>
  </div>
</div>
```

### Card Usage (Profile Cards)
```jsx
<div className="bg-white rounded-lg p-4 shadow">
  <div className="flex items-center gap-4">
    <PhotoAvatar size="lg" />
    {/* Details */}
  </div>
</div>
```

### Hero Usage (Profile Header)
```jsx
<div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
  <PhotoAvatar size="xl" />
  <h1 className="text-2xl font-bold">Name</h1>
  {/* Additional info */}
</div>
```

## Accessibility Design

### Focus Management
- Focus moves to modal when opened
- Focus trapped within modal while open
- Focus returns to trigger on close
- Visible focus rings on all interactive elements

### Screen Reader Support
- Descriptive ARIA labels
- Role="dialog" for modal
- aria-modal="true"
- aria-labelledby for titles
- aria-label for close button

### Keyboard Navigation
- Tab/Shift+Tab - Navigate
- Enter/Space - Activate
- Escape - Close modal

### Color Contrast
- All text meets WCAG AA standards
- White text on dark backgrounds
- Focus rings visible on all backgrounds
- Loading spinner has good contrast

## Responsive Design

### Breakpoints

```css
/* Mobile (< 640px) */
- Modal: p-4 (smaller padding)
- Image: max-h-[80vh] (constrained)

/* Tablet (640px - 1024px) */
- Modal: p-4 (standard padding)
- Image: max-h-[80vh] (constrained)

/* Desktop (> 1024px) */
- Modal: max-w-5xl (generous max width)
- Image: max-h-[80vh] (constrained)
```

### Touch Targets

```css
/* Minimum touch target: 44x44px (iOS standard) */
- Close button: 44x44px (p-2 + icon padding)
- Avatar: All sizes meet minimum
```

## Error States

### Loading State
- Centered spinner
- Matches brand color (primary)
- Smooth rotation animation
- Disappears when image loads

### Error State
- Broken image icon
- Friendly error message
- Centered in modal
- Same background as loading

### Empty State (No Photo)
- Initials displayed
- Gradient background
- Color based on name
- No indication of interactivity

## Performance Considerations

### Animation Performance
- Uses CSS transforms (GPU accelerated)
- No layout thrashing
- 60fps animations
- Smooth easing curves

### Image Loading
- Lazy loads when modal opens
- Shows loading state
- Handles errors gracefully
- No preloading (saves bandwidth)

### Bundle Size
- framer-motion: ~100KB (already in dependencies)
- Minimal additional CSS
- Tree-shakeable components

## Design Tokens

```css
/* Border Radius */
sm: rounded-lg (8px)
md: rounded-xl (12px)
lg: rounded-2xl (16px)
full: rounded-full (50%)

/* Shadow */
sm: shadow-sm
md: shadow
lg: shadow-lg
xl: shadow-xl
2xl: shadow-2xl

/* Ring (Focus Ring) */
ring-2: 2px
ring-3: 3px
ring-4: 4px

/* Blur */
backdrop-blur-sm: 4px blur
backdrop-blur-md: 12px blur
backdrop-blur-lg: 16px blur
```

## Micro-interactions

### Avatar Click
1. User hovers → Scale up slightly
2. User taps → Scale down briefly
3. Modal opens → Fade in + scale up
4. Image loads → Spinner disappears

### Modal Close
1. User clicks backdrop/button/presses Escape
2. Modal fades out + scales down
3. Backdrop fades out
4. Body scroll re-enabled
5. Focus returns to avatar

## Design Principles Applied

### 1. **Clarity**
- Clear visual hierarchy
- Obvious interactive elements
- Intuitive close methods

### 2. **Efficiency**
- Minimal clicks to view photos
- Keyboard shortcuts
- Fast animations

### 3. **Beauty**
- Smooth animations
- Gradient colors
- Glassmorphism effects
- Consistent spacing

### 4. **Accessibility**
- Keyboard navigation
- Screen reader support
- High contrast
- Large touch targets

### 5. **Performance**
- GPU animations
- Lazy loading
- Optimized re-renders

## Future Design Opportunities

### Potential Enhancements
1. **Gesture Support** - Pinch to zoom, swipe to close
2. **Transitions** - Morph from avatar position
3. **Gallery Mode** - Multiple photos with navigation
4. **Edit Mode** - Crop, rotate, filters
5. **Social Features** - Share, download, print

### Design Experiments
1. **Dark Mode** - Adaptive colors
2. **Thumbnail Strip** - Filmstrip navigation
3. **Zoom Controls** - In/out buttons
4. **Fullscreen Toggle** - Immersive view
5. **Info Panel** - Metadata display

## Implementation Notes

### Why Framer Motion?
- Industry standard for React animations
- Declarative API
- Excellent performance
- Built-in gesture support
- Easy to maintain

### Why Custom Modal?
- Full design control
- Optimized for photos
- Consistent with design system
- Better accessibility
- Smaller bundle than generic libraries

### Why Separate Components?
- Reusable avatar everywhere
- Modal can be used standalone
- Clear separation of concerns
- Easier to test
- Better code organization

---

**Design Philosophy:** Form follows function, beauty serves usability.
**Goal:** Create delightful, accessible photo viewing experiences.
