import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import PhotoModal from "./PhotoModal";

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
 * Generate a hash from a string (0-100)
 * Uses the full name for consistent, unique results
 */
function generateNameHash(personName) {
  if (!personName) return 50;
  let hash = 0;
  const str = personName.toLowerCase().trim();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Normalize to 0-100 range (absolute value mod 101)
  return Math.abs(hash % 101);
}

/**
 * Generate HSL color values with unique shades based on name hash
 * Staff: Purple/Pink spectrum (hue 220-280) - WIDER 60° range
 * Students: Cyan/Deep Blue spectrum (hue 170-250) - WIDER 80° range
 */
function generateHSLColor(personName, personType) {
  const hash = generateNameHash(personName);

  let hue, saturation, lightness;

  if (personType === "staff") {
    // Purple/Pink spectrum: 220-280 (60° range - MUCH wider)
    hue = 220 + (hash * 0.6); // Maps 0-100 to 220-280
    saturation = 50 + (hash * 0.4); // 50-90% - WIDER variation
    lightness = 40 + (hash * 0.25); // 40-65% - WIDER variation
  } else if (personType === "student") {
    // Cyan/Deep Blue spectrum: 170-250 (80° range - MUCH wider)
    hue = 170 + (hash * 0.8); // Maps 0-100 to 170-250
    saturation = 55 + (hash * 0.4); // 55-95% - WIDER variation
    lightness = 40 + (hash * 0.25); // 40-65% - WIDER variation
  } else {
    // Default: Full spectrum for backwards compatibility
    hue = hash * 3.6; // Maps 0-100 to 0-360
    saturation = 50 + (hash * 0.4); // 50-90%
    lightness = 40 + (hash * 0.25); // 40-65%
  }

  return { hue, saturation, lightness };
}

/**
 * Create gradient CSS from HSL values
 * Returns a gradient from base color to a slightly darker shade
 */
function createGradient(hue, saturation, lightness) {
  const color1 = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const color2 = `hsl(${hue}, ${saturation}%, ${Math.max(lightness - 12, 25)}%)`;
  return { color1, color2 };
}

/**
 * Compute the gradient style for a name/type combination.
 */
function getAvatarColor(personName, personType) {
  const hsl = generateHSLColor(personName, personType);
  const gradient = createGradient(hsl.hue, hsl.saturation, hsl.lightness);
  return {
    background: `linear-gradient(135deg, ${gradient.color1}, ${gradient.color2})`,
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
  const avatarColor = useMemo(() => getAvatarColor(name, type), [name, type]);

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
