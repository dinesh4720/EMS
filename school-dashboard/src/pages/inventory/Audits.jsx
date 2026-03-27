import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Plus, Edit3, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const CONDITIONS = ["GOOD", "FAIR", "POOR", "DAMAGED"];

const statusColors = {
  PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
};

const emptyAuditItem = { assetId: "", expectedQuantity: "", actualQuantity: "", condition: "", notes: "" };
const emptyForm = { title: "", status: "PENDING", startDate: "", notes: "", auditItems: [] };

export default function Audits() {
  const { t } = useTranslation();
  const [audits, setAudits] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, assetData] = await Promise.all([
        inventoryApi.getAudits(filterStatus !== "all" ? filterStatus : undefined),
        inventoryApi.getAssets({}),
      ]);
      setAudits(Array.isArray(data) ? data : []);
      setAssets(assetData?.data || (Array.isArray(assetData) ? assetData : []));
    } catch { toast.error(t('toast.error.failedToLoadAudits')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

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

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteAudit'))) return;
    try {
      await inventoryApi.deleteAudit(id);
      toast.success(t('toast.success.auditDeleted'));
      fetchData();
    } catch { toast.error(t('toast.error.deleteFailed')); }
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

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={4} rows={5} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 px-3 py-2"
        >
          <option value="all">{t('pages.allStatuses')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          New Audit
        </MinimalButton>
      </div>

      {/* Audit List */}
      {audits.length === 0 ? (
        <p className="text-center py-12 text-gray-500 dark:text-zinc-400">{t('pages.noAuditsFound')}</p>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => (
            <div key={audit._id} className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100 truncate">{audit.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[audit.status] || ""}`}>{audit.status?.replace(/_/g, " ")}</span>
                      {audit.startDate && (
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Started: {new Date(audit.startDate).toLocaleDateString()}</span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-zinc-400">{audit.auditItems?.length || 0} items</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {audit.auditItems?.length > 0 && (
                    <button
                      onClick={() => setExpanded(expanded === audit._id ? null : audit._id)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                    >
                      {expanded === audit._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button onClick={() => openEdit(audit)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(audit._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Expanded Audit Items */}
              {expanded === audit._id && audit.auditItems?.length > 0 && (
                <div className="border-t border-gray-100 dark:border-zinc-800 px-5 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["Asset", "Expected Qty", "Actual Qty", "Condition", "Notes"].map((h) => (
                          <th key={h} className="text-left py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {audit.auditItems.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-50 dark:border-zinc-800">
                          <td className="py-2 text-gray-900 dark:text-zinc-100">{item.assetId?.name || "Unknown"}</td>
                          <td className="py-2 text-gray-600 dark:text-zinc-400">{item.expectedQuantity ?? "—"}</td>
                          <td className="py-2 text-gray-600 dark:text-zinc-400">{item.actualQuantity ?? "—"}</td>
                          <td className="py-2 text-gray-600 dark:text-zinc-400">{item.condition || "—"}</td>
                          <td className="py-2 text-gray-500 dark:text-zinc-400 text-xs">{item.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }} size="lg">
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
                <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Audit Items</h4>
                <MinimalButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addAuditItem}>
                  Add Item
                </MinimalButton>
              </div>
              {(form.auditItems || []).length === 0 && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center py-3 border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                  No items added yet. Click "Add Item" to audit assets.
                </p>
              )}
              <div className="space-y-3">
                {(form.auditItems || []).map((item, idx) => (
                  <div key={idx} className="border border-gray-100 dark:border-zinc-800 rounded-lg p-3 relative">
                    <button
                      onClick={() => removeAuditItem(idx)}
                      className="absolute top-2 right-2 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
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
    </div>
  );
}
