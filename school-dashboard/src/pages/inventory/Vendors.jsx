import { useState, useEffect, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Select, SelectItem, Switch,
} from "@heroui/react";
import { Search, Plus, Edit3, Trash2, Phone, Mail, Truck } from "lucide-react";
import { MinimalButton, Card, Badge, EmptyState, ErrorState, IconButton } from "../../components/ui";
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await inventoryApi.getVendors(search || undefined);
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

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

  if (initialLoading) return <CardGridPageSkeleton title={false} cards={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Input
          value={search}
          onValueChange={setSearch}
          placeholder={t('pages.searchVendors')}
          startContent={<Search size={16} className="text-fg-faint" />}
          size="sm"
          className="w-56"
          aria-label={t('pages.searchVendors')}
        />
        <MinimalButton variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
          Add Vendor
        </MinimalButton>
      </div>

      {/* Vendor Cards */}
      {loadError ? (
        <ErrorState onRetry={fetchVendors} error={loadError} title={t('toast.error.failedToLoadVendors')} />
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={t('pages.noVendorsFound')}
          action={<MinimalButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>Add Vendor</MinimalButton>}
        />
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${loading ? 'opacity-50' : ''}`}>
          {vendors.map((v) => (
            <Card key={v._id} padding="md" elevation="raised">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <h4 className="font-medium text-fg truncate">{v.name}</h4>
                  {v.contactPerson && <p className="text-xs text-fg-muted">{v.contactPerson}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton aria-label="Edit vendor" variant="ghost" size="sm" icon={<Edit3 size={14} />} onClick={() => openEdit(v)} />
                  <IconButton aria-label="Delete vendor" variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(v._id)} />
                </div>
              </div>
              <div className="space-y-1.5">
                {v.phone && (
                  <div className="flex items-center gap-2 text-xs text-fg-muted">
                    <Phone size={12} /> {v.phone}
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2 text-xs text-fg-muted">
                    <Mail size={12} /> {v.email}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {v.category && <Badge color="neutral" size="sm">{v.category}</Badge>}
                  {!v.isActive && <Badge color="danger" size="sm">{t('pages.inactive')}</Badge>}
                </div>
              </div>
            </Card>
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
              <span className="text-sm text-fg">Active Vendor</span>
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
