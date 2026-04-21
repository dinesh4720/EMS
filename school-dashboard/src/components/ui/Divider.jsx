import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const SPACING_H = {
  none: "",
  sm: "my-2",
  md: "my-4",
  lg: "my-6",
};

const SPACING_V = {
  none: "",
  sm: "mx-2",
  md: "mx-4",
  lg: "mx-6",
};

export default function Divider({
  orientation = "horizontal",
  spacing = "md",
  label,
  className,
  ...props
}) {
  const isVertical = orientation === "vertical";

  if (label && !isVertical) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn("flex items-center gap-3", SPACING_H[spacing], className)}
        {...props}
      >
        <span className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
          {label}
        </span>
        <span className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" aria-hidden="true" />
      </div>
    );
  }

  if (isVertical) {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "inline-block w-px self-stretch bg-gray-100 dark:bg-zinc-800",
          SPACING_V[spacing],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <hr
      className={cn(
        "border-0 h-px bg-gray-100 dark:bg-zinc-800",
        SPACING_H[spacing],
        className
      )}
      {...props}
    />
  );
}

Divider.propTypes = {
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  spacing: PropTypes.oneOf(["none", "sm", "md", "lg"]),
  label: PropTypes.node,
  className: PropTypes.string,
};
