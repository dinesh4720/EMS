import { forwardRef } from "react";

const ACTION_TONE = {
  created: "ok",
  updated: "primary",
  deleted: "danger",
  login: "ok",
  logout: "default",
  login_failed: "danger",
  password_changed: "warn",
  permission_changed: "warn",
  settings_changed: "primary",
  role_changed: "warn",
};

const ACTION_LABEL = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  login: "Login",
  logout: "Logout",
  login_failed: "Login Failed",
  password_changed: "Password Changed",
  permission_changed: "Permission Changed",
  settings_changed: "Settings Changed",
  role_changed: "Role Changed",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

const AuditLogListRow = forwardRef(function AuditLogListRow(
  { log, isActive, onSelect },
  ref
) {
  const action = log.action || "unknown";
  const tone = ACTION_TONE[action] || "default";
  const label = ACTION_LABEL[action] || action.replace(/_/g, " ");
  const userName = log.userId?.name || log.userName || "—";
  const entity = log.entity || "—";

  const handleRowClick = () => onSelect?.(log);

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={handleRowClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 border-b transition-colors"
      style={{
        borderColor: "var(--divider)",
        background: isActive ? "var(--accent-bg)" : "transparent",
        outline: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--surface-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
      data-log-id={log._id}
    >
      {/* Action badge */}
      <span
        className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
        style={{
          background:
            tone === "ok"
              ? "var(--ok-bg)"
              : tone === "danger"
              ? "var(--danger-bg)"
              : tone === "warn"
              ? "var(--warn-bg)"
              : tone === "primary"
              ? "var(--accent-bg)"
              : "var(--surface-2)",
          color:
            tone === "ok"
              ? "var(--ok)"
              : tone === "danger"
              ? "var(--danger)"
              : tone === "warn"
              ? "var(--warn)"
              : tone === "primary"
              ? "var(--accent)"
              : "var(--fg-muted)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background:
              tone === "ok"
                ? "var(--ok)"
                : tone === "danger"
                ? "var(--danger)"
                : tone === "warn"
                ? "var(--warn)"
                : tone === "primary"
                ? "var(--accent)"
                : "var(--fg-muted)",
          }}
        />
        {label}
      </span>

      {/* Entity + info */}
      <div className="flex-1 min-w-0" style={{ lineHeight: 1.3 }}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-medium truncate"
            style={{
              fontSize: 13,
              letterSpacing: "-0.01em",
              color: "var(--fg)",
            }}
          >
            {entity}
          </span>
          {log.entityId && (
            <span
              className="mono tnum truncate"
              style={{ fontSize: 11, color: "var(--fg-subtle)", flexShrink: 0 }}
            >
              {log.entityId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            {userName}
          </span>
          {log.ipAddress && (
            <span
              className="mono hidden sm:inline"
              style={{ fontSize: 11, color: "var(--fg-faint)" }}
            >
              · {log.ipAddress}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-right">
        <span
          className="block"
          style={{ fontSize: 12, color: "var(--fg-muted)" }}
        >
          {formatRelative(log.createdAt)}
        </span>
        <span
          className="block"
          style={{ fontSize: 11, color: "var(--fg-faint)" }}
        >
          {formatDate(log.createdAt)}
        </span>
      </div>
    </button>
  );
});

export default AuditLogListRow;
