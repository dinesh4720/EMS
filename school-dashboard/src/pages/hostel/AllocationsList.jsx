import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Users, LogOut, Calendar, Printer } from "lucide-react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { IconButton } from "../../components/ui";
import Modal from "../../components/ui/Modal";
import Chip from "../../components/ui/Chip";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useHostelLookups } from "../../hooks/useHostelLookups";
import { getDateLocale } from '../../i18n/index';
import { toTodayDateString } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { EmptyState, ErrorState } from '../../components/ui';
import ExportMenu from '../../components/ui/ExportMenu';
import PrintPreviewModal from '../../components/ui/PrintPreviewModal';
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
  const [roomFilter, setRoomFilter] = useState("");
  const [page, setPage] = useState(1);
  const [printOpen, setPrintOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [vacatingId, setVacatingId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const onVacateOpen = () => setIsVacateOpen(true);
  const onVacateClose = () => setIsVacateOpen(false);
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

  const statusColors = { active: "success", vacated: "neutral", transferred: "warning" };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(getDateLocale(), { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const filteredAllocations = allocations.filter((a) => {
    if (roomFilter && (a.roomId?._id || a.roomId) !== roomFilter) return false;
    return true;
  });

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
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
            size="sm"
          />
          <Select
            placeholder={t('pages.allHostels')}
            value={hostelFilter}
            onChange={(e) => { setHostelFilter(e.target.value); setPage(1); }}
            className="max-w-[180px]"
            size="sm"
          >
            <option value="">{t('pages.allHostels')}</option>
            {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </Select>
          <Select
            placeholder="Room"
            value={roomFilter}
            onChange={(e) => { setRoomFilter(e.target.value); setPage(1); }}
            className="max-w-[180px]"
            size="sm"
          >
            <option value="">All Rooms</option>
            {rooms.map(r => <option key={r._id} value={r._id}>{r.roomNumber}</option>)}
          </Select>
          <Select
            placeholder={t('pages.status2')}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="max-w-[140px]"
            size="sm"
          >
            <option value="active">{t('pages.active')}</option>
            <option value="vacated">{t('pages.vacated')}</option>
            <option value="transferred">{t('pages.transferred')}</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            rows={filteredAllocations}
            columns={[
              { key: "student", label: "Student", accessor: (a) => a.studentName || a.studentId?.name || "—" },
              { key: "admissionNo", label: "Adm No", accessor: (a) => a.admissionNo || a.studentId?.admissionNo || "—" },
              { key: "hostel", label: "Hostel", accessor: (a) => a.hostelName || a.hostelId?.name || "—" },
              { key: "room", label: "Room", accessor: (a) => a.roomNumber || a.roomId?.roomNumber || "—" },
              { key: "bed", label: "Bed", accessor: (a) => a.bedNumber || "—" },
              { key: "startDate", label: "From", accessor: (a) => formatDate(a.startDate) },
              { key: "status", label: "Status" },
            ]}
            filename="allocations"
            title="Student Allocations"
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
            Allocate Student
          </Button>
        </div>
      </div>

      {/* Allocations Table */}
      {filteredAllocations.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('pages.noAllocationsFound')}
          action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleAdd}>
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
                {filteredAllocations.map((alloc) => (
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
                      <Chip size="sm" color={statusColors[alloc.status]} className="capitalize">
                        {alloc.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {alloc.status === "active" && (
                        <Button
                          size="sm" variant="danger"
                          icon={<LogOut size={14} />}
                          onClick={() => openVacateModal(alloc._id)}
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
        title="Student Allocations"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Student Allocations</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Student</th>
                <th className="text-left py-2 px-3">Adm No</th>
                <th className="text-left py-2 px-3">Hostel</th>
                <th className="text-left py-2 px-3">Room</th>
                <th className="text-left py-2 px-3">Bed</th>
                <th className="text-left py-2 px-3">From</th>
                <th className="text-left py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((alloc) => (
                <tr key={alloc._id} className="border-b">
                  <td className="py-2 px-3">{alloc.studentName || alloc.studentId?.name || "—"}</td>
                  <td className="py-2 px-3">{alloc.admissionNo || alloc.studentId?.admissionNo || "—"}</td>
                  <td className="py-2 px-3">{alloc.hostelName || alloc.hostelId?.name || "—"}</td>
                  <td className="py-2 px-3">{alloc.roomNumber || alloc.roomId?.roomNumber || "—"}</td>
                  <td className="py-2 px-3">{alloc.bedNumber || "—"}</td>
                  <td className="py-2 px-3">{formatDate(alloc.startDate)}</td>
                  <td className="py-2 px-3">{alloc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>

      {/* Add Allocation Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
        <Modal.Header>{t('pages.allocateStudentToRoom')}</Modal.Header>
        <Modal.Body className="gap-4">
          {/* Server-side student search — replaces bulk limit:500 fetch (MF-24) */}
          <Input
            label={t('pages.searchStudent')}
            placeholder={t('hostel.searchStudentPlaceholder')}
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            startContent={<Search size={14} className="text-fg-faint" />}
          />
          <Select
            label={t('pages.student')} isRequired
            value={formData.studentId}
            onChange={(e) => setFormData(p => ({ ...p, studentId: e.target.value || "" }))}
            isInvalid={!!errors.studentId} errorMessage={errors.studentId}
            placeholder={studentSearch.length < 2 ? "Search a student above first" : studentsLoading ? "Searching..." : "Select student"}
          >
            {students.map(s => (
              <option key={s._id} value={s._id}>
                {s.name} {s.admissionNo ? `(${s.admissionNo})` : ""}
              </option>
            ))}
          </Select>
          <Select
            label={t('pages.hostel1')} isRequired
            value={formData.hostelId}
            onChange={(e) => setFormData(p => ({ ...p, hostelId: e.target.value || "", roomId: "" }))}
            isInvalid={!!errors.hostelId} errorMessage={errors.hostelId}
          >
            {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </Select>
          <Select
            label={t('pages.room')} isRequired
            value={formData.roomId}
            onChange={(e) => setFormData(p => ({ ...p, roomId: e.target.value || "" }))}
            isInvalid={!!errors.roomId} errorMessage={errors.roomId}
            disabled={!formData.hostelId}
            description={!formData.hostelId ? "Select a hostel first" : ""}
          >
            {rooms.map(r => (
              <option key={r._id} value={r._id}>
                {r.roomNumber} — {r.occupiedBeds}/{r.capacity} beds ({r.type})
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pages.bedNumber')}
              value={formData.bedNumber}
              onChange={(e) => setFormData(p => ({ ...p, bedNumber: e.target.value }))}
              placeholder={t('hostel.bedNumberPlaceholder')}
            />
            <Input
              label={t('pages.startDate1')} isRequired type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
              isInvalid={!!errors.startDate} errorMessage={errors.startDate}
            />
          </div>
          <Input
            label="Monthly Fee (₹)" type="number" min={0}
            value={String(formData.monthlyFee)}
            onChange={(e) => setFormData(p => ({ ...p, monthlyFee: e.target.value }))}
          />
          <Input
            label={t('pages.notes1')}
            value={formData.notes}
            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={handleClose}>{t('pages.cancel2')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Allocate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Vacate Modal */}
      <Modal isOpen={isVacateOpen} onClose={onVacateClose} size="md">
        <Modal.Header>{t('pages.vacateStudent')}</Modal.Header>
        <Modal.Body className="gap-4">
          <p className="text-sm text-fg-muted">{t('pages.markThisAllocationAsVacatedTheRoomBedWillBeFreedUp')}</p>
          <Input
            label={t('pages.endDate1')} type="date"
            value={vacateData.endDate}
            onChange={(e) => setVacateData(p => ({ ...p, endDate: e.target.value }))}
          />
          <Input
            label={t('pages.notes1')}
            value={vacateData.notes}
            onChange={(e) => setVacateData(p => ({ ...p, notes: e.target.value }))}
            placeholder={t('pages.reasonForVacating')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onVacateClose}>{t('pages.cancel2')}</Button>
          <Button variant="danger" onClick={handleVacate} loading={saving}>
            Confirm Vacate
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
