import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Search, X, Plus, CheckCircle2, Ban } from "lucide-react";
import BulkActionBar from "../../components/ui/BulkActionBar";
import useBulkSelection from "../../hooks/useBulkSelection";
import { feesApi, studentsApi } from "../../services/api";
import { useCurrency } from "../../context/hooks/useCurrency";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import ErrorState from "../../components/ui/ErrorState";
import { createRefundSchema, parseFormSchema } from "../../validators/formSchemas";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from "../../utils/logger";
import RefundListRow from "./RefundListRow";
import RefundDetailPane from "./RefundDetailPane";

const ITEMS_PER_LOAD = 10;
const MOBILE_MAX = 1099;

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "processed", label: "Processed" },
  { key: "rejected", label: "Rejected" },
];

export default function Refunds() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  // ============ Data state ============
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRefund, setRejectingRefund] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // New Refund modal
  const [newRefundOpen, setNewRefundOpen] = useState(false);
  const [newRefundForm, setNewRefundForm] = useState({
    studentId: "",
    classId: "",
    amount: "",
    reason: "",
    refundMode: "cash",
    remarks: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [savingRefund, setSavingRefund] = useState(false);
  const [studentTotalPaid, setStudentTotalPaid] = useState(null);

  // Student search picker state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ============ Routing (URL-driven selection) ============
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") || null;

  const setSelectedId = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("id", id);
          else next.delete("id");
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  // ============ Mobile viewport detection ============
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await feesApi.getRefunds({});
      setRefunds(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Error fetching refunds:", error);
      setFetchError(error?.message || t("toast.error.failedToLoadRefunds"));
      toast.error(t("toast.error.failedToLoadRefunds"));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.approveRefund(refund._id, {});
      toast.success(t("toast.success.refundApproved"));
      fetchRefunds();
    } catch {
      toast.error(t("toast.error.failedToApproveRefund"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (refund) => {
    setRejectingRefund(refund);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingRefund) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error(t("pages.pleaseEnterRejectionReason", "Please enter a rejection reason"));
      return;
    }
    setActionLoading(rejectingRefund._id);
    try {
      await feesApi.rejectRefund(rejectingRefund._id, { rejectionReason: reason });
      toast.success(t("toast.success.refundRejected", "Refund rejected"));
      setRejectModalOpen(false);
      setRejectingRefund(null);
      setRejectReason("");
      fetchRefunds();
    } catch (error) {
      toast.error(
        error?.message ||
          t("toast.error.failedToRejectRefund", "Failed to reject refund")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadRefund = (refund) => {
    const sanitize = (value) => {
      const str = String(value ?? "");
      return (/^[=+\-@\t\r]/.test(str) ? "'" : "") + str.replace(/"/g, '""');
    };
    const rows = [
      ["Refund ID", refund._id],
      ["Student", refund.studentId?.name || ""],
      [
        "Class",
        `${refund.classId?.name || ""} ${refund.classId?.section || ""}`.trim(),
      ],
      ["Amount", refund.amount ?? 0],
      ["Reason", refund.reason || ""],
      ["Refund Mode", refund.refundMode || ""],
      ["Status", refund.status || ""],
      ["Refund Date", refund.refundDate || ""],
      ["Remarks", refund.remarks || ""],
      ["Created At", refund.createdAt || ""],
    ];
    const csvContent = [
      "Field,Value",
      ...rows.map((r) => r.map((c) => `"${sanitize(c)}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `refund-${refund._id}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleProcess = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.processRefund(refund._id, {});
      toast.success(t("toast.success.refundProcessed"));
      fetchRefunds();
    } catch {
      toast.error(t("toast.error.failedToProcessRefund"));
    } finally {
      setActionLoading(null);
    }
  };

  const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

  useEffect(() => {
    if (!OBJECT_ID_REGEX.test(newRefundForm.studentId)) {
      setStudentTotalPaid(null);
      return;
    }
    const timeout = setTimeout(() => {
      feesApi
        .getPayments({ studentId: newRefundForm.studentId })
        .then(({ payments: data }) => {
          const total = Array.isArray(data)
            ? data.reduce((sum, p) => sum + (p.amount || 0), 0)
            : 0;
          setStudentTotalPaid(total);
        })
        .catch((err) => {
          logger.error("Failed to fetch student payments for refund validation:", err);
          toast.error(
            t(
              "toast.error.failedToLoadPaymentHistory",
              "Failed to load payment history — refund limit cannot be verified"
            )
          );
          setStudentTotalPaid(null);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [newRefundForm.studentId]);

  useEffect(() => {
    if (!studentSearch || studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const data = await studentsApi.getAll({
          search: studentSearch,
          limit: 20,
        });
        setStudentResults(data.students || []);
      } catch {
        setStudentResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch("");
    setStudentResults([]);
    const classId = student.classId?._id || student.classId || "";
    setNewRefundForm((f) => ({
      ...f,
      studentId: student._id,
      classId: String(classId),
    }));
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setNewRefundForm((f) => ({ ...f, studentId: "", classId: "" }));
    setStudentTotalPaid(null);
  };

  const handleCreateRefund = async () => {
    setFormErrors({});
    if (!selectedStudent) {
      setFormErrors({
        studentId: t("toast.error.pleaseSelectAStudent", "Please select a student"),
      });
      toast.error(t("toast.error.pleaseSelectAStudent", "Please select a student"));
      return;
    }
    const { success, errors } = parseFormSchema(createRefundSchema, newRefundForm);
    if (!success) {
      setFormErrors(errors);
      toast.error(
        Object.values(errors)[0] || t("toast.error.pleaseFillAllRequiredFields")
      );
      return;
    }
    const parsedAmount = parseFloat(newRefundForm.amount);
    if (studentTotalPaid !== null && parsedAmount > studentTotalPaid) {
      const msg = t("toast.error.refundExceedsTotalPaid", {
        amount: parsedAmount,
        totalPaid: studentTotalPaid,
        defaultValue: `Refund amount (${fmt(parsedAmount)}) cannot exceed total paid (${fmt(studentTotalPaid)})`,
      });
      setFormErrors({ amount: msg });
      toast.error(msg);
      return;
    }
    setSavingRefund(true);
    try {
      await feesApi.createRefund({
        ...newRefundForm,
        amount: parsedAmount,
      });
      toast.success(t("toast.success.refundRequestCreated"));
      setNewRefundOpen(false);
      setNewRefundForm({
        studentId: "",
        classId: "",
        amount: "",
        reason: "",
        refundMode: "cash",
        remarks: "",
      });
      setFormErrors({});
      handleClearStudent();
      fetchRefunds();
    } catch (error) {
      toast.error(error?.message || t("toast.error.failedToCreateRefund"));
    } finally {
      setSavingRefund(false);
    }
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const studentName = r.studentId?.name || "";
      const matchesSearch = studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchQuery, statusFilter]);

  const { visibleItems: visibleRefunds, hasMore, isLoadingMore, loaderRef } =
    useEntityFetch(filteredRefunds, [searchQuery, statusFilter]);

  const visibleIds = useMemo(
    () => visibleRefunds.map((r) => String(r._id)),
    [visibleRefunds]
  );

  const selection = useBulkSelection({
    visibleIds,
    totalMatching: filteredRefunds.length,
  });

  const toggleCheck = useCallback(
    (refund, event) => selection.toggle(refund._id, event),
    [selection]
  );

  const totalRefunds = filteredRefunds.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  const pendingCount = filteredRefunds.filter((r) => r.status === "pending").length;
  const approvedCount = filteredRefunds.filter((r) => r.status === "approved").length;
  const processedCount = filteredRefunds.filter((r) => r.status === "processed").length;
  const rejectedCount = filteredRefunds.filter((r) => r.status === "rejected").length;

  // ============ Selected refund ============
  const selectedRefund = useMemo(() => {
    if (!selectedId) return null;
    return visibleRefunds.find((r) => String(r._id) === selectedId) || null;
  }, [selectedId, visibleRefunds]);

  // Auto-select first visible refund on desktop when nothing is selected
  useEffect(() => {
    if (isMobileViewport) return;
    if (selectedId) return;
    if (visibleRefunds.length === 0) return;
    const first = visibleRefunds[0];
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", String(first._id));
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileViewport, selectedId, visibleRefunds.length]);

  // ============ Keyboard nav ============
  const listRef = useRef(null);
  const rowRefs = useRef(new Map());

  const moveSelection = useCallback(
    (delta) => {
      if (visibleRefunds.length === 0) return;
      const ids = visibleRefunds.map((r) => String(r._id));
      const currentIdx = ids.indexOf(selectedId);
      const nextIdx =
        currentIdx === -1
          ? delta > 0
            ? 0
            : visibleRefunds.length - 1
          : Math.min(visibleRefunds.length - 1, Math.max(0, currentIdx + delta));
      const nextRefund = visibleRefunds[nextIdx];
      if (!nextRefund) return;
      const nextId = String(nextRefund._id);
      setSelectedId(nextId);
      requestAnimationFrame(() => {
        rowRefs.current.get(nextId)?.scrollIntoView({ block: "nearest" });
        rowRefs.current.get(nextId)?.focus({ preventScroll: true });
      });
    },
    [visibleRefunds, selectedId, setSelectedId]
  );

  const handleListKeyDown = useCallback(
    (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Enter on a row keeps selection
      } else if (e.key === "Escape") {
        if (selection.count > 0) return;
        e.preventDefault();
        setSelectedId(null);
      }
    },
    [moveSelection, setSelectedId, selection.count]
  );

  const closeDetail = () => setSelectedId(null);
  const detailVisible = !!selectedRefund;

  // Mobile drawer focus trap
  const drawerRef = useRef(null);
  const handleDrawerKeyDown = useCallback(
    (e) => {
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  if (loading) {
    return <TablePageSkeleton kpiCards={5} columns={5} rows={8} />;
  }

  if (fetchError) {
    return (
      <ErrorState
        title={t("common.somethingWentWrong", "Something went wrong")}
        description={fetchError}
        retryLabel={t("common.tryAgain", "Try again")}
        onRetry={fetchRefunds}
        size="lg"
      />
    );
  }

  return (
    <div
      className="page"
      style={
        isMobileViewport
          ? { display: "flex", flexDirection: "column", minHeight: 0 }
          : {
              display: "grid",
              gridTemplateColumns: "minmax(420px, 1fr) 380px",
              gap: 0,
              minHeight: 0,
            }
      }
    >
      {/* Left list */}
      <div
        style={{
          borderRight: isMobileViewport ? "none" : "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4 mb-4 px-6 pt-6">
          <div className="p-4 border border-border-token rounded-lg bg-surface">
            <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
              {t("pages.totalRefunds")}
            </p>
            <p className="text-2xl font-bold text-fg">{fmt(totalRefunds)}</p>
          </div>
          <div className="p-4 border border-border-token rounded-lg bg-surface">
            <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
              {t("pages.pending2")}
            </p>
            <p className="text-2xl font-bold text-fg">{pendingCount}</p>
          </div>
          <div className="p-4 border border-border-token rounded-lg bg-surface">
            <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
              {t("pages.approved1")}
            </p>
            <p className="text-2xl font-bold text-fg">{approvedCount}</p>
          </div>
          <div className="p-4 border border-border-token rounded-lg bg-surface">
            <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
              {t("pages.processed")}
            </p>
            <p className="text-2xl font-bold text-fg">{processedCount}</p>
          </div>
          <div className="p-4 border border-border-token rounded-lg bg-surface">
            <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">
              {t("pages.rejected")}
            </p>
            <p className="text-2xl font-bold text-fg">{rejectedCount}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-border-token py-4 px-6 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ToolbarSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("pages.searchStudent")}
              ariaLabel={t("aria.misc.searchRefunds", "Search refunds")}
              style={{ flex: 1, maxWidth: 360 }}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-[140px]">
              <Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setNewRefundOpen(true)}
            >
              {t("pages.newRefund")}
            </Button>
          </div>

          <BulkActionBar
            selection={selection}
            totalMatching={filteredRefunds.length}
          >
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => {
                toast.success(`Approved ${selection.count} refunds (queued — endpoint not wired yet).`);
                selection.clear();
              }}
            >
              <CheckCircle2 size={12} aria-hidden /> Approve
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => {
                toast.success(`Rejected ${selection.count} refunds (queued — endpoint not wired yet).`);
                selection.clear();
              }}
            >
              <Ban size={12} aria-hidden /> Reject
            </button>
          </BulkActionBar>
        </div>

        {/* List rows */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Refunds list"
          tabIndex={0}
          onKeyDown={handleListKeyDown}
          style={{
            flex: 1,
            overflow: "auto",
            outline: "none",
            minHeight: 0,
          }}
        >
          {visibleRefunds.length === 0 ? (
            <div
              className="subtle"
              style={{ padding: 32, textAlign: "center", fontSize: 13 }}
            >
              {t("pages.noRefundRecords", "No refund records found.")}
            </div>
          ) : (
            visibleRefunds.map((refund) => {
              const id = String(refund._id);
              return (
                <RefundListRow
                  key={id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(id, el);
                    else rowRefs.current.delete(id);
                  }}
                  refund={refund}
                  isActive={selectedId === id}
                  isChecked={selection.isSelected(id)}
                  onSelect={() => setSelectedId(id)}
                  onToggleCheck={toggleCheck}
                  currencyFmt={fmt}
                />
              );
            })
          )}
        </div>

        {/* Load more */}
        <div
          ref={loaderRef}
          className="flex justify-center py-4 bg-surface-2 border-t border-border-token"
        >
          {isLoadingMore && (
            <span className="h-4 w-4 rounded-full border-2 border-border-strong border-t-accent animate-spin" />
          )}
          {!hasMore && filteredRefunds.length > ITEMS_PER_LOAD && (
            <span className="text-fg-faint text-xs">
              {t("pages.allRefundsLoaded")}
            </span>
          )}
        </div>
      </div>

      {/* Right detail pane — desktop only */}
      {!isMobileViewport && (
        <RefundDetailPane
          refund={selectedRefund}
          onClose={closeDetail}
          onApprove={handleApprove}
          onReject={handleReject}
          onProcess={handleProcess}
          onDownload={handleDownloadRefund}
          actionLoading={actionLoading}
          currencyFmt={fmt}
        />
      )}

      {/* Mobile: slide-over drawer for detail */}
      {isMobileViewport && detailVisible && (
        <div
          className="stafflist__drawer-overlay"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            ref={drawerRef}
            className="stafflist__drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Refund: ${selectedRefund?.studentId?.name || ""}`}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleDrawerKeyDown}
          >
            <RefundDetailPane
              refund={selectedRefund}
              isMobile
              onClose={closeDetail}
              onApprove={handleApprove}
              onReject={handleReject}
              onProcess={handleProcess}
              onDownload={handleDownloadRefund}
              actionLoading={actionLoading}
              currencyFmt={fmt}
            />
          </div>
        </div>
      )}

      {/* Reject Refund Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingRefund(null);
          setRejectReason("");
        }}
        title={t("pages.rejectRefund", "Reject Refund")}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectingRefund(null);
                setRejectReason("");
              }}
              disabled={actionLoading === rejectingRefund?._id}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmReject}
              loading={actionLoading === rejectingRefund?._id}
              disabled={actionLoading === rejectingRefund?._id}
            >
              {t("pages.confirmReject", "Reject Refund")}
            </Button>
          </div>
        }
      >
        <Textarea
          label={t("pages.rejectionReason", "Reason for rejection")}
          placeholder={t("pages.enterRejectionReason", "Enter rejection reason...")}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          required
          rows={3}
        />
      </Modal>

      {/* New Refund Modal */}
      <Modal
        isOpen={newRefundOpen}
        onClose={() => {
          setNewRefundOpen(false);
          setFormErrors({});
          handleClearStudent();
        }}
        title={t("pages.newRefundRequest")}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setNewRefundOpen(false);
                setFormErrors({});
                handleClearStudent();
              }}
              disabled={savingRefund}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateRefund}
              loading={savingRefund}
              disabled={savingRefund}
            >
              {savingRefund
                ? t("common.creating", "Creating...")
                : t("fees.createRefund", "Create Refund")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Student search picker */}
          <div>
            <label className="text-sm font-medium text-fg mb-1 block">
              {t("pages.student", "Student")}{" "}
              <span className="text-danger-token" aria-hidden="true">*</span>
            </label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-border-token rounded-lg bg-surface-2">
                <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-fg">
                    {selectedStudent.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {selectedStudent.name}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {selectedStudent.admissionNo ||
                      selectedStudent.admissionId ||
                      ""}{" "}
                    — {t("common.class")}{" "}
                    {selectedStudent.classId?.name || ""}
                    {selectedStudent.classId?.section
                      ? ` ${selectedStudent.classId.section}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearStudent}
                  className="p-1 hover:bg-surface rounded transition-colors"
                >
                  <X size={14} className="text-fg-muted" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder={t(
                    "pages.searchStudentsByNameOrAdmissionNo",
                    "Search by name or admission number..."
                  )}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  size="sm"
                  startContent={
                    <Search size={14} className="text-fg-muted" />
                  }
                />
                {studentResults.length > 0 && studentSearch && (
                  <div className="absolute z-50 w-full border border-border-token rounded-lg mt-1 max-h-48 overflow-y-auto bg-surface shadow-lg">
                    {studentResults.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-2 transition-colors border-b border-divider last:border-b-0"
                      >
                        <span className="font-medium text-fg">
                          {s.name}
                        </span>
                        <span className="text-fg-muted ml-2 text-xs">
                          {s.admissionNo || s.admissionId || ""} —{" "}
                          {t("common.class")}{" "}
                          {s.classId?.name || ""}
                          {s.classId?.section
                            ? ` ${s.classId.section}`
                            : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {studentSearch.length >= 2 &&
                  studentResults.length === 0 && (
                    <div className="absolute z-50 w-full border border-border-token rounded-lg mt-1 bg-surface shadow-lg px-3 py-3 text-sm text-fg-muted">
                      {t("common.noResultsFound", "No students found")}
                    </div>
                  )}
              </div>
            )}
          </div>
          <Input
            type="number"
            label={t("fees.amountLabel")}
            placeholder={t("fees.amountPlaceholder")}
            value={newRefundForm.amount}
            onChange={(e) =>
              setNewRefundForm({ ...newRefundForm, amount: e.target.value })
            }
            required
            description={
              studentTotalPaid !== null
                ? t("fees.maxRefundable", {
                    amount: studentTotalPaid.toLocaleString(),
                  })
                : undefined
            }
            error={
              formErrors.amount ||
              (studentTotalPaid !== null &&
              parseFloat(newRefundForm.amount) > studentTotalPaid
                ? t("fees.cannotExceedTotalPaid", {
                    amount: studentTotalPaid.toLocaleString(),
                  })
                : undefined)
            }
          />
          <Textarea
            label={t("pages.reason")}
            placeholder={t("pages.reasonForRefund")}
            value={newRefundForm.reason}
            onChange={(e) =>
              setNewRefundForm({ ...newRefundForm, reason: e.target.value })
            }
            required
            rows={2}
            error={formErrors.reason}
          />
          <Select
            label={t("pages.refundMode")}
            value={newRefundForm.refundMode}
            onChange={(e) =>
              setNewRefundForm({
                ...newRefundForm,
                refundMode: e.target.value,
              })
            }
            error={formErrors.refundMode}
          >
            <option value="cash">{t("pages.cash1")}</option>
            <option value="cheque">{t("pages.cheque1")}</option>
            <option value="bank_transfer">
              {t("pages.bankTransfer1")}
            </option>
          </Select>
          <Textarea
            label={t("pages.remarksOptional")}
            placeholder={t("pages.additionalNotes1")}
            value={newRefundForm.remarks}
            onChange={(e) =>
              setNewRefundForm({ ...newRefundForm, remarks: e.target.value })
            }
            rows={2}
          />
        </div>
      </Modal>
    </div>
  );
}
