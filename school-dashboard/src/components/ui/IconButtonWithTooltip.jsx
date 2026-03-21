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
export default function IconButtonWithTooltip({ 
  tooltip, 
  tooltipPlacement = "top",
  children, 
  className,
  ...props 
}) {
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
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
