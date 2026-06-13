import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, DoorOpen, Edit2, Trash2, BedDouble, Printer } from "lucide-react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { IconButton } from "../../components/ui";
import Modal from "../../components/ui/Modal";
import Chip from "../../components/ui/Chip";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { ConfirmDialog, EmptyState, ErrorState } from '../../components/ui';
import ExportMenu from '../../components/ui/ExportMenu';
import PrintPreviewModal from '../../components/ui/PrintPreviewModal';
import { hostelRoomSchema, parseFormSchema } from '../../validators/formSchemas';

const INITIAL_FORM = {
  hostelId: "", roomNumber: "", floor: 0, type: "double",
  capacity: 2, monthlyFee: 0, amenities: [], description: "",
};

const ROOM_TYPES = [
  { key: "single", label: "Single" },
  { key: "double", label: "Double" },
  { key: "triple", label: "Triple" },
  { key: "dormitory", label: "Dormitory" },
];

const AMENITY_OPTIONS = ["AC", "WiFi", "Attached Bathroom", "Hot Water", "Balcony", "Study Table", "Wardrobe"];

export default function RoomsList() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [printOpen, setPrintOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timerId = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timerId);
  }, [searchInput]);

  useEffect(() => {
    hostelApi.getHostels().then(d => setHostels(d.hostels || [])).catch(() => {});
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (hostelFilter) params.hostelId = hostelFilter;
      if (typeFilter) params.type = typeFilter;
      const data = await hostelApi.getRooms(params);
      setRooms(data.rooms || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setLoadError(err);
      toast.error(t('toast.error.failedToLoadRooms'));
    } finally {
      setIsLoading(false);
    }
  }, [search, hostelFilter, typeFilter, page, t]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const validateForm = () => {
    const { success, errors: zodErrors } = parseFormSchema(hostelRoomSchema, formData);
    setErrors(zodErrors);
    return success;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        floor: Number(formData.floor) || 0,
        capacity: Number(formData.capacity),
        monthlyFee: Number(formData.monthlyFee) || 0,
      };
      if (editingId) {
        await hostelApi.updateRoom(editingId, payload);
        toast.success(t('toast.success.roomUpdated'));
      } else {
        await hostelApi.createRoom(payload);
        toast.success(t('toast.success.roomCreated'));
      }
      handleClose();
      fetchRooms();
    } catch (err) {
      toast.error(err?.message || "Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room) => {
    setEditingId(room._id);
    setFormData({
      hostelId: room.hostelId?._id || room.hostelId || "",
      roomNumber: room.roomNumber || "", floor: room.floor || 0,
      type: room.type || "double", capacity: room.capacity || 2,
      monthlyFee: room.monthlyFee || 0, amenities: room.amenities || [],
      description: room.description || "",
    });
    setErrors({});
    onOpen();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await hostelApi.deleteRoom(deleteTarget);
      toast.success(t('toast.success.roomDeleted'));
      fetchRooms();
    } catch (err) {
      toast.error(err?.message || "Failed to delete room");
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
    setFormData({ ...INITIAL_FORM, hostelId: hostelFilter || "" });
    setErrors({});
    onOpen();
  };

  const toggleAmenity = (a) => {
    setFormData(p => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter(x => x !== a)
        : [...p.amenities, a],
    }));
  };

  const occupancyColor = (room) => {
    if (room.occupiedBeds >= room.capacity) return "bg-[var(--danger-bg)] text-[var(--danger)]";
    if (room.occupiedBeds > 0) return "bg-[var(--warn-bg)] text-[var(--warn)]";
    return "bg-[var(--ok-bg)] text-[var(--ok)]";
  };

  const filteredRooms = rooms.filter((r) => {
    if (occupancyFilter === "all") return true;
    if (occupancyFilter === "full") return r.occupiedBeds >= r.capacity;
    if (occupancyFilter === "partial") return r.occupiedBeds > 0 && r.occupiedBeds < r.capacity;
    if (occupancyFilter === "empty") return r.occupiedBeds === 0;
    return true;
  });

  if (isLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={6} />;

  if (loadError) {
    return <ErrorState error={loadError} onRetry={fetchRooms} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <Input
            placeholder={t('pages.searchRooms')}
            aria-label={t('pages.searchRooms')}
            startContent={<Search size={16} className="text-fg-faint" aria-hidden="true" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder={t('pages.allHostels')}
            aria-label={t('pages.allHostels')}
            value={hostelFilter}
            onChange={(e) => { setHostelFilter(e.target.value); setPage(1); }}
            className="max-w-[180px]"
            size="sm"
          >
            <option value="">{t('pages.allHostels')}</option>
            {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </Select>
          <Select
            placeholder={t('pages.allTypes1')}
            aria-label={t('pages.allTypes1')}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="max-w-[150px]"
            size="sm"
          >
            <option value="">{t('pages.allTypes1')}</option>
            {ROOM_TYPES.map(rt => <option key={rt.key} value={rt.key}>{rt.label}</option>)}
          </Select>
          <Select
            placeholder="Occupancy"
            aria-label="Filter by occupancy"
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
            rows={filteredRooms}
            columns={[
              { key: "roomNumber", label: "Room" },
              { key: "hostel", label: "Hostel", accessor: (r) => r.hostelId?.name || "—" },
              { key: "floor", label: "Floor" },
              { key: "type", label: "Type" },
              { key: "occupancy", label: "Occupancy", accessor: (r) => `${r.occupiedBeds}/${r.capacity}` },
              { key: "monthlyFee", label: "Fee", accessor: (r) => r.monthlyFee ? `₹${r.monthlyFee.toLocaleString()}` : "—" },
            ]}
            filename="rooms"
            title="Rooms"
          />
          <IconButton
            size="sm"
            variant="outline"
            aria-label="Print preview"
            onClick={() => setPrintOpen(true)}
          >
            <Printer size={14} aria-hidden="true" />
          </IconButton>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleAdd} size="sm">
            Add Room
          </Button>
        </div>
      </div>

      {/* Rooms Table */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title={t('pages.noRoomsFound')}
          action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleAdd}>
              Add Room
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border-token">
            <table className="w-full text-sm" aria-label="Rooms">
              <thead>
                <tr className="bg-surface-2 border-b border-border-token">
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.room')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.hostel1')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.floor')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.type1')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.occupancy')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.fee1')}</th>
                  <th className="text-right px-4 py-3 font-medium text-fg">{t('pages.actions1')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredRooms.map((room) => (
                  <tr key={room._id} className="bg-surface hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-fg">{room.roomNumber}</td>
                    <td className="px-4 py-3 text-fg-muted">{room.hostelId?.name || "—"}</td>
                    <td className="px-4 py-3 text-fg-muted">{room.floor}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" className="capitalize">{room.type}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${occupancyColor(room)}`}>
                        <BedDouble size={12} aria-hidden="true" />
                        {room.occupiedBeds}/{room.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {room.monthlyFee ? `₹${room.monthlyFee.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <IconButton size="sm" variant="ghost" aria-label="Edit room" onClick={() => handleEdit(room)}>
                          <Edit2 size={14} className="text-fg-muted" />
                        </IconButton>
                        <IconButton size="sm" variant="ghost" aria-label="Delete room" onClick={() => setDeleteTarget(room._id)}>
                          <Trash2 size={14} className="text-danger" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('pages.previous')}</Button>
              <span className="flex items-center text-sm text-fg-muted">Page {page} of {totalPages}</span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{t('pages.next')}</Button>
            </div>
          )}
        </>
      )}

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Rooms"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Rooms</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Room</th>
                <th className="text-left py-2 px-3">Hostel</th>
                <th className="text-left py-2 px-3">Floor</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Occupancy</th>
                <th className="text-left py-2 px-3">Fee</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room._id} className="border-b">
                  <td className="py-2 px-3">{room.roomNumber}</td>
                  <td className="py-2 px-3">{room.hostelId?.name || "—"}</td>
                  <td className="py-2 px-3">{room.floor}</td>
                  <td className="py-2 px-3">{room.type}</td>
                  <td className="py-2 px-3">{room.occupiedBeds}/{room.capacity}</td>
                  <td className="py-2 px-3">{room.monthlyFee ? `₹${room.monthlyFee.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>

      {/* Add/Edit Room Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
        <Modal.Header>{editingId ? "Edit Room" : "Add Room"}</Modal.Header>
        <Modal.Body className="gap-4">
          <Select
            label={t('pages.hostel1')} required
            value={formData.hostelId}
            onChange={(e) => setFormData(p => ({ ...p, hostelId: e.target.value || "" }))}
            error={errors.hostelId}
          >
            {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pages.roomNumber')} required
              value={formData.roomNumber}
              onChange={(e) => setFormData(p => ({ ...p, roomNumber: e.target.value }))}
              error={errors.roomNumber}
            />
            <Input
              label={t('pages.floor')}
              type="number"
              value={String(formData.floor)}
              onChange={(e) => setFormData(p => ({ ...p, floor: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('pages.roomType')}
              value={formData.type}
              onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
            >
              {ROOM_TYPES.map(rt => <option key={rt.key} value={rt.key}>{rt.label}</option>)}
            </Select>
            <Input
              label={t('pages.capacity')} required type="number" min={1}
              value={String(formData.capacity)}
              onChange={(e) => setFormData(p => ({ ...p, capacity: e.target.value }))}
              error={errors.capacity}
            />
          </div>
          <Input
            label="Monthly Fee (₹)" type="number" min={0}
            value={String(formData.monthlyFee)}
            onChange={(e) => setFormData(p => ({ ...p, monthlyFee: e.target.value }))}
          />
          <div>
            <p className="text-sm font-medium text-fg mb-2">{t('pages.amenities')}</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <Chip
                  key={a}
                  color={formData.amenities.includes(a) ? "primary" : "neutral"}
                  selected={formData.amenities.includes(a)}
                  className="cursor-pointer"
                  onClick={() => toggleAmenity(a)}
                >
                  {a}
                </Chip>
              ))}
            </div>
          </div>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteRoomTitle')}
        message={t('confirm.deleteRoom')}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
