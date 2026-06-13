import { memo, useEffect } from "react";
import PropTypes from "prop-types";
import { Tooltip, Button } from "@heroui/react";

/**
 * IconButtonWithTooltip - A button with an icon that shows a tooltip on hover
 * Use this for all icon-only buttons to improve accessibility and UX
 *
 * @param {string} tooltip - The tooltip text to show on hover
 * @param {string} tooltipPlacement - Placement of tooltip (default: 'top')
 * @param {ReactNode} children - The icon or content to render inside the button
 * @param {object} props - All other props passed to Button component
 */
const IconButtonWithTooltip = memo(function IconButtonWithTooltip({
  tooltip,
  tooltipPlacement = "top",
  children,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}) {
  const inferredLabel = typeof tooltip === "string" ? tooltip : undefined;

  useEffect(() => {
    if (
      import.meta.env?.DEV &&
      typeof tooltip !== "string" &&
      !ariaLabel &&
      !ariaLabelledBy
    ) {
      // eslint-disable-next-line no-console
      console.error(
        "[IconButtonWithTooltip] Icon-only buttons must have an accessible name via a string tooltip, aria-label, or aria-labelledby."
      );
    }
  }, [tooltip, ariaLabel, ariaLabelledBy]);

  return (
    <Tooltip
      content={tooltip}
      placement={tooltipPlacement}
      delay={500}
      closeDelay={0}
      classNames={{
        content: "bg-gray-800 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs px-2 py-1 rounded-md font-medium"
      }}
    >
      <Button
        isIconOnly
        variant="light"
        size="sm"
        className={className}
        aria-label={ariaLabel || inferredLabel}
        aria-labelledby={ariaLabelledBy}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  );
});

IconButtonWithTooltip.displayName = 'IconButtonWithTooltip';

IconButtonWithTooltip.propTypes = {
  tooltip: PropTypes.node.isRequired,
  tooltipPlacement: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  "aria-label": PropTypes.string,
  "aria-labelledby": PropTypes.string,
};

export default IconButtonWithTooltip;
