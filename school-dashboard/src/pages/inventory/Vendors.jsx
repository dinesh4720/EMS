import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Select, SelectItem, Switch,
} from "@heroui/react";
import { Search, Plus, Edit3, Trash2, Phone, Mail } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const emptyForm = {
  name: "", contactPerson: "", phone: "", email: "", address: "", category: "", notes: "", isActive: true,
};

export default function Vendors() {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getVendors(search || undefined);
      setVendors(Array.isArray(data) ? data : []);
    } catch { toast.error(t('toast.error.failedToLoadVendors')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setIsOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: v.name || "", contactPerson: v.contactPerson || "", phone: v.phone || "",
      email: v.email || "", address: v.address || "", category: v.category || "", notes: v.notes || "",
      isActive: v.isActive !== false,
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrors({ name: t('toast.error.nameIsRequired') });
      return toast.error(t('toast.error.nameIsRequired'));
    }
    try {
      setSaving(true);
      if (editing) {
        await inventoryApi.updateVendor(editing._id, form);
        toast.success(t('toast.success.vendorUpdated'));
      } else {
        await inventoryApi.createVendor(form);
        toast.success(t('toast.success.vendorCreated'));
      }
      setIsOpen(false);
      fetchVendors();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryApi.deleteVendor(deleteTarget);
      toast.success(t('toast.success.vendorDeleted'));
      fetchVendors();
    } catch { toast.error(t('toast.error.deleteFailed')); }
    finally { setDeleteTarget(null); }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  if (loading) return <CardGridPageSkeleton title={false} cards={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.searchVendors')}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 w-56"
          />
        </div>
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          Add Vendor
        </MinimalButton>
      </div>

      {/* Vendor Cards */}
      {vendors.length === 0 ? (
        <p className="text-center py-12 text-gray-500 dark:text-zinc-400">{t('pages.noVendorsFound')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v._id} className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-zinc-100">{v.name}</h4>
                  {v.contactPerson && <p className="text-xs text-gray-500 dark:text-zinc-400">{v.contactPerson}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"><Edit3 size={14} /></button>
                  <button onClick={() => setDeleteTarget(v._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 dark:text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-1.5">
                {v.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                    <Phone size={12} /> {v.phone}
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                    <Mail size={12} /> {v.email}
                  </div>
                )}
                {v.category && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 mt-1">
                    {v.category}
                  </span>
                )}
              </div>
              {!v.isActive && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 mt-2">{t('pages.inactive')}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? "Edit Vendor" : "New Vendor"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('pages.vendorName')} isRequired value={form.name} onValueChange={(v) => set("name", v)} isInvalid={!!errors.name} errorMessage={errors.name} />
              <Input label={t('pages.contactPerson')} value={form.contactPerson} onValueChange={(v) => set("contactPerson", v)} />
              <Input label={t('pages.phone1')} value={form.phone} onValueChange={(v) => set("phone", v)} />
              <Input label={t('pages.email1')} type="email" value={form.email} onValueChange={(v) => set("email", v)} />
              <Select
                label={t('pages.category1')}
                selectedKeys={form.category ? [form.category] : []}
                onChange={(e) => set("category", e.target.value)}
              >
                <SelectItem key="Stationery">Stationery</SelectItem>
                <SelectItem key="Electronics">Electronics</SelectItem>
                <SelectItem key="Furniture">Furniture</SelectItem>
                <SelectItem key="Lab Equipment">Lab Equipment</SelectItem>
                <SelectItem key="Sports">Sports</SelectItem>
                <SelectItem key="Cleaning">Cleaning</SelectItem>
                <SelectItem key="Food">Food</SelectItem>
                <SelectItem key="Transport">Transport</SelectItem>
                <SelectItem key="Printing">Printing</SelectItem>
                <SelectItem key="Other">Other</SelectItem>
              </Select>
            </div>
            <Textarea label={t('pages.address2')} value={form.address} onValueChange={(v) => set("address", v)} className="mt-2" />
            <Textarea label={t('pages.notes1')} value={form.notes} onValueChange={(v) => set("notes", v)} />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-sm text-gray-700 dark:text-zinc-300">Active Vendor</span>
              <Switch isSelected={form.isActive} onValueChange={(v) => set("isActive", v)} size="sm" />
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
        title={t('confirm.deleteVendor')}
        message={t('confirm.deleteVendor')}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
