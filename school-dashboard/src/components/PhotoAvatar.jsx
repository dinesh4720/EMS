import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import PhotoModal from "./photo/PhotoModal";

// Size configurations (module scope — no recreation per render)
const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-20 h-20 text-2xl",
};

/**
 * Build initials from a user's full name.
 */
function getInitials(personName) {
  if (!personName) return "?";
  const parts = personName.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return personName[0].toUpperCase();
}

/**
 * Build the avatar gradient for a given name.
 *
 * Verbatim recipe from the EMS Revamp design system
 * (scripts/shell.jsx in the design handoff): two perceptually-uniform
 * oklch stops at a 135° angle, each stop's hue derived from a different
 * character of the name across the full 0–360° wheel. NO type-based
 * hue bucketing — every avatar gets its own random gradient across the
 * whole spectrum so the result is visually rich instead of monochromatic.
 *
 *   linear-gradient(135deg,
 *     oklch(70% 0.14 [name[0] * 7  mod 360]),
 *     oklch(55% 0.16 [name[1] * 11 mod 360]))
 *
 * The lightness/chroma values come straight from the design (70%/0.14
 * and 55%/0.16); oklch keeps complementary hues vibrant instead of
 * muddying through the RGB midpoint.
 */
function getAvatarColor(personName) {
  const safe = (personName || "?").trim() || "?";
  const hue1 = (safe.charCodeAt(0) * 7) % 360;
  const hue2 = (safe.charCodeAt(1 % safe.length) * 11) % 360;
  return {
    background: `linear-gradient(135deg, oklch(70% 0.14 ${hue1}), oklch(55% 0.16 ${hue2}))`,
  };
}

/**
 * PhotoAvatar - A reusable clickable photo/avatar component that opens PhotoModal
 *
 * Props:
 * - src: Image URL (optional)
 * - alt: Alt text for accessibility
 * - name: Name for fallback initials
 * - size: 'sm' | 'md' | 'lg' | 'xl'
 * - type: 'student' | 'staff' | undefined (for distinct color schemes)
 * - className: Additional CSS classes
 * - onClick: Optional click handler (runs before modal opens)
 */
export default function PhotoAvatar({
  src,
  alt = "Profile photo",
  name = "User",
  size = "md",
  type = undefined,
  className = "",
  onClick,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add cache-busting parameter to image URL
  // Use a ref to track when src actually changes, not on every render
  const [version, setVersion] = useState(0);
  const prevSrcRef = useRef(src);

  // Update version only when src actually changes
  // useEffect (not useMemo) because setVersion is a side effect
  useEffect(() => {
    if (src && src !== prevSrcRef.current) {
      setVersion(prev => prev + 1);
      prevSrcRef.current = src;
    }
  }, [src]);

  const cacheBustedSrc = useMemo(() => {
    if (!src) return null;
    // Skip cache-busting for base64 data URLs (they don't need it and it breaks them)
    if (src.startsWith('data:')) return src;
    // Add version to force browser to fetch fresh image when src changes
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}v=${version}`;
  }, [src, version]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    // Only open modal if there's a photo
    if (src) {
      setIsModalOpen(true);
    }
  };

  // Memoize color calculations to prevent unnecessary recalculation
  const avatarColor = useMemo(() => getAvatarColor(name), [name]);

  const avatarSize = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <>
      <motion.div
        whileHover={src ? { scale: 1.05 } : {}}
        whileTap={src ? { scale: 0.95 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`inline-block relative ${className}`}
      >
        <div
          className={`${avatarSize} rounded-full flex-shrink-0 overflow-hidden cursor-pointer`}
          style={src ? {} : avatarColor}
          onClick={handleClick}
          role={src ? "button" : undefined}
          tabIndex={src ? 0 : undefined}
          aria-label={src ? `View full-size photo of ${name}` : alt}
          onKeyDown={(e) => {
            if (src && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
        >
          {src ? (
            <img
              src={cacheBustedSrc}
              alt={alt}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`w-full h-full flex items-center justify-center text-white font-semibold ${
              src ? "hidden" : ""
            }`}
            style={src ? undefined : avatarColor}
          >
            {getInitials(name)}
          </div>
        </div>

        {/* Optional indicator for clickable photos */}
        {src && (
          <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/10 transition-colors pointer-events-none" />
        )}
      </motion.div>

      {/* Photo Modal */}
      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        src={cacheBustedSrc}
        alt={alt}
      />
    </>
  );
}
