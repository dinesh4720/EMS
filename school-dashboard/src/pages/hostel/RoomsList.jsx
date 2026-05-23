import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@heroui/react";
import { Plus, Search, DoorOpen, Edit2, Trash2, BedDouble } from "lucide-react";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { ConfirmDialog, EmptyState, ErrorState } from '../../components/ui';
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
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
            startContent={<Search size={16} className="text-fg-faint" />}
            value={searchInput}
            onValueChange={setSearchInput}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder={t('pages.allHostels')}
            selectedKeys={hostelFilter ? [hostelFilter] : []}
            onSelectionChange={(keys) => { setHostelFilter([...keys][0] || ""); setPage(1); }}
            className="max-w-[180px]"
            size="sm"
          >
            {hostels.map(h => <SelectItem key={h._id}>{h.name}</SelectItem>)}
          </Select>
          <Select
            placeholder={t('pages.allTypes1')}
            selectedKeys={typeFilter ? [typeFilter] : []}
            onSelectionChange={(keys) => { setTypeFilter([...keys][0] || ""); setPage(1); }}
            className="max-w-[150px]"
            size="sm"
          >
            {ROOM_TYPES.map(rt => <SelectItem key={rt.key}>{rt.label}</SelectItem>)}
          </Select>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleAdd} size="sm">
          Add Room
        </Button>
      </div>

      {/* Rooms Table */}
      {rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title={t('pages.noRoomsFound')}
          action={
            <Button color="primary" size="sm" startContent={<Plus size={14} />} onPress={handleAdd}>
              Add Room
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border-token">
            <table className="w-full text-sm">
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
                {rooms.map((room) => (
                  <tr key={room._id} className="bg-surface hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-fg">{room.roomNumber}</td>
                    <td className="px-4 py-3 text-fg-muted">{room.hostelId?.name || "—"}</td>
                    <td className="px-4 py-3 text-fg-muted">{room.floor}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat" className="capitalize">{room.type}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${occupancyColor(room)}`}>
                        <BedDouble size={12} />
                        {room.occupiedBeds}/{room.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {room.monthlyFee ? `₹${room.monthlyFee.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button isIconOnly size="sm" variant="light" aria-label="Edit room" onPress={() => handleEdit(room)}>
                          <Edit2 size={14} className="text-fg-muted" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" aria-label="Delete room" onPress={() => setDeleteTarget(room._id)}>
                          <Trash2 size={14} className="text-danger" />
                        </Button>
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
              <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage(p => p - 1)}>{t('pages.previous')}</Button>
              <span className="flex items-center text-sm text-fg-muted">Page {page} of {totalPages}</span>
              <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(p => p + 1)}>{t('pages.next')}</Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Room Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-fg">
            {editingId ? "Edit Room" : "Add Room"}
          </ModalHeader>
          <ModalBody className="gap-4">
            <Select
              label={t('pages.hostel1')} isRequired
              selectedKeys={formData.hostelId ? [formData.hostelId] : []}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, hostelId: [...keys][0] || "" }))}
              isInvalid={!!errors.hostelId} errorMessage={errors.hostelId}
            >
              {hostels.map(h => <SelectItem key={h._id}>{h.name}</SelectItem>)}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('pages.roomNumber')} isRequired
                value={formData.roomNumber}
                onValueChange={(v) => setFormData(p => ({ ...p, roomNumber: v }))}
                isInvalid={!!errors.roomNumber} errorMessage={errors.roomNumber}
              />
              <Input
                label={t('pages.floor')}
                type="number"
                value={String(formData.floor)}
                onValueChange={(v) => setFormData(p => ({ ...p, floor: v }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('pages.roomType')}
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) => setFormData(p => ({ ...p, type: [...keys][0] }))}
              >
                {ROOM_TYPES.map(rt => <SelectItem key={rt.key}>{rt.label}</SelectItem>)}
              </Select>
              <Input
                label={t('pages.capacity')} isRequired type="number" min={1}
                value={String(formData.capacity)}
                onValueChange={(v) => setFormData(p => ({ ...p, capacity: v }))}
                isInvalid={!!errors.capacity} errorMessage={errors.capacity}
              />
            </div>
            <Input
              label="Monthly Fee (₹)" type="number" min={0}
              value={String(formData.monthlyFee)}
              onValueChange={(v) => setFormData(p => ({ ...p, monthlyFee: v }))}
            />
            <div>
              <p className="text-sm font-medium text-fg mb-2">{t('pages.amenities')}</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map(a => (
                  <Chip
                    key={a}
                    variant={formData.amenities.includes(a) ? "solid" : "bordered"}
                    color={formData.amenities.includes(a) ? "primary" : "default"}
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
