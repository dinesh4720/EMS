import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Switch, Input, Textarea, Divider, Chip, Select, SelectItem } from "@heroui/react";
import { Shield, AlertTriangle, CheckCircle, Globe, Lock } from "lucide-react";
import { ssoApi } from "../../services/settingsService";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import useConfirmDialog from "../../hooks/useConfirmDialog";

const ROLES = [
  'Admin', 'Teacher', 'Accountant', 'Librarian', 'Principal',
  'Vice Principal', 'Lab Assistant', 'Receptionist', 'Administrative', 'Teaching',
];

const EMPTY_GOOGLE = { enabled: false, clientId: '', clientSecret: '' };
const EMPTY_MICROSOFT = { enabled: false, clientId: '', clientSecret: '', tenantId: '' };
const EMPTY_SAML = {
  enabled: false,
  entryPoint: '',
  issuer: '',
  cert: '',
  emailAttribute: 'email',
  nameAttribute: 'displayName',
  groupAttribute: '',
};

export default function SSOSettings() {
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [google, setGoogle] = useState(EMPTY_GOOGLE);
  const [microsoft, setMicrosoft] = useState(EMPTY_MICROSOFT);
  const [saml, setSaml] = useState(EMPTY_SAML);
  const [allowedDomains, setAllowedDomains] = useState('');
  const [autoProvision, setAutoProvision] = useState(false);
  const [defaultRole, setDefaultRole] = useState('Teacher');
  const [ssoOnly, setSsoOnly] = useState(false);

  // Track whether backend already has secrets (they are never returned in GET)
  const [secretStatus, setSecretStatus] = useState({
    googleHasSecret: false,
    microsoftHasSecret: false,
    samlHasCert: false,
  });

  // Track initial ssoOnly to detect enabling for the first time
  const initialSsoOnly = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    ssoApi.getConfig({ signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      const cfg = data?.ssoConfig || {};
      setGoogle({
        enabled: cfg.google?.enabled || false,
        clientId: cfg.google?.clientId || '',
        clientSecret: '',
      });
      setMicrosoft({
        enabled: cfg.microsoft?.enabled || false,
        clientId: cfg.microsoft?.clientId || '',
        clientSecret: '',
        tenantId: cfg.microsoft?.tenantId || '',
      });
      setSaml({
        enabled: cfg.saml?.enabled || false,
        entryPoint: cfg.saml?.entryPoint || '',
        issuer: cfg.saml?.issuer || '',
        cert: '',
        emailAttribute: cfg.saml?.emailAttribute || 'email',
        nameAttribute: cfg.saml?.nameAttribute || 'displayName',
        groupAttribute: cfg.saml?.groupAttribute || '',
      });
      setAllowedDomains((cfg.allowedDomains || []).join('\n'));
      setAutoProvision(cfg.autoProvision || false);
      setDefaultRole(cfg.defaultRole || 'Teacher');
      setSsoOnly(cfg.ssoOnly || false);
      initialSsoOnly.current = cfg.ssoOnly || false;
      setSecretStatus({
        googleHasSecret: cfg.google?.hasClientSecret || false,
        microsoftHasSecret: cfg.microsoft?.hasClientSecret || false,
        samlHasCert: cfg.saml?.hasCert || false,
      });
    }).catch((err) => {
      if (err.name === 'AbortError') return;
      toast.error("Failed to load SSO configuration");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const doSave = useCallback(async () => {
    setSaving(true);
    try {
      const domains = allowedDomains
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);

      const payload = {
        google: {
          enabled: google.enabled,
          clientId: google.clientId || null,
          ...(google.clientSecret ? { clientSecret: google.clientSecret } : {}),
        },
        microsoft: {
          enabled: microsoft.enabled,
          clientId: microsoft.clientId || null,
          tenantId: microsoft.tenantId || null,
          ...(microsoft.clientSecret ? { clientSecret: microsoft.clientSecret } : {}),
        },
        saml: {
          enabled: saml.enabled,
          entryPoint: saml.entryPoint || null,
          issuer: saml.issuer || null,
          ...(saml.cert ? { cert: saml.cert } : {}),
          emailAttribute: saml.emailAttribute || 'email',
          nameAttribute: saml.nameAttribute || 'displayName',
          groupAttribute: saml.groupAttribute || null,
        },
        allowedDomains: domains,
        autoProvision,
        defaultRole,
        ssoOnly,
      };

      await ssoApi.updateConfig(payload);
      toast.success("SSO configuration saved");

      // Update secret status without re-fetching
      setSecretStatus((prev) => ({
        googleHasSecret: prev.googleHasSecret || !!google.clientSecret,
        microsoftHasSecret: prev.microsoftHasSecret || !!microsoft.clientSecret,
        samlHasCert: prev.samlHasCert || !!saml.cert,
      }));

      // Clear secret inputs (they should never persist in state)
      setGoogle((g) => ({ ...g, clientSecret: '' }));
      setMicrosoft((m) => ({ ...m, clientSecret: '' }));
      setSaml((s) => ({ ...s, cert: '' }));
      initialSsoOnly.current = ssoOnly;
    } catch (err) {
      toast.error(err?.message || "Failed to save SSO configuration");
    } finally {
      setSaving(false);
    }
  }, [google, microsoft, saml, allowedDomains, autoProvision, defaultRole, ssoOnly]);

  // Save with lockout warning when enabling ssoOnly for the first time
  const handleSave = useCallback(() => {
    const enablingSsoOnly = ssoOnly && !initialSsoOnly.current;
    if (enablingSsoOnly) {
      showConfirm({
        title: 'Enable SSO-Only Mode?',
        message:
          'When SSO-Only mode is active, staff can ONLY log in via an SSO provider. ' +
          'Any account without a linked SSO identity will be permanently locked out — ' +
          'including admin accounts. There is no password-based recovery path once this is enabled. ' +
          'Ensure at least one SSO provider is fully configured before continuing.',
        variant: 'danger',
        confirmText: 'Enable SSO-Only',
        onConfirm: doSave,
      });
    } else {
      doSave();
    }
  }, [ssoOnly, showConfirm, doSave]);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-fg">SSO Configuration</h2>
          <p className="text-sm text-fg-muted">
            Configure Google, Microsoft, or SAML single sign-on for staff login
          </p>
        </div>
      </div>

      <Divider />

      {/* Google OAuth */}
      <Section
        title="Google Workspace"
        icon={<Globe size={15} className="text-blue-500" />}
        enabled={google.enabled}
        onToggle={(v) => setGoogle((g) => ({ ...g, enabled: v }))}
      >
        <Input
          label="Client ID"
          size="sm"
          value={google.clientId}
          onValueChange={(v) => setGoogle((g) => ({ ...g, clientId: v }))}
          placeholder="123456789-abc.apps.googleusercontent.com"
        />
        <Input
          label="Client Secret"
          size="sm"
          type="password"
          value={google.clientSecret}
          onValueChange={(v) => setGoogle((g) => ({ ...g, clientSecret: v }))}
          placeholder={secretStatus.googleHasSecret ? "Secret saved — enter new value to replace" : "Enter client secret"}
          description={secretStatus.googleHasSecret && !google.clientSecret ? "A secret is already saved. Leave blank to keep it." : undefined}
        />
      </Section>

      <Divider />

      {/* Microsoft 365 */}
      <Section
        title="Microsoft 365 / Azure AD"
        icon={<Globe size={15} className="text-blue-600" />}
        enabled={microsoft.enabled}
        onToggle={(v) => setMicrosoft((m) => ({ ...m, enabled: v }))}
      >
        <Input
          label="Client ID (Application ID)"
          size="sm"
          value={microsoft.clientId}
          onValueChange={(v) => setMicrosoft((m) => ({ ...m, clientId: v }))}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Input
          label="Tenant ID"
          size="sm"
          value={microsoft.tenantId}
          onValueChange={(v) => setMicrosoft((m) => ({ ...m, tenantId: v }))}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Input
          label="Client Secret"
          size="sm"
          type="password"
          value={microsoft.clientSecret}
          onValueChange={(v) => setMicrosoft((m) => ({ ...m, clientSecret: v }))}
          placeholder={secretStatus.microsoftHasSecret ? "Secret saved — enter new value to replace" : "Enter client secret"}
          description={secretStatus.microsoftHasSecret && !microsoft.clientSecret ? "A secret is already saved. Leave blank to keep it." : undefined}
        />
      </Section>

      <Divider />

      {/* SAML 2.0 */}
      <Section
        title="SAML 2.0"
        icon={<Shield size={15} className="text-purple-500" />}
        enabled={saml.enabled}
        onToggle={(v) => setSaml((s) => ({ ...s, enabled: v }))}
      >
        <Input
          label="IdP Entry Point URL"
          size="sm"
          value={saml.entryPoint}
          onValueChange={(v) => setSaml((s) => ({ ...s, entryPoint: v }))}
          placeholder="https://your-idp.com/sso/saml"
        />
        <Input
          label="Issuer / Entity ID"
          size="sm"
          value={saml.issuer}
          onValueChange={(v) => setSaml((s) => ({ ...s, issuer: v }))}
          placeholder="https://your-idp.com/entity"
        />
        <Textarea
          label="IdP Certificate (PEM)"
          size="sm"
          minRows={4}
          value={saml.cert}
          onValueChange={(v) => setSaml((s) => ({ ...s, cert: v }))}
          placeholder={secretStatus.samlHasCert ? "Certificate saved — paste new PEM to replace" : "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
          description={secretStatus.samlHasCert && !saml.cert ? "A certificate is already saved. Leave blank to keep it." : undefined}
          classNames={{ input: "font-mono text-xs" }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email Attribute"
            size="sm"
            value={saml.emailAttribute}
            onValueChange={(v) => setSaml((s) => ({ ...s, emailAttribute: v }))}
            placeholder="email"
          />
          <Input
            label="Display Name Attribute"
            size="sm"
            value={saml.nameAttribute}
            onValueChange={(v) => setSaml((s) => ({ ...s, nameAttribute: v }))}
            placeholder="displayName"
          />
        </div>
        <Input
          label="Group Attribute (optional)"
          size="sm"
          value={saml.groupAttribute}
          onValueChange={(v) => setSaml((s) => ({ ...s, groupAttribute: v }))}
          placeholder="groups"
          description="Used for group-to-role mapping. Leave blank if not needed."
        />
      </Section>

      <Divider />

      {/* General SSO settings */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-fg">General Settings</p>

        {/* Allowed Domains */}
        <Textarea
          label="Allowed Email Domains"
          size="sm"
          minRows={2}
          value={allowedDomains}
          onValueChange={setAllowedDomains}
          placeholder="school.edu&#10;district.org"
          description="One domain per line. Only emails from these domains can use SSO."
        />

        {/* Auto Provision */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border-token bg-surface-2">
          <div>
            <p className="text-sm font-medium text-fg">Auto-provision new staff</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Automatically create a staff account when an SSO user logs in for the first time
            </p>
          </div>
          <Switch
            isSelected={autoProvision}
            onValueChange={setAutoProvision}
            color="success"
            size="sm"
          />
        </div>

        {/* Default Role */}
        <Select
          label="Default Role for Auto-Provisioned Staff"
          size="sm"
          selectedKeys={[defaultRole]}
          onSelectionChange={(keys) => setDefaultRole([...keys][0])}
          isDisabled={!autoProvision}
        >
          {ROLES.map((r) => (
            <SelectItem key={r}>{r}</SelectItem>
          ))}
        </Select>

        {/* SSO-Only Mode */}
        <div className="flex items-start justify-between p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Lock size={15} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-fg">SSO-Only Mode</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                <strong>High risk:</strong> Disables password login for all staff. Anyone without an active SSO account
                will be permanently locked out. Disable SSO-Only before removing an SSO provider.
              </p>
              {ssoOnly && !initialSsoOnly.current && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle size={12} className="text-amber-600" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    You will be asked to confirm before saving.
                  </p>
                </div>
              )}
            </div>
          </div>
          <Switch
            isSelected={ssoOnly}
            onValueChange={setSsoOnly}
            color="danger"
            size="sm"
            className="flex-shrink-0 ml-3"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          {ssoOnly && (
            <Chip
              size="sm"
              variant="flat"
              color="danger"
              startContent={<AlertTriangle size={12} />}
            >
              SSO-Only active
            </Chip>
          )}
          {(google.enabled || microsoft.enabled || saml.enabled) && (
            <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle size={12} />}>
              {[google.enabled && 'Google', microsoft.enabled && 'Microsoft', saml.enabled && 'SAML']
                .filter(Boolean)
                .join(', ')}{' '}
              enabled
            </Chip>
          )}
        </div>
        <Button
          color="primary"
          size="sm"
          onPress={handleSave}
          isLoading={saving}
        >
          Save SSO Config
        </Button>
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}

function Section({ title, icon, enabled, onToggle, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-fg">{title}</p>
        </div>
        <Switch isSelected={enabled} onValueChange={onToggle} color="success" size="sm" />
      </div>
      {enabled && (
        <div className="space-y-3 pl-1">
          {children}
        </div>
      )}
    </div>
  );
}
