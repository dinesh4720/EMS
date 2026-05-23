import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@heroui/react";
import { Plus, Search, Users, LogOut, Calendar } from "lucide-react";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useHostelLookups } from "../../hooks/useHostelLookups";
import { getDateLocale } from '../../i18n/index';
import { toTodayDateString } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { EmptyState, ErrorState } from '../../components/ui';
import { hostelAllocationSchema, parseFormSchema } from '../../validators/formSchemas';


const INITIAL_FORM = {
  hostelId: "", roomId: "", studentId: "", bedNumber: "",
  startDate: toTodayDateString(), monthlyFee: 0, notes: "",
};

export default function AllocationsList() {
  const { t } = useTranslation();
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
  const [vacateData, setVacateData] = useState({ endDate: toTodayDateString(), notes: "" });
  // Student search term for the async dropdown (MF-24)
  const [studentSearch, setStudentSearch] = useState("");

  // Lookup data (hostels, rooms, students) — students are fetched via debounced search
  const { hostels, rooms, students, studentsLoading } = useHostelLookups(formData.hostelId, studentSearch);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAllocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (hostelFilter) params.hostelId = hostelFilter;
      const data = await hostelApi.getAllocations(params);
      setAllocations(data.allocations || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setLoadError(err);
      toast.error(t('toast.error.failedToLoadAllocations'));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, hostelFilter, page, t]);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const validateForm = () => {
    const { success, errors: zodErrors } = parseFormSchema(hostelAllocationSchema, formData);
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
        monthlyFee: Number(formData.monthlyFee) || 0,
      };
      await hostelApi.createAllocation(payload);
      toast.success(t('toast.success.studentAllocatedSuccessfully'));
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
      toast.success(t('toast.success.studentVacated'));
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
    setVacateData({ endDate: toTodayDateString(), notes: "" });
    onVacateOpen();
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setStudentSearch("");
    onClose();
  };

  const handleAdd = () => {
    setFormData({ ...INITIAL_FORM, hostelId: hostelFilter || "" });
    setErrors({});
    onOpen();
  };

  const statusColors = { active: "success", vacated: "default", transferred: "warning" };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(getDateLocale(), { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (isLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={6} />;

  if (loadError) {
    return <ErrorState error={loadError} onRetry={fetchAllocations} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <Input
            placeholder={t('pages.searchStudent')}
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
            placeholder={t('pages.status2')}
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => { setStatusFilter([...keys][0] || ""); setPage(1); }}
            className="max-w-[140px]"
            size="sm"
          >
            <SelectItem key="active">{t('pages.active')}</SelectItem>
            <SelectItem key="vacated">{t('pages.vacated')}</SelectItem>
            <SelectItem key="transferred">{t('pages.transferred')}</SelectItem>
          </Select>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleAdd} size="sm">
          Allocate Student
        </Button>
      </div>

      {/* Allocations Table */}
      {allocations.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('pages.noAllocationsFound')}
          action={
            <Button color="primary" size="sm" startContent={<Plus size={14} />} onPress={handleAdd}>
              Allocate Student
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border-token">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-border-token">
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.student')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.admNo')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.hostel1')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.room')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.bed')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.from')}</th>
                  <th className="text-left px-4 py-3 font-medium text-fg">{t('pages.status2')}</th>
                  <th className="text-right px-4 py-3 font-medium text-fg">{t('pages.actions1')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {allocations.map((alloc) => (
                  <tr key={alloc._id} className="bg-surface hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-fg">
                      {alloc.studentName || alloc.studentId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {alloc.admissionNo || alloc.studentId?.admissionNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {alloc.hostelName || alloc.hostelId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {alloc.roomNumber || alloc.roomId?.roomNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{alloc.bedNumber || "—"}</td>
                    <td className="px-4 py-3 text-fg-muted">
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
              <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage(p => p - 1)}>{t('pages.previous')}</Button>
              <span className="flex items-center text-sm text-fg-muted">Page {page} of {totalPages}</span>
              <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(p => p + 1)}>{t('pages.next')}</Button>
            </div>
          )}
        </>
      )}

      {/* Add Allocation Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-fg">{t('pages.allocateStudentToRoom')}</ModalHeader>
          <ModalBody className="gap-4">
            {/* Server-side student search — replaces bulk limit:500 fetch (MF-24) */}
            <Input
              label={t('pages.searchStudent')}
              placeholder={t('hostel.searchStudentPlaceholder')}
              value={studentSearch}
              onValueChange={setStudentSearch}
              startContent={<Search size={14} className="text-fg-faint" />}
              isClearable
              onClear={() => setStudentSearch("")}
            />
            <Select
              label={t('pages.student')} isRequired
              selectedKeys={formData.studentId ? [formData.studentId] : []}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, studentId: [...keys][0] || "" }))}
              isInvalid={!!errors.studentId} errorMessage={errors.studentId}
              isLoading={studentsLoading}
              placeholder={studentSearch.length < 2 ? "Search a student above first" : studentsLoading ? "Searching..." : "Select student"}
            >
              {students.map(s => (
                <SelectItem key={s._id}>
                  {s.name} {s.admissionNo ? `(${s.admissionNo})` : ""}
                </SelectItem>
              ))}
            </Select>
            <Select
              label={t('pages.hostel1')} isRequired
              selectedKeys={formData.hostelId ? [formData.hostelId] : []}
              onSelectionChange={(keys) => setFormData(p => ({ ...p, hostelId: [...keys][0] || "", roomId: "" }))}
              isInvalid={!!errors.hostelId} errorMessage={errors.hostelId}
            >
              {hostels.map(h => <SelectItem key={h._id}>{h.name}</SelectItem>)}
            </Select>
            <Select
              label={t('pages.room')} isRequired
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
                label={t('pages.bedNumber')}
                value={formData.bedNumber}
                onValueChange={(v) => setFormData(p => ({ ...p, bedNumber: v }))}
                placeholder={t('hostel.bedNumberPlaceholder')}
              />
              <Input
                label={t('pages.startDate1')} isRequired type="date"
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
              label={t('pages.notes1')}
              value={formData.notes}
              onValueChange={(v) => setFormData(p => ({ ...p, notes: v }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>{t('pages.cancel2')}</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={saving}>
              Allocate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Vacate Modal */}
      <Modal isOpen={isVacateOpen} onClose={onVacateClose} size="md">
        <ModalContent>
          <ModalHeader className="text-fg">{t('pages.vacateStudent')}</ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-sm text-fg-muted">{t('pages.markThisAllocationAsVacatedTheRoomBedWillBeFreedUp')}</p>
            <Input
              label={t('pages.endDate1')} type="date"
              value={vacateData.endDate}
              onValueChange={(v) => setVacateData(p => ({ ...p, endDate: v }))}
            />
            <Input
              label={t('pages.notes1')}
              value={vacateData.notes}
              onValueChange={(v) => setVacateData(p => ({ ...p, notes: v }))}
              placeholder={t('pages.reasonForVacating')}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onVacateClose}>{t('pages.cancel2')}</Button>
            <Button color="warning" onPress={handleVacate} isLoading={saving}>
              Confirm Vacate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
