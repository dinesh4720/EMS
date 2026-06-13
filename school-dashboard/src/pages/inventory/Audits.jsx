import { useState, useEffect, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Plus, Edit3, Trash2, ChevronDown, ChevronUp, X, ClipboardCheck } from "lucide-react";
import { MinimalButton, Card, Badge, EmptyState, ErrorState, IconButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatShortDate } from '../../utils/dateFormatter';

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const CONDITIONS = ["GOOD", "FAIR", "POOR", "DAMAGED"];

const statusBadgeColor = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
};

const emptyAuditItem = { assetId: "", expectedQuantity: "", actualQuantity: "", condition: "", notes: "" };
const emptyForm = { title: "", status: "PENDING", startDate: "", notes: "", auditItems: [] };

export default function Audits() {
  const { t } = useTranslation();
  const [audits, setAudits] = useState([]);
  const [assets, setAssets] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [data, assetData] = await Promise.all([
        inventoryApi.getAudits(filterStatus !== "all" ? filterStatus : undefined),
        inventoryApi.getAssets({}),
      ]);
      setAudits(Array.isArray(data) ? data : []);
      setAssets(assetData?.data || (Array.isArray(assetData) ? assetData : []));
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setIsOpen(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title || "",
      status: a.status || "PENDING",
      startDate: a.startDate ? a.startDate.slice(0, 10) : "",
      notes: a.notes || "",
      auditItems: (a.auditItems || []).map((item) => ({
        assetId: item.assetId?._id || item.assetId || "",
        expectedQuantity: item.expectedQuantity ?? "",
        actualQuantity: item.actualQuantity ?? "",
        condition: item.condition || "",
        notes: item.notes || "",
      })),
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setErrors({ title: t('toast.error.titleIsRequired') });
      return toast.error(t('toast.error.titleIsRequired'));
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        startDate: form.startDate || undefined,
        auditItems: (form.auditItems || [])
          .filter((item) => item.assetId)
          .map((item) => ({
            assetId: item.assetId,
            expectedQuantity: item.expectedQuantity !== "" ? Number(item.expectedQuantity) : undefined,
            actualQuantity: item.actualQuantity !== "" ? Number(item.actualQuantity) : undefined,
            condition: item.condition || undefined,
            notes: item.notes || undefined,
          })),
      };
      if (editing) {
        await inventoryApi.updateAudit(editing._id, payload);
        toast.success(t('toast.success.auditUpdated'));
      } else {
        await inventoryApi.createAudit(payload);
        toast.success(t('toast.success.auditCreated'));
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deleteAudit(deleteTarget);
      toast.success(t('toast.success.auditDeleted'));
      fetchData();
    } catch { toast.error(t('toast.error.deleteFailed')); }
    finally { setDeleteTarget(null); }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const addAuditItem = () => {
    setForm((f) => ({ ...f, auditItems: [...(f.auditItems || []), { ...emptyAuditItem }] }));
  };

  const removeAuditItem = (idx) => {
    setForm((f) => ({ ...f, auditItems: f.auditItems.filter((_, i) => i !== idx) }));
  };

  const setAuditItem = (idx, key, val) => {
    setForm((f) => {
      const items = [...(f.auditItems || [])];
      items[idx] = { ...items[idx], [key]: val };
      return { ...f, auditItems: items };
    });
  };

  if (initialLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={4} rows={5} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select
          selectedKeys={[filterStatus]}
          onSelectionChange={(keys) => setFilterStatus([...keys][0] || "all")}
          size="sm"
          className="w-48"
          aria-label="Filter by status"
        >
          <SelectItem key="all">{t('pages.allStatuses')}</SelectItem>
          {STATUSES.map((s) => <SelectItem key={s}>{s.replace(/_/g, " ")}</SelectItem>)}
        </Select>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          New Audit
        </MinimalButton>
      </div>

      {/* Audit List */}
      {loadError ? (
        <ErrorState onRetry={fetchData} error={loadError} title={t('toast.error.failedToLoadAudits')} />
      ) : audits.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={t('pages.noAuditsFound')}
          action={<MinimalButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>New Audit</MinimalButton>}
        />
      ) : (
        <div className={`space-y-3 ${loading ? 'opacity-50' : ''}`}>
          {audits.map((audit) => (
            <Card key={audit._id} padding="none" elevation="raised">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="min-w-0">
                    <h2 className="font-medium text-fg truncate">{audit.title}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge color={statusBadgeColor[audit.status] || 'neutral'} size="sm">
                        {audit.status?.replace(/_/g, " ")}
                      </Badge>
                      {audit.startDate && (
                        <span className="text-xs text-fg-muted">Started: {formatShortDate(audit.startDate)}</span>
                      )}
                      <span className="text-xs text-fg-muted">{audit.auditItems?.length || 0} items</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {audit.auditItems?.length > 0 && (
                    <IconButton
                      aria-label={expanded === audit._id ? "Collapse audit items" : "Expand audit items"}
                      variant="ghost"
                      size="sm"
                      icon={expanded === audit._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      onClick={() => setExpanded(expanded === audit._id ? null : audit._id)}
                    />
                  )}
                  <IconButton aria-label="Edit audit" variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => openEdit(audit)} />
                  <IconButton aria-label="Delete audit" variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(audit._id)} />
                </div>
              </div>

              {/* Expanded Audit Items */}
              {expanded === audit._id && audit.auditItems?.length > 0 && (
                <div className="border-t border-divider px-5 py-3">
                  <table className="w-full text-sm" aria-label={`Audit items for ${audit.title}`}>
                    <thead>
                      <tr>
                        {["Asset", "Expected Qty", "Actual Qty", "Condition", "Notes"].map((h) => (
                          <th key={h} className="text-left py-2 text-xs font-medium text-fg-muted uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {audit.auditItems.map((item, idx) => (
                        <tr key={item._id || item.assetId?._id || `audit-item-${idx}`} className="border-t border-divider">
                          <td className="py-2 text-fg">{item.assetId?.name || "Unknown"}</td>
                          <td className="py-2 text-fg-muted">{item.expectedQuantity ?? "—"}</td>
                          <td className="py-2 text-fg-muted">{item.actualQuantity ?? "—"}</td>
                          <td className="py-2 text-fg-muted">{item.condition || "—"}</td>
                          <td className="py-2 text-fg-muted text-xs">{item.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }} size="lg" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Audit" : "New Asset Audit"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('pages.title1')} isRequired value={form.title} onValueChange={(v) => set("title", v)} className="sm:col-span-2" isInvalid={!!errors.title} errorMessage={errors.title} />
              <Select label={t('pages.status2')} selectedKeys={[form.status]} onSelectionChange={(keys) => set("status", [...keys][0])}>
                {STATUSES.map((s) => <SelectItem key={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </Select>
              <Input label={t('pages.startDate1')} type="date" value={form.startDate} onValueChange={(v) => set("startDate", v)} />
            </div>
            <Textarea label={t('pages.notes1')} value={form.notes} onValueChange={(v) => set("notes", v)} className="mt-2" />

            {/* Audit Items Sub-form */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-fg">Audit Items</h4>
                <MinimalButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addAuditItem}>
                  Add Item
                </MinimalButton>
              </div>
              {(form.auditItems || []).length === 0 && (
                <p className="text-xs text-fg-muted text-center py-3 border border-dashed border-border-token rounded-lg">
                  No items added yet. Click "Add Item" to audit assets.
                </p>
              )}
              <div className="space-y-3">
                {(form.auditItems || []).map((item, idx) => (
                  <div key={item.assetId || `form-audit-item-${idx}`} className="border border-divider rounded-lg p-3 relative">
                    <div className="absolute top-2 right-2">
                      <IconButton
                        aria-label="Remove audit item"
                        variant="danger"
                        size="sm"
                        icon={<X size={14} />}
                        onClick={() => removeAuditItem(idx)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <Select
                        label="Asset"
                        selectedKeys={item.assetId ? [item.assetId] : []}
                        onSelectionChange={(keys) => setAuditItem(idx, "assetId", [...keys][0] || "")}
                        className="sm:col-span-2"
                      >
                        {assets.map((a) => <SelectItem key={a._id}>{a.name}{a.assetTag ? ` (${a.assetTag})` : ""}</SelectItem>)}
                      </Select>
                      <Input label="Expected Qty" type="number" value={String(item.expectedQuantity)} onValueChange={(v) => setAuditItem(idx, "expectedQuantity", v)} />
                      <Input label="Actual Qty" type="number" value={String(item.actualQuantity)} onValueChange={(v) => setAuditItem(idx, "actualQuantity", v)} />
                      <Select
                        label="Condition"
                        selectedKeys={item.condition ? [item.condition] : []}
                        onSelectionChange={(keys) => setAuditItem(idx, "condition", [...keys][0] || "")}
                      >
                        {CONDITIONS.map((c) => <SelectItem key={c}>{c}</SelectItem>)}
                      </Select>
                      <Input label="Notes" value={item.notes} onValueChange={(v) => setAuditItem(idx, "notes", v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <MinimalButton variant="ghost" onClick={() => setIsOpen(false)}>{t('pages.cancel2')}</MinimalButton>
            <MinimalButton variant="primary" onClick={handleSave} loading={saving}>{editing ? "Update" : "Create"}</MinimalButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteAudit')}
        message={t('confirm.deleteAudit')}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
