import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
} from "@heroui/react";
import { Monitor, Smartphone, Globe, Shield, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { request } from "../../services/api";
import { getDateLocale } from "../../i18n";
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

function getDeviceIcon(device) {
  if (device === "Mobile") return Smartphone;
  return Monitor;
}

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
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

  return date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await request("/auth/sessions");
        if (!cancelled) setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch {
        if (!cancelled) toast.error("Failed to load sessions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSessions();
    return () => { cancelled = true; };
  }, []);

  const handleRevoke = (sessionId) => {
    showConfirm({
      title: 'Revoke Session',
      message: 'Are you sure you want to revoke this session? The user will be logged out.',
      variant: 'danger',
      confirmText: 'Revoke',
      onConfirm: async () => {
        try {
          setRevokingId(sessionId);
          await request(`/auth/sessions/${sessionId}`, { method: "DELETE" });
          setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
          toast.success("Session revoked successfully");
        } catch {
          toast.error("Failed to revoke session");
        } finally {
          setRevokingId(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-fg">
            Active Sessions
          </h2>
          <p className="text-sm text-fg-muted mt-1">
            Manage active login sessions
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={`session-skeleton-${i}`} className="border border-border-token">
              <CardBody className="p-4">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-2 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-2 rounded w-1/3" />
                    <div className="h-3 bg-surface-2 rounded w-1/2" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">
            Active Sessions
          </h2>
          <p className="text-sm text-fg-muted mt-1">
            Manage active login sessions across devices
          </p>
        </div>
        <Chip size="sm" variant="flat" color="primary">
          {sessions.length} active
        </Chip>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const DeviceIcon = getDeviceIcon(session.deviceInfo?.device);
          const isCurrent = session.isCurrent;

          return (
            <Card
              key={session.sessionId}
              className={`border transition-all ${
                isCurrent
                  ? "border-[var(--accent-border)] bg-[var(--accent-bg)]"
                  : "border-border-token"
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  {/* Device Icon */}
                  <div
                    className={`p-2.5 rounded-lg ${
                      isCurrent
                        ? "bg-[var(--accent-bg)]"
                        : "bg-surface-2"
                    }`}
                  >
                    <DeviceIcon
                      size={20}
                      className={
                        isCurrent
                          ? "text-[var(--accent)]"
                          : "text-fg-muted"
                      }
                    />
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-fg">
                        {session.deviceInfo?.browser || "Unknown Browser"} on{" "}
                        {session.deviceInfo?.os || "Unknown OS"}
                      </h4>
                      {isCurrent && (
                        <Chip size="sm" variant="flat" color="success">
                          Current session
                        </Chip>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-fg-muted flex items-center gap-1">
                        <Globe size={14} aria-hidden="true" />
                        {session.ipAddress || "Unknown IP"}
                      </span>
                      <span className="text-sm text-fg-muted flex items-center gap-1">
                        <Clock size={14} aria-hidden="true" />
                        {formatDate(session.lastActivityAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCurrent && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      title="Revoke this session"
                      onPress={() => handleRevoke(session.sessionId)}
                      isLoading={revokingId === session.sessionId}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}

        {sessions.length === 0 && (
          <Card className="border border-border-token">
            <CardBody className="p-8 text-center">
              <Shield
                size={40}
                className="mx-auto text-fg-faint mb-3"
              />
              <p className="text-fg-muted">
                No active sessions found
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
