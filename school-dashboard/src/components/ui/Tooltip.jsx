import { memo } from "react";
import PropTypes from "prop-types";
import { Tooltip as HeroTooltip } from "@heroui/react";

/**
 * Tooltip — frosted-glass variant (REVAMP-05).
 *
 * Glass surface comes from .ds-tooltip in feedback-primitives.css.
 * Use for short contextual hints (< ~8 words). For rich content, prefer
 * `Popover`. Always render around an interactive trigger so it remains
 * keyboard-focusable.
 */
const VARIANT_CLASS = {
  default: "ds-tooltip",
  warning: "ds-tooltip ds-tooltip--warning",
  danger: "ds-tooltip ds-tooltip--danger",
  primary: "ds-tooltip ds-tooltip--primary",
};

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

  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.default;
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
