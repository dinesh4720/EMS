import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageOff } from "lucide-react";
import { useTranslation } from 'react-i18next';
import ModalBase from "../ui/ModalBase";

/**
 * PhotoModal - A beautiful, accessible modal for viewing full-size photos
 *
 * Features:
 * - Smooth fade-in/scale animations using framer-motion
 * - Backdrop blur effect
 * - Close on: backdrop click, Escape key, close button
 * - Focus trapped within the modal (Tab/Shift+Tab cycle through modal elements only)
 * - Loading state while image loads
 * - Error state if image fails to load
 * - Responsive sizing with max constraints
 * - Full accessibility support (aria-labels, roles, focus management)
 */
export default function PhotoModal({ isOpen, onClose, src, alt = "Photo" }) {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const titleId = useRef("photo-modal-title");

  // Reset image state when src changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen, src]);

  // Handle backdrop click (only fires when clicking the backdrop div itself)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={alt && alt !== "Photo" ? titleId.current : undefined}
      portalId="photo-modal-root"
      className="fixed inset-0 z-[99999]"
    >
      <AnimatePresence>
        {isOpen && (
          /* Backdrop */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            role="presentation"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 p-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={t('aria.buttons.closePhotoModal', 'Close photo')}
              >
                <X size={28} strokeWidth={2} />
              </button>

              {/* Image Container */}
              <div className="relative bg-default-100 rounded-2xl overflow-hidden shadow-2xl">
                {/* Loading State */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-default-100 z-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
                    />
                  </div>
                )}

                {/* Error State */}
                {imageError && (
                  <div className="flex items-center justify-center py-16 bg-default-100">
                    <div className="text-center">
                      <ImageOff className="w-16 h-16 text-default-400 mx-auto mb-4" strokeWidth={1.5} />
                      <p className="text-default-500 font-medium">Failed to load image</p>
                    </div>
                  </div>
                )}

                {/* Actual Image */}
                {!imageError && (
                  <img
                    src={src}
                    alt={alt}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                )}

                {/* Photo Title/Alt Text */}
                {alt && alt !== "Photo" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p id={titleId.current} className="text-white text-sm font-medium">
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
        )}
      </AnimatePresence>
    </ModalBase>
  );
}
