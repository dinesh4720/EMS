/**
 * useStudentsListData
 * Encapsulates all state, data-fetching, filtering, and action logic
 * for the StudentsList page. The component only renders.
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
// useDisclosure replaced with local useState per design-system compliance
import { useDebounce } from "../../../hooks/useDebounce";

import { useApp } from "../../../context/AppContext";
import { studentsApi } from "../../../services/api";
import { useBatchStudentFees } from "./useStudentFees";
import { useStudentsUpload } from "../components/list/StudentsUpload";
import { safeGetItem, safeSetItem } from "../../../utils/safeStorage";
import { ALL_COLUMNS } from "../utils/studentImportUtils";
import { getNextClass } from "../utils/studentHelpers";
import { request } from "../../../services/api.js";
import { getSocketService } from "../../../services/socketServiceEnhanced.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  computeStatusCounts,
  filterByAcademicPerformance,
  filterByAttendance,
  sortWithPinned,
  computeActiveFiltersCount,
  computeFilterCounts,
  resolveSelectedIds,
  clampPageSize,
  serverFiltersChanged,
} from "./useStudentsListData.helpers";
import logger from '../../../utils/logger';

const ROW_HEIGHT = 65;
const DEFAULT_STUDENTS_PAGE_SIZE = 100;

export function useStudentsListData() {
  const { t } = useTranslation();
  const {
    deleteStudent,
    updateStudent,
    loading: contextLoading,
    classes,
    currentAcademicYear,
  } = useApp();
  const queryClient = useQueryClient();

  // ── Filter state (restored from sessionStorage) ──────────────────────────
  // Filter state restored from sessionStorage.
  // class is single-select (maps to API classId). Others are multi-select arrays.
  const parseArrayFilter = (key) => {
    const raw = sessionStorage.getItem(`students-filter-${key}`);
    if (!raw || raw === 'all') return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : parsed !== 'all' ? [parsed] : [];
    } catch {
      return raw !== 'all' ? [raw] : [];
    }
  };
  const parseClassFilter = () => {
    const raw = sessionStorage.getItem('students-filter-class');
    if (!raw || raw === 'all') return 'all';
    try {
      const parsed = JSON.parse(raw);
      // Migrate from previous array storage back to string
      if (Array.isArray(parsed)) {
        const first = parsed[0] || 'all';
        sessionStorage.setItem('students-filter-class', first);
        return first;
      }
      return parsed !== 'all' ? parsed : 'all';
    } catch {
      return raw !== 'all' ? raw : 'all';
    }
  };

  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("students-filter-search") || "");
  const [classFilter, setClassFilter] = useState(() => parseClassFilter());
  const [feeStatusFilter, setFeeStatusFilter] = useState(() => parseArrayFilter("feeStatus"));
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem("students-filter-status") || "active");
  const [academicYearFilter, setAcademicYearFilter] = useState(() => parseArrayFilter("academicYear"));
  const [academicPerformanceFilter, setAcademicPerformanceFilter] = useState(() => parseArrayFilter("academicPerformance"));
  const [attendanceFilter, setAttendanceFilter] = useState(() => parseArrayFilter("attendance"));
  const [localStudents, setLocalStudents] = useState(null);
  const deferredSearchQuery = useDebounce(searchQuery.trim(), 300);

  // ── Dropdown open/close state ─────────────────────────────────────────────
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // ── Fee structure cache ───────────────────────────────────────────────────
  const [studentFeeStructures, setStudentFeeStructures] = useState({});

  // ── Table refs ────────────────────────────────────────────────────────────
  const tableContainerRef = useRef(null);

  // ── Sort state ────────────────────────────────────────────────────────────
  const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));

  // ── Server pagination state (PAG-04 / SCH-102) ────────────────────────────
  // Real server pagination replaces the previous `limit: 0` (fetch-all) call,
  // which was re-downloading every student on load + every filter/search
  // keystroke. The backend already caps `limit` at 100/page and returns the
  // pagination envelope consumed below.
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_STUDENTS_PAGE_SIZE);

  // ── Phone inline editing ──────────────────────────────────────────────────
  const [editingPhoneId, setEditingPhoneId] = useState(null);
  const [phoneInput, setPhoneInput] = useState("");

  // ── Edit drawer state ─────────────────────────────────────────────────────
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── Column visibility ─────────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = safeGetItem("studentListColumns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validKeys = ALL_COLUMNS.map((col) => col.key);
        const validSaved = parsed.filter((key) => validKeys.includes(key));
        ALL_COLUMNS.forEach((col) => {
          if (col.required && !validSaved.includes(col.key)) validSaved.push(col.key);
        });
        return new Set(validSaved);
      } catch { /* fall through */ }
    }
    return new Set(ALL_COLUMNS.map((col) => col.key));
  });

  const toggleColumn = (columnKey) => {
    const column = ALL_COLUMNS.find((col) => col.key === columnKey);
    if (column?.required) return;
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) newSet.delete(columnKey);
      else newSet.add(columnKey);
      safeSetItem("studentListColumns", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const visibleColumnsArray = useMemo(
    () => ALL_COLUMNS.filter((col) => visibleColumns.has(col.key)),
    [visibleColumns]
  );

  // ── Modal disclosures ─────────────────────────────────────────────────────
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const onBulkActionOpen = () => setIsBulkActionOpen(true);
  const onBulkActionClose = () => setIsBulkActionOpen(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const onPromoteOpen = () => setIsPromoteOpen(true);
  const onPromoteClose = () => setIsPromoteOpen(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const onReminderOpen = () => setIsReminderOpen(true);
  const onReminderClose = () => setIsReminderOpen(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDeleteOpen = () => setIsDeleteOpen(true);
  const onDeleteClose = () => setIsDeleteOpen(false);
  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);
  const onStatusChangeOpen = () => setIsStatusChangeOpen(true);
  const onStatusChangeClose = () => setIsStatusChangeOpen(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const onCsvUploadOpen = () => setIsCsvUploadOpen(true);
  const onCsvUploadClose = () => setIsCsvUploadOpen(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const onPreviewOpen = () => setIsPreviewOpen(true);
  const onPreviewClose = () => setIsPreviewOpen(false);
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const onTcModalOpen = () => setIsTcModalOpen(true);
  const onTcModalClose = () => setIsTcModalOpen(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const onBulkDeleteOpen = () => setIsBulkDeleteOpen(true);
  const onBulkDeleteClose = () => setIsBulkDeleteOpen(false);

  // ── Bulk action state ─────────────────────────────────────────────────────
  const [bulkAction, setBulkAction] = useState("");
  const [bulkDeleteStudents, setBulkDeleteStudents] = useState([]);
  // promoteToClass state removed - was unused
  const [promotionPreview, setPromotionPreview] = useState([]);
  const [tcStudents, setTcStudents] = useState([]);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({ student: null, newStatus: "", action: "" });

  // ── Reminder / message state ──────────────────────────────────────────────
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderTargetCount, setReminderTargetCount] = useState(0);

  // ── Derived class helpers ─────────────────────────────────────────────────
  const uniqueClasses = useMemo(
    () =>
      [...new Set(classes.map((cls) => (cls.section ? `${cls.name}-${cls.section}` : cls.name)).filter(Boolean))].sort(),
    [classes]
  );

  const selectedClassId = useMemo(() => {
    if (classFilter === 'all') return null;
    const found = classes.find((cls) => {
      const label = cls.section ? `${cls.name}-${cls.section}` : cls.name;
      return label === classFilter;
    });
    return found?._id || found?.id || null;
  }, [classFilter, classes]);

  const sortParams = useMemo(
    () => ({
      sortBy: sortDescriptor.column === "class" ? "class" : "name",
      sortOrder: sortDescriptor.direction === "descending" ? "desc" : "asc",
    }),
    [sortDescriptor]
  );

  // ── React Query ───────────────────────────────────────────────────────────
  const studentsQueryKey = useMemo(
    () => [
      "students",
      "list",
      deferredSearchQuery,
      selectedClassId,
      feeStatusFilter.join(","),
      statusFilter,
      academicYearFilter.join(","),
      sortParams.sortBy,
      sortParams.sortOrder,
      currentPage,
      pageSize,
    ],
    [deferredSearchQuery, selectedClassId, feeStatusFilter, statusFilter, academicYearFilter, sortParams.sortBy, sortParams.sortOrder, currentPage, pageSize]
  );

  const studentsQuery = useQuery({
    queryKey: studentsQueryKey,
    queryFn: () =>
      studentsApi.list({
        page: currentPage,
        // The redesigned StudentsDataGrid paginates client-side over the loaded
        // batch (no server-page navigator in the redesign's look), so it needs
        // the full roster in one fetch. limit=0 opts into the backend's
        // noPagination mode (see routes/students/crud.js), which returns every
        // student and reports totalPages=1. Hook-level pagination state is kept
        // for any future server-paged consumer; the redesign ignores it.
        limit: 0,
        search: deferredSearchQuery || undefined,
        classId: selectedClassId || undefined,
        feeStatus: feeStatusFilter.length > 0 ? feeStatusFilter.join(",") : undefined,
        status: statusFilter !== "active" ? statusFilter : undefined,
        academicYear: academicYearFilter.length > 0 ? academicYearFilter.join(",") : undefined,
        sortBy: sortParams.sortBy,
        sortOrder: sortParams.sortOrder,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const students = useMemo(() => localStudents ?? studentsQuery.data?.data ?? [], [localStudents, studentsQuery.data]);
  const listLoading = studentsQuery.isLoading;
  const listError = studentsQuery.error;

  // PAG-04 (SCH-102): server pagination metadata. The backend always returns
  // a `pagination` envelope — even on the legacy `limit: 0` "no pagination"
  // path — so the consumer can drive a real pager off this.
  const serverPagination = useMemo(
    () =>
      studentsQuery.data?.pagination ?? {
        currentPage,
        totalPages: 1,
        totalItems: students.length,
        itemsPerPage: pageSize,
        hasNextPage: false,
        hasPrevPage: currentPage > 1,
      },
    [studentsQuery.data, currentPage, pageSize, students.length]
  );
  const totalPages = Math.max(1, serverPagination.totalPages ?? 1);
  const totalItems = serverPagination.totalItems ?? students.length;

  const uniqueAcademicYears = useMemo(
    () =>
      [...new Set([currentAcademicYear, ...students.map((student) => student.academicYear || currentAcademicYear)])].sort(),
    [students, currentAcademicYear]
  );

  useEffect(() => {
    setLocalStudents(null);
    setStudentFeeStructures({});
  }, [studentsQuery.data]);

  // PAG-04 (SCH-102): reset to page 1 whenever a server-side filter changes.
  // Client-only filters (academicPerformance, attendance) are NOT in
  // SERVER_FILTER_KEYS — they run over the current page and shouldn't
  // re-trigger a server fetch.
  const serverFilterSnapshot = useMemo(
    () => ({
      search: deferredSearchQuery,
      classId: selectedClassId,
      feeStatus: feeStatusFilter.join(","),
      status: statusFilter,
      academicYear: academicYearFilter.join(","),
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
    }),
    [
      deferredSearchQuery,
      selectedClassId,
      feeStatusFilter,
      statusFilter,
      academicYearFilter,
      sortParams.sortBy,
      sortParams.sortOrder,
    ]
  );
  const lastServerFilterSnapshotRef = useRef(serverFilterSnapshot);
  useEffect(() => {
    if (serverFiltersChanged(lastServerFilterSnapshotRef.current, serverFilterSnapshot)) {
      lastServerFilterSnapshotRef.current = serverFilterSnapshot;
      setCurrentPage(1);
    }
  }, [serverFilterSnapshot]);

  // After a server filter narrows the result set, the previous page may now
  // be empty. Clamp into the valid range so the user doesn't see a blank
  // table while the next refetch is in flight.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const setPageSizeClamped = useCallback((next) => {
    const clamped = clampPageSize(next, DEFAULT_STUDENTS_PAGE_SIZE);
    setPageSize(clamped);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (studentsQuery.error) {
      logger.error("Failed to load students list:", studentsQuery.error);
      toast.error(`Failed to load students: ${studentsQuery.error.message}`);
    }
  }, [studentsQuery.error]);

  const refreshStudentsList = useCallback(() => {
    setSelectedKeys(new Set([]));
    return studentsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only depend on refetch function, not the entire query object
  }, [studentsQuery.refetch]);

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => computeStatusCounts(students), [students]);

  // ── Client-side filters ───────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let filtered = filterByAcademicPerformance(students, academicPerformanceFilter);
    filtered = filterByAttendance(filtered, attendanceFilter);
    return filtered;
  }, [students, academicPerformanceFilter, attendanceFilter]);

  const visibleItems = useMemo(() => sortWithPinned(filteredItems), [filteredItems]);
  const selectedCount = selectedKeys.size;

  // ── Row virtualizer ───────────────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    const handleRefresh = () => refreshStudentsList();
    window.addEventListener("students:list-refresh", handleRefresh);
    return () => window.removeEventListener("students:list-refresh", handleRefresh);
  }, [refreshStudentsList]);

  // ── Debounced fee fetching ────────────────────────────────────────────────
  const virtualItems = rowVirtualizer.getVirtualItems();
  const [debouncedVisibleIds, setDebouncedVisibleIds] = useState([]);
  const feeDebounceRef = useRef(null);

  useEffect(() => {
    if (feeDebounceRef.current) clearTimeout(feeDebounceRef.current);
    feeDebounceRef.current = setTimeout(() => {
      const ids = virtualItems
        .map((vRow) => visibleItems[vRow.index]?.id)
        .filter((id) => id && !studentFeeStructures[id]);
      if (ids.length > 0) setDebouncedVisibleIds(ids);
    }, 300);
    return () => { if (feeDebounceRef.current) clearTimeout(feeDebounceRef.current); };
  }, [virtualItems, visibleItems, studentFeeStructures]);

  const { feeStructures: batchFeeStructures } = useBatchStudentFees(
    debouncedVisibleIds,
    { academicYear: currentAcademicYear }
  );

  useEffect(() => {
    if (batchFeeStructures && Object.keys(batchFeeStructures).length > 0) {
      setStudentFeeStructures((prev) => ({ ...prev, ...batchFeeStructures }));
    }
  }, [batchFeeStructures]);

  // ── Socket.IO real-time updates ───────────────────────────────────────────
  // [AUDIT-785] Do NOT guard with isConnected() — socketServiceEnhanced.on()
  // stores listeners in its internal Map even before the socket connects, and
  // the 'connect' handler re-registers them on reconnection. Guarding with
  // isConnected() caused the early-return path to return undefined (no cleanup),
  // so if the effect re-ran while the socket was disconnected, the previous
  // run's listeners would never be removed.
  useEffect(() => {
    const socketService = getSocketService();
    const handleStudentUpdate = (data) => {
      toast.success(`${data.name}'s profile was updated`, { duration: 3000, icon: '🔄' });
    };
    const handleFeeUpdate = (data) => {
      toast.success(`Fee structure updated for ${data.studentName || "Student"}`, { duration: 3000, icon: '💰' });
      if (data.studentId) {
        (async () => {
          try {
            const feeData = await request(`/student-fees/student/${data.studentId}?academicYear=${currentAcademicYear}`);
            setStudentFeeStructures((prev) => ({ ...prev, [data.studentId]: { ...feeData, _exists: true } }));
          } catch (err) {
            logger.error("❌ Error refetching fee structure:", err);
          }
        })();
      }
    };
    socketService.on("student_updated", handleStudentUpdate);
    socketService.on("fee_structure_updated", handleFeeUpdate);
    return () => {
      socketService.off("student_updated", handleStudentUpdate);
      socketService.off("fee_structure_updated", handleFeeUpdate);
    };
  }, [currentAcademicYear]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getClassOptions = () => classes.map((cls) => `${cls.name}-${cls.section}`);

  // ── Phone save handler ────────────────────────────────────────────────────
  const handleSavePhone = async (studentId) => {
    if (!phoneInput.trim()) { toast.error(t("toast.error.pleaseEnterAPhoneNumber")); return; }
    try {
      await updateStudent(studentId, {
        parentPhone: phoneInput,
        // Also update the first parent's phone to keep parents array in sync
        ...(phoneInput ? {} : {}),
      });
      await refreshStudentsList();
      toast.success(t("toast.success.phoneNumberAddedSuccessfully"));
      setEditingPhoneId(null);
      setPhoneInput("");
    } catch { toast.error(t("toast.error.failedToAddPhoneNumber")); }
  };

  // ── Pin / unpin handlers ──────────────────────────────────────────────────
  const handlePinStudent = async (studentId) => {
    try {
      await studentsApi.pin(studentId);
      // Update query cache directly so auto-refetch won't revert the change
      queryClient.setQueryData(studentsQueryKey, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((student) =>
            String(student.id) === String(studentId)
              ? { ...student, isPinned: true, pinnedAt: new Date().toISOString() }
              : student
          ),
        };
      });
      toast.success(t("toast.success.studentPinned", "Student pinned"));
    } catch { toast.error(t("toast.error.failedToPinStudent", "Failed to pin student")); }
  };

  const handleUnpinStudent = async (studentId) => {
    try {
      await studentsApi.unpin(studentId);
      queryClient.setQueryData(studentsQueryKey, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((student) =>
            String(student.id) === String(studentId)
              ? { ...student, isPinned: false, pinnedAt: null }
              : student
          ),
        };
      });
      toast.success(t("toast.success.studentUnpinned", "Student unpinned"));
    } catch { toast.error(t("toast.error.failedToUnpinStudent", "Failed to unpin student")); }
  };

  // ── Bulk action dispatcher ────────────────────────────────────────────────
  const handleBulkAction = (action, _singleStudent = null) => {
    if (action === "message") {
      const ids = resolveSelectedIds(selectedKeys, filteredItems);
      setReminderTargetCount(ids.length);
      setReminderMessage("");
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      setReminderTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      onReminderOpen();
      return;
    }
    setBulkAction(action);
    if (action === "promote") {
      const ids = resolveSelectedIds(selectedKeys, filteredItems);
      const selected = filteredItems.filter((student) => ids.includes(String(student.id)));
      setPromotionPreview(selected.map((student) => ({ ...student, nextClass: getNextClass(student.class, uniqueClasses) })));
      onPromoteOpen();
    } else if (action === "tc") {
      const ids = resolveSelectedIds(selectedKeys, filteredItems);
      setTcStudents(filteredItems.filter((student) => ids.includes(String(student.id))));
      onTcModalOpen();
    } else if (action === "delete") {
      const ids = resolveSelectedIds(selectedKeys, filteredItems);
      setBulkDeleteStudents(filteredItems.filter((student) => ids.includes(String(student.id))));
      onBulkDeleteOpen();
    } else {
      onBulkActionOpen();
    }
  };

  const executeBulkDelete = async () => {
    const ids = bulkDeleteStudents.map((s) => String(s.id));
    try {
      await request("/bulk-ops/students/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      await refreshStudentsList();
      toast.success(`${ids.length} student${ids.length !== 1 ? "s" : ""} deleted`);
      setSelectedKeys(new Set([]));
      setBulkDeleteStudents([]);
      onBulkDeleteClose();
    } catch (err) {
      toast.error("Failed to delete students: " + (err.message || "Unknown error"));
    }
  };

  const executeBulkAction = async () => {
    const ids = resolveSelectedIds(selectedKeys, filteredItems);
    setIsBulkProcessing(true);
    try {
      if (bulkAction === "deactivate" || bulkAction === "alumni") {
        // Single batch request instead of N sequential requests
        const statusValue = bulkAction === "deactivate" ? "inactive" : "alumni";
        await request("/bulk-ops/students/batch-update", {
          method: "POST",
          body: JSON.stringify({ ids, data: { status: statusValue } }),
        });
      } else if (bulkAction === "tc") {
        // TC generation still requires per-student calls; run in parallel
        await Promise.allSettled(
          ids.map((id) =>
            request(`/students/${id}/transfer-certificate`, {
              method: "POST",
              body: JSON.stringify({}),
            }).catch(() => updateStudent(id, { tcIssued: true }))
          )
        );
      }
      await refreshStudentsList();
      toast.success(t("toast.success.studentsUpdated", { count: ids.length, defaultValue: `${ids.length} student${ids.length > 1 ? "s" : ""} updated successfully` }));
      setSelectedKeys(new Set([]));
      onBulkActionClose();
    } catch (err) {
      toast.error("Failed to update students: " + (err.message || "Unknown error"));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const executePromotion = async () => {
    const ids = resolveSelectedIds(selectedKeys, filteredItems);
    const selected = filteredItems.filter((student) => ids.includes(String(student.id)));
    setIsPromoting(true);
    try {
      // Build the bulk payload in one pass — no per-student API calls
      const promotions = [];
      let skipCount = 0;
      for (const student of selected) {
        const nextClass = getNextClass(student.class, uniqueClasses);
        if (!nextClass) { skipCount++; continue; }
        if (nextClass === "Passed Out / Alumni") {
          promotions.push({ studentId: String(student.id), graduate: true });
        } else {
          const target = classes.find((cls) => {
            const label = cls.section ? `${cls.name}-${cls.section}` : cls.name;
            return label === nextClass;
          });
          const classId = target?._id || target?.id;
          if (classId) {
            promotions.push({ studentId: String(student.id), targetClassId: String(classId) });
          } else {
            toast.error(`Class "${nextClass}" not found for ${student.name}. Create the class first.`);
            skipCount++;
          }
        }
      }

      if (promotions.length === 0) {
        toast.error(t("toast.error.failedToPromoteStudents", "Failed to promote any students"));
        return;
      }

      // Single bulk API call instead of N sequential calls
      const res = await studentsApi.bulkPromote({ promotions });
      const successCount = (res.promoted || 0) + (res.graduated || 0);
      const failCount = (res.failed || 0) + skipCount;

      if (failCount === 0) {
        toast.success(t("toast.success.studentsPromoted", { count: successCount, defaultValue: `${successCount} student${successCount > 1 ? "s" : ""} promoted successfully` }));
      } else if (successCount === 0) {
        toast.error(t("toast.error.failedToPromoteStudents", "Failed to promote any students"));
      } else {
        toast.success(t("toast.success.studentsPromotedPartial", { success: successCount, fail: failCount, defaultValue: `${successCount} promoted, ${failCount} failed` }));
      }

      await refreshStudentsList();
      setSelectedKeys(new Set([]));
      setPromotionPreview([]);
      onPromoteClose();
    } catch (err) {
      toast.error("Failed to promote students: " + (err.message || "Unknown error"));
    } finally {
      setIsPromoting(false);
    }
  };

  const executeSendReminders = async () => {
    if (!reminderMessage.trim()) {
      toast.error(t("toast.error.pleaseEnterAMessage", "Please enter a message"));
      return;
    }
    const ids = resolveSelectedIds(selectedKeys, filteredItems);
    onReminderClose();
    try {
      await request("/students/send-reminders-bulk", {
        method: "POST",
        body: JSON.stringify({
          studentIds: ids.length > 0 ? ids : filteredItems.map((student) => student.id),
          type: "fee",
          message: reminderMessage,
          scheduledTime: reminderTime || undefined,
        }),
      });
      toast.success(t("toast.success.messagesSent", { count: reminderTargetCount, defaultValue: `Messages ${reminderTime ? 'scheduled' : 'sent'} for ${reminderTargetCount} parents` }));
    } catch (err) {
      logger.error("Failed to send reminders:", err);
      toast.error(err.message || "Failed to send reminders");
    }
  };

  // handleBulkMessage removed — functionality handled by handleBulkAction("message")

  // ── Filter helpers ────────────────────────────────────────────────────────
  const closeAllDropdowns = () => {
    setBulkDropdownOpen(false);
    setMoreDropdownOpen(false);
  };

  const clearAllFilters = () => {
    setSearchQuery(""); setClassFilter("all"); setFeeStatusFilter([]); setStatusFilter("active");
    setAcademicYearFilter([]); setAcademicPerformanceFilter([]); setAttendanceFilter([]);
    // Clear persisted filters
    ["search", "class", "feeStatus", "academicYear", "academicPerformance", "attendance", "status"].forEach(k => sessionStorage.removeItem(`students-filter-${k}`));
    toast.success(t("toast.success.allFiltersCleared"));
  };

  const activeFiltersCount = computeActiveFiltersCount({
    classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter,
  });

  // Search debounce indicator
  const isSearching = searchQuery.trim() !== deferredSearchQuery;

  const filterCounts = useMemo(() => computeFilterCounts(students, currentAcademicYear), [students, currentAcademicYear]);

  const filtersConfig = useMemo(() => {
    const feeStatusOpts = ["paid", "pending", "overdue", "partial"];
    return {
      class: { label: "Class", value: classFilter, mode: "single", options: uniqueClasses, counts: filterCounts.class, displayLabels: {} },
      feeStatus: { label: "Fee Status", value: feeStatusFilter, mode: "multi", options: feeStatusOpts, counts: filterCounts.feeStatus, displayLabels: { paid: "Paid", pending: "Pending", overdue: "Overdue", partial: "Partial" } },
      academicYear: { label: "Academic Year", value: academicYearFilter, mode: "multi", options: uniqueAcademicYears, counts: filterCounts.academicYear, displayLabels: {} },
      academicPerformance: { label: "Academic Performance", value: academicPerformanceFilter, mode: "multi", options: ["excellent", "good", "average", "below_average"], counts: filterCounts.academicPerformance, displayLabels: { excellent: "Excellent (90%+)", good: "Good (75-89%)", average: "Average (50-74%)", below_average: "Below Average (<50%)" } },
      attendance: { label: "Attendance", value: attendanceFilter, mode: "multi", options: ["excellent", "good", "average", "below"], counts: filterCounts.attendance, displayLabels: { excellent: "Excellent (90%+)", good: "Good (75-89%)", average: "Average (50-74%)", below: "Below Average (<50%)" } },
    };
  }, [classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter, uniqueClasses, uniqueAcademicYears, filterCounts]);

  const handleFilterChange = useCallback((filterKey, value) => {
    if (filterKey === "class") {
      const next = value === "all" ? "all" : value;
      setClassFilter(next);
      sessionStorage.setItem("students-filter-class", next);
      return;
    }
    const setters = {
      feeStatus: setFeeStatusFilter,
      academicYear: setAcademicYearFilter,
      academicPerformance: setAcademicPerformanceFilter,
      attendance: setAttendanceFilter,
    };
    const setter = setters[filterKey];
    if (!setter) return;
    setter((prev) => {
      if (value === "all") {
        sessionStorage.setItem(`students-filter-${filterKey}`, JSON.stringify([]));
        return [];
      }
      const next = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      sessionStorage.setItem(`students-filter-${filterKey}`, JSON.stringify(next));
      return next;
    });
  }, []);



  // ── CSV upload hook ───────────────────────────────────────────────────────
  const csvUpload = useStudentsUpload({
    classes, currentAcademicYear, refreshStudentsList,
    onPreviewOpen, onPreviewClose, onCsvUploadClose,
    filteredItems, selectedKeys,
  });

  return {
    // loading
    contextLoading, listLoading, listError,
    // students data
    students, filteredItems, visibleItems, selectedCount,
    currentAcademicYear, classes,
    // filter state
    searchQuery, setSearchQuery: (val) => { setSearchQuery(val); sessionStorage.setItem("students-filter-search", val); }, deferredSearchQuery,
    statusFilter, setStatusFilter: (val) => { setStatusFilter(val); sessionStorage.setItem("students-filter-status", val); },
    classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter,
    // filter helpers
    filtersConfig, activeFiltersCount, isSearching,
    handleFilterChange, clearAllFilters,
    // dropdown state
    bulkDropdownOpen, setBulkDropdownOpen,
    moreDropdownOpen, setMoreDropdownOpen,
    closeAllDropdowns,
    // sort / selection
    sortDescriptor, setSortDescriptor,
    selectedKeys, setSelectedKeys,
    statusCounts,
    // column visibility
    visibleColumns, toggleColumn, visibleColumnsArray,
    // table
    tableContainerRef, rowVirtualizer,
    // fee structures
    studentFeeStructures,
    // phone editing
    editingPhoneId, setEditingPhoneId, phoneInput, setPhoneInput, handleSavePhone,
    // pin
    handlePinStudent, handleUnpinStudent,
    // edit drawer
    isEditDrawerOpen, setIsEditDrawerOpen, selectedStudent, setSelectedStudent,
    // local override
    localStudents, setLocalStudents,
    // refresh
    refreshStudentsList,
    // bulk modals
    isBulkActionOpen, onBulkActionClose,
    isPromoteOpen, onPromoteOpen, onPromoteClose, promotionPreview,
    isReminderOpen, onReminderClose, reminderMessage, setReminderMessage, reminderTime, setReminderTime, reminderTargetCount,
    isTcModalOpen, onTcModalOpen, onTcModalClose, tcStudents, setTcStudents,
    isDeleteOpen, onDeleteClose, onDeleteOpen, studentToDelete, setStudentToDelete, isDeleting, setIsDeleting,
    isStatusChangeOpen, onStatusChangeClose, onStatusChangeOpen, statusChangeData, setStatusChangeData,
    isCsvUploadOpen, onCsvUploadClose, onCsvUploadOpen,
    isPreviewOpen, onPreviewClose,
    // bulk handlers
    bulkAction, handleBulkAction, executeBulkAction, executeBulkDelete,
    executePromotion, executeSendReminders,
    isBulkProcessing, isPromoting,
    isBulkDeleteOpen, onBulkDeleteClose, bulkDeleteStudents,
    // delete/update
    deleteStudent, updateStudent,
    // csv upload
    csvUpload,
    // server pagination (PAG-04 / SCH-102)
    currentPage, setCurrentPage, pageSize, setPageSize: setPageSizeClamped,
    pagination: serverPagination,
    totalPages, totalItems,
    // helpers
    getClassOptions,
  };
}
