import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Lock, AlertCircle, RotateCcw } from "lucide-react";
import Switch from "../../components/ui/Switch";
import { request } from "../../services/api.js";
import { usePermissions } from "../../context/PermissionContext";
import { MODULE_GROUP_ORDER } from "../../config/moduleRegistry";
import logger from "../../utils/logger";

// Friendly labels for the always-on core modules (the API returns core entries
// without a label since they can never be toggled).
const CORE_LABELS = {
  dashboard: "Dashboard",
  students: "Students",
  staff: "Staff",
  classes: "Classes",
  attendance: "Attendance",
  timetable: "Timetable",
  settings: "Settings",
};

function ModulesSkeleton() {
  return (
    <div className="space-y-6 animate-shimmer" aria-hidden>
      <div className="h-6 w-40 bg-surface-2 rounded" />
      <div className="h-4 w-2/3 bg-surface-2 rounded" />
      {[0, 1, 2].map((g) => (
        <div key={g} className="space-y-3">
          <div className="h-4 w-32 bg-surface-2 rounded" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-border-token rounded-lg">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-surface-2 rounded" />
                <div className="h-3 w-64 bg-surface-2 rounded" />
              </div>
              <div className="h-5 w-9 bg-surface-2 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ModulesSettings() {
  const { refreshPermissions, isAdmin } = usePermissions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Working copy of the enabled toggleable keys.
  const [selected, setSelected] = useState(() => new Set());

  const canEdit = typeof isAdmin === "function" ? isAdmin() : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request("/settings/modules");
      setData(res);
      const on = (res.modules || [])
        .filter((m) => !m.core && m.enabled)
        .map((m) => m.key);
      setSelected(new Set(on));
    } catch (e) {
      logger.error("Failed to load module settings:", e);
      setError(e?.message || "Failed to load module settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const coreModules = useMemo(
    () => (data?.modules || []).filter((m) => m.core),
    [data]
  );

  // Toggleable modules grouped and ordered for display.
  const grouped = useMemo(() => {
    const toggleable = (data?.modules || []).filter((m) => !m.core);
    const byGroup = new Map();
    for (const m of toggleable) {
      const g = m.group || "Other";
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(m);
    }
    const ordered = [];
    for (const g of MODULE_GROUP_ORDER) {
      if (byGroup.has(g)) ordered.push([g, byGroup.get(g)]);
    }
    // Any group not in the canonical order, appended alphabetically.
    for (const [g, items] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (!MODULE_GROUP_ORDER.includes(g)) ordered.push([g, items]);
    }
    return ordered;
  }, [data]);

  const initialOn = useMemo(() => {
    const on = (data?.modules || []).filter((m) => !m.core && m.enabled).map((m) => m.key);
    return new Set(on);
  }, [data]);

  const dirty = useMemo(() => {
    if (selected.size !== initialOn.size) return true;
    for (const k of selected) if (!initialOn.has(k)) return true;
    return false;
  }, [selected, initialOn]);

  const toggle = (key) => {
    if (!canEdit) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await request("/settings/modules", {
        method: "PUT",
        body: JSON.stringify({ enabledModules: [...selected] }),
      });
      setData(res);
      const on = (res.modules || []).filter((m) => !m.core && m.enabled).map((m) => m.key);
      setSelected(new Set(on));
      toast.success("Module settings saved");
      // Refresh nav + route gating immediately from the new enabled set.
      refreshPermissions?.();
    } catch (e) {
      logger.error("Failed to save module settings:", e);
      toast.error(e?.message || "Failed to save module settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ModulesSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={40} className="text-danger-token mb-3" />
        <h3 className="text-base font-medium text-fg">Couldn’t load modules</h3>
        <p className="text-sm text-fg-muted mt-1 mb-4">{error}</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-fg text-bg text-sm font-medium hover:opacity-90"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-fg">Modules</h2>
        <p className="text-sm text-fg-muted mt-1">
          Turn features on or off for your school. Disabled modules are hidden from the
          sidebar and blocked everywhere — turn them on as you’re ready to use them.
        </p>
        {data && data.managed === false && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border-token bg-surface-2 p-3 text-sm text-fg-muted">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
            <span>
              All modules are currently on. Switch off the ones you don’t need yet and
              save to launch on just your core features.
            </span>
          </div>
        )}
        {!canEdit && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border-token bg-surface-2 p-3 text-sm text-fg-muted">
            <Lock size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
            <span>Only administrators can change which modules are enabled.</span>
          </div>
        )}
      </div>

      {/* Always-on core */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
          Always on
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {coreModules.map((m) => (
            <div
              key={m.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-token bg-surface px-3 py-2.5"
            >
              <span className="text-sm text-fg">{CORE_LABELS[m.key] || m.key}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-fg-subtle">
                <Lock size={12} /> Core
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Toggleable modules by group */}
      {grouped.map(([group, items]) => (
        <section key={group} className="space-y-3">
          <h3 className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
            {group}
          </h3>
          <div className="space-y-2">
            {items.map((m) => {
              const on = selected.has(m.key);
              return (
                <div
                  key={m.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border-token bg-surface px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">{m.label}</p>
                    {m.description && (
                      <p className="text-xs text-fg-muted mt-0.5">{m.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={on}
                    disabled={!canEdit}
                    onChange={() => toggle(m.key)}
                    aria-label={`Enable ${m.label}`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Save bar */}
      {canEdit && (
        <div className="fixed bottom-0 right-0 left-0 sm:left-auto z-20 border-t border-divider bg-surface/95 backdrop-blur px-6 py-3">
          <div className="max-w-[800px] mx-auto flex items-center justify-end gap-3">
            {dirty && (
              <span className="text-xs text-fg-muted mr-auto">You have unsaved changes</span>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set(initialOn))}
              disabled={!dirty || saving}
              className="px-4 py-2 rounded-md border border-border-token text-sm text-fg-muted hover:text-fg disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="px-4 py-2 rounded-md bg-fg text-bg text-sm font-medium hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
