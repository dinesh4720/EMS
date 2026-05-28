import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, BellRing, Printer } from "lucide-react";
import toast from "react-hot-toast";

import useFeesData, { derivePaymentStatus } from "../../hooks/useFeesData";
import FeesKpiStrip from "../../components/fees/FeesKpiStrip";
import PaymentsTable from "../../components/fees/PaymentsTable";
import PaymentSheet from "../../components/fees/PaymentSheet";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import ErrorState from "../../components/ui/ErrorState";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import ExportMenu from "../../components/ui/ExportMenu";
import PrintPreviewModal from "../../components/ui/PrintPreviewModal";
import { studentsApi } from "../../services/api";
import logger from "../../utils/logger";

const VALID_FILTERS = new Set(["all", "paid", "pending", "overdue"]);

// Phase 7 — top-level Fees page.
// Single canonical surface: KPI strip + toolbar + table + collection sheet.
// URL state via ?status= (filter) and ?student= (sheet pre-fill).
export default function FeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (() => {
    const raw = searchParams.get("status");
    return VALID_FILTERS.has(raw) ? raw : "all";
  })();
  const studentParam = searchParams.get("student");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sheetOpen, setSheetOpen] = useState(!!studentParam);
  const [printOpen, setPrintOpen] = useState(false);

  // If URL carries ?student=, open the sheet pre-filled. Closing the sheet
  // strips ?student= so deep-link semantics stay consistent.
  if (studentParam && !sheetOpen) {
    setSheetOpen(true);
  }

  const { payments, filtered, kpis, isLoading, isError, error, refetch } = useFeesData({ status, search });

  const setStatus = (next) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "all") out.delete("status");
        else out.set("status", next);
        return out;
      },
      { replace: false }
    );
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.delete("student");
        return out;
      },
      { replace: false }
    );
  };

  const openSheet = (preStudentId) => {
    setSheetOpen(true);
    if (preStudentId) {
      setSearchParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set("student", String(preStudentId));
          return out;
        },
        { replace: false }
      );
    }
  };

  const onSendReminder = async (ids) => {
    if (!ids?.length) return;
    const studentIds = payments
      .filter((p) => ids.includes(p._id || p.id))
      .map((p) => p.student?._id || p.studentId)
      .filter(Boolean);
    if (!studentIds.length) {
      toast.error("No students found for the selected payments.");
      return;
    }
    try {
      await studentsApi.sendRemindersBulk({ studentIds, type: "fee" });
      toast.success(`Reminder sent to ${studentIds.length} ${studentIds.length === 1 ? "student" : "students"}`);
    } catch (err) {
      toast.error(err?.message || "Failed to send reminders");
    }
  };

  const subLine = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const inrFmt = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
    return `${today} · ${inrFmt.format(kpis.collectedToday)} collected`;
  }, [kpis.collectedToday]);

  return (
    <div className="page fees-page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Fees</h1>
          <div className="page__sub mono tnum">{subLine}</div>
        </div>
        <div className="row gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => {
              const overdueIds = payments
                .filter((p) => derivePaymentStatus(p) === "overdue")
                .filter((p) => (p.studentId?._id || p.studentId || p.student?._id))
                .map((p) => p._id || p.id);
              onSendReminder(overdueIds);
            }}
            disabled={kpis.overdueCount === 0}
          >
            <BellRing size={13} aria-hidden /> Send reminders
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => openSheet(null)}
          >
            <Plus size={13} aria-hidden /> Collect payment
          </button>
        </div>
      </div>

      <FeesKpiStrip kpis={kpis} activeFilter={status} onFilterChange={setStatus} />

      <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          urlParam="q"
          placeholder="Search students, receipt no…"
          ariaLabel="Search payments"
          style={{ flex: 1, maxWidth: 360 }}
        />

        <div className="seg" role="tablist" aria-label="Filter payments">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "overdue", label: "Overdue" },
            { key: "paid", label: "Paid" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={status === f.key}
              className={`seg__btn${status === f.key ? " is-active" : ""}`}
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="row gap-2" style={{ marginLeft: "auto" }}>
          <ExportMenu
            rows={filtered}
            columns={[
              { key: "studentName", label: "Student", accessor: (p) => p.student?.name || p.studentName || "—" },
              { key: "rollNo", label: "Roll", accessor: (p) => p.student?.rollNo || p.rollNo || "—" },
              { key: "className", label: "Class", accessor: (p) => p.student?.className || p.className || p.classSection || "—" },
              { key: "term", label: "Term", accessor: (p) => p.term || p.feeTerm || p.headName || "—" },
              { key: "amount", label: "Amount", accessor: (p) => p.amount ?? 0 },
              { key: "status", label: "Status", accessor: (p) => p.status || "pending" },
              { key: "dueDate", label: "Due Date", accessor: (p) => p.dueDate || p.due_at || "—" },
              { key: "paymentMode", label: "Mode", accessor: (p) => p.paymentMode || p.mode || "—" },
            ]}
            filename="fees-list"
            title="Fees List"
          />
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setPrintOpen(true)}
            aria-label="Print preview"
          >
            <Printer size={14} aria-hidden />
          </button>
        </div>
      </div>

      {isLoading ? (
        <TablePageSkeleton kpiCards={3} columns={6} rows={8} />
      ) : isError ? (
        <ErrorState
          title="Unable to load payments"
          error={error}
          onRetry={refetch}
          size="lg"
        />
      ) : (
        <PaymentsTable
          rows={filtered}
          onCollect={openSheet}
          onSendReminder={onSendReminder}
        />
      )}

      <PaymentSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        prefilledStudentId={studentParam || null}
        onCollected={() => refetch?.()}
      />

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Fees List"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Fees List</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Roll</th>
                <th className="text-left py-2 px-3">Student</th>
                <th className="text-left py-2 px-3">Class</th>
                <th className="text-left py-2 px-3">Term</th>
                <th className="text-left py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Due Date</th>
                <th className="text-left py-2 px-3">Mode</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id || p.id} className="border-b">
                  <td className="py-2 px-3">{p.student?.rollNo || p.rollNo || "—"}</td>
                  <td className="py-2 px-3">{p.student?.name || p.studentName || "—"}</td>
                  <td className="py-2 px-3">{p.student?.className || p.className || p.classSection || "—"}</td>
                  <td className="py-2 px-3">{p.term || p.feeTerm || p.headName || "—"}</td>
                  <td className="py-2 px-3">{p.amount != null ? `₹${Number(p.amount).toLocaleString()}` : "—"}</td>
                  <td className="py-2 px-3">{p.status || "pending"}</td>
                  <td className="py-2 px-3">{p.dueDate || p.due_at || "—"}</td>
                  <td className="py-2 px-3">{p.paymentMode || p.mode || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>
    </div>
  );
}
