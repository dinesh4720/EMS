import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Plus, Edit3 } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';

const TYPES = ["PREVENTIVE", "CORRECTIVE", "INSPECTION"];
const STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const statusColors = {
  SCHEDULED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
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
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsData, assetsData, vendorData] = await Promise.all([
        inventoryApi.getMaintenance({ status: filterStatus !== "all" ? filterStatus : undefined }),
        inventoryApi.getAssets({ limit: 500 }),
        inventoryApi.getVendors(),
      ]);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setAssets(assetsData?.data || []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch { toast.error(t('toast.error.failedToLoadMaintenanceLogs')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

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

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={6} />;

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
          Add Log
        </MinimalButton>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                {["Asset", "Type", "Description", "Scheduled", "Status", "Cost", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500 dark:text-zinc-400">{t('pages.noMaintenanceLogs')}</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-zinc-100">{log.assetId?.name || "—"}</p>
                      {log.assetId?.assetTag && <p className="text-xs text-gray-500 dark:text-zinc-400">{log.assetId.assetTag}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{log.maintenanceType}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300 max-w-[200px] truncate">{log.description}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{formatShortDate(log.scheduledDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[log.status] || ""}`}>{log.status?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{log.cost != null ? `₹${log.cost.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(log)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                {TYPES.map((t) => <SelectItem key={t}>{t}</SelectItem>)}
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
