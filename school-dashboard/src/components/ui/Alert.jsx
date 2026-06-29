import { forwardRef } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "../../utils/cn";

const VARIANT_STYLES = {
  info: {
    container: "bg-info-bg text-info-token border-info-border",
    icon: "text-info-token",
    Icon: Info,
    role: "status",
  },
  success: {
    container: "bg-ok-bg text-ok border-ok-border",
    icon: "text-ok",
    Icon: CheckCircle2,
    role: "status",
  },
  warning: {
    container: "bg-warn-bg text-warn border-warn-border",
    icon: "text-warn",
    Icon: AlertTriangle,
    role: "status",
  },
  danger: {
    container: "bg-danger-bg text-danger-token border-danger-border",
    icon: "text-danger-token",
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
