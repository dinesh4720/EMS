import { useState, useEffect, useCallback } from "react";
import { z } from 'zod';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Plus, Edit3, Trash2, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import { MinimalButton, Card, Badge, EmptyState, ErrorState, IconButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const CATEGORIES = ["FURNITURE", "ELECTRONICS", "LAB_EQUIPMENT", "SPORTS", "STATIONERY", "VEHICLE", "OTHER"];
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ORDERED", "RECEIVED", "PURCHASED", "CANCELLED"];

const statusBadgeColor = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  ORDERED: 'info',
  RECEIVED: 'info',
  PURCHASED: 'info',
  CANCELLED: 'neutral',
};

const emptyForm = {
  itemName: "", category: "FURNITURE", quantity: 1, estimatedCost: "",
  actualCost: "", status: "PENDING", justification: "", vendorId: "", notes: "",
};

export default function Procurement() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [reqData, vendorData] = await Promise.all([
        inventoryApi.getProcurement(filterStatus !== "all" ? filterStatus : undefined),
        inventoryApi.getVendors(),
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setIsOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      itemName: r.itemName || "", category: r.category || "FURNITURE",
      quantity: r.quantity ?? 1, estimatedCost: r.estimatedCost ?? "",
      actualCost: r.actualCost ?? "", status: r.status || "PENDING",
      justification: r.justification || "", vendorId: r.vendorId?._id || r.vendorId || "",
      notes: r.notes || "",
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.itemName.trim()) {
      setErrors({ itemName: t('toast.error.itemNameIsRequired') });
      return toast.error(t('toast.error.itemNameIsRequired'));
    }
    const numericValidation = z.object({
      quantity: z.coerce.number({ invalid_type_error: "Must be a valid number" }).int("Must be a whole number").min(1, "Must be at least 1"),
      estimatedCost: z.union([z.literal(""), z.coerce.number({ invalid_type_error: "Must be a valid number" }).min(0, "Must be 0 or greater")]),
      actualCost: z.union([z.literal(""), z.coerce.number({ invalid_type_error: "Must be a valid number" }).min(0, "Must be 0 or greater")]),
    }).safeParse({
      quantity: String(form.quantity),
      estimatedCost: String(form.estimatedCost),
      actualCost: String(form.actualCost),
    });
    if (!numericValidation.success) {
      const fieldErrors = {};
      numericValidation.error.errors.forEach((e) => { fieldErrors[e.path[0]] = e.message; });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return toast.error("Please fix the highlighted fields");
    }
    const { quantity, estimatedCost, actualCost } = numericValidation.data;
    try {
      setSaving(true);
      const payload = {
        ...form,
        quantity,
        estimatedCost: estimatedCost !== "" ? estimatedCost : undefined,
        actualCost: actualCost !== "" ? actualCost : undefined,
        vendorId: form.vendorId || undefined,
      };
      if (editing) {
        await inventoryApi.updateProcurement(editing._id, payload);
        toast.success(t('toast.success.requestUpdated'));
      } else {
        await inventoryApi.createProcurement(payload);
        toast.success(t('toast.success.requestCreated'));
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await inventoryApi.updateProcurement(id, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      fetchData();
    } catch { toast.error(t('toast.error.updateFailed')); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deleteProcurement(deleteTarget);
      toast.success(t('toast.success.requestDeleted'));
      fetchData();
    } catch { toast.error(t('toast.error.deleteFailed')); }
    finally { setDeleteTarget(null); }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  if (initialLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={6} />;

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
          New Request
        </MinimalButton>
      </div>

      {/* Table */}
      {loadError ? (
        <ErrorState onRetry={fetchData} error={loadError} title={t('toast.error.failedToLoadProcurementData')} />
      ) : (
        <Card padding="none" elevation="raised" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-divider">
                  {["Item", "Category", "Qty", "Est. Cost", "Requested By", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={loading ? "opacity-50 pointer-events-none" : ""}>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={ShoppingCart}
                        title={t('pages.noProcurementRequests')}
                        action={<MinimalButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>New Request</MinimalButton>}
                      />
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r._id} className="border-b border-divider hover:bg-surface-hover">
                      <td className="px-4 py-3 font-medium text-fg">{r.itemName}</td>
                      <td className="px-4 py-3">
                        <Badge color="neutral" size="sm">{r.category?.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-fg">{r.quantity}</td>
                      <td className="px-4 py-3 text-fg">{r.estimatedCost != null ? `₹${r.estimatedCost.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-fg-muted">{r.requestedBy?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge color={statusBadgeColor[r.status] || 'neutral'} size="sm">{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status === "PENDING" && (
                            <>
                              <IconButton aria-label={t('pages.approve1')} variant="ghost" size="sm" icon={<CheckCircle size={14} className="text-green-600 dark:text-green-400" />} onClick={() => handleStatusChange(r._id, "APPROVED")} />
                              <IconButton aria-label={t('pages.reject1')} variant="ghost" size="sm" icon={<XCircle size={14} className="text-red-600 dark:text-red-400" />} onClick={() => handleStatusChange(r._id, "REJECTED")} />
                            </>
                          )}
                          <IconButton aria-label="Edit procurement" variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => openEdit(r)} />
                          <IconButton aria-label="Delete procurement" variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(r._id)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Request" : "New Procurement Request"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('pages.itemName')} isRequired value={form.itemName} onValueChange={(v) => set("itemName", v)} isInvalid={!!errors.itemName} errorMessage={errors.itemName} />
              <Select label={t('pages.category1')} selectedKeys={[form.category]} onSelectionChange={(keys) => set("category", [...keys][0])}>
                {CATEGORIES.map((c) => <SelectItem key={c}>{c.replace(/_/g, " ")}</SelectItem>)}
              </Select>
              <Input label={t('pages.quantity')} isRequired type="number" inputMode="numeric" value={String(form.quantity)} onValueChange={(v) => set("quantity", v)} isInvalid={!!errors.quantity} errorMessage={errors.quantity} />
              <Input label={t('pages.estimatedCost')} type="number" inputMode="decimal" value={String(form.estimatedCost)} onValueChange={(v) => set("estimatedCost", v)} startContent="₹" isInvalid={!!errors.estimatedCost} errorMessage={errors.estimatedCost} />
              <Input label="Actual Cost" type="number" inputMode="decimal" value={String(form.actualCost)} onValueChange={(v) => set("actualCost", v)} startContent="₹" isInvalid={!!errors.actualCost} errorMessage={errors.actualCost} />
              <Select label={t('pages.status2')} selectedKeys={[form.status]} onSelectionChange={(keys) => set("status", [...keys][0])}>
                {STATUSES.map((s) => <SelectItem key={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </Select>
              <Select label={t('pages.vendor')} selectedKeys={form.vendorId ? [form.vendorId] : []} onSelectionChange={(keys) => set("vendorId", [...keys][0] || "")} className="sm:col-span-2">
                {vendors.map((v) => <SelectItem key={v._id}>{v.name}</SelectItem>)}
              </Select>
            </div>
            <Textarea label={t('pages.justification')} value={form.justification} onValueChange={(v) => set("justification", v)} className="mt-2" />
            <Textarea label={t('pages.notes1')} value={form.notes} onValueChange={(v) => set("notes", v)} />
          </ModalBody>
          <ModalFooter>
            <MinimalButton variant="ghost" onClick={() => setIsOpen(false)}>{t('pages.cancel2')}</MinimalButton>
            <MinimalButton variant="primary" onClick={handleSave} loading={saving}>{editing ? "Update" : "Submit"}</MinimalButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteProcurement')}
        message={t('confirm.deleteProcurement')}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
