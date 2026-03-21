import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@heroui/react";
import { Plus, Search, Building2, Edit2, Trash2, Users, DoorOpen } from "lucide-react";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  name: "", type: "boys", wardenName: "", wardenPhone: "", wardenEmail: "",
  address: "", description: "",
};

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function HostelList() {
  const [hostels, setHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchHostels = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const data = await hostelApi.getHostels(params);
      setHostels(data.hostels || []);
    } catch {
      toast.error("Failed to load hostels");
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.type) e.type = "Type is required";
    if (formData.wardenEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.wardenEmail)) {
      e.wardenEmail = "Invalid email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingId) {
        await hostelApi.updateHostel(editingId, formData);
        toast.success("Hostel updated");
      } else {
        await hostelApi.createHostel(formData);
        toast.success("Hostel created");
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
      wardenName: hostel.wardenName || "", wardenPhone: hostel.wardenPhone || "",
      wardenEmail: hostel.wardenEmail || "", address: hostel.address || "",
      description: hostel.description || "",
    });
    setErrors({});
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hostel? This cannot be undone.")) return;
    try {
      await hostelApi.deleteHostel(id);
      toast.success("Hostel deleted");
      fetchHostels();
    } catch (err) {
      toast.error(err?.message || "Failed to delete hostel");
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

  if (isLoading) return <SkeletonCards />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <Input
            placeholder="Search hostels..."
            startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
            value={searchInput}
            onValueChange={setSearchInput}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder="All Types"
            selectedKeys={typeFilter ? [typeFilter] : []}
            onSelectionChange={(keys) => setTypeFilter([...keys][0] || "")}
            className="max-w-[150px]"
            size="sm"
          >
            <SelectItem key="boys">Boys</SelectItem>
            <SelectItem key="girls">Girls</SelectItem>
            <SelectItem key="mixed">Mixed</SelectItem>
          </Select>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleAdd} size="sm">
          Add Hostel
        </Button>
      </div>

      {/* Hostel Cards */}
      {hostels.length === 0 ? (
        <div className="text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
          <p className="text-gray-500 dark:text-zinc-400">No hostels found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{hostel.name}</h3>
                  <Chip size="sm" color={typeColors[hostel.type]} variant="flat" className="mt-1 capitalize">
                    {hostel.type}
                  </Chip>
                </div>
                <div className="flex gap-1">
                  <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(hostel)}>
                    <Edit2 size={14} className="text-gray-500 dark:text-zinc-400" />
                  </Button>
                  <Button isIconOnly size="sm" variant="light" onPress={() => handleDelete(hostel._id)}>
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <DoorOpen size={14} />
                  <span>{hostel.totalRooms || 0} rooms</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <Users size={14} />
                  <span>{hostel.occupiedBeds || 0} / {hostel.totalCapacity || 0} beds occupied</span>
                </div>
                {hostel.wardenName && (
                  <p className="text-gray-500 dark:text-zinc-400">Warden: {hostel.wardenName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Hostel Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-gray-900 dark:text-zinc-100">
            {editingId ? "Edit Hostel" : "Add Hostel"}
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Hostel Name" isRequired
              value={formData.name}
              onValueChange={(v) => setFormData(p => ({ ...p, name: v }))}
              isInvalid={!!errors.name} errorMessage={errors.name}
            />
            <Select
              label="Type" isRequired
              selectedKeys={[formData.type]}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, type: [...keys][0] }))}
              isInvalid={!!errors.type} errorMessage={errors.type}
            >
              <SelectItem key="boys">Boys</SelectItem>
              <SelectItem key="girls">Girls</SelectItem>
              <SelectItem key="mixed">Mixed</SelectItem>
            </Select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Warden Name"
                value={formData.wardenName}
                onValueChange={(v) => setFormData(p => ({ ...p, wardenName: v }))}
              />
              <Input
                label="Warden Phone"
                value={formData.wardenPhone}
                onValueChange={(v) => setFormData(p => ({ ...p, wardenPhone: v }))}
              />
            </div>
            <Input
              label="Warden Email"
              value={formData.wardenEmail}
              onValueChange={(v) => setFormData(p => ({ ...p, wardenEmail: v }))}
              isInvalid={!!errors.wardenEmail} errorMessage={errors.wardenEmail}
            />
            <Input
              label="Address"
              value={formData.address}
              onValueChange={(v) => setFormData(p => ({ ...p, address: v }))}
            />
            <Input
              label="Description"
              value={formData.description}
              onValueChange={(v) => setFormData(p => ({ ...p, description: v }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>Cancel</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={saving}>
              {editingId ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
