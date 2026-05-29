import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Building2, Edit2, Trash2, Users, DoorOpen, Printer } from "lucide-react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { IconButton } from "../../components/ui";
import Modal from "../../components/ui/Modal";
import Chip from "../../components/ui/Chip";
import Avatar from "../../components/ui/Avatar";
import { hostelApi, staffApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { ConfirmDialog, EmptyState, ErrorState } from '../../components/ui';
import ExportMenu from '../../components/ui/ExportMenu';
import PrintPreviewModal from '../../components/ui/PrintPreviewModal';
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
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [printOpen, setPrintOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
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

  const filteredHostels = hostels.filter((h) => {
    if (occupancyFilter === "all") return true;
    const occupied = h.occupiedBeds || 0;
    const capacity = h.totalCapacity || 0;
    if (occupancyFilter === "full") return capacity > 0 && occupied >= capacity;
    if (occupancyFilter === "partial") return occupied > 0 && occupied < capacity;
    if (occupancyFilter === "empty") return occupied === 0;
    return true;
  });

  if (isLoading) return <CardGridPageSkeleton title={false} cards={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />;

  if (loadError) {
    return <ErrorState error={loadError} onRetry={fetchHostels} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <Input
            placeholder={t('pages.searchHostels')}
            startContent={<Search size={16} className="text-fg-faint" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder={t('pages.allTypes1')}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="max-w-[150px]"
            size="sm"
          >
            <option value="">{t('pages.allTypes1')}</option>
            <option value="boys">{t('pages.boys')}</option>
            <option value="girls">{t('pages.girls')}</option>
            <option value="mixed">{t('pages.mixed')}</option>
          </Select>
          <Select
            placeholder="Occupancy"
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
            className="max-w-[150px]"
            size="sm"
          >
            <option value="all">All Occupancy</option>
            <option value="full">Full</option>
            <option value="partial">Partial</option>
            <option value="empty">Empty</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            rows={filteredHostels}
            columns={[
              { key: "name", label: "Name" },
              { key: "type", label: "Type" },
              { key: "totalRooms", label: "Rooms" },
              { key: "occupiedBeds", label: "Occupied" },
              { key: "totalCapacity", label: "Capacity" },
              { key: "warden", label: "Warden", accessor: (h) => getWardenName(h) || "—" },
            ]}
            filename="hostels"
            title="Hostels"
          />
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setPrintOpen(true)}
            aria-label="Print preview"
          >
            <Printer size={14} aria-hidden />
          </button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleAdd} size="sm">
            Add Hostel
          </Button>
        </div>
      </div>

      {/* Hostel Cards */}
      {filteredHostels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('pages.noHostelsFound')}
          action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleAdd}>
              Add Hostel
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHostels.map((hostel) => (
            <div key={hostel._id} className="bg-surface rounded-lg border border-border-token p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-fg">{hostel.name}</h3>
                  <Chip size="sm" color={typeColors[hostel.type]} className="mt-1 capitalize">
                    {hostel.type}
                  </Chip>
                </div>
                <div className="flex gap-1">
                  <IconButton size="sm" variant="ghost" aria-label="Edit hostel" onClick={() => handleEdit(hostel)}>
                    <Edit2 size={14} className="text-fg-muted" />
                  </IconButton>
                  <IconButton size="sm" variant="ghost" aria-label="Delete hostel" onClick={() => setDeleteTarget(hostel._id)}>
                    <Trash2 size={14} className="text-danger" />
                  </IconButton>
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

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Hostels"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Hostels</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Rooms</th>
                <th className="text-left py-2 px-3">Occupied</th>
                <th className="text-left py-2 px-3">Capacity</th>
                <th className="text-left py-2 px-3">Warden</th>
              </tr>
            </thead>
            <tbody>
              {filteredHostels.map((hostel) => (
                <tr key={hostel._id} className="border-b">
                  <td className="py-2 px-3">{hostel.name}</td>
                  <td className="py-2 px-3">{hostel.type}</td>
                  <td className="py-2 px-3">{hostel.totalRooms || 0}</td>
                  <td className="py-2 px-3">{hostel.occupiedBeds || 0}</td>
                  <td className="py-2 px-3">{hostel.totalCapacity || 0}</td>
                  <td className="py-2 px-3">{getWardenName(hostel) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>

      {/* Add/Edit Hostel Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
        <Modal.Header>{editingId ? "Edit Hostel" : "Add Hostel"}</Modal.Header>
        <Modal.Body className="gap-4">
          <Input
            label={t('pages.hostelName')} isRequired
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            isInvalid={!!errors.name} errorMessage={errors.name}
          />
          <Select
            label={t('pages.type1')} isRequired
            value={formData.type}
            onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
            isInvalid={!!errors.type} errorMessage={errors.type}
          >
            <option value="boys">{t('pages.boys')}</option>
            <option value="girls">{t('pages.girls')}</option>
            <option value="mixed">{t('pages.mixed')}</option>
          </Select>
          <Select
            label="Warden"
            value={formData.wardenId}
            onChange={(e) => setFormData(p => ({ ...p, wardenId: e.target.value }))}
          >
            {staffList.map((staff) => (
              <option key={staff.id || staff._id} value={staff.id || staff._id}>
                {staff.name}
              </option>
            ))}
          </Select>
          <Input
            label={t('pages.address2')}
            value={formData.address}
            onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
          />
          <Input
            label={t('pages.description1')}
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={handleClose}>{t('pages.cancel2')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {editingId ? "Update" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
