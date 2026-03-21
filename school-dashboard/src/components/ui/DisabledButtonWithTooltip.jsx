import { Tooltip, Button } from "@heroui/react";

/**
 * DisabledButtonWithTooltip - A button that shows why it's disabled when hovered
 * Use this for any disabled button to provide context about why it's disabled
 * 
 * @param {string} disabledReason - The reason why the button is disabled (required)
 * @param {string} tooltipPlacement - Placement of tooltip (default: 'top')
 * @param {ReactNode} children - The content to render inside the button
 * @param {object} props - All other props passed to Button component
 */
export default function DisabledButtonWithTooltip({ 
  disabledReason,
  tooltipPlacement = "top",
  children, 
  className,
  ...props 
}) {
  // If there's no disabledReason, just render the button normally without tooltip wrapper
  if (!disabledReason) {
    return (
      <Button
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Tooltip 
      content={disabledReason} 
      placement={tooltipPlacement}
      delay={300}
      closeDelay={0}
      classNames={{
        content: "bg-amber-600 text-white dark:bg-amber-500 text-xs px-2 py-1 rounded-md font-medium"
      }}
    >
      <div className="inline-flex">
        <Button
          isDisabled
          className={className}
          {...props}
        >
          {children}
        </Button>
      </div>
    </Tooltip>
  );
}

/**
 * IconDisabledTooltip - A simpler version for icon buttons that are disabled
 * 
 * @param {string} tooltip - The tooltip text to show on hover (should explain why disabled)
 * @param {string} tooltipPlacement - Placement of tooltip (default: 'top')
 * @param {ReactNode} children - The icon to render inside the button
 * @param {object} props - All other props passed to Button component
 */
export function IconDisabledTooltip({ 
  tooltip,
  tooltipPlacement = "top",
  children, 
  className,
  ...props 
}) {
  if (!tooltip) {
    return (
      <Button
        isIconOnly
        variant="light"
        size="sm"
        isDisabled
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Tooltip 
      content={tooltip} 
      placement={tooltipPlacement}
      delay={300}
      closeDelay={0}
      classNames={{
        content: "bg-amber-600 text-white dark:bg-amber-500 text-xs px-2 py-1 rounded-md font-medium"
      }}
    >
      <Button
        isIconOnly
        variant="light"
        size="sm"
        isDisabled
        className={className}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
