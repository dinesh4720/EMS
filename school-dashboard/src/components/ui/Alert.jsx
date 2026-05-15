import { forwardRef } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "../../utils/cn";

const VARIANT_STYLES = {
  info: {
    container:
      "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900/60",
    icon: "text-blue-500 dark:text-blue-400",
    Icon: Info,
    role: "status",
  },
  success: {
    container:
      "bg-green-50 text-green-900 border-green-200 dark:bg-green-950/40 dark:text-green-100 dark:border-green-900/60",
    icon: "text-green-600 dark:text-green-400",
    Icon: CheckCircle2,
    role: "status",
  },
  warning: {
    container:
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900/60",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
    role: "status",
  },
  danger: {
    container:
      "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-900/60",
    icon: "text-red-600 dark:text-red-400",
    Icon: XCircle,
    role: "alert",
  },
};

const Alert = forwardRef(function Alert(
  {
    variant = "info",
    title,
    children,
    icon,
    onClose,
    action,
    frosted = false,
    className,
    ...props
  },
  ref
) {
  const config = VARIANT_STYLES[variant] ?? VARIANT_STYLES.info;
  const IconToRender = icon !== undefined ? null : config.Icon;

  return (
    <div
      ref={ref}
      role={config.role}
      className={cn(
        "relative flex gap-3 rounded-lg border px-4 py-3 text-sm",
        /* REVAMP-05: `frosted` layers .ds-alert (glass tokens) over the
         * coloured tailwind utilities so the alert reads like the other
         * overlay primitives without losing variant tinting. */
        frosted ? "ds-alert" : config.container,
        className
      )}
      {...props}
    >
      {(icon || IconToRender) && (
        <span className={cn("shrink-0 mt-0.5", config.icon)} aria-hidden="true">
          {icon ?? <IconToRender size={18} />}
        </span>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? "text-sm opacity-90" : "")}>{children}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 -mr-1 -mt-1 inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

Alert.propTypes = {
  variant: PropTypes.oneOf(["info", "success", "warning", "danger"]),
  title: PropTypes.node,
  children: PropTypes.node,
  icon: PropTypes.node,
  onClose: PropTypes.func,
  action: PropTypes.node,
  frosted: PropTypes.bool,
  className: PropTypes.string,
};

export default Alert;
