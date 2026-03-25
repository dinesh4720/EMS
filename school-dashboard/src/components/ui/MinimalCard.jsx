/**
 * MinimalCard - Clean card component without shadows
 */
import { memo } from "react";
import { cn } from "../../utils/cn";

const MinimalCard = memo(function MinimalCard({
  children,
  className,
  padding = "md",
  border = true,
  ...props
}) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-lg",
        border && "border border-gray-100 dark:border-zinc-800",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

MinimalCard.displayName = 'MinimalCard';

// Card Header subcomponent
MinimalCard.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn("pb-4 border-b border-gray-100 dark:border-zinc-800 mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Content subcomponent
MinimalCard.Content = function CardContent({ children, className, ...props }) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
};

// Card Footer subcomponent
MinimalCard.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn("pt-4 border-t border-gray-100 dark:border-zinc-800 mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default MinimalCard;
