import { useState, useCallback, useEffect } from "react";
import { Button, Switch, Chip, Divider } from "@heroui/react";
import {
  Shield, Copy, RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle, Info
} from "lucide-react";
import { ssoApi } from "../../services/settingsService";
import toast from "react-hot-toast";

import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

export default function SCIMSettings() {
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [scimEnabled, setScimEnabled] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [revealedToken, setRevealedToken] = useState(null);
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [, setInitialized] = useState(false);

  // Load config on first render
  useEffect(() => {
    const controller = new AbortController();
    ssoApi.getConfig({ signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      const scim = data?.ssoConfig?.scim || {};
      setScimEnabled(scim.enabled || false);
      setHasToken(scim.hasToken || false);
      setInitialized(true);
    }).catch((err) => {
      if (err.name === 'AbortError') return;
      setInitialized(true);
    });
    return () => controller.abort();
  }, []);

  const handleRevealToken = useCallback(async () => {
    if (revealedToken) {
      setIsTokenVisible((v) => !v);
      return;
    }
    setLoading(true);
    try {
      const data = await ssoApi.getScimToken();
      if (data?.token) {
        setRevealedToken(data.token);
        setIsTokenVisible(true);
      } else {
        toast.error("No token found. Generate one first.");
      }
    } catch {
      toast.error("Failed to retrieve token.");
    } finally {
      setLoading(false);
    }
  }, [revealedToken]);

  const handleCopy = useCallback(() => {
    if (!revealedToken) return;
    navigator.clipboard.writeText(revealedToken).then(() => {
      toast.success("Token copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy token");
    });
  }, [revealedToken]);

  const handleRegenerate = useCallback(() => {
    showConfirm({
      title: 'Regenerate SCIM Token',
      message: 'Regenerating the token will immediately invalidate the existing token. Any IdP currently using it will stop working until you update it there. Continue?',
      variant: 'warning',
      confirmText: 'Regenerate',
      onConfirm: async () => {
        setRegenerating(true);
        try {
          const data = await ssoApi.regenerateScimToken();
          if (data?.token) {
            setRevealedToken(data.token);
            setIsTokenVisible(true);
            setHasToken(true);
            toast.success("New SCIM token generated. Copy it now — it won't be shown again.");
          }
        } catch {
          toast.error("Failed to regenerate token.");
        } finally {
          setRegenerating(false);
        }
      },
    });
  }, [showConfirm]);

  const handleToggleEnabled = useCallback(async (enabled) => {
    setScimEnabled(enabled);
    try {
      await ssoApi.updateConfig({ scim: { enabled } });
      toast.success(`SCIM provisioning ${enabled ? "enabled" : "disabled"}`);
    } catch {
      setScimEnabled(!enabled);
      toast.error("Failed to update SCIM setting.");
    }
  }, []);

  const maskedToken = revealedToken
    ? (isTokenVisible ? revealedToken : `${"•".repeat(32)}${revealedToken.slice(-8)}`)
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[var(--info-bg)] flex items-center justify-center">
            <Shield size={18} className="text-[var(--info)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-fg">SCIM Provisioning</h2>
            <p className="text-sm text-fg-muted">
              Automate staff account management via your identity provider (Okta, Azure AD, etc.)
            </p>
          </div>
        </div>
      </div>

      <Divider />

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border-token bg-surface-2">
        <div>
          <p className="text-sm font-medium text-fg">Enable SCIM</p>
          <p className="text-xs text-fg-muted mt-0.5">
            Allow your IdP to create, update, and deactivate staff accounts automatically
          </p>
        </div>
        <Switch
          isSelected={scimEnabled}
          onValueChange={handleToggleEnabled}
          color="success"
          size="sm"
        />
      </div>

      {/* SCIM Endpoint Info */}
      <div className="p-4 rounded-xl border border-[var(--info-border)] bg-[var(--info-bg)]">
        <div className="flex items-start gap-2">
          <Info size={15} className="text-[var(--info)] mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--info)]">
              SCIM v2 Base URL — configure this in your IdP
            </p>
            <code className="text-xs bg-[var(--info-bg)] text-[var(--info)] px-2 py-1 rounded font-mono block">
              {window.location.origin}/api/auth/sso/scim/v2
            </code>
            <p className="text-xs text-[var(--info)]">
              Append <code className="font-mono">?schoolCode=YOUR_CODE</code> or send the{" "}
              <code className="font-mono">x-school-code</code> header with your requests.
            </p>
          </div>
        </div>
      </div>

      {/* Bearer Token Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-fg">Bearer Token</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Use this as the Authorization header in your IdP's SCIM configuration
            </p>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={hasToken ? "success" : "default"}
            startContent={hasToken ? <CheckCircle size={12} /> : null}
          >
            {hasToken ? "Token configured" : "No token"}
          </Chip>
        </div>

        {/* Token display row */}
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border-token bg-surface font-mono text-xs text-fg min-h-[44px]">
          <div className="flex-1 truncate">
            {revealedToken
              ? maskedToken
              : hasToken
              ? "Token is set — click Reveal to view"
              : "No token generated yet"}
          </div>

          {revealedToken && (
            <button
              type="button"
              onClick={() => setIsTokenVisible((v) => !v)}
              className="p-1 hover:bg-surface-2 rounded transition-colors flex-shrink-0"
              title={isTokenVisible ? "Hide token" : "Show token"}
            >
              {isTokenVisible ? (
                <EyeOff size={14} className="text-fg-muted" />
              ) : (
                <Eye size={14} className="text-fg-muted" />
              )}
            </button>
          )}

          {revealedToken && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:bg-surface-2 rounded transition-colors flex-shrink-0"
              title="Copy token"
            >
              <Copy size={14} className="text-fg-muted" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Eye size={14} />}
            onPress={handleRevealToken}
            isLoading={loading}
            isDisabled={!hasToken || regenerating}
          >
            {revealedToken ? (isTokenVisible ? "Hide" : "Reveal") : "Reveal Token"}
          </Button>

          <Button
            size="sm"
            variant="flat"
            color="warning"
            startContent={<RefreshCw size={14} />}
            onPress={handleRegenerate}
            isLoading={regenerating}
            isDisabled={loading}
          >
            {hasToken ? "Regenerate Token" : "Generate Token"}
          </Button>
        </div>

        {/* Warning when token was just generated/regenerated */}
        {revealedToken && isTokenVisible && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--warn-bg)] border border-[var(--warn-border)]">
            <AlertTriangle size={14} className="text-[var(--warn)] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--warn)]">
              Copy this token now and paste it into your IdP. For security, the full token is not stored
              in this view — if you lose it, regenerate a new one.
            </p>
          </div>
        )}
      </div>

      <Divider />

      {/* Supported Operations */}
      <div>
        <p className="text-sm font-medium text-fg mb-3">
          Supported SCIM Operations
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Create users", desc: "Provision new staff accounts" },
            { label: "Update users", desc: "Sync name, email, phone changes" },
            { label: "Deactivate users", desc: "Set staff status to inactive" },
            { label: "Reactivate users", desc: "Restore deactivated accounts" },
          ].map((op) => (
            <div
              key={op.label}
              className="flex items-start gap-2 p-3 rounded-lg border border-border-token bg-surface-2"
            >
              <CheckCircle size={14} className="text-[var(--ok)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-fg">{op.label}</p>
                <p className="text-xs text-fg-muted">{op.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
