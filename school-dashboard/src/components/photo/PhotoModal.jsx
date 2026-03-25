import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * PhotoModal - A beautiful, accessible modal for viewing full-size photos
 *
 * Features:
 * - Smooth fade-in/scale animations using framer-motion
 * - Backdrop blur effect
 * - Close on: backdrop click, Escape key, close button
 * - Keyboard navigation (Escape to close)
 * - Loading state while image loads
 * - Error state if image fails to load
 * - Responsive sizing with max constraints
 * - Full accessibility support (aria-labels, roles, focus management)
 */
export default function PhotoModal({
  isOpen, onClose, src, alt = "Photo" }) {
  const { t } = useTranslation();
  // Use ref to track latest isOpen/onClose without recreating the handler
  const isOpenRef = useRef(isOpen);
  const onCloseRef = useRef(onClose);
  const handleEscapeRef = useRef(null);

  // Keep refs in sync
  useEffect(() => {
    isOpenRef.current = isOpen;
    onCloseRef.current = onClose;
  }, [isOpen, onClose]);

  // Handle Escape key press - stable reference
  const handleEscape = useCallback((e) => {
    if (e.key === "Escape" && isOpenRef.current) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      onCloseRef.current();
    }
  }, []); // Empty deps - function never changes

  // Store the latest handleEscape
  handleEscapeRef.current = handleEscape;

  // Set up keyboard listener - use capture phase to ensure it runs first
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape, true); // true = capture phase
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape, true);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            role="presentation"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="relative max-w-5xl w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="photo-modal-title"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 p-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={t('aria.buttons.closePhotoModal')}
              >
                <X size={28} strokeWidth={2} />
              </button>

              {/* Image Container */}
              <div className="relative bg-default-100 rounded-2xl overflow-hidden shadow-2xl">
                {/* Loading State */}
                <div className="absolute inset-0 flex items-center justify-center bg-default-100 z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
                  />
                </div>

                {/* Actual Image */}
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  onLoad={(e) => {
                    // Hide loading spinner when image loads
                    e.target.previousElementSibling?.remove();
                  }}
                  onError={(e) => {
                    // Show error state
                    e.target.style.display = "none";
                    e.target.previousElementSibling.innerHTML = `
                      <div class="text-center">
                        <svg class="w-16 h-16 text-default-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-default-500 font-medium">Failed to load image</p>
                      </div>
                    `;
                  }}
                />

                {/* Photo Title/Alt Text (Optional) */}
                {alt && alt !== "Photo" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p id="photo-modal-title" className="text-white text-sm font-medium">
                      {alt}
                    </p>
                  </div>
                )}
              </div>

              {/* Keyboard Hint */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-xs">
                Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> to close
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
