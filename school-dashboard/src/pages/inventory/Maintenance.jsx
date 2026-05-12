import { useState, useEffect, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Plus, Edit3, Wrench } from "lucide-react";
import { MinimalButton, Card, Badge, EmptyState, ErrorState, IconButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';

const TYPES = ["PREVENTIVE", "CORRECTIVE", "INSPECTION"];
const STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const statusBadgeColor = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

const emptyForm = {
  assetId: "", maintenanceType: "PREVENTIVE", description: "", scheduledDate: "",
  completedDate: "", cost: "", status: "SCHEDULED", vendorId: "", performedBy: "", notes: "",
};

export default function Maintenance() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [assets, setAssets] = useState([]);
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [logsData, assetsData, vendorData] = await Promise.all([
        inventoryApi.getMaintenance({ status: filterStatus !== "all" ? filterStatus : undefined }),
        inventoryApi.getAssets({ limit: 500 }),
        inventoryApi.getVendors(),
      ]);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setAssets(assetsData?.data || []);
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
  const openEdit = (log) => {
    setEditing(log);
    setForm({
      assetId: log.assetId?._id || log.assetId || "",
      maintenanceType: log.maintenanceType || "PREVENTIVE",
      description: log.description || "",
      scheduledDate: log.scheduledDate ? log.scheduledDate.slice(0, 10) : "",
      completedDate: log.completedDate ? log.completedDate.slice(0, 10) : "",
      cost: log.cost ?? "",
      status: log.status || "SCHEDULED",
      vendorId: log.vendorId?._id || log.vendorId || "",
      performedBy: log.performedBy || "",
      notes: log.notes || "",
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.assetId) newErrors.assetId = t('toast.error.assetIsRequired');
    if (!form.description.trim()) newErrors.description = t('toast.error.descriptionIsRequired');
    if (!form.scheduledDate) newErrors.scheduledDate = t('toast.error.scheduledDateIsRequired');
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.assetId) return toast.error(t('toast.error.assetIsRequired'));
      if (newErrors.description) return toast.error(t('toast.error.descriptionIsRequired'));
      return toast.error(t('toast.error.scheduledDateIsRequired'));
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        cost: form.cost ? Number(form.cost) : undefined,
        completedDate: form.completedDate || undefined,
        vendorId: form.vendorId || undefined,
      };
      if (editing) {
        await inventoryApi.updateMaintenance(editing._id, payload);
        toast.success(t('toast.success.maintenanceLogUpdated'));
      } else {
        await inventoryApi.createMaintenance(payload);
        toast.success(t('toast.success.maintenanceLogCreated'));
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
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
          Add Log
        </MinimalButton>
      </div>

      {/* Table */}
      {loadError ? (
        <ErrorState onRetry={fetchData} error={loadError} title={t('toast.error.failedToLoadMaintenanceLogs')} />
      ) : (
        <Card padding="none" elevation="raised" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-divider">
                  {["Asset", "Type", "Description", "Scheduled", "Status", "Cost", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={loading ? "opacity-50 pointer-events-none" : ""}>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Wrench}
                        title={t('pages.noMaintenanceLogs')}
                        action={<MinimalButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>Add Log</MinimalButton>}
                      />
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b border-divider hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg">{log.assetId?.name || "—"}</p>
                        {log.assetId?.assetTag && <p className="text-xs text-fg-muted">{log.assetId.assetTag}</p>}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{log.maintenanceType}</td>
                      <td className="px-4 py-3 text-fg max-w-[200px] truncate">{log.description}</td>
                      <td className="px-4 py-3 text-fg-muted">{formatShortDate(log.scheduledDate)}</td>
                      <td className="px-4 py-3">
                        <Badge color={statusBadgeColor[log.status] || 'neutral'} size="sm">{log.status?.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-fg">{log.cost != null ? `₹${log.cost.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3">
                        <IconButton aria-label="Edit maintenance log" variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => openEdit(log)} />
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
      <Modal isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }} size="xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Maintenance Log" : "New Maintenance Log"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label={t('pages.asset')} isRequired selectedKeys={form.assetId ? [form.assetId] : []} onSelectionChange={(keys) => set("assetId", [...keys][0] || "")} isInvalid={!!errors.assetId} errorMessage={errors.assetId}>
                {assets.map((a) => <SelectItem key={a._id}>{a.name}{a.assetTag ? ` (${a.assetTag})` : ""}</SelectItem>)}
              </Select>
              <Select label={t('pages.type1')} selectedKeys={[form.maintenanceType]} onSelectionChange={(keys) => set("maintenanceType", [...keys][0])}>
                {TYPES.map((mt) => <SelectItem key={mt}>{mt}</SelectItem>)}
              </Select>
              <Input label={t('pages.scheduledDate')} isRequired type="date" value={form.scheduledDate} onValueChange={(v) => set("scheduledDate", v)} isInvalid={!!errors.scheduledDate} errorMessage={errors.scheduledDate} />
              <Input label={t('pages.completedDate')} type="date" value={form.completedDate} onValueChange={(v) => set("completedDate", v)} />
              <Select label={t('pages.status2')} selectedKeys={[form.status]} onSelectionChange={(keys) => set("status", [...keys][0])}>
                {STATUSES.map((s) => <SelectItem key={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </Select>
              <Input label={t('pages.cost')} type="number" value={String(form.cost)} onValueChange={(v) => set("cost", v)} startContent="₹" />
              <Select label={t('pages.vendor')} selectedKeys={form.vendorId ? [form.vendorId] : []} onSelectionChange={(keys) => set("vendorId", [...keys][0] || "")}>
                {vendors.map((v) => <SelectItem key={v._id}>{v.name}</SelectItem>)}
              </Select>
              <Input label={t('pages.performedBy')} value={form.performedBy} onValueChange={(v) => set("performedBy", v)} />
            </div>
            <Textarea label={t('pages.description1')} isRequired value={form.description} onValueChange={(v) => set("description", v)} className="mt-2" isInvalid={!!errors.description} errorMessage={errors.description} />
            <Textarea label={t('pages.notes1')} value={form.notes} onValueChange={(v) => set("notes", v)} />
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
