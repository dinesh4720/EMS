import { memo } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const RADIUS = {
  md: "rounded-lg",
  lg: "rounded-xl",
};

const ELEVATION = {
  flat: "",
  raised: "shadow-sm",
  elevated: "shadow-md",
};

const Card = memo(function Card({
  children,
  className,
  padding = "md",
  radius = "md",
  elevation = "flat",
  border = true,
  interactive = false,
  as: Component = "div",
  ...props
}) {
  return (
    <Component
      className={cn(
        "bg-surface",
        RADIUS[radius],
        PADDING[padding],
        ELEVATION[elevation],
        border && "border border-divider",
        interactive &&
          "transition-colors hover:bg-surface-2/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = "Card";

Card.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn("pb-4 border-b border-divider mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Content = function CardContent({ children, className, ...props }) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn("pt-4 border-t border-divider mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  padding: PropTypes.oneOf(["none", "sm", "md", "lg"]),
  radius: PropTypes.oneOf(["md", "lg"]),
  elevation: PropTypes.oneOf(["flat", "raised", "elevated"]),
  border: PropTypes.bool,
  interactive: PropTypes.bool,
  as: PropTypes.elementType,
};

export default Card;
