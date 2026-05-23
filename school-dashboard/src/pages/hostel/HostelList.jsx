import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Avatar } from "@heroui/react";
import { Plus, Search, Building2, Edit2, Trash2, Users, DoorOpen } from "lucide-react";
import { hostelApi, staffApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { ConfirmDialog, EmptyState, ErrorState } from '../../components/ui';
import { hostelSchema, parseFormSchema } from '../../validators/formSchemas';

const INITIAL_FORM = {
  name: "", type: "boys", wardenId: "",
  address: "", description: "",
};

export default function HostelList() {
  const { t } = useTranslation();
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    const timerId = setTimeout(() => { setSearch(searchInput); }, 300);
    return () => clearTimeout(timerId);
  }, [searchInput]);

  const fetchHostels = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const data = await hostelApi.getHostels(params);
      setHostels(data.hostels || []);
    } catch (err) {
      setLoadError(err);
      toast.error(t('toast.error.failedToLoadHostels'));
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, t]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  useEffect(() => {
    let cancelled = false;
    staffApi.getAll().then((data) => {
      if (cancelled) return;
      setStaffList(Array.isArray(data) ? data : data?.data || []);
    }).catch(() => {
      if (!cancelled) toast.error('Failed to load staff list');
    });
    return () => { cancelled = true; };
  }, []);

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.type) e.type = "Type is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.wardenId) delete payload.wardenId;
      if (editingId) {
        await hostelApi.updateHostel(editingId, payload);
        toast.success(t('toast.success.hostelUpdated'));
      } else {
        await hostelApi.createHostel(payload);
        toast.success(t('toast.success.hostelCreated'));
      }
      handleClose();
      fetchHostels();
    } catch (err) {
      toast.error(err?.message || "Failed to save hostel");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hostel) => {
    setEditingId(hostel._id);
    setFormData({
      name: hostel.name || "", type: hostel.type || "boys",
      wardenId: hostel.wardenId?._id || hostel.wardenId || "",
      address: hostel.address || "",
      description: hostel.description || "",
    });
    setErrors({});
    onOpen();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await hostelApi.deleteHostel(deleteTarget);
      toast.success(t('toast.success.hostelDeleted'));
      fetchHostels();
    } catch (err) {
      toast.error(err?.message || "Failed to delete hostel");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setEditingId(null);
    onClose();
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setErrors({});
    onOpen();
  };

  const typeColors = { boys: "primary", girls: "secondary", mixed: "warning" };

  const getWardenName = (hostel) => {
    if (hostel.wardenId?.name) return hostel.wardenId.name;
    if (typeof hostel.wardenId === 'object' && hostel.wardenId?.name) return hostel.wardenId.name;
    return hostel.wardenName || '';
  };

  if (isLoading) return <CardGridPageSkeleton title={false} cards={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />;

  if (loadError) {
    return <ErrorState error={loadError} onRetry={fetchHostels} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <Input
            placeholder={t('pages.searchHostels')}
            startContent={<Search size={16} className="text-fg-faint" />}
            value={searchInput}
            onValueChange={setSearchInput}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder={t('pages.allTypes1')}
            selectedKeys={typeFilter ? [typeFilter] : []}
            onSelectionChange={(keys) => setTypeFilter([...keys][0] || "")}
            className="max-w-[150px]"
            size="sm"
          >
            <SelectItem key="boys">{t('pages.boys')}</SelectItem>
            <SelectItem key="girls">{t('pages.girls')}</SelectItem>
            <SelectItem key="mixed">{t('pages.mixed')}</SelectItem>
          </Select>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleAdd} size="sm">
          Add Hostel
        </Button>
      </div>

      {/* Hostel Cards */}
      {hostels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('pages.noHostelsFound')}
          action={
            <Button color="primary" size="sm" startContent={<Plus size={14} />} onPress={handleAdd}>
              Add Hostel
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="bg-surface rounded-lg border border-border-token p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-fg">{hostel.name}</h3>
                  <Chip size="sm" color={typeColors[hostel.type]} variant="flat" className="mt-1 capitalize">
                    {hostel.type}
                  </Chip>
                </div>
                <div className="flex gap-1">
                  <Button isIconOnly size="sm" variant="light" aria-label="Edit hostel" onPress={() => handleEdit(hostel)}>
                    <Edit2 size={14} className="text-fg-muted" />
                  </Button>
                  <Button isIconOnly size="sm" variant="light" aria-label="Delete hostel" onPress={() => setDeleteTarget(hostel._id)}>
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-fg-muted">
                  <DoorOpen size={14} />
                  <span>{hostel.totalRooms || 0} rooms</span>
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <Users size={14} />
                  <span>{hostel.occupiedBeds || 0} / {hostel.totalCapacity || 0} beds occupied</span>
                </div>
                {getWardenName(hostel) && (
                  <p className="text-fg-muted">Warden: {getWardenName(hostel)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteHostelTitle')}
        message={t('confirm.deleteHostel')}
        confirmText="Delete"
        variant="danger"
      />

      {/* Add/Edit Hostel Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-fg">
            {editingId ? "Edit Hostel" : "Add Hostel"}
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label={t('pages.hostelName')} isRequired
              value={formData.name}
              onValueChange={(v) => setFormData(p => ({ ...p, name: v }))}
              isInvalid={!!errors.name} errorMessage={errors.name}
            />
            <Select
              label={t('pages.type1')} isRequired
              selectedKeys={[formData.type]}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, type: [...keys][0] }))}
              isInvalid={!!errors.type} errorMessage={errors.type}
            >
              <SelectItem key="boys">{t('pages.boys')}</SelectItem>
              <SelectItem key="girls">{t('pages.girls')}</SelectItem>
              <SelectItem key="mixed">{t('pages.mixed')}</SelectItem>
            </Select>
            <Select
              label="Warden"
              selectedKeys={formData.wardenId ? [formData.wardenId] : []}
              onSelectionChange={(keys) => {
                const value = [...keys][0] || "";
                setFormData(p => ({ ...p, wardenId: value }));
              }}
            >
              {staffList.map((staff) => (
                <SelectItem key={staff.id || staff._id} textValue={staff.name}>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={staff.name}
                      src={staff.photo || staff.picture}
                      className="w-6 h-6 text-tiny"
                    />
                    <span>{staff.name}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
            <Input
              label={t('pages.address2')}
              value={formData.address}
              onValueChange={(v) => setFormData(p => ({ ...p, address: v }))}
            />
            <Input
              label={t('pages.description1')}
              value={formData.description}
              onValueChange={(v) => setFormData(p => ({ ...p, description: v }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>{t('pages.cancel2')}</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={saving}>
              {editingId ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
