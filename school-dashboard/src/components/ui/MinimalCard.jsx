/**
 * MinimalCard - Clean card component without shadows
 */
import { cn } from "../../utils/cn";

export default function MinimalCard({
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
        "bg-white rounded-lg",
        border && "border border-gray-100",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header subcomponent
MinimalCard.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn("pb-4 border-b border-gray-100 mb-4", className)}
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
      className={cn("pt-4 border-t border-gray-100 mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};
