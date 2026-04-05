import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@heroui/react";
import { Plus, Search, DoorOpen, Edit2, Trash2, BedDouble } from "lucide-react";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

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
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    hostelApi.getHostels().then(d => setHostels(d.hostels || [])).catch(() => {});
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (hostelFilter) params.hostelId = hostelFilter;
      if (typeFilter) params.type = typeFilter;
      const data = await hostelApi.getRooms(params);
      setRooms(data.rooms || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error(t('toast.error.failedToLoadRooms'));
    } finally {
      setIsLoading(false);
    }
  }, [search, hostelFilter, typeFilter, page]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const validateForm = () => {
    const e = {};
    if (!formData.hostelId) e.hostelId = "Hostel is required";
    if (!formData.roomNumber.trim()) e.roomNumber = "Room number is required";
    if (!formData.capacity || formData.capacity < 1) e.capacity = "Capacity must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
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
    if (room.occupiedBeds >= room.capacity) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    if (room.occupiedBeds > 0) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
  };

  if (isLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={6} />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <Input
            placeholder={t('pages.searchRooms')}
            startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
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
            {ROOM_TYPES.map(t => <SelectItem key={t.key}>{t.label}</SelectItem>)}
          </Select>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleAdd} size="sm">
          Add Room
        </Button>
      </div>

      {/* Rooms Table */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <DoorOpen size={40} className="mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
          <p className="text-gray-500 dark:text-zinc-400">{t('pages.noRoomsFound')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.room')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.hostel1')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.floor')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.type1')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.occupancy')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.fee1')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">{t('pages.actions1')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {rooms.map((room) => (
                  <tr key={room._id} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{room.roomNumber}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{room.hostelId?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{room.floor}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat" className="capitalize">{room.type}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${occupancyColor(room)}`}>
                        <BedDouble size={12} />
                        {room.occupiedBeds}/{room.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                      {room.monthlyFee ? `₹${room.monthlyFee.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(room)}>
                          <Edit2 size={14} className="text-gray-500 dark:text-zinc-400" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" onPress={() => setDeleteTarget(room._id)}>
                          <Trash2 size={14} className="text-red-500" />
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
              <span className="flex items-center text-sm text-gray-600 dark:text-zinc-400">Page {page} of {totalPages}</span>
              <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(p => p + 1)}>{t('pages.next')}</Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Room Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-gray-900 dark:text-zinc-100">
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
                {ROOM_TYPES.map(t => <SelectItem key={t.key}>{t.label}</SelectItem>)}
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
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t('pages.amenities')}</p>
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
        title={t('confirm.deleteRoom')}
        message={t('confirm.deleteRoom')}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
