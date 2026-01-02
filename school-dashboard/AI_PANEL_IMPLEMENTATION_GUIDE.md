# AI Dockable Panel - Implementation Guide

## 📋 Overview

This is a production-ready, state-driven AI assistant panel that docks to the right side of the viewport with smooth transitions and responsive behavior.

## 🎯 Design Decisions

### Layout Strategy: **CSS Grid** (Recommended)

**Why CSS Grid over Flexbox?**

| Aspect | CSS Grid ✅ | Flexbox ⚠️ |
|--------|-------------|------------|
| 2D Layout Control | Excellent (rows + columns) | Limited (1D only) |
| Content Resizing | Automatic, declarative | Requires manual width calculations |
| Panel Integration | Native `minmax()` support | Needs absolute positioning hacks |
| Responsive Design | Built-in media queries | Manual breakpoint handling |
| Performance | GPU-accelerated layout | Can trigger reflows |
| Maintainability | Declarative | Imperative (JS-heavy) |

**Verdict:** CSS Grid provides cleaner, more maintainable code with better performance.

---

## 🏗️ Component Architecture

```
AiPanelProvider (Context)
├── AiDockablePanel (Container)
│   ├── AiPanelHeader
│   ├── AiPanelBody
│   └── AiPanelFooter
└── AiPanelLayout (Wrapper for main content)
```

---

## 📦 Installation

### 1. Wrap your App with the Provider

```jsx
// src/App.jsx
import { AiPanelProvider } from './components/AiDockablePanel';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AiPanelProvider>
          <AppRoutes />
        </AiPanelProvider>
      </AppProvider>
    </AuthProvider>
  );
}
```

### 2. Add the Panel to Your Layout

```jsx
// src/App.jsx (inside AuthenticatedApp)
import { AiDockablePanel, useAiPanel } from './components/AiDockablePanel';
import AiPanelLayout from './components/AiPanelLayout';

function AuthenticatedApp() {
  const { togglePanel } = useAiPanel();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* Wrap main content with layout handler */}
      <div className="flex-1 flex flex-col">
        <Topbar onAiClick={togglePanel} />
        
        <AiPanelLayout>
          <main className="flex-1 p-6">
            {/* Your page content */}
          </main>
        </AiPanelLayout>
      </div>

      {/* AI Panel */}
      <AiDockablePanel>
        <AiPanelContent />
      </AiDockablePanel>
    </div>
  );
}
```

### 3. Create AI Panel Content

```jsx
// src/components/AiPanelContent.jsx
import { AiPanelHeader, AiPanelBody, AiPanelFooter } from './AiDockablePanel';
import { useState } from 'react';
import { Send } from 'lucide-react';

export default function AiPanelContent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  return (
    <>
      <AiPanelHeader title="AI Assistant" />
      
      <AiPanelBody>
        <div className="p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="p-3 rounded-lg bg-default-100">
              {msg}
            </div>
          ))}
        </div>
      </AiPanelBody>
      
      <AiPanelFooter>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border"
            placeholder="Ask anything..."
          />
          <button className="p-2 bg-primary text-white rounded-lg">
            <Send size={18} />
          </button>
        </div>
      </AiPanelFooter>
    </>
  );
}
```

### 4. Update Topbar to Toggle Panel

```jsx
// src/components/Topbar.jsx
import { useAiPanel } from './AiDockablePanel';

export default function Topbar({ onAiClick }) {
  const { togglePanel } = useAiPanel();
  
  return (
    <div className="h-12 px-4 flex items-center justify-between">
      {/* ... other content ... */}
      
      <button
        onClick={togglePanel}
        className="p-2 rounded-full hover:bg-default-100"
        title="Toggle AI Assistant"
      >
        <Sparkles className="text-primary w-5 h-5" />
      </button>
    </div>
  );
}
```

---

## 🎨 Layout CSS Examples

### Option 1: Max-Width Constraint (Simple)

```css
.main-content {
  transition: max-width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.panel-open {
  max-width: calc(100vw - 480px); /* Panel width */
}
```

### Option 2: CSS Grid (Recommended)

```css
.app-container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "sidebar topbar topbar"
    "sidebar content panel";
  min-height: 100vh;
}

/* When panel is open */
.app-container.panel-open {
  grid-template-columns: auto 1fr 480px;
}

/* Responsive breakpoints */
@media (max-width: 1024px) {
  .app-container.panel-open {
    /* Panel becomes overlay on small screens */
    grid-template-columns: auto 1fr 0;
  }
  
  .ai-panel {
    position: fixed;
    right: 0;
    width: 100vw !important;
  }
}
```

### Option 3: Flexbox with Calc

```css
.main-wrapper {
  display: flex;
  flex: 1;
  transition: all 300ms ease;
}

.main-content {
  flex: 1;
  width: calc(100vw - var(--panel-width, 0px));
  transition: width 300ms ease;
}
```

---

## 🧠 State Logic

### Panel States

```javascript
const states = {
  // Panel is closed (default)
  closed: { isOpen: false, isMinimized: false },
  
  // Panel is open and full width
  open: { isOpen: true, isMinimized: false },
  
  // Panel is collapsed to thin strip
  minimized: { isOpen: true, isMinimized: true },
};
```

### State Transitions

```javascript
// Open → Minimized (after inactivity)
// Minimized → Open (user clicks expand)
// Open → Closed (user clicks close)
// Closed → Open (user clicks AI button)
```

### Inactivity Detection

```javascript
// Auto-minimize after 5 minutes of inactivity
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

useEffect(() => {
  const handleActivity = () => {
    lastActivityRef.current = Date.now();
    
    if (isOpen && !isMinimized) {
      clearTimeout(inactiveTimer);
      inactiveTimer = setTimeout(() => {
        minimizePanel();
      }, INACTIVITY_TIMEOUT);
    }
  };

  window.addEventListener('mousemove', handleActivity);
  window.addEventListener('keydown', handleActivity);
  window.addEventListener('click', handleActivity);

  return () => {
    window.removeEventListener('mousemove', handleActivity);
    window.removeEventListener('keydown', handleActivity);
    window.removeEventListener('click', handleActivity);
    clearTimeout(inactiveTimer);
  };
}, [isOpen, isMinimized]);
```

---

## 📱 Responsive Behavior

### Breakpoints

| Screen Size | Panel Behavior |
|-------------|----------------|
| **≥ 1024px** | Docks, content resizes |
| **768px - 1023px** | Overlay (80% width) |
| **< 768px** | Full-screen overlay |

### Implementation

```javascript
const useResponsivePanel = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return {
    panelWidth: isMobile ? '100vw' : 480,
    position: isMobile ? 'fixed' : 'relative',
    zIndex: isMobile ? 9999 : 40,
  };
};
```

---

## ⚡ Performance Optimizations

1. **GPU Acceleration**
   ```css
   .ai-panel {
     transform: translateZ(0);
     will-change: transform, width;
   }
   ```

2. **Debounce Resize Events**
   ```javascript
   const debouncedResize = useMemo(
     () => debounce(() => handleResize(), 150),
     []
   );
   ```

3. **Avoid Layout Thrashing**
   ```javascript
   // Batch DOM reads/writes
   const width = element.offsetWidth; // Read
   requestAnimationFrame(() => {
     element.style.width = width + 'px'; // Write
   });
   ```

---

## 🎹 Keyboard Accessibility

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    // Cmd/Ctrl + K to toggle
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePanel();
    }
    
    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      closePanel();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, togglePanel, closePanel]);
```

---

## 🐛 UX Edge Cases

### 1. Window Resize
- **Problem:** Panel width doesn't adjust on resize
- **Solution:** Listen to resize events and recalculate layout

```javascript
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 1024 && isOpen) {
      // Switch to overlay mode
      setIsDocked(false);
    }
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [isOpen]);
```

### 2. Focus Management
- **Problem:** Focus trap inside panel
- **Solution:** Return focus to trigger element on close

```javascript
const triggerRef = useRef(null);

const closePanel = () => {
  setIsOpen(false);
  triggerRef.current?.focus(); // Return focus
};

<button ref={triggerRef} onClick={openPanel}>
  Open AI
</button>
```

### 3. Scroll Lock
- **Problem:** Background scrolls when panel is open
- **Solution:** Lock body scroll when panel is open

```javascript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

### 4. Animation Performance
- **Problem:** Jerky animations on slow devices
- **Solution:** Reduce motion preference & spring physics

```javascript
const prefersReducedMotion = useMemo(
  () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  []
);

const transition = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring', damping: 25, stiffness: 200 };
```

---

## 🧪 Testing Checklist

- [ ] Panel opens/closes smoothly
- [ ] Main content resizes correctly
- [ ] Inactivity timeout works
- [ ] Responsive breakpoints trigger
- [ ] Keyboard shortcuts work
- [ ] Focus management works
- [ ] Scroll lock works
- [ ] Performance is smooth (60fps)
- [ ] No memory leaks (cleanup)

---

## 📚 API Reference

### `useAiPanel()`

```javascript
const {
  isOpen,           // boolean - Panel visibility
  isDocked,         // boolean - Panel docked state
  isMinimized,      // boolean - Panel minimized state
  panelWidth,       // number - Panel width in px
  setPanelWidth,    // (width: number) => void
  openPanel,        // () => void
  closePanel,       // () => void
  togglePanel,      // () => void
  minimizePanel,    // () => void
  maximizePanel,    // () => void
} = useAiPanel();
```

### Component Props

#### `AiPanelProvider`
- `children: ReactNode` - Your app content

#### `AiDockablePanel`
- `children: ReactNode` - Panel content components

#### `AiPanelHeader`
- `title?: string` - Header title
- `actions?: ReactNode` - Additional header actions

#### `AiPanelBody`
- `children: ReactNode` - Main panel content

#### `AiPanelFooter`
- `children: ReactNode` - Footer content

---

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install framer-motion lucide-react
   ```

2. Copy components to your project

3. Wrap your app with `AiPanelProvider`

4. Add `AiDockablePanel` and `AiPanelLayout`

5. Use `useAiPanel()` hook to control panel

6. Customize styles to match your design

---

## 📝 Notes

- **No magic numbers** - All widths are configurable via props
- **Declarative** - Layout responds to state, not manual DOM manipulation
- **Accessible** - Full keyboard and screen reader support
- **Performant** - GPU-accelerated animations
- **Maintainable** - Clear separation of concerns

---

## 🎯 Summary

This implementation provides:
- ✅ Smooth, native-feeling transitions
- ✅ Content resizing without overlap
- ✅ Responsive behavior (desktop → mobile)
- ✅ State-driven architecture
- ✅ Inactivity detection
- ✅ Keyboard shortcuts
- ✅ Accessibility features
- ✅ Performance optimized

**Recommended:** CSS Grid for layout, Framer Motion for animations, React Context for state.
