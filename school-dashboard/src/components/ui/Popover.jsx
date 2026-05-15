import { memo } from "react";
import PropTypes from "prop-types";
import {
  Popover as HeroPopover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";

/**
 * Popover — frosted-glass floating surface (REVAMP-05).
 *
 * Glass surface comes from .ds-popover in feedback-primitives.css.
 * Use for rich floating content that can include interactive controls
 * (mini-forms, filter pickers, date ranges). Prefer `Tooltip` for short
 * hints, `DropdownMenu` for menu items.
 */
const Popover = memo(function Popover({
  isOpen,
  onOpenChange,
  trigger,
  placement = "bottom",
  offset = 8,
  showArrow = false,
  backdrop = "transparent",
  children,
  contentClassName = "",
  classNames: classNamesProp,
  ...props
}) {
  const mergedClassNames = {
    // base wraps the floating element; content is the inner panel.
    base: "ds-popover",
    content: "p-0 bg-transparent border-none shadow-none",
    ...classNamesProp,
  };

  return (
    <HeroPopover
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement={placement}
      offset={offset}
      showArrow={showArrow}
      backdrop={backdrop}
      classNames={mergedClassNames}
      {...props}
    >
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent className={contentClassName}>{children}</PopoverContent>
    </HeroPopover>
  );
});

Popover.displayName = "Popover";

Popover.propTypes = {
  isOpen: PropTypes.bool,
  onOpenChange: PropTypes.func,
  trigger: PropTypes.node.isRequired,
  placement: PropTypes.string,
  offset: PropTypes.number,
  showArrow: PropTypes.bool,
  backdrop: PropTypes.oneOf(["transparent", "opaque", "blur"]),
  children: PropTypes.node,
  contentClassName: PropTypes.string,
  classNames: PropTypes.object,
};

export default Popover;
