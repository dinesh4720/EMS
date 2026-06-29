import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const COLOR_STYLES = {
  neutral: "bg-surface-2 text-fg-muted border-border-token",
  primary: "bg-surface-2 text-fg border-border-strong",
  success: "bg-ok-bg text-ok border-ok-border",
  warning: "bg-warn-bg text-warn border-warn-border",
  danger: "bg-danger-bg text-danger-token border-danger-border",
  info: "bg-info-bg text-info-token border-info-border",
};

const SIZE_STYLES = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-2.5 py-1",
};

const Tag = forwardRef(function Tag(
  {
    children,
    color = "neutral",
    size = "md",
    icon,
    className,
    ...props
  },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 font-medium border rounded-md whitespace-nowrap",
        SIZE_STYLES[size],
        COLOR_STYLES[color],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
});

Tag.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Tag;
