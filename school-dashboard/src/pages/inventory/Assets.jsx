import { useState, useEffect, useMemo, useRef } from "react";
import { z } from 'zod';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { Search, Plus, Edit3, Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi, staffApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

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

const ITEMS_PER_PAGE = 25;

export default function Assets() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stockTarget, setStockTarget] = useState(null); // { asset, type: 'IN'|'OUT' }
  const [stockQty, setStockQty] = useState("");
  const [stockSaving, setStockSaving] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Track previous filter values to detect changes vs. pagination
  const filterRef = useRef({ search, filterCategory, filterStatus });

  const fetchAssets = async (pageToLoad = page) => {
    try {
      setLoading(true);
      const [res, vendorList, staffData] = await Promise.all([
        inventoryApi.getAssets({ search, category: filterCategory !== "all" ? filterCategory : undefined, status: filterStatus !== "all" ? filterStatus : undefined, page: pageToLoad, limit: ITEMS_PER_PAGE }),
        inventoryApi.getVendors(),
        staffApi.getAll(),
      ]);
      setAssets(res?.data || []);
      setTotal(res?.total || 0);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setStaffList(Array.isArray(staffData) ? staffData : staffData?.data || []);
    } catch { toast.error(t('toast.error.failedToLoadAssets')); }
    finally { setLoading(false); setInitialLoading(false); }
  };

  // Single effect handles both filter changes and pagination.
  // When filters change, always fetch page 1 without also triggering a stale fetch
  // for the old page value (which caused mixed results on rapid filter changes).
  useEffect(() => {
    const prev = filterRef.current;
    const filtersChanged = prev.search !== search || prev.filterCategory !== filterCategory || prev.filterStatus !== filterStatus;
    filterRef.current = { search, filterCategory, filterStatus };

    if (filtersChanged && page !== 1) {
      setPage(1); // page change will retrigger this effect at page 1
      return;
    }

    fetchAssets(filtersChanged ? 1 : page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterCategory, filterStatus]);

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
    const numericValidation = z.object({
      quantity: z.coerce.number({ invalid_type_error: "Must be a valid number" }).int("Must be a whole number").min(0, "Must be 0 or greater"),
      minimumQuantity: z.coerce.number({ invalid_type_error: "Must be a valid number" }).int("Must be a whole number").min(0, "Must be 0 or greater"),
      purchasePrice: z.union([z.literal(""), z.coerce.number({ invalid_type_error: "Must be a valid number" }).min(0, "Must be 0 or greater")]),
      currentValue: z.union([z.literal(""), z.coerce.number({ invalid_type_error: "Must be a valid number" }).min(0, "Must be 0 or greater")]),
      depreciationRate: z.union([z.literal(""), z.coerce.number({ invalid_type_error: "Must be a valid number" }).min(0, "Must be 0").max(100, "Must be 0–100")]),
    }).safeParse({
      quantity: String(form.quantity),
      minimumQuantity: String(form.minimumQuantity),
      purchasePrice: String(form.purchasePrice),
      currentValue: String(form.currentValue),
      depreciationRate: String(form.depreciationRate),
    });
    if (!numericValidation.success) {
      const fieldErrors = {};
      numericValidation.error.errors.forEach((e) => { fieldErrors[e.path[0]] = e.message; });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return toast.error("Please fix the highlighted fields");
    }
    const { quantity, minimumQuantity, purchasePrice, currentValue, depreciationRate } = numericValidation.data;
    try {
      setSaving(true);
      const payload = {
        ...form,
        quantity,
        minimumQuantity,
        purchasePrice: purchasePrice !== "" ? purchasePrice : undefined,
        currentValue: currentValue !== "" ? currentValue : undefined,
        depreciationRate: depreciationRate !== "" ? depreciationRate : undefined,
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deleteAsset(deleteTarget);
      toast.success(t('toast.success.assetDeleted'));
      fetchAssets();
    } catch { toast.error(t('toast.error.deleteFailed')); }
    finally { setDeleteTarget(null); }
  };

  const handleStockAdjust = async () => {
    const delta = z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").safeParse(stockQty);
    if (!delta.success) return toast.error(delta.error.errors[0].message);
    const { asset, type } = stockTarget;
    if (type === 'OUT' && asset.quantity - delta.data < 0) return toast.error("Stock cannot go below 0");
    try {
      setStockSaving(true);
      await inventoryApi.adjustAssetStock(asset._id, { type, quantity: delta.data });
      toast.success(type === 'IN' ? `Stock added: +${delta.data}` : `Stock removed: -${delta.data}`);
      setStockTarget(null);
      setStockQty("");
      fetchAssets();
    } catch (err) {
      toast.error(err?.message || "Failed to update stock");
    } finally {
      setStockSaving(false);
    }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  if (initialLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={6} rows={6} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <Input
            value={search}
            onValueChange={setSearch}
            placeholder={t('pages.searchAssets')}
            startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
            size="sm"
            className="w-56"
          />
          <Select
            selectedKeys={[filterCategory]}
            onSelectionChange={(keys) => setFilterCategory([...keys][0] || "all")}
            size="sm"
            className="w-44"
            aria-label="Filter by category"
          >
            <SelectItem key="all">All Category</SelectItem>
            {CATEGORIES.map((o) => <SelectItem key={o}>{o.replace(/_/g, " ")}</SelectItem>)}
          </Select>
          <Select
            selectedKeys={[filterStatus]}
            onSelectionChange={(keys) => setFilterStatus([...keys][0] || "all")}
            size="sm"
            className="w-44"
            aria-label="Filter by status"
          >
            <SelectItem key="all">{t('pages.allStatus1')}</SelectItem>
            {STATUSES.map((o) => <SelectItem key={o}>{o.replace(/_/g, " ")}</SelectItem>)}
          </Select>
        </div>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          {t('pages.addAsset')}
        </MinimalButton>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                {[t('pages.name1'), t('pages.category1'), t('pages.location'), t('pages.assignedTo'), t('pages.qty'), t('pages.currentValue'), t('pages.condition'), t('pages.status2'), t('pages.vendor'), t('pages.actions1')].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={loading ? "opacity-50 pointer-events-none" : ""}>
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
                        <button onClick={() => { setStockTarget({ asset: a, type: 'IN' }); setStockQty(""); }} className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-950 text-gray-500 dark:text-zinc-400 hover:text-green-600" title={t('pages.stockIn')}><ArrowDownToLine size={14} /></button>
                        <button onClick={() => { setStockTarget({ asset: a, type: 'OUT' }); setStockQty(""); }} className="p-1.5 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-950 text-gray-500 dark:text-zinc-400 hover:text-yellow-600" title={t('pages.stockOut')}><ArrowUpFromLine size={14} /></button>
                        <button aria-label={t('pages.editAsset')} onClick={() => openEdit(a)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                        <button aria-label={t('pages.deleteAsset')} onClick={() => setDeleteTarget(a._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {t('pages.assetsTotal', { count: total })}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 text-gray-700 dark:text-zinc-300"
            >
              {t('pages.previous')}
            </button>
            <span className="text-sm text-gray-600 dark:text-zinc-400 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 text-gray-700 dark:text-zinc-300"
            >
              {t('pages.next')}
            </button>
          </div>
        )}
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
              <Input label={t('pages.quantity')} type="number" inputMode="numeric" value={String(form.quantity)} onValueChange={(v) => set("quantity", v)} isInvalid={!!errors.quantity} errorMessage={errors.quantity} />
              <Input label={t('pages.minimumQuantity')} type="number" inputMode="numeric" value={String(form.minimumQuantity)} onValueChange={(v) => set("minimumQuantity", v)} isInvalid={!!errors.minimumQuantity} errorMessage={errors.minimumQuantity} />
              <Input label={t('pages.purchaseDate')} type="date" value={form.purchaseDate} onValueChange={(v) => set("purchaseDate", v)} />
              <Input label={t('pages.purchasePrice')} type="number" inputMode="decimal" value={String(form.purchasePrice)} onValueChange={(v) => set("purchasePrice", v)} isInvalid={!!errors.purchasePrice} errorMessage={errors.purchasePrice} />
              <Input label="Current Value" type="number" inputMode="decimal" value={String(form.currentValue)} onValueChange={(v) => set("currentValue", v)} isInvalid={!!errors.currentValue} errorMessage={errors.currentValue} description="Auto-calculated if depreciation rate is set" />
              <Input label={t('pages.warrantyExpiry')} type="date" value={form.warrantyExpiry} onValueChange={(v) => set("warrantyExpiry", v)} />
              <Input label="Depreciation Rate (%)" type="number" inputMode="decimal" value={String(form.depreciationRate)} onValueChange={(v) => set("depreciationRate", v)} isInvalid={!!errors.depreciationRate} errorMessage={errors.depreciationRate} />
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteAsset')}
        message={t('confirm.deleteAsset')}
        confirmText="Delete"
        variant="danger"
      />

      {/* Stock In / Stock Out Modal */}
      <Modal isOpen={!!stockTarget} onOpenChange={(open) => { if (!open) { setStockTarget(null); setStockQty(""); } }} size="sm">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              {stockTarget?.type === 'IN'
                ? <ArrowDownToLine size={16} className="text-green-600" />
                : <ArrowUpFromLine size={16} className="text-yellow-600" />}
              {stockTarget?.type === 'IN' ? 'Stock In' : 'Stock Out'}: {stockTarget?.asset?.name}
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
              Current stock: <span className="font-medium text-gray-900 dark:text-zinc-100">{stockTarget?.asset?.quantity ?? 0}</span>
            </p>
            <Input
              label={stockTarget?.type === 'IN' ? 'Quantity to add' : 'Quantity to remove'}
              type="number"
              inputMode="numeric"
              min={1}
              value={stockQty}
              onValueChange={setStockQty}
              autoFocus
            />
            {stockTarget?.type === 'OUT' && stockQty && Number(stockQty) > 0 && (
              <p className={`text-xs mt-1 ${(stockTarget.asset.quantity - Number(stockQty)) < 0 ? 'text-red-600' : 'text-gray-500 dark:text-zinc-400'}`}>
                New stock: {stockTarget.asset.quantity - Number(stockQty)}
              </p>
            )}
            {stockTarget?.type === 'IN' && stockQty && Number(stockQty) > 0 && (
              <p className="text-xs mt-1 text-gray-500 dark:text-zinc-400">
                New stock: {stockTarget.asset.quantity + Number(stockQty)}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <MinimalButton variant="ghost" onClick={() => { setStockTarget(null); setStockQty(""); }}>Cancel</MinimalButton>
            <MinimalButton
              variant={stockTarget?.type === 'IN' ? 'primary' : 'danger'}
              onClick={handleStockAdjust}
              loading={stockSaving}
            >
              {stockTarget?.type === 'IN' ? 'Add Stock' : 'Remove Stock'}
            </MinimalButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
