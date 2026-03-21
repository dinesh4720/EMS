import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@heroui/react";
import { Plus, Search, Users, LogOut, Calendar } from "lucide-react";
import { hostelApi, studentsApi } from "../../services/api";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  hostelId: "", roomId: "", studentId: "", bedNumber: "",
  startDate: new Date().toISOString().split("T")[0], monthlyFee: 0, notes: "",
};

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-4">
          <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse flex-1" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function AllocationsList() {
  const [allocations, setAllocations] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [hostelFilter, setHostelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [vacatingId, setVacatingId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isVacateOpen, onOpen: onVacateOpen, onClose: onVacateClose } = useDisclosure();
  const [vacateData, setVacateData] = useState({ endDate: new Date().toISOString().split("T")[0], notes: "" });

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    hostelApi.getHostels().then(d => setHostels(d.hostels || [])).catch(() => {});
    studentsApi.list({ limit: 500 }).then(d => setStudents(d.data || [])).catch(() => {});
  }, []);

  // Load rooms when hostel changes in form
  useEffect(() => {
    if (formData.hostelId) {
      hostelApi.getRooms({ hostelId: formData.hostelId, available: true })
        .then(d => setRooms(d.rooms || []))
        .catch(() => {});
    } else {
      setRooms([]);
    }
  }, [formData.hostelId]);

  const fetchAllocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (hostelFilter) params.hostelId = hostelFilter;
      const data = await hostelApi.getAllocations(params);
      setAllocations(data.allocations || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load allocations");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, hostelFilter, page]);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const validateForm = () => {
    const e = {};
    if (!formData.hostelId) e.hostelId = "Hostel is required";
    if (!formData.roomId) e.roomId = "Room is required";
    if (!formData.studentId) e.studentId = "Student is required";
    if (!formData.startDate) e.startDate = "Start date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        monthlyFee: Number(formData.monthlyFee) || 0,
      };
      await hostelApi.createAllocation(payload);
      toast.success("Student allocated successfully");
      handleClose();
      fetchAllocations();
    } catch (err) {
      toast.error(err?.message || "Failed to allocate student");
    } finally {
      setSaving(false);
    }
  };

  const handleVacate = async () => {
    if (!vacatingId) return;
    setSaving(true);
    try {
      await hostelApi.vacateAllocation(vacatingId, vacateData);
      toast.success("Student vacated");
      onVacateClose();
      setVacatingId(null);
      fetchAllocations();
    } catch (err) {
      toast.error(err?.message || "Failed to vacate");
    } finally {
      setSaving(false);
    }
  };

  const openVacateModal = (allocationId) => {
    setVacatingId(allocationId);
    setVacateData({ endDate: new Date().toISOString().split("T")[0], notes: "" });
    onVacateOpen();
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  const handleAdd = () => {
    setFormData({ ...INITIAL_FORM, hostelId: hostelFilter || "" });
    setErrors({});
    onOpen();
  };

  const statusColors = { active: "success", vacated: "default", transferred: "warning" };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (isLoading) return <SkeletonTable />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <Input
            placeholder="Search student..."
            startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
            value={searchInput}
            onValueChange={setSearchInput}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder="All Hostels"
            selectedKeys={hostelFilter ? [hostelFilter] : []}
            onSelectionChange={(keys) => { setHostelFilter([...keys][0] || ""); setPage(1); }}
            className="max-w-[180px]"
            size="sm"
          >
            {hostels.map(h => <SelectItem key={h._id}>{h.name}</SelectItem>)}
          </Select>
          <Select
            placeholder="Status"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => { setStatusFilter([...keys][0] || ""); setPage(1); }}
            className="max-w-[140px]"
            size="sm"
          >
            <SelectItem key="active">Active</SelectItem>
            <SelectItem key="vacated">Vacated</SelectItem>
            <SelectItem key="transferred">Transferred</SelectItem>
          </Select>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleAdd} size="sm">
          Allocate Student
        </Button>
      </div>

      {/* Allocations Table */}
      {allocations.length === 0 ? (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
          <p className="text-gray-500 dark:text-zinc-400">No allocations found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Adm No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Hostel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Room</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Bed</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">From</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {allocations.map((alloc) => (
                  <tr key={alloc._id} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">
                      {alloc.studentName || alloc.studentId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                      {alloc.admissionNo || alloc.studentId?.admissionNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                      {alloc.hostelName || alloc.hostelId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                      {alloc.roomNumber || alloc.roomId?.roomNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{alloc.bedNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(alloc.startDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Chip size="sm" color={statusColors[alloc.status]} variant="flat" className="capitalize">
                        {alloc.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {alloc.status === "active" && (
                        <Button
                          size="sm" variant="flat" color="warning"
                          startContent={<LogOut size={14} />}
                          onPress={() => openVacateModal(alloc._id)}
                        >
                          Vacate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center text-sm text-gray-600 dark:text-zinc-400">Page {page} of {totalPages}</span>
              <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* Add Allocation Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-gray-900 dark:text-zinc-100">Allocate Student to Room</ModalHeader>
          <ModalBody className="gap-4">
            <Select
              label="Student" isRequired
              selectedKeys={formData.studentId ? [formData.studentId] : []}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, studentId: [...keys][0] || "" }))}
              isInvalid={!!errors.studentId} errorMessage={errors.studentId}
            >
              {students.map(s => (
                <SelectItem key={s._id}>
                  {s.name} {s.admissionNo ? `(${s.admissionNo})` : ""}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Hostel" isRequired
              selectedKeys={formData.hostelId ? [formData.hostelId] : []}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, hostelId: [...keys][0] || "", roomId: "" }))}
              isInvalid={!!errors.hostelId} errorMessage={errors.hostelId}
            >
              {hostels.map(h => <SelectItem key={h._id}>{h.name}</SelectItem>)}
            </Select>
            <Select
              label="Room" isRequired
              selectedKeys={formData.roomId ? [formData.roomId] : []}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, roomId: [...keys][0] || "" }))}
              isInvalid={!!errors.roomId} errorMessage={errors.roomId}
              isDisabled={!formData.hostelId}
              description={!formData.hostelId ? "Select a hostel first" : ""}
            >
              {rooms.map(r => (
                <SelectItem key={r._id}>
                  {r.roomNumber} — {r.occupiedBeds}/{r.capacity} beds ({r.type})
                </SelectItem>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bed Number"
                value={formData.bedNumber}
                onValueChange={(v) => setFormData(p => ({ ...p, bedNumber: v }))}
                placeholder="e.g. B1"
              />
              <Input
                label="Start Date" isRequired type="date"
                value={formData.startDate}
                onValueChange={(v) => setFormData(p => ({ ...p, startDate: v }))}
                isInvalid={!!errors.startDate} errorMessage={errors.startDate}
              />
            </div>
            <Input
              label="Monthly Fee (₹)" type="number" min={0}
              value={String(formData.monthlyFee)}
              onValueChange={(v) => setFormData(p => ({ ...p, monthlyFee: v }))}
            />
            <Input
              label="Notes"
              value={formData.notes}
              onValueChange={(v) => setFormData(p => ({ ...p, notes: v }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>Cancel</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={saving}>
              Allocate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Vacate Modal */}
      <Modal isOpen={isVacateOpen} onClose={onVacateClose} size="md">
        <ModalContent>
          <ModalHeader className="text-gray-900 dark:text-zinc-100">Vacate Student</ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-sm text-gray-600 dark:text-zinc-400">Mark this allocation as vacated. The room bed will be freed up.</p>
            <Input
              label="End Date" type="date"
              value={vacateData.endDate}
              onValueChange={(v) => setVacateData(p => ({ ...p, endDate: v }))}
            />
            <Input
              label="Notes"
              value={vacateData.notes}
              onValueChange={(v) => setVacateData(p => ({ ...p, notes: v }))}
              placeholder="Reason for vacating..."
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onVacateClose}>Cancel</Button>
            <Button color="warning" onPress={handleVacate} isLoading={saving}>
              Confirm Vacate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
