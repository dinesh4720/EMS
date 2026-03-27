import { useState, useEffect, useMemo } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Search, Plus, Edit3, Trash2 } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi, staffApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

const CATEGORIES = ["FURNITURE", "ELECTRONICS", "LAB_EQUIPMENT", "SPORTS", "STATIONERY", "VEHICLE", "OTHER"];
const CONDITIONS = ["GOOD", "FAIR", "POOR", "DAMAGED"];
const STATUSES = ["ACTIVE", "UNDER_MAINTENANCE", "DISPOSED", "LOST"];

const conditionColors = {
  GOOD: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  FAIR: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  POOR: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  DAMAGED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const statusColors = {
  ACTIVE: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  UNDER_MAINTENANCE: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  DISPOSED: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
  LOST: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const emptyForm = {
  name: "", category: "FURNITURE", serialNumber: "", assetTag: "", description: "",
  location: "", assignedTo: "", quantity: 1, minimumQuantity: 0,
  purchaseDate: "", purchasePrice: "", currentValue: "", warrantyExpiry: "", vendorId: "",
  condition: "GOOD", status: "ACTIVE", notes: "", depreciationRate: "",
};

export default function Assets() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const [res, vendorList, staffData] = await Promise.all([
        inventoryApi.getAssets({ search, category: filterCategory !== "all" ? filterCategory : undefined, status: filterStatus !== "all" ? filterStatus : undefined }),
        inventoryApi.getVendors(),
        staffApi.getAll(),
      ]);
      setAssets(res?.data || []);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setStaffList(Array.isArray(staffData) ? staffData : staffData?.data || []);
    } catch { toast.error(t('toast.error.failedToLoadAssets')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssets(); }, [search, filterCategory, filterStatus]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setIsOpen(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      name: a.name || "", category: a.category || "FURNITURE", serialNumber: a.serialNumber || "",
      assetTag: a.assetTag || "", description: a.description || "", location: a.location || "",
      assignedTo: a.assignedTo?._id || a.assignedTo || "", quantity: a.quantity ?? 1, minimumQuantity: a.minimumQuantity ?? 0,
      purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : "",
      purchasePrice: a.purchasePrice ?? "", currentValue: a.currentValue ?? "",
      warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.slice(0, 10) : "",
      vendorId: a.vendorId?._id || a.vendorId || "", condition: a.condition || "GOOD",
      status: a.status || "ACTIVE", notes: a.notes || "", depreciationRate: a.depreciationRate ?? "",
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrors({ name: t('toast.error.nameIsRequired') });
      return toast.error(t('toast.error.nameIsRequired'));
    }
    if (form.quantity < 0) return toast.error(t('toast.error.quantityCannotBeNegative'));
    try {
      setSaving(true);
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        minimumQuantity: Number(form.minimumQuantity),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        currentValue: form.currentValue !== "" ? Number(form.currentValue) : undefined,
        depreciationRate: form.depreciationRate !== "" ? Number(form.depreciationRate) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        vendorId: form.vendorId || undefined,
        assignedTo: form.assignedTo || null,
      };
      if (editing) {
        await inventoryApi.updateAsset(editing._id, payload);
        toast.success(t('toast.success.assetUpdated'));
      } else {
        await inventoryApi.createAsset(payload);
        toast.success(t('toast.success.assetCreated'));
      }
      setIsOpen(false);
      fetchAssets();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteAsset'))) return;
    try {
      await inventoryApi.deleteAsset(id);
      toast.success(t('toast.success.assetDeleted'));
      fetchAssets();
    } catch { toast.error(t('toast.error.deleteFailed')); }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={6} rows={6} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pages.searchAssets')}
              className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 w-56"
            />
          </div>
          {[{ label: "Category", value: filterCategory, setter: setFilterCategory, options: CATEGORIES },
            { label: "Status", value: filterStatus, setter: setFilterStatus, options: STATUSES }].map(({ label, value, setter, options }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 px-3 py-2"
            >
              <option value="all">All {label}</option>
              {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          ))}
        </div>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          Add Asset
        </MinimalButton>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                {["Name", "Category", "Location", "Assigned To", "Qty", "Current Value", "Condition", "Status", "Vendor", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-500 dark:text-zinc-400">{t('pages.noAssetsFound')}</td></tr>
              ) : (
                assets.map((a) => (
                  <tr key={a._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-zinc-100">{a.name}</p>
                      {a.assetTag && <p className="text-xs text-gray-500 dark:text-zinc-400">{a.assetTag}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">{a.category?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{a.location || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{a.assignedTo?.name || a.assignedToName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{a.quantity}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                      {a.currentValue != null ? `₹${Number(a.currentValue).toLocaleString()}` : (a.purchasePrice ? `₹${Number(a.purchasePrice).toLocaleString()}` : "—")}
                      {a.purchasePrice && a.currentValue != null && a.currentValue < a.purchasePrice && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500 line-through">₹{Number(a.purchasePrice).toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${conditionColors[a.condition] || ""}`}>{a.condition}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] || ""}`}>{a.status?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{a.vendorId?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Asset" : "New Asset"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('pages.name1')} isRequired value={form.name} onValueChange={(v) => set("name", v)} isInvalid={!!errors.name} errorMessage={errors.name} />
              <Select label={t('pages.category1')} selectedKeys={[form.category]} onSelectionChange={(keys) => set("category", [...keys][0])}>
                {CATEGORIES.map((c) => <SelectItem key={c}>{c.replace(/_/g, " ")}</SelectItem>)}
              </Select>
              <Input label={t('pages.assetTag')} value={form.assetTag} onValueChange={(v) => set("assetTag", v)} />
              <Input label={t('pages.serialNumber')} value={form.serialNumber} onValueChange={(v) => set("serialNumber", v)} />
              <Input label={t('pages.location')} value={form.location} onValueChange={(v) => set("location", v)} />
              <Select label={t('pages.assignedTo')} selectedKeys={form.assignedTo ? [form.assignedTo] : []} onSelectionChange={(keys) => set("assignedTo", [...keys][0] || "")}>
                {staffList.map((s) => <SelectItem key={s._id || s.id}>{s.name}</SelectItem>)}
              </Select>
              <Input label={t('pages.quantity')} type="number" value={String(form.quantity)} onValueChange={(v) => set("quantity", v)} />
              <Input label={t('pages.minimumQuantity')} type="number" value={String(form.minimumQuantity)} onValueChange={(v) => set("minimumQuantity", v)} />
              <Input label={t('pages.purchaseDate')} type="date" value={form.purchaseDate} onValueChange={(v) => set("purchaseDate", v)} />
              <Input label={t('pages.purchasePrice')} type="number" value={String(form.purchasePrice)} onValueChange={(v) => set("purchasePrice", v)} />
              <Input label="Current Value" type="number" value={String(form.currentValue)} onValueChange={(v) => set("currentValue", v)} description="Auto-calculated if depreciation rate is set" />
              <Input label={t('pages.warrantyExpiry')} type="date" value={form.warrantyExpiry} onValueChange={(v) => set("warrantyExpiry", v)} />
              <Input label="Depreciation Rate (%)" type="number" value={String(form.depreciationRate)} onValueChange={(v) => set("depreciationRate", v)} />
              <Select label={t('pages.vendor')} selectedKeys={form.vendorId ? [form.vendorId] : []} onSelectionChange={(keys) => set("vendorId", [...keys][0] || "")}>
                {vendors.map((v) => <SelectItem key={v._id}>{v.name}</SelectItem>)}
              </Select>
              <Select label={t('pages.condition')} selectedKeys={[form.condition]} onSelectionChange={(keys) => set("condition", [...keys][0])}>
                {CONDITIONS.map((c) => <SelectItem key={c}>{c}</SelectItem>)}
              </Select>
              <Select label={t('pages.status2')} selectedKeys={[form.status]} onSelectionChange={(keys) => set("status", [...keys][0])}>
                {STATUSES.map((s) => <SelectItem key={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </Select>
            </div>
            <Textarea label={t('pages.description1')} value={form.description} onValueChange={(v) => set("description", v)} className="mt-2" />
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
