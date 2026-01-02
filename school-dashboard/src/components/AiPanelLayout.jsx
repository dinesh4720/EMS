import { useAiPanel } from './AiDockablePanel';

/**
 * LAYOUT WRAPPER: Handles main content area resizing
 * 
 * This component wraps your main content and adjusts its layout
 * when the AI panel is open. It uses CSS Grid for robust, declarative layout.
 */
export default function AiPanelLayout({ children }) {
  const { isOpen, panelWidth } = useAiPanel();

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        // When panel is open, reduce max-width to prevent overlap
        maxWidth: isOpen ? `calc(100vw - ${panelWidth}px)` : '100vw',
        // Add padding on the right when panel is open
        paddingRight: isOpen ? '0' : '0',
        // Smooth transition for layout changes
        transitionProperty: 'max-width, padding-right',
      }}
    >
      {children}
    </div>
  );
}

/**
 * ALTERNATIVE: CSS Grid-based Layout
 * Use this if you prefer CSS Grid over max-width approach
 */
export function AiPanelGridLayout({ children, sidebarOpen }) {
  const { isOpen, panelWidth } = useAiPanel();

  return (
    <div
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: isOpen
          ? `minmax(0, ${sidebarOpen ? 'calc(100vw - 224px - ' + panelWidth + 'px)' : 'calc(100vw - 64px - ' + panelWidth + 'px)'}) 1fr`
          : '1fr',
        transition: 'grid-template-columns 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * RESPONSIVE BEHAVIOR
 * On smaller screens, the panel becomes an overlay
 */
const useResponsivePanel = () => {
  const { isOpen, panelWidth } = useAiPanel();
  
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  return {
    // On small screens, panel overlays content (no resize)
    shouldResize: isOpen && !isSmallScreen,
    // Panel becomes full-screen on very small screens
    isFullScreen: isOpen && window.innerWidth < 640,
  };
};
