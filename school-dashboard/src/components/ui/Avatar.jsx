import { forwardRef, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  xs: "h-6 w-6 text-2xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const STATUS_STYLES = {
  online: "bg-ok",
  offline: "bg-fg-subtle",
  away: "bg-warn",
  busy: "bg-danger-token",
};

const STATUS_SIZE = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

const SHAPE_STYLES = {
  circle: "rounded-full",
  square: "rounded-lg",
};

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Decorative, non-semantic: each user's initials avatar gets a stable colour
 * from this set purely for visual variety. These are NOT status colours, so
 * they intentionally stay as raw palette gradients — the design tokens reserve
 * --ok/--warn/--danger/--info for status and have no decorative-gradient
 * equivalent (see tokens.css: "Status — used ONLY for status, never decoration"). */
const GRADIENT_CLASSES = [
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-cyan-500 to-sky-600",
];

function hashIndex(str = "", modulo = 1) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

const Avatar = forwardRef(function Avatar(
  {
    src,
    alt = "",
    name,
    size = "md",
    shape = "circle",
    status,
    className,
    fallbackClassName,
    ...props
  },
  ref
) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  const initials = useMemo(() => getInitials(name || alt), [name, alt]);
  const gradient = useMemo(
    () => GRADIENT_CLASSES[hashIndex(name || alt, GRADIENT_CLASSES.length)],
    [name, alt]
  );

  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center overflow-visible select-none shrink-0",
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || "avatar"}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", SHAPE_STYLES[shape])}
        />
      ) : (
        <span
          aria-label={alt || name || "avatar"}
          role="img"
          className={cn(
            "flex items-center justify-center h-full w-full font-semibold text-white",
            SHAPE_STYLES[shape],
            initials ? gradient : "bg-surface-2 text-fg-muted",
            fallbackClassName
          )}
        >
          {initials || (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-1/2 w-1/2">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
            </svg>
          )}
        </span>
      )}
      {status && (
        <span
          aria-label={status}
          role="img"
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-bg",
            STATUS_SIZE[size],
            STATUS_STYLES[status]
          )}
        />
      )}
    </span>
  );
});

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  shape: PropTypes.oneOf(["circle", "square"]),
  status: PropTypes.oneOf(["online", "offline", "away", "busy"]),
  className: PropTypes.string,
  fallbackClassName: PropTypes.string,
};

const OFFSET_BY_SIZE = {
  xs: "-ml-1.5",
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-3",
  xl: "-ml-4",
};

Avatar.Group = function AvatarGroup({ children, max, size = "md", className }) {
  const items = Array.isArray(children) ? children : [children].filter(Boolean);
  const visible = max ? items.slice(0, max) : items;
  const overflow = max ? items.length - visible.length : 0;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((child, idx) => (
        <div
          key={child.key ?? idx}
          className={cn("ring-2 ring-bg rounded-full", idx > 0 && OFFSET_BY_SIZE[size])}
        >
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full ring-2 ring-bg bg-surface-2 text-fg font-medium",
            SIZE_STYLES[size],
            OFFSET_BY_SIZE[size]
          )}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

Avatar.Group.propTypes = {
  children: PropTypes.node,
  max: PropTypes.number,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  className: PropTypes.string,
};

export default Avatar;
