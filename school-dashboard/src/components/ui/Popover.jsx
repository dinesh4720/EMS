import { memo } from "react";
import PropTypes from "prop-types";
import {
  Popover as HeroPopover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";

/**
 * Popover — design-system wrapper around HeroUI Popover.
 *
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
  contentClassName,
  classNames: classNamesProp,
  ...props
}) {
  const mergedClassNames = {
    base: "bg-white dark:bg-zinc-900 shadow-lg rounded-lg",
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
      <PopoverContent
        className={`p-3 border border-default-200 ${contentClassName || ""}`.trim()}
      >
        {children}
      </PopoverContent>
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
