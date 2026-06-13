import { Chip } from "@heroui/react";
import {
  Eye,
  FileEdit,
  Trash2,
  LogIn,
  LogOut,
  KeyRound,
  ShieldAlert,
  Settings,
  UserCog,
} from "lucide-react";

const ACTION_META = {
  created: { label: "Created", color: "success", icon: FileEdit },
  updated: { label: "Updated", color: "primary", icon: FileEdit },
  deleted: { label: "Deleted", color: "danger", icon: Trash2 },
  login: { label: "Login", color: "success", icon: LogIn },
  logout: { label: "Logout", color: "default", icon: LogOut },
  login_failed: { label: "Login Failed", color: "danger", icon: ShieldAlert },
  password_changed: { label: "Password Changed", color: "warning", icon: KeyRound },
  permission_changed: { label: "Permission Changed", color: "warning", icon: ShieldAlert },
  settings_changed: { label: "Settings Changed", color: "primary", icon: Settings },
  role_changed: { label: "Role Changed", color: "warning", icon: UserCog },
};

function getActionMeta(action) {
  return ACTION_META[action] || { label: action, color: "default", icon: Eye };
}

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditLogDetail({
  log,
  onClose,
  isMobile = false,
}) {
  if (!log) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center h-full px-6"
        style={{ color: "var(--fg-muted)" }}
      >
        <Eye size={32} style={{ color: "var(--fg-faint)", marginBottom: 12 }} />
        <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
          Select a log
        </p>
        <p className="text-xs mt-1">Click any audit log to view its details.</p>
      </div>
    );
  }

  const meta = getActionMeta(log.action);
  const ActionIcon = meta.icon;
  const changes = log.changes || [];
  const hasChanges = changes.length > 0;
  const hasOldValue = log.oldValue != null;
  const hasNewValue = log.newValue != null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{
              background:
                meta.color === "danger"
                  ? "var(--danger-bg)"
                  : meta.color === "success"
                  ? "var(--ok-bg)"
                  : meta.color === "warning"
                  ? "var(--warn-bg)"
                  : meta.color === "primary"
                  ? "var(--accent-bg)"
                  : "var(--surface-2)",
              color:
                meta.color === "danger"
                  ? "var(--danger)"
                  : meta.color === "success"
                  ? "var(--ok)"
                  : meta.color === "warning"
                  ? "var(--warn)"
                  : meta.color === "primary"
                  ? "var(--accent)"
                  : "var(--fg-muted)",
            }}
          >
            <ActionIcon size={18} />
          </div>
          <div className="min-w-0">
            <Chip size="sm" variant="flat" color={meta.color} className="capitalize">
              {meta.label}
            </Chip>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>
              {formatDate(log.createdAt)}
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-hover shrink-0 ml-2"
            aria-label="Close"
          >
            <Trash2 size={14} style={{ color: "var(--fg-muted)" }} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetadataItem label="Entity" value={log.entity || "—"} capitalize />
          <MetadataItem label="Entity ID" value={log.entityId || "—"} />
          <MetadataItem
            label="Performed By"
            value={log.userId?.name || log.userName || "—"}
          />
          <MetadataItem
            label="Role"
            value={log.userId?.role || "—"}
            capitalize
          />
          <MetadataItem label="IP Address" value={log.ipAddress || "—"} />
          <MetadataItem label="Method" value={log.method || "—"} uppercase />
          <MetadataItem label="Path" value={log.path || "—"} fullWidth />
          {log.userAgent && (
            <MetadataItem label="User Agent" value={log.userAgent} fullWidth />
          )}
        </div>

        {/* Changes */}
        {hasChanges && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Field Changes
            </h4>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-token)" }}>
              <table className="w-full text-sm">
                <thead style={{ background: "var(--surface-2)" }}>
                  <tr>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase" style={{ color: "var(--fg-muted)" }}>
                      Field
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase" style={{ color: "var(--fg-muted)" }}>
                      Old
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase" style={{ color: "var(--fg-muted)" }}>
                      New
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-token)" }}>
                  {changes.map((change, i) => (
                    <tr key={change.field ? `change-${change.field}` : `change-${i}`}>
                      <td className="px-3 py-2 font-medium" style={{ color: "var(--fg)", fontSize: 12 }}>
                        {change.field}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--fg-muted)", fontSize: 12 }}>
                        <pre className="whitespace-pre-wrap break-all font-mono p-1.5 rounded" style={{ background: "var(--surface-2)", fontSize: 11 }}>
                          {formatValue(change.oldValue)}
                        </pre>
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--fg-muted)", fontSize: 12 }}>
                        <pre className="whitespace-pre-wrap break-all font-mono p-1.5 rounded" style={{ background: "var(--surface-2)", fontSize: 11 }}>
                          {formatValue(change.newValue)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Snapshot */}
        {(hasOldValue || hasNewValue) && !hasChanges && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Snapshot
            </h4>
            {hasOldValue && (
              <SnapshotBlock label="Old Value" value={log.oldValue} />
            )}
            {hasNewValue && (
              <SnapshotBlock label="New Value" value={log.newValue} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetadataItem({ label, value, capitalize, uppercase, fullWidth }) {
  return (
    <div className={`space-y-0.5 ${fullWidth ? "col-span-2" : ""}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
        {label}
      </p>
      <p
        className={`text-sm font-medium break-all ${uppercase ? "uppercase" : ""} ${capitalize ? "capitalize" : ""}`}
        style={{ color: "var(--fg)" }}
      >
        {value}
      </p>
    </div>
  );
}

function SnapshotBlock({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
        {label}
      </p>
      <pre
        className="whitespace-pre-wrap break-all text-xs font-mono p-3 rounded-lg border"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border-token)",
          color: "var(--fg-muted)",
        }}
      >
        {formatValue(value)}
      </pre>
    </div>
  );
}
