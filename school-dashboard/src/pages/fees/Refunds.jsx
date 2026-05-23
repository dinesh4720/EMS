import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import {
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Spinner,
} from "@heroui/react";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Search, X, Plus, Download } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";
import { useCurrency } from "../../context/hooks/useCurrency";
import MobileResponsive from "../../components/ui/MobileResponsive";
import Button from "../../components/ui/Button";
import AppModal from "../../components/ui/Modal";
import AppInput from "../../components/ui/Input";
import AppTextarea from "../../components/ui/Textarea";
import AppSelect from "../../components/ui/Select";
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

function RefundStatusBadge({ status }) {
  const tone =
    status === "processed" ? "ok" :
    status === "approved" ? "info" :
    status === "rejected" ? "danger" :
    "warn";
  return (
    <span className={`status status--${tone}`}>
      <span className="dot" aria-hidden="true" />
      {status}
    </span>
  );
}

export default function Refunds() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const navigate = useNavigate();

  // ============ Data state ============
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

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

  // Reject modal state — preserved from main
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectRefund, setRejectRefund] = useState(null);

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
    } catch (error) {
      toast.error(t("toast.error.failedToApproveRefund"));
    } finally {
      setActionLoading(null);
    }
  };

  // REVAMP-27 — reject pending refund with a required reason (preserved from main)
  const handleReject = (refund) => {
    setRejectRefund(refund);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim() || !rejectRefund) return;
    setActionLoading(rejectRefund._id);
    try {
      await feesApi.rejectRefund(rejectRefund._id, { rejectionReason: rejectReason.trim() });
      toast.success(t("toast.success.refundRejected", "Refund rejected"));
      setRejectModalOpen(false);
      setRejectRefund(null);
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
    } catch (error) {
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

  const totalRefunds = filteredRefunds.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  const pendingCount = filteredRefunds.filter((r) => r.status === "pending").length;
  const approvedCount = filteredRefunds.filter((r) => r.status === "approved").length;
  const processedCount = filteredRefunds.filter((r) => r.status === "processed").length;
  const rejectedCount = filteredRefunds.filter((r) => r.status === "rejected").length;

  const statusCounts = useMemo(() => {
    const all = refunds.length;
    const pending = refunds.filter((r) => r.status === "pending").length;
    const approved = refunds.filter((r) => r.status === "approved").length;
    const processed = refunds.filter((r) => r.status === "processed").length;
    const rejected = refunds.filter((r) => r.status === "rejected").length;
    return { all, pending, approved, processed, rejected };
  }, [refunds]);

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
        e.preventDefault();
        setSelectedId(null);
      }
    },
    [moveSelection, setSelectedId]
  );

  const closeDetail = () => setSelectedId(null);
  const detailVisible = !!selectedRefund;

  if (loading) {
    return <TablePageSkeleton kpiCards={3} columns={5} rows={8} />;
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
        <div className="grid grid-cols-4 gap-4 mb-4 px-6 pt-6">
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
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-border-token py-4 px-6 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-surface rounded-lg border border-border-token hover:border-border-strong focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all">
              <Search size={16} className="text-fg-faint" />
              <input
                type="text"
                placeholder={t("pages.searchStudent")}
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-gray-500 dark:placeholder:text-zinc-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 hover:bg-surface-2 rounded"
                >
                  <X size={14} className="text-fg-faint" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select
              size="sm"
              placeholder={t("pages.allStatus1")}
              selectedKeys={new Set([statusFilter])}
              onSelectionChange={(keys) =>
                setStatusFilter(Array.from(keys)[0])
              }
              className="w-full sm:w-[140px]"
              classNames={{
                trigger:
                  "h-9 min-h-9 bg-surface border-border-token hover:border-border-strong",
                value: "text-sm",
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.key}>{f.label}</SelectItem>
              ))}
            </Select>

            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setNewRefundOpen(true)}
            >
              {t("pages.newRefund")}
            </Button>
          </div>
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
                  onSelect={() => setSelectedId(id)}
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
          {isLoadingMore && <Spinner size="sm" />}
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
            className="stafflist__drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Refund: ${selectedRefund?.studentId?.name || ""}`}
            onClick={(e) => e.stopPropagation()}
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

      {/* Reject Reason Modal — preserved from main */}
      <AppModal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectReason(""); setRejectRefund(null); }}
        title={t("pages.rejectRefund", "Reject Refund")}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setRejectModalOpen(false); setRejectReason(""); setRejectRefund(null); }}
              disabled={actionLoading === rejectRefund?._id}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              loading={actionLoading === rejectRefund?._id}
              disabled={!rejectReason.trim() || actionLoading === rejectRefund?._id}
            >
              {t("pages.reject", "Reject")}
            </Button>
          </div>
        }
      >
        <AppTextarea
          label={t("pages.rejectionReason", "Reason for rejection")}
          placeholder={t("pages.enterRejectionReason", "Enter reason for rejection...")}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          required
          rows={3}
        />
      </AppModal>

      {/* New Refund Modal */}
      <Modal
        isOpen={newRefundOpen}
        onClose={() => {
          setNewRefundOpen(false);
          setFormErrors({});
          handleClearStudent();
        }}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-border-token">
                {t("pages.newRefundRequest")}
              </ModalHeader>
              <ModalBody className="py-4 space-y-4">
                {/* Student search picker */}
                <div>
                  <label className="text-sm font-medium text-fg mb-1 block">
                    {t("pages.student", "Student")}{" "}
                    <span className="text-danger">*</span>
                  </label>
                  {selectedStudent ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-border-token rounded-lg bg-surface-2 dark:bg-zinc-900">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
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
                        className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
                      >
                        <X size={14} className="text-gray-400" />
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
                        onValueChange={(v) => setStudentSearch(v)}
                        variant="bordered"
                        startContent={
                          <Search size={14} className="text-gray-400" />
                        }
                        size="sm"
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
                  onValueChange={(v) =>
                    setNewRefundForm({ ...newRefundForm, amount: v })
                  }
                  variant="bordered"
                  isRequired
                  description={
                    studentTotalPaid !== null
                      ? t("fees.maxRefundable", {
                          amount: studentTotalPaid.toLocaleString(),
                        })
                      : undefined
                  }
                  isInvalid={
                    Boolean(formErrors.amount) ||
                    (studentTotalPaid !== null &&
                      parseFloat(newRefundForm.amount) > studentTotalPaid)
                  }
                  errorMessage={
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
                  onValueChange={(v) =>
                    setNewRefundForm({ ...newRefundForm, reason: v })
                  }
                  variant="bordered"
                  isRequired
                  minRows={2}
                  isInvalid={Boolean(formErrors.reason)}
                  errorMessage={formErrors.reason}
                />
                <Select
                  label={t("pages.refundMode")}
                  variant="bordered"
                  selectedKeys={[newRefundForm.refundMode]}
                  onChange={(e) =>
                    setNewRefundForm({
                      ...newRefundForm,
                      refundMode: e.target.value,
                    })
                  }
                  isInvalid={Boolean(formErrors.refundMode)}
                  errorMessage={formErrors.refundMode}
                >
                  <SelectItem key="cash">{t("pages.cash1")}</SelectItem>
                  <SelectItem key="cheque">{t("pages.cheque1")}</SelectItem>
                  <SelectItem key="bank_transfer">
                    {t("pages.bankTransfer1")}
                  </SelectItem>
                </Select>
                <Textarea
                  label={t("pages.remarksOptional")}
                  placeholder={t("pages.additionalNotes1")}
                  value={newRefundForm.remarks}
                  onValueChange={(v) =>
                    setNewRefundForm({ ...newRefundForm, remarks: v })
                  }
                  variant="bordered"
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter className="border-t border-border-token gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
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
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
