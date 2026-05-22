import { useState, useMemo, useEffect } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { useNavigate } from "react-router-dom";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Search, X, Plus, Download } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";
import { useCurrency } from '../../context/hooks/useCurrency';
import MobileResponsive from "../../components/ui/MobileResponsive";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import ErrorState from "../../components/ui/ErrorState";
import { createRefundSchema, parseFormSchema } from "../../validators/formSchemas";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';

const ITEMS_PER_LOAD = 10;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // refund id being actioned

  // New Refund modal
  const [newRefundOpen, setNewRefundOpen] = useState(false);
  const [newRefundForm, setNewRefundForm] = useState({ studentId: "", classId: "", amount: "", reason: "", refundMode: "cash", remarks: "" });
  const [formErrors, setFormErrors] = useState({});
  const [savingRefund, setSavingRefund] = useState(false);
  // BUG-30: track total paid for the selected student to prevent over-refund
  const [studentTotalPaid, setStudentTotalPaid] = useState(null);

  // [AUDIT-515] Student search picker state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectRefund, setRejectRefund] = useState(null);

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
      logger.error('Error fetching refunds:', error);
      setFetchError(error?.message || t('toast.error.failedToLoadRefunds'));
      toast.error(t('toast.error.failedToLoadRefunds'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.approveRefund(refund._id, {});
      toast.success(t('toast.success.refundApproved'));
      fetchRefunds();
    } catch (error) {
      toast.error(t('toast.error.failedToApproveRefund'));
    } finally {
      setActionLoading(null);
    }
  };

  // REVAMP-27 — reject pending refund with a required reason
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
      toast.success(t('toast.success.refundRejected', 'Refund rejected'));
      setRejectModalOpen(false);
      setRejectRefund(null);
      setRejectReason("");
      fetchRefunds();
    } catch (error) {
      toast.error(
        error?.message ||
          t('toast.error.failedToRejectRefund', 'Failed to reject refund')
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadRefund = (refund) => {
    const sanitize = (value) => {
      const str = String(value ?? '');
      return (/^[=+\-@\t\r]/.test(str) ? "'" : '') + str.replace(/"/g, '""');
    };
    const rows = [
      ['Refund ID', refund._id],
      ['Student', refund.studentId?.name || ''],
      ['Class', `${refund.classId?.name || ''} ${refund.classId?.section || ''}`.trim()],
      ['Amount', refund.amount ?? 0],
      ['Reason', refund.reason || ''],
      ['Refund Mode', refund.refundMode || ''],
      ['Status', refund.status || ''],
      ['Refund Date', refund.refundDate || ''],
      ['Remarks', refund.remarks || ''],
      ['Created At', refund.createdAt || ''],
    ];
    const csvContent = ['Field,Value', ...rows.map(r => r.map(c => `"${sanitize(c)}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `refund-${refund._id}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleProcess = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.processRefund(refund._id, {});
      toast.success(t('toast.success.refundProcessed'));
      fetchRefunds();
    } catch (error) {
      toast.error(t('toast.error.failedToProcessRefund'));
    } finally {
      setActionLoading(null);
    }
  };

  const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

  // BUG-30: fetch student total paid when a valid studentId is entered (debounced)
  useEffect(() => {
    if (!OBJECT_ID_REGEX.test(newRefundForm.studentId)) {
      setStudentTotalPaid(null);
      return;
    }
    const timeout = setTimeout(() => {
      feesApi.getPayments({ studentId: newRefundForm.studentId })
        .then(({ payments: data }) => {
          const total = Array.isArray(data)
            ? data.reduce((sum, p) => sum + (p.amount || 0), 0)
            : 0;
          setStudentTotalPaid(total);
        })
        .catch((err) => {
          logger.error('Failed to fetch student payments for refund validation:', err);
          toast.error(t('toast.error.failedToLoadPaymentHistory', 'Failed to load payment history — refund limit cannot be verified'));
          setStudentTotalPaid(null);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [newRefundForm.studentId]);

  // [AUDIT-515] Debounced student search
  useEffect(() => {
    if (!studentSearch || studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const data = await studentsApi.getAll({ search: studentSearch, limit: 20 });
        setStudentResults(data.students || []);
      } catch {
        setStudentResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  // [AUDIT-515] Handle student selection from search results
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch("");
    setStudentResults([]);
    const classId = student.classId?._id || student.classId || "";
    setNewRefundForm((f) => ({ ...f, studentId: student._id, classId: String(classId) }));
  };

  // [AUDIT-515] Clear student selection
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
      setFormErrors({ studentId: t('toast.error.pleaseSelectAStudent', 'Please select a student') });
      toast.error(t('toast.error.pleaseSelectAStudent', 'Please select a student'));
      return;
    }
    const { success, errors } = parseFormSchema(createRefundSchema, newRefundForm);
    if (!success) {
      setFormErrors(errors);
      toast.error(Object.values(errors)[0] || t('toast.error.pleaseFillAllRequiredFields'));
      return;
    }
    const parsedAmount = parseFloat(newRefundForm.amount);
    // BUG-30: prevent refund amount from exceeding total paid
    if (studentTotalPaid !== null && parsedAmount > studentTotalPaid) {
      const msg = t('toast.error.refundExceedsTotalPaid', { amount: parsedAmount, totalPaid: studentTotalPaid, defaultValue: `Refund amount (${fmt(parsedAmount)}) cannot exceed total paid (${fmt(studentTotalPaid)})` });
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
      toast.success(t('toast.success.refundRequestCreated'));
      setNewRefundOpen(false);
      setNewRefundForm({ studentId: "", classId: "", amount: "", reason: "", refundMode: "cash", remarks: "" });
      setFormErrors({});
      handleClearStudent();
      fetchRefunds();
    } catch (error) {
      toast.error(error?.message || t('toast.error.failedToCreateRefund'));
    } finally {
      setSavingRefund(false);
    }
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const studentName = r.studentId?.name || '';
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchQuery, statusFilter]);

  const { visibleItems: visibleRefunds, hasMore, isLoadingMore, loaderRef } = useEntityFetch(
    filteredRefunds,
    [searchQuery, statusFilter]
  );

  const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingCount = filteredRefunds.filter((r) => r.status === "pending").length;
  const processedCount = filteredRefunds.filter((r) => r.status === "processed").length;

  if (loading) {
    return <TablePageSkeleton kpiCards={3} columns={5} rows={8} />;
  }

  if (fetchError) {
    return (
      <ErrorState
        title={t('common.somethingWentWrong', 'Something went wrong')}
        description={fetchError}
        retryLabel={t('common.tryAgain', 'Try again')}
        onRetry={fetchRefunds}
        size="lg"
      />
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)]">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{t('pages.totalRefunds')}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{fmt(totalRefunds)}</p>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)]">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{t('pages.pending2')}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{pendingCount}</p>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)]">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{t('pages.processed')}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{processedCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-[var(--color-border)] py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ToolbarSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('pages.searchStudent')}
            ariaLabel={t('aria.misc.searchRefunds', 'Search refunds')}
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
              <option value="all">{t('pages.allStatus1')}</option>
              <option value="pending">{t('pages.pending2')}</option>
              <option value="approved">{t('pages.approved1')}</option>
              <option value="processed">{t('pages.processed')}</option>
            </Select>
          </div>

          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setNewRefundOpen(true)}
          >
            {t('pages.newRefund')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <MobileResponsive className="border border-[var(--color-border)] rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <table className="w-full border-collapse" aria-label={t('aria.misc.refunds')}>
          <thead className="bg-[var(--color-bg-secondary)]">
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] text-left">{t('pages.sTUDENT')}</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] text-left">{t('pages.aMOUNT')}</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] text-left">{t('pages.rEASON')}</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] text-left">{t('pages.sTATUS')}</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] text-left">{t('pages.dATE')}</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] text-right">{t('pages.aCTIONS')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRefunds.map((refund) => (
              <tr key={refund._id} className="border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-[var(--color-bg-secondary)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">{refund.studentId?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-text-muted)] cursor-pointer" onClick={() => navigate(`/students/${refund.studentId?._id}`)}>
                        {refund.studentId?.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{t('common.class')} {refund.classId?.name} {refund.classId?.section}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-[var(--color-text-primary)]">{fmt(refund.amount || 0)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--color-text-muted)]">{refund.reason || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <RefundStatusBadge status={refund.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-[var(--color-text-muted)]">{refund.refundDate || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {refund.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionLoading === refund._id}
                          disabled={actionLoading === refund._id}
                          onClick={() => handleReject(refund)}
                          aria-label={t('pages.rejectRefund', 'Reject refund')}
                        >
                          {t('pages.reject', 'Reject')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={actionLoading === refund._id}
                          disabled={actionLoading === refund._id}
                          onClick={() => handleApprove(refund)}
                          aria-label={t('pages.approveRefund', 'Approve refund')}
                        >
                          {t('pages.approve1')}
                        </Button>
                      </>
                    )}
                    {refund.status === "approved" && (
                      <Button
                        size="sm"
                        loading={actionLoading === refund._id}
                        disabled={actionLoading === refund._id}
                        onClick={() => handleProcess(refund)}
                        aria-label={t('pages.processRefund', 'Process refund')}
                      >
                        {t('pages.process')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download size={14} />}
                      aria-label={t('pages.downloadRefund', 'Download refund details')}
                      title={t('pages.download', 'Download refund details')}
                      onClick={() => handleDownloadRefund(refund)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {visibleRefunds.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <p className="text-[var(--color-text-muted)] text-sm">{t('pages.noRefundRecords')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Load more */}
        <div ref={loaderRef} className="flex justify-center py-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
          {isLoadingMore && (
            <span className="h-4 w-4 rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)] animate-spin" />
          )}
          {!hasMore && filteredRefunds.length > ITEMS_PER_LOAD && (
            <span className="text-[var(--color-text-muted)] text-xs">{t('pages.allRefundsLoaded')}</span>
          )}
        </div>
      </MobileResponsive>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectReason(""); setRejectRefund(null); }}
        title={t('pages.rejectRefund', 'Reject Refund')}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setRejectModalOpen(false); setRejectReason(""); setRejectRefund(null); }}
              disabled={actionLoading === rejectRefund?._id}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              loading={actionLoading === rejectRefund?._id}
              disabled={!rejectReason.trim() || actionLoading === rejectRefund?._id}
            >
              {t('pages.reject', 'Reject')}
            </Button>
          </div>
        }
      >
        <Textarea
          label={t('pages.rejectionReason', 'Reason for rejection')}
          placeholder={t('pages.enterRejectionReason', 'Enter reason for rejection...')}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          required
          rows={3}
        />
      </Modal>

      {/* New Refund Modal */}
      <Modal
        isOpen={newRefundOpen}
        onClose={() => { setNewRefundOpen(false); setFormErrors({}); handleClearStudent(); }}
        title={t('pages.newRefundRequest')}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setNewRefundOpen(false); setFormErrors({}); handleClearStudent(); }}
              disabled={savingRefund}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateRefund}
              loading={savingRefund}
              disabled={savingRefund}
            >
              {savingRefund ? t('common.creating', 'Creating...') : t('fees.createRefund', 'Create Refund')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* [AUDIT-515] Student search picker — replaces raw ObjectId inputs */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] mb-1 block">
              {t('pages.student', 'Student')} <span className="text-[var(--color-error)]" aria-hidden="true">*</span>
            </label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
                <div className="w-7 h-7 rounded-full bg-[var(--color-bg)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{selectedStudent.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{selectedStudent.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {selectedStudent.admissionNo || selectedStudent.admissionId || ''} — {t('common.class')} {selectedStudent.classId?.name || ''}{selectedStudent.classId?.section ? ` ${selectedStudent.classId.section}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearStudent}
                  aria-label={t('common.clearSelection', 'Clear student selection')}
                  className="p-1 hover:bg-[var(--color-bg)] rounded transition-colors"
                >
                  <X size={14} className="text-[var(--color-text-muted)]" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder={t('pages.searchStudentsByNameOrAdmissionNo', 'Search by name or admission number...')}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  size="sm"
                  startContent={<Search size={14} className="text-[var(--color-text-muted)]" />}
                />
                {studentResults.length > 0 && studentSearch && (
                  <div className="absolute z-50 w-full border border-[var(--color-border)] rounded-lg mt-1 max-h-48 overflow-y-auto bg-[var(--color-bg)] shadow-lg">
                    {studentResults.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        aria-label={t('common.selectStudent', 'Select student') + ' ' + s.name}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <span className="font-medium text-[var(--color-text-primary)]">{s.name}</span>
                        <span className="text-[var(--color-text-muted)] ml-2 text-xs">
                          {s.admissionNo || s.admissionId || ''} — {t('common.class')} {s.classId?.name || ''}{s.classId?.section ? ` ${s.classId.section}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {studentSearch.length >= 2 && studentResults.length === 0 && (
                  <div className="absolute z-50 w-full border border-[var(--color-border)] rounded-lg mt-1 bg-[var(--color-bg)] shadow-lg px-3 py-3 text-sm text-[var(--color-text-muted)]">
                    {t('common.noResultsFound', 'No students found')}
                  </div>
                )}
              </div>
            )}
          </div>
          <Input
            type="number"
            label={t('fees.amountLabel')}
            placeholder={t('fees.amountPlaceholder')}
            value={newRefundForm.amount}
            onChange={(e) => setNewRefundForm({ ...newRefundForm, amount: e.target.value })}
            required
            description={studentTotalPaid !== null ? t('fees.maxRefundable', { amount: studentTotalPaid.toLocaleString() }) : undefined}
            error={formErrors.amount || (studentTotalPaid !== null && parseFloat(newRefundForm.amount) > studentTotalPaid ? t('fees.cannotExceedTotalPaid', { amount: studentTotalPaid.toLocaleString() }) : undefined)}
          />
          <Textarea
            label={t('pages.reason')}
            placeholder={t('pages.reasonForRefund')}
            value={newRefundForm.reason}
            onChange={(e) => setNewRefundForm({ ...newRefundForm, reason: e.target.value })}
            required
            rows={2}
            error={formErrors.reason}
          />
          <Select
            label={t('pages.refundMode')}
            value={newRefundForm.refundMode}
            onChange={(e) => setNewRefundForm({ ...newRefundForm, refundMode: e.target.value })}
            error={formErrors.refundMode}
          >
            <option value="cash">{t('pages.cash1')}</option>
            <option value="cheque">{t('pages.cheque1')}</option>
            <option value="bank_transfer">{t('pages.bankTransfer1')}</option>
          </Select>
          <Textarea
            label={t('pages.remarksOptional')}
            placeholder={t('pages.additionalNotes1')}
            value={newRefundForm.remarks}
            onChange={(e) => setNewRefundForm({ ...newRefundForm, remarks: e.target.value })}
            rows={2}
          />
        </div>
      </Modal>
    </div>
  );
}
