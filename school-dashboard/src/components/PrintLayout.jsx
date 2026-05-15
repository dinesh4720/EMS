import { createPortal } from 'react-dom';

/**
 * PrintLayout — renders children as a portal in document.body so they appear
 * outside #root. This is required for window.print() to work correctly.
 *
 * How it works with the @media print CSS in index.css:
 *   Screen:  .print-only is positioned off-screen (invisible to the user).
 *   Print:   #root is hidden; body > .print-only is shown instead.
 *            The sidebar, topbar, and all other dashboard chrome are hidden
 *            because they live inside #root.
 *
 * Usage:
 *   // 1. Wrap your printable content:
 *   <PrintLayout>
 *     <YourPrintableComponent />
 *   </PrintLayout>
 *
 *   // 2. Trigger printing:
 *   window.print();
 *
 * Without this wrapper, window.print() shows the full dashboard (sidebar +
 * header) because nothing instructs the browser to hide the app chrome.
 */
export default function PrintLayout({ children }) {
  return createPortal(
    <div className="print-only">{children}</div>,
    document.body
  );
}
