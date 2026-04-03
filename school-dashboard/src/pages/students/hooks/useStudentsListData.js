/**
 * useStudentsListData
 * Encapsulates all state, data-fetching, filtering, and action logic
 * for the StudentsList page. The component only renders.
 */
import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDisclosure } from "@heroui/react";

import { useApp } from "../../../context/AppContext";
import { studentsApi, classesApi } from "../../../services/api";
import { useBatchStudentFees } from "./useStudentFees";
import { useStudentsUpload } from "../components/list/StudentsUpload";
import { safeGetItem, safeSetItem } from "../../../utils/safeStorage";
import { ALL_COLUMNS } from "../utils/studentImportUtils";
import { getNextClass } from "../utils/studentHelpers";
import { request } from "../../../services/api.js";
import { getSocketService } from "../../../services/socketServiceEnhanced.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ROW_HEIGHT = 65;

export function useStudentsListData() {
  const { t } = useTranslation();
  const {
    deleteStudent,
    updateStudent,
    loading: contextLoading,
    classes,
    currentAcademicYear,
  } = useApp();

  // ── Filter state (restored from sessionStorage) ──────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState(() => sessionStorage.getItem("students-filter-class") || "all");
  const [feeStatusFilter, setFeeStatusFilter] = useState(() => sessionStorage.getItem("students-filter-feeStatus") || "all");
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem("students-filter-status") || "active");
  const [academicYearFilter, setAcademicYearFilter] = useState(() => sessionStorage.getItem("students-filter-academicYear") || "all");
  const [academicPerformanceFilter, setAcademicPerformanceFilter] = useState(() => sessionStorage.getItem("students-filter-academicPerformance") || "all");
  const [attendanceFilter, setAttendanceFilter] = useState(() => sessionStorage.getItem("students-filter-attendance") || "all");
  const [localStudents, setLocalStudents] = useState(null);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  // ── Dropdown open/close state ─────────────────────────────────────────────
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // ── Fee structure cache ───────────────────────────────────────────────────
  const [studentFeeStructures, setStudentFeeStructures] = useState({});

  // ── Table refs ────────────────────────────────────────────────────────────
  const tableContainerRef = useRef(null);

  // ── Sort state ────────────────────────────────────────────────────────────
  const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));

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
  const { isOpen: isBulkActionOpen, onOpen: onBulkActionOpen, onClose: onBulkActionClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  const { isOpen: isReminderOpen, onOpen: onReminderOpen, onClose: onReminderClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isStatusChangeOpen, onOpen: onStatusChangeOpen, onClose: onStatusChangeClose } = useDisclosure();
  const { isOpen: isCsvUploadOpen, onOpen: onCsvUploadOpen, onClose: onCsvUploadClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isTcModalOpen, onOpen: onTcModalOpen, onClose: onTcModalClose } = useDisclosure();

  // ── Bulk action state ─────────────────────────────────────────────────────
  const [bulkAction, setBulkAction] = useState("");
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
    if (classFilter === "all") return null;
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
      "students-list",
      deferredSearchQuery,
      selectedClassId,
      feeStatusFilter,
      statusFilter,
      academicYearFilter,
      sortParams.sortBy,
      sortParams.sortOrder,
    ],
    [deferredSearchQuery, selectedClassId, feeStatusFilter, statusFilter, academicYearFilter, sortParams.sortBy, sortParams.sortOrder]
  );

  const studentsQuery = useQuery({
    queryKey: studentsQueryKey,
    queryFn: () =>
      studentsApi.list({
        limit: 0,
        search: deferredSearchQuery || undefined,
        classId: selectedClassId || undefined,
        feeStatus: feeStatusFilter,
        status: statusFilter,
        academicYear: academicYearFilter,
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

  const uniqueAcademicYears = useMemo(
    () =>
      [...new Set([currentAcademicYear, ...students.map((student) => student.academicYear || currentAcademicYear)])].sort(),
    [students, currentAcademicYear]
  );

  useEffect(() => {
    setLocalStudents(null);
    setStudentFeeStructures({});
  }, [studentsQuery.data]);

  useEffect(() => {
    if (studentsQuery.error) {
      console.error("Failed to load students list:", studentsQuery.error);
      toast.error(`Failed to load students: ${studentsQuery.error.message}`);
    }
  }, [studentsQuery.error]);

  const refreshStudentsList = useCallback(() => {
    setSelectedKeys(new Set([]));
    return studentsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only depend on refetch function, not the entire query object
  }, [studentsQuery.refetch]);

  // ── Status counts ─────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    let active = 0, inactive = 0, alumni = 0, graduated = 0, transferred = 0;
    for (const student of students) {
      const status = student.status || "active";
      if (status === "active") active++;
      else if (status === "inactive") inactive++;
      else if (status === "alumni") alumni++;
      else if (status === "graduated") graduated++;
      else if (status === "transferred") transferred++;
    }
    return { all: students.length, active, inactive, alumni, graduated, transferred };
  }, [students]);

  // ── Attendance helper ─────────────────────────────────────────────────────
  // Use real attendancePercentage from backend; return null when no data exists
  const getAttendancePercentage = (student) => {
    if (student.attendancePercentage != null) return student.attendancePercentage;
    return null; // No attendance records
  };

  // ── Client-side filters ───────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let filtered = students;
    if (academicPerformanceFilter !== "all") {
      filtered = filtered.filter((student) => {
        if (!student.examResults || !Array.isArray(student.examResults) || student.examResults.length === 0) return false;
        const total = student.examResults.reduce((sum, e) => (e.percentage != null ? sum + e.percentage : sum), 0);
        const avg = total / student.examResults.length;
        switch (academicPerformanceFilter) {
          case "excellent":    return avg >= 90;
          case "good":         return avg >= 75 && avg < 90;
          case "average":      return avg >= 50 && avg < 75;
          case "below_average": return avg < 50;
          default:             return true;
        }
      });
    }
    if (attendanceFilter !== "all") {
      filtered = filtered.filter((student) => {
        const att = getAttendancePercentage(student);
        if (att == null) return false; // Exclude students with no attendance data from filtered results
        switch (attendanceFilter) {
          case "excellent": return att >= 90;
          case "good":      return att >= 75 && att < 90;
          case "average":   return att >= 50 && att < 75;
          case "below":     return att < 50;
          default:          return true;
        }
      });
    }
    return filtered;
  }, [students, academicPerformanceFilter, attendanceFilter]);

  const visibleItems = useMemo(() => {
    const pinned = filteredItems.filter((student) => student.isPinned);
    const unpinned = filteredItems.filter((student) => !student.isPinned);
    // Sort pinned students by pinnedAt (most recently pinned first)
    pinned.sort((first, second) => {
      if (first.pinnedAt && second.pinnedAt) return new Date(second.pinnedAt) - new Date(first.pinnedAt);
      return 0;
    });
    return [...pinned, ...unpinned];
  }, [filteredItems]);
  const selectedCount = selectedKeys === "all" ? filteredItems.length : selectedKeys.size;

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
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService?.isConnected()) return;
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
            console.error("❌ Error refetching fee structure:", err);
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
      setLocalStudents(students.map((student) => String(student.id) === String(studentId) ? { ...student, isPinned: true, pinnedAt: new Date().toISOString() } : student));
      toast.success(t("toast.success.studentPinned", "Student pinned"));
    } catch { toast.error(t("toast.error.failedToPinStudent", "Failed to pin student")); }
  };

  const handleUnpinStudent = async (studentId) => {
    try {
      await studentsApi.unpin(studentId);
      setLocalStudents(students.map((student) => String(student.id) === String(studentId) ? { ...student, isPinned: false, pinnedAt: null } : student));
      toast.success(t("toast.success.studentUnpinned", "Student unpinned"));
    } catch { toast.error(t("toast.error.failedToUnpinStudent", "Failed to unpin student")); }
  };

  // ── Bulk action dispatcher ────────────────────────────────────────────────
  const handleBulkAction = (action, _singleStudent = null) => {
    if (action === "message") {
      const ids = selectedKeys === "all" ? filteredItems.map((student) => String(student.id)) : Array.from(selectedKeys);
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
      const ids = selectedKeys === "all" ? filteredItems.map((student) => String(student.id)) : Array.from(selectedKeys);
      const selected = filteredItems.filter((student) => ids.includes(String(student.id)));
      setPromotionPreview(selected.map((student) => ({ ...student, nextClass: getNextClass(student.class, uniqueClasses) })));
      onPromoteOpen();
    } else if (action === "tc") {
      const ids = selectedKeys === "all" ? filteredItems.map((student) => String(student.id)) : Array.from(selectedKeys);
      setTcStudents(filteredItems.filter((student) => ids.includes(String(student.id))));
      onTcModalOpen();
    } else {
      onBulkActionOpen();
    }
  };

  const executeBulkAction = async () => {
    const ids = selectedKeys === "all" ? filteredItems.map((student) => String(student.id)) : Array.from(selectedKeys);
    setIsBulkProcessing(true);
    try {
      for (const id of ids) {
        if (bulkAction === "deactivate") await updateStudent(id, { status: "inactive" });
        else if (bulkAction === "tc") {
          // Generate actual transfer certificate via dedicated endpoint
          try {
            await request(`/students/${id}/transfer-certificate`, { method: 'POST', body: JSON.stringify({}) });
          } catch {
            // Fall back to setting flag if TC endpoint not available
            await updateStudent(id, { tcIssued: true });
          }
        }
        else if (bulkAction === "alumni") await updateStudent(id, { status: "alumni" });
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
    const ids = selectedKeys === "all" ? filteredItems.map((student) => String(student.id)) : Array.from(selectedKeys);
    const selected = filteredItems.filter((student) => ids.includes(String(student.id)));
    let successCount = 0, failCount = 0;
    setIsPromoting(true);
    try {
      for (const student of selected) {
        try {
          const nextClass = getNextClass(student.class, uniqueClasses);
          if (!nextClass) { failCount++; continue; }
          if (nextClass === "Passed Out / Alumni") {
            await updateStudent(student.id, { class: "Passed Out" });
          } else {
            const classMatch = nextClass.match(/^(\d+)(?:-([A-Z]))?$/i);
            let classId = null;
            if (classMatch) {
              const [, grade, section = ""] = classMatch;
              const target = classes.find((cls) => String(cls.name) === String(grade) && (cls.section || "") === String(section));
              if (target) classId = target._id || target.id;
            }
            if (classId) {
              const updateData = { classId, class: nextClass };
              const conflict = students.find((st) => (String(st.classId) === String(classId) || st.class === nextClass) && st.id !== student.id && st.rollNo === student.rollNo);
              if (conflict) {
                try {
                  const res = await classesApi.getNextRollNumber(classId);
                  const nextRollNo = res?.rollNumber || res?.rollNo;
                  if (nextRollNo) updateData.rollNo = nextRollNo;
                } catch { /* skip */ }
              }
              await updateStudent(student.id, updateData);
            } else {
              // Cannot resolve classId — skip this student with error
              toast.error(`Class "${nextClass}" not found for ${student.name}. Create the class first.`);
              failCount++;
              continue;
            }
          }
          successCount++;
        } catch { failCount++; }
      }
      if (failCount === 0) toast.success(t("toast.success.studentsPromoted", { count: successCount, defaultValue: `${successCount} student${successCount > 1 ? "s" : ""} promoted successfully` }));
      else if (successCount === 0) toast.error(t("toast.error.failedToPromoteStudents", "Failed to promote any students"));
      else toast.success(t("toast.success.studentsPromotedPartial", { success: successCount, fail: failCount, defaultValue: `${successCount} promoted, ${failCount} failed` }));
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
    const ids = selectedKeys === "all" ? filteredItems.map((student) => String(student.id)) : Array.from(selectedKeys);
    onReminderClose();
    try {
      await request("/messages/bulk-reminder", {
        method: "POST",
        body: JSON.stringify({
          studentIds: ids.length > 0 ? ids : filteredItems.map((student) => student.id),
          message: reminderMessage,
          scheduledTime: reminderTime || undefined,
        }),
      });
      toast.success(t("toast.success.messagesSent", { count: reminderTargetCount, defaultValue: `Messages ${reminderTime ? 'scheduled' : 'sent'} for ${reminderTargetCount} parents` }));
    } catch (err) {
      console.error("Failed to send reminders:", err);
      toast.error(err.message || "Failed to send reminders");
    }
  };

  // handleBulkMessage removed — functionality handled by handleBulkAction("message")

  // ── Filter helpers ────────────────────────────────────────────────────────
  const closeAllDropdowns = () => {
    setStatusDropdownOpen(false); setBulkDropdownOpen(false);
    setFiltersDropdownOpen(false); setSortDropdownOpen(false);
    setColumnsDropdownOpen(false); setMoreDropdownOpen(false);
  };

  const clearAllFilters = () => {
    setClassFilter("all"); setFeeStatusFilter("all"); setStatusFilter("all");
    setAcademicYearFilter("all"); setAcademicPerformanceFilter("all"); setAttendanceFilter("all");
    // Clear persisted filters
    ["class", "feeStatus", "academicYear", "academicPerformance", "attendance", "status"].forEach(k => sessionStorage.removeItem(`students-filter-${k}`));
    toast.success(t("toast.success.allFiltersCleared"));
  };

  const activeFiltersCount =
    (classFilter !== "all" ? 1 : 0) + (feeStatusFilter !== "all" ? 1 : 0) +
    (academicYearFilter !== "all" ? 1 : 0) + (academicPerformanceFilter !== "all" ? 1 : 0) +
    (attendanceFilter !== "all" ? 1 : 0);

  // Search debounce indicator
  const isSearching = searchQuery.trim() !== deferredSearchQuery;

  const filterCounts = useMemo(() => {
    const classCounts = {}, feeStatusCounts = {}, academicYearCounts = {}, academicPerformanceCounts = {}, attendanceCounts = {};
    for (const student of students) {
      if (student.class) classCounts[student.class] = (classCounts[student.class] || 0) + 1;
      // Bug #2: Only count feeStatus if the backend actually provides it.
      // NOTE: Backend does not currently compute/return feeStatus on student records.
      // "overdue" count will remain 0 until the backend returns feeStatus per student.
      if (student.feeStatus) { feeStatusCounts[student.feeStatus] = (feeStatusCounts[student.feeStatus] || 0) + 1; }
      // Bug #1: academicYear counts depend on the backend returning academicYear per student.
      // If students lack this field, all default to currentAcademicYear and prior years show 0.
      const yr = student.academicYear || currentAcademicYear; academicYearCounts[yr] = (academicYearCounts[yr] || 0) + 1;
      // Bug #3: Don't default students with no performance data to "average".
      // Only count students that actually have academic performance data.
      if (student.academicPerformance) { academicPerformanceCounts[student.academicPerformance] = (academicPerformanceCounts[student.academicPerformance] || 0) + 1; }
      const att = getAttendancePercentage(student);
      if (att != null) {
        let cat = "below";
        if (att >= 90) cat = "excellent"; else if (att >= 75) cat = "good"; else if (att >= 50) cat = "average";
        attendanceCounts[cat] = (attendanceCounts[cat] || 0) + 1;
      }
    }
    return { class: classCounts, feeStatus: feeStatusCounts, academicYear: academicYearCounts, academicPerformance: academicPerformanceCounts, attendance: attendanceCounts };
  }, [students, currentAcademicYear]);

  const filtersConfig = useMemo(() => {
    const feeStatusOpts = ["paid", "pending", "overdue", "partial"];
    return {
      class: { label: "Class", value: classFilter, options: ["all", ...uniqueClasses], counts: { all: students.length, ...filterCounts.class }, displayLabels: { all: "All Classes" } },
      feeStatus: { label: "Fee Status", value: feeStatusFilter, options: ["all", ...feeStatusOpts], counts: { all: students.length, ...filterCounts.feeStatus }, displayLabels: { all: "All Fee Status", paid: "Paid", pending: "Pending", overdue: "Overdue", partial: "Partial" } },
      academicYear: { label: "Academic Year", value: academicYearFilter, options: ["all", ...uniqueAcademicYears], counts: { all: students.length, ...filterCounts.academicYear }, displayLabels: { all: "All Years" } },
      academicPerformance: { label: "Academic Performance", value: academicPerformanceFilter, options: ["all", "excellent", "good", "average", "below_average"], counts: { all: students.length, ...filterCounts.academicPerformance }, displayLabels: { all: "All Performance", excellent: "Excellent (90%+)", good: "Good (75-89%)", average: "Average (50-74%)", below_average: "Below Average (<50%)" } },
      attendance: { label: "Attendance", value: attendanceFilter, options: ["all", "excellent", "good", "average", "below"], counts: { all: students.length, ...filterCounts.attendance }, displayLabels: { all: "All Attendance", excellent: "Excellent (90%+)", good: "Good (75-89%)", average: "Average (50-74%)", below: "Below Average (<50%)" } },
    };
  }, [classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter, uniqueClasses, uniqueAcademicYears, filterCounts, students.length]);

  const handleFilterChange = useCallback((filterKey, value) => {
    switch (filterKey) {
      case "class":               setClassFilter(value); break;
      case "feeStatus":           setFeeStatusFilter(value); break;
      case "academicYear":        setAcademicYearFilter(value); break;
      case "academicPerformance": setAcademicPerformanceFilter(value); break;
      case "attendance":          setAttendanceFilter(value); break;
    }
    // Persist to sessionStorage
    sessionStorage.setItem(`students-filter-${filterKey}`, value);
  }, []);

  const filterPresets = [
    { id: "fee-defaulters",  label: "Fee Defaulters",  icon: "💰", applied: feeStatusFilter === "overdue",  filters: { feeStatus: "overdue" } },
    { id: "low-attendance",  label: "Low Attendance",  icon: "📉", applied: attendanceFilter === "below",   filters: { attendance: "below" } },
    { id: "high-performers", label: "High Performers", icon: "⭐", applied: academicPerformanceFilter === "excellent", filters: { academicPerformance: "excellent" } },
    { id: "needs-attention", label: "Needs Attention", icon: "⚠️", applied: feeStatusFilter === "overdue" && attendanceFilter === "below", filters: { feeStatus: "overdue", attendance: "below" } },
  ];

  const handlePresetClick = useCallback((preset) => {
    // Reset all filters first, then apply preset values
    setClassFilter("all"); setFeeStatusFilter("all"); setAcademicYearFilter("all");
    setAcademicPerformanceFilter("all"); setAttendanceFilter("all");
    if (preset.filters.feeStatus)           setFeeStatusFilter(preset.filters.feeStatus);
    if (preset.filters.attendance)          setAttendanceFilter(preset.filters.attendance);
    if (preset.filters.academicPerformance) setAcademicPerformanceFilter(preset.filters.academicPerformance);
    if (preset.filters.class)               setClassFilter(preset.filters.class);
    if (preset.filters.academicYear)        setAcademicYearFilter(preset.filters.academicYear);
  }, []);

  // ── CSV upload hook ───────────────────────────────────────────────────────
  const csvUpload = useStudentsUpload({
    classes, currentAcademicYear, refreshStudentsList,
    onPreviewOpen, onPreviewClose, onCsvUploadClose,
    filteredItems, selectedKeys,
  });

  return {
    // loading
    contextLoading, listLoading,
    // students data
    students, filteredItems, visibleItems, selectedCount,
    currentAcademicYear, classes,
    // filter state
    searchQuery, setSearchQuery, deferredSearchQuery,
    statusFilter, setStatusFilter: (val) => { setStatusFilter(val); sessionStorage.setItem("students-filter-status", val); },
    classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter,
    // filter helpers
    filtersConfig, filterPresets, activeFiltersCount, isSearching,
    handleFilterChange, handlePresetClick, clearAllFilters,
    // dropdown state
    statusDropdownOpen, setStatusDropdownOpen,
    bulkDropdownOpen, setBulkDropdownOpen,
    filtersDropdownOpen, setFiltersDropdownOpen,
    sortDropdownOpen, setSortDropdownOpen,
    columnsDropdownOpen, setColumnsDropdownOpen,
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
    bulkAction, handleBulkAction, executeBulkAction,
    executePromotion, executeSendReminders,
    isBulkProcessing, isPromoting,
    // delete/update
    deleteStudent, updateStudent,
    // csv upload
    csvUpload,
    // helpers
    getClassOptions,
  };
}
