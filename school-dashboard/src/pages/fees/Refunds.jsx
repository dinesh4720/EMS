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
import {
  Search,
  X,
  Plus,
  CheckCircle2,
  Ban,
  Inbox,
} from "lucide-react";
import BulkActionBar from "../../components/ui/BulkActionBar";
import useBulkSelection from "../../hooks/useBulkSelection";
import { feesApi, studentsApi } from "../../services/api";
import { useCurrency } from "../../context/hooks/useCurrency";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { PageShell } from "../../components/ui";
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
      // PAG-27: refund-cap validation must use a server-side aggregate so
      // long-tenured students (with > 50 payments) don't have their
      // refundable total silently understated by the paginated /fees/payments
      // list endpoint.
      feesApi
        .getStudentTotalPaid(newRefundForm.studentId)
        .then((res) => {
          const total = Number(res?.totalPaid);
          setStudentTotalPaid(Number.isFinite(total) ? total : 0);
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

  const pageContent = (
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
        <div className="refund-kpi">
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.totalRefunds")}</span>
            <span className="refund-kpi__value mono tnum">{fmt(totalRefunds)}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.pending2")}</span>
            <span className="refund-kpi__value mono tnum">{pendingCount}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.approved1")}</span>
            <span className="refund-kpi__value mono tnum">{approvedCount}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.processed")}</span>
            <span className="refund-kpi__value mono tnum">{processedCount}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.rejected")}</span>
            <span className="refund-kpi__value mono tnum">{rejectedCount}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ paddingTop: 0 }}>
          <ToolbarSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("pages.searchStudent")}
            ariaLabel={t("aria.misc.searchRefunds", "Search refunds")}
            style={{ flex: 1, maxWidth: 360 }}
          />

          <div className="seg" role="tablist" aria-label={t("aria.misc.filterRefunds", "Filter refunds")}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === f.key}
                className={`seg__btn${statusFilter === f.key ? " is-active" : ""}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="row gap-2" style={{ marginLeft: "auto" }}>
            <button
              type="button"
              className="btn btn--accent"
              onClick={() => setNewRefundOpen(true)}
            >
              <Plus size={13} aria-hidden /> {t("pages.newRefund")}
            </button>
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
            <EmptyState
              icon={Inbox}
              title={t("pages.noRefundRecords", "No refund records found.")}
              description={
                searchQuery || statusFilter !== "all"
                  ? t("pages.tryAdjustingFilters", "Try adjusting your search or filters.")
                  : t("pages.noRefundsYetDescription", "Refund requests will appear here once created.")
              }
              size="md"
            />
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
      {rejectModalOpen && (
        <div className="composer-overlay" onClick={() => {
          if (!actionLoading) {
            setRejectModalOpen(false);
            setRejectingRefund(null);
            setRejectReason("");
          }
        }}>
          <div className="composer" role="dialog" aria-modal="true" style={{ maxWidth: 480 }}>
            <header className="composer__head">
              <span className="composer__title">{t("pages.rejectRefund", "Reject Refund")}</span>
              <button
                type="button"
                className="iconbtn"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectingRefund(null);
                  setRejectReason("");
                }}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </header>
            <div className="composer__body">
              <label className="field" htmlFor="reject-reason">
                <span className="field__label">
                  {t("pages.rejectionReason", "Reason for rejection")} <span className="req">*</span>
                </span>
                <textarea
                  id="reject-reason"
                  className="textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("pages.enterRejectionReason", "Enter rejection reason...")}
                  required
                />
              </label>
            </div>
            <footer className="composer__foot">
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectingRefund(null);
                  setRejectReason("");
                }}
                disabled={actionLoading === rejectingRefund?._id}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="btn btn--accent"
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectingRefund?._id || !rejectReason.trim()}
              >
                {actionLoading === rejectingRefund?._id
                  ? t("common.processing", "Processing...")
                  : t("pages.confirmReject", "Reject Refund")}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* New Refund Modal */}
      {newRefundOpen && (
        <div className="composer-overlay" onClick={() => {
          if (!savingRefund) {
            setNewRefundOpen(false);
            setFormErrors({});
            handleClearStudent();
          }
        }}>
          <div className="composer" role="dialog" aria-modal="true" style={{ maxWidth: 560 }}>
            <header className="composer__head">
              <span className="composer__title">{t("pages.newRefundRequest")}</span>
              <button
                type="button"
                className="iconbtn"
                onClick={() => {
                  setNewRefundOpen(false);
                  setFormErrors({});
                  handleClearStudent();
                }}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </header>
            <div className="composer__body">
              <div className="fgrid">
                {/* Student search picker */}
                <label className="field span-2" htmlFor="refund-student-search">
                  <span className="field__label">
                    {t("pages.student", "Student")} <span className="req">*</span>
                  </span>
                  {selectedStudent ? (
                    <div className="taginput">
                      <span className="tagchip">
                        {selectedStudent.name}
                        <button
                          type="button"
                          className="iconbtn"
                          aria-label={t("common.remove", "Remove")}
                          onClick={handleClearStudent}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    </div>
                  ) : (
                    <div className="field__icon-wrap">
                      <Search size={14} className="field__icon" aria-hidden />
                      <input
                        id="refund-student-search"
                        className="input input--with-icon"
                        placeholder={t(
                          "pages.searchStudentsByNameOrAdmissionNo",
                          "Search by name or admission number..."
                        )}
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        role="combobox"
                        aria-expanded={studentResults.length > 0}
                        aria-controls="refund-student-results"
                        aria-autocomplete="list"
                      />
                      {studentResults.length > 0 && studentSearch && (
                        <div
                          id="refund-student-results"
                          role="listbox"
                          aria-label={t("pages.studentResults", "Student results")}
                          className="autocomplete-dropdown"
                          style={{
                            position: "absolute",
                            zIndex: 50,
                            width: "100%",
                            marginTop: 4,
                            maxHeight: 192,
                            overflowY: "auto",
                            background: "var(--surface)",
                            border: "1px solid var(--border-token)",
                            borderRadius: 8,
                            boxShadow: "var(--shadow-md)",
                          }}
                        >
                          {studentResults.map((s) => (
                            <button
                              key={s._id}
                              type="button"
                              role="option"
                              onClick={() => handleSelectStudent(s)}
                              className="autocomplete-item"
                              style={{
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 12px",
                                fontSize: 13,
                                background: "transparent",
                                border: "none",
                                borderBottom: "1px solid var(--divider)",
                                cursor: "pointer",
                                color: "var(--fg)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--surface-2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <span style={{ fontWeight: 520 }}>{s.name}</span>
                              <span className="subtle" style={{ marginLeft: 8, fontSize: 12 }}>
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
                          <div
                            style={{
                              position: "absolute",
                              zIndex: 50,
                              width: "100%",
                              marginTop: 4,
                              padding: "12px",
                              fontSize: 13,
                              color: "var(--fg-muted)",
                              background: "var(--surface)",
                              border: "1px solid var(--border-token)",
                              borderRadius: 8,
                              boxShadow: "var(--shadow-md)",
                            }}
                          >
                            {t("common.noResultsFound", "No students found")}
                          </div>
                        )}
                    </div>
                  )}
                  {formErrors.studentId && (
                    <span className="field__hint" style={{ color: "var(--danger)" }}>
                      {formErrors.studentId}
                    </span>
                  )}
                </label>

                <label className="field" htmlFor="refund-amount">
                  <span className="field__label">
                    {t("fees.amountLabel")} <span className="req">*</span>
                  </span>
                  <input
                    id="refund-amount"
                    type="number"
                    className={`input mono tnum${formErrors.amount ? " input--err" : ""}`}
                    placeholder={t("fees.amountPlaceholder")}
                    value={newRefundForm.amount}
                    onChange={(e) =>
                      setNewRefundForm({ ...newRefundForm, amount: e.target.value })
                    }
                    min={1}
                  />
                  {studentTotalPaid !== null && (
                    <span className="field__hint">
                      {t("fees.maxRefundable", {
                        amount: studentTotalPaid.toLocaleString(),
                      })}
                    </span>
                  )}
                  {formErrors.amount && (
                    <span className="field__hint" style={{ color: "var(--danger)" }}>
                      {formErrors.amount}
                    </span>
                  )}
                </label>

                <label className="field" htmlFor="refund-mode">
                  <span className="field__label">
                    {t("pages.refundMode")} <span className="req">*</span>
                  </span>
                  <select
                    id="refund-mode"
                    className="select"
                    value={newRefundForm.refundMode}
                    onChange={(e) =>
                      setNewRefundForm({
                        ...newRefundForm,
                        refundMode: e.target.value,
                      })
                    }
                  >
                    <option value="cash">{t("pages.cash1")}</option>
                    <option value="cheque">{t("pages.cheque1")}</option>
                    <option value="bank_transfer">
                      {t("pages.bankTransfer1")}
                    </option>
                  </select>
                  {formErrors.refundMode && (
                    <span className="field__hint" style={{ color: "var(--danger)" }}>
                      {formErrors.refundMode}
                    </span>
                  )}
                </label>

                <label className="field span-2" htmlFor="refund-reason">
                  <span className="field__label">
                    {t("pages.reason")} <span className="req">*</span>
                  </span>
                  <textarea
                    id="refund-reason"
                    className={`textarea${formErrors.reason ? " textarea--err" : ""}`}
                    placeholder={t("pages.reasonForRefund")}
                    value={newRefundForm.reason}
                    onChange={(e) =>
                      setNewRefundForm({ ...newRefundForm, reason: e.target.value })
                    }
                    rows={2}
                  />
                  {formErrors.reason && (
                    <span className="field__hint" style={{ color: "var(--danger)" }}>
                      {formErrors.reason}
                    </span>
                  )}
                </label>

                <label className="field span-2" htmlFor="refund-remarks">
                  <span className="field__label">{t("pages.remarksOptional")}</span>
                  <textarea
                    id="refund-remarks"
                    className="textarea"
                    placeholder={t("pages.additionalNotes1")}
                    value={newRefundForm.remarks}
                    onChange={(e) =>
                      setNewRefundForm({ ...newRefundForm, remarks: e.target.value })
                    }
                    rows={2}
                  />
                </label>
              </div>
            </div>
            <footer className="composer__foot">
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setNewRefundOpen(false);
                  setFormErrors({});
                  handleClearStudent();
                }}
                disabled={savingRefund}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="btn btn--accent"
                onClick={handleCreateRefund}
                disabled={savingRefund}
              >
                {savingRefund
                  ? t("common.creating", "Creating...")
                  : t("fees.createRefund", "Create Refund")}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <PageShell
        title={t("pages.refunds", "Refunds")}
        description={t("pages.loading", "Loading...")}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Fees", href: "/fees" },
          { label: t("pages.refunds", "Refunds") },
        ]}
        bodyPadding="none"
        scrollable={false}
      >
        <TablePageSkeleton kpiCards={5} columns={5} rows={8} />
      </PageShell>
    );
  }

  if (fetchError) {
    return (
      <PageShell
        title={t("pages.refunds", "Refunds")}
        description={t("pages.somethingWentWrong", "Something went wrong")}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Fees", href: "/fees" },
          { label: t("pages.refunds", "Refunds") },
        ]}
        bodyPadding="none"
        scrollable={false}
      >
        <ErrorState
          title={t("common.somethingWentWrong", "Something went wrong")}
          description={fetchError}
          retryLabel={t("common.tryAgain", "Try again")}
          onRetry={fetchRefunds}
          size="lg"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("pages.refunds", "Refunds")}
      description={`${filteredRefunds.length} ${filteredRefunds.length === 1 ? "record" : "records"}`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Fees", href: "/fees" },
        { label: t("pages.refunds", "Refunds") },
      ]}
      bodyPadding="none"
      scrollable={false}
    >
      {pageContent}
    </PageShell>
  );
}
