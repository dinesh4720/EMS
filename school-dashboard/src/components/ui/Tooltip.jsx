import { memo } from "react";
import PropTypes from "prop-types";
import { Tooltip as HeroTooltip } from "@heroui/react";

const VARIANT_CLASSES = {
  default:
    "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs px-2.5 py-1.5 rounded-md font-medium shadow-sm",
  warning:
    "bg-warning-600 text-white dark:bg-warning-500 text-xs px-2.5 py-1.5 rounded-md font-medium shadow-sm",
  danger:
    "bg-danger text-white text-xs px-2.5 py-1.5 rounded-md font-medium shadow-sm",
  primary:
    "bg-primary text-white text-xs px-2.5 py-1.5 rounded-md font-medium shadow-sm",
};

/**
 * Tooltip — design-system wrapper around HeroUI Tooltip.
 *
 * Use for short contextual hints (< ~8 words). For rich content, prefer
 * `Popover`. Always render around an interactive trigger so it remains
 * keyboard-focusable.
 */
const Tooltip = memo(function Tooltip({
  content,
  placement = "top",
  variant = "default",
  delay = 300,
  closeDelay = 0,
  isDisabled,
  children,
  classNames: classNamesProp,
  ...props
}) {
  if (!content) return children;

  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;
  const mergedClassNames = {
    content: variantClass,
    ...classNamesProp,
  };

  return (
    <HeroTooltip
      content={content}
      placement={placement}
      delay={delay}
      closeDelay={closeDelay}
      isDisabled={isDisabled}
      classNames={mergedClassNames}
      {...props}
    >
      {children}
    </HeroTooltip>
  );
});

Tooltip.displayName = "Tooltip";

Tooltip.propTypes = {
  content: PropTypes.node,
  placement: PropTypes.string,
  variant: PropTypes.oneOf(["default", "warning", "danger", "primary"]),
  delay: PropTypes.number,
  closeDelay: PropTypes.number,
  isDisabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  classNames: PropTypes.object,
};

export default Tooltip;
