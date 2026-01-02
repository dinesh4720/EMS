import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

// ============================================
// CONTEXT: Global AI Panel State Management
// ============================================
const AiPanelContext = createContext(null);

export const useAiPanel = () => {
  const context = useContext(AiPanelContext);
  if (!context) {
    throw new Error('useAiPanel must be used within AiPanelProvider');
  }
  return context;
};

export const AiPanelProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelWidth, setPanelWidth] = useState(480); // Default width in pixels
  const [inactiveTimer, setInactiveTimer] = useState(null);
  const lastActivityRef = useRef(Date.now());

  // Close panel after inactivity (configurable)
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  const resetInactivityTimer = useCallback(() => {
    if (inactiveTimer) {
      clearTimeout(inactiveTimer);
    }
    lastActivityRef.current = Date.now();
    
    // Only auto-close if panel is open and not minimized
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, INACTIVITY_TIMEOUT);
      setInactiveTimer(timer);
    }
  }, [isOpen, isMinimized, inactiveTimer]);

  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (inactiveTimer) clearTimeout(inactiveTimer);
    };
  }, [resetInactivityTimer]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    if (inactiveTimer) clearTimeout(inactiveTimer);
  }, [inactiveTimer]);

  const togglePanel = useCallback(() => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isOpen, openPanel, closePanel]);

  const minimizePanel = useCallback(() => {
    setIsMinimized(true);
    if (inactiveTimer) clearTimeout(inactiveTimer);
  }, [inactiveTimer]);

  const maximizePanel = useCallback(() => {
    setIsMinimized(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const value = {
    isOpen,
    isDocked,
    isMinimized,
    panelWidth,
    setPanelWidth,
    setIsDocked,
    openPanel,
    closePanel,
    togglePanel,
    minimizePanel,
    maximizePanel,
  };

  return (
    <AiPanelContext.Provider value={value}>
      {children}
    </AiPanelContext.Provider>
  );
};

// ============================================
// COMPONENT: Dockable Panel Container
// ============================================
export function AiDockablePanel({ children }) {
  const { isOpen, isDocked, isMinimized, panelWidth, closePanel, maximizePanel } = useAiPanel();

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={false}
        animate={{
          x: isDocked ? 0 : 0,
          width: isMinimized ? 'auto' : panelWidth,
        }}
        exit={{
          x: isDocked ? panelWidth : 0,
          opacity: 0,
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 200,
          opacity: { duration: 0.2 },
        }}
        className={`
          fixed right-0 top-12 bottom-0 z-40
          bg-white/95 dark:bg-black/95
          border-l border-default-200 dark:border-default-700
          shadow-2xl backdrop-blur-xl
          flex flex-col overflow-hidden
          ${isDocked ? 'border-l' : 'border-l shadow-2xl'}
        `}
        style={{
          width: isMinimized ? 'auto' : panelWidth,
        }}
      >
        {/* Minimized State */}
        {isMinimized ? (
          <MinimizedPanel onExpand={maximizePanel} onClose={closePanel} />
        ) : (
          <>{children}</>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// COMPONENT: Minimized Panel (Collapsed)
// ============================================
function MinimizedPanel({ onExpand, onClose }) {
  return (
    <div className="h-full w-16 flex flex-col items-center py-4 gap-4">
      <button
        onClick={onExpand}
        className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all group relative"
        title="Expand AI Assistant"
      >
        <Sparkles className="text-primary w-5 h-5" />
        <span className="absolute right-full mr-2 px-2 py-1 bg-default-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          AI Assistant
        </span>
      </button>
      
      <button
        onClick={onClose}
        className="p-3 rounded-xl hover:bg-default-100 dark:hover:bg-default-800 transition-all group relative"
        title="Close"
      >
        <X className="w-5 h-5 text-default-500" />
        <span className="absolute right-full mr-2 px-2 py-1 bg-default-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Close
        </span>
      </button>
    </div>
  );
}

// ============================================
// COMPONENT: Panel Header
// ============================================
export function AiPanelHeader({ title, actions }) {
  const { isMinimized, minimizePanel, closePanel } = useAiPanel();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-default-200 dark:border-default-700 bg-default-50/50 dark:bg-default-100/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-foreground">{title || 'AI Assistant'}</h2>
      </div>
      
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={minimizePanel}
          className="p-2 hover:bg-default-200 dark:hover:bg-default-700 rounded-lg transition-colors"
          title="Minimize"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
        <button
          onClick={closePanel}
          className="p-2 hover:bg-default-200 dark:hover:bg-default-700 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: Panel Body
// ============================================
export function AiPanelBody({ children }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {children}
    </div>
  );
}

// ============================================
// COMPONENT: Panel Footer
// ============================================
export function AiPanelFooter({ children }) {
  return (
    <div className="border-t border-default-200 dark:border-default-700 p-4 bg-default-50/50 dark:bg-default-100/5">
      {children}
    </div>
  );
}
