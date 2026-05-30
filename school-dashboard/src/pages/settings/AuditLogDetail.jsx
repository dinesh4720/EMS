import { Chip } from "@heroui/react";
import { Eye, FileEdit, Trash2, LogIn, LogOut, KeyRound, ShieldAlert, Settings, UserCog } from "lucide-react";
import Drawer from "../../components/ui/Drawer";
import { getDateLocale } from "../../i18n";

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
  return date.toLocaleString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditLogDetail({ log, isOpen, onClose }) {
  if (!log) return null;

  const meta = getActionMeta(log.action);
  const ActionIcon = meta.icon;

  const changes = log.changes || [];
  const hasChanges = changes.length > 0;
  const hasOldValue = log.oldValue != null;
  const hasNewValue = log.newValue != null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log Detail"
      description={`Log ID: ${log._id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Action header */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              meta.color === "danger"
                ? "bg-[var(--danger-bg)] text-[var(--danger)]"
                : meta.color === "success"
                ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                : meta.color === "warning"
                ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                : meta.color === "primary"
                ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                : "bg-surface-2 text-fg-muted"
            }`}
          >
            <ActionIcon size={20} />
          </div>
          <div>
            <Chip size="sm" variant="flat" color={meta.color}>
              {meta.label}
            </Chip>
            <p className="text-xs text-fg-muted mt-0.5">
              {formatDate(log.createdAt)}
            </p>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-fg-muted uppercase tracking-wider">Entity</p>
            <p className="text-sm font-medium text-fg capitalize">{log.entity || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-fg-muted uppercase tracking-wider">Entity ID</p>
            <p className="text-sm font-medium text-fg">{log.entityId || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-fg-muted uppercase tracking-wider">Performed By</p>
            <p className="text-sm font-medium text-fg">
              {log.userId?.name || log.userName || "—"}
            </p>
            {log.userId?.email && (
              <p className="text-xs text-fg-muted">{log.userId.email}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-fg-muted uppercase tracking-wider">Role</p>
            <p className="text-sm font-medium text-fg capitalize">
              {log.userId?.role || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-fg-muted uppercase tracking-wider">IP Address</p>
            <p className="text-sm font-medium text-fg">{log.ipAddress || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-fg-muted uppercase tracking-wider">Method</p>
            <p className="text-sm font-medium text-fg uppercase">{log.method || "—"}</p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-xs text-fg-muted uppercase tracking-wider">Path</p>
            <p className="text-sm font-medium text-fg font-mono">{log.path || "—"}</p>
          </div>
          {log.userAgent && (
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-fg-muted uppercase tracking-wider">User Agent</p>
              <p className="text-xs text-fg-muted break-all">{log.userAgent}</p>
            </div>
          )}
        </div>

        {/* Changes */}
        {hasChanges && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-fg">Field Changes</h4>
            <div className="border border-border-token rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-2">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted uppercase">Field</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted uppercase">Old Value</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted uppercase">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-token">
                  {changes.map((change, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-fg">{change.field}</td>
                      <td className="px-3 py-2 text-fg-muted">
                        <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-surface-2 p-1.5 rounded">
                          {formatValue(change.oldValue)}
                        </pre>
                      </td>
                      <td className="px-3 py-2 text-fg-muted">
                        <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-surface-2 p-1.5 rounded">
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

        {/* Old / New snapshot */}
        {(hasOldValue || hasNewValue) && !hasChanges && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-fg">Snapshot</h4>
            {hasOldValue && (
              <div className="space-y-1">
                <p className="text-xs text-fg-muted">Old Value</p>
                <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-surface-2 p-3 rounded-lg border border-border-token text-fg-muted">
                  {formatValue(log.oldValue)}
                </pre>
              </div>
            )}
            {hasNewValue && (
              <div className="space-y-1">
                <p className="text-xs text-fg-muted">New Value</p>
                <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-surface-2 p-3 rounded-lg border border-border-token text-fg-muted">
                  {formatValue(log.newValue)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
