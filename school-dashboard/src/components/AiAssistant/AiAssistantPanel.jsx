import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import './AiAssistantPanel.css';

// ============================================
// CONTEXT: Global AI Panel State Management
// ============================================
const AiAssistantContext = createContext(null);

export const useAiAssistant = () => {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error('useAiAssistant must be used within AiAssistantProvider');
  }
  return context;
};

export const AiAssistantProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [panelWidth, setPanelWidth] = useState(600);

  // Auto-minimize on inactivity (5 minutes)
  useEffect(() => {
    if (!isOpen) {
      setIsIdle(false);
      return;
    }

    let idleTimer;
    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsIdle(true), 5 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => document.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetIdleTimer));
      clearTimeout(idleTimer);
    };
  }, [isOpen]);

  // Lock body scroll on mobile when panel is open
  useEffect(() => {
    const isSmallScreen = window.innerWidth < 1024;
    if (isOpen && isSmallScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);

  const value = {
    isOpen,
    isIdle,
    panelWidth,
    setPanelWidth,
    openPanel,
    closePanel,
    togglePanel,
  };

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
    </AiAssistantContext.Provider>
  );
};

// ============================================
// COMPONENT: Layout Wrapper (No Grid - Just Pass Through)
// ============================================
export function AiAssistantLayout({ children }) {
  // No grid layout needed - panel is now a fixed overlay
  return <>{children}</>;
}

// ============================================
// COMPONENT: AI Assistant Panel
// ============================================
export function AiAssistantPanel({ children }) {
  const { isOpen, closePanel } = useAiAssistant();
  const [isVisible, setIsVisible] = useState(isOpen);
  const panelRef = useRef(null);

  // Handle transition state for smooth animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Focus panel when opened
      panelRef.current?.focus();
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard accessibility (Escape to close)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') closePanel();
  }, [closePanel]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`ai-assistant-backdrop ${isOpen ? 'ai-assistant-backdrop--visible' : ''}`}
        onClick={closePanel}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <aside
        ref={panelRef}
        className={`ai-assistant-panel ${isOpen ? 'ai-assistant-panel--open' : ''}`}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        aria-label="AI Assistant"
        role="complementary"
        aria-hidden={!isOpen}
      >
        <div className="ai-assistant-panel__content">
          {children}
        </div>
      </aside>
    </>
  );
}

// ============================================
// COMPONENT: Toggle Button (for Topbar)
// ============================================
export function AiAssistantToggle() {
  const { isOpen, togglePanel } = useAiAssistant();

  return (
    <button
      onClick={togglePanel}
      className={`ai-assistant-toggle ${isOpen ? 'ai-assistant-toggle--active' : ''}`}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      aria-pressed={isOpen}
      aria-expanded={isOpen}
    >
      <Sparkles size={18} />
    </button>
  );
}

// ============================================
// EXPORT: All components
// ============================================
export default {
  AiAssistantProvider,
  useAiAssistant,
  AiAssistantLayout,
  AiAssistantPanel,
  AiAssistantToggle,
};
