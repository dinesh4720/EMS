import { useState, useMemo, useEffect, useRef } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Spinner } from "@heroui/react";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Search, X, Plus, Download } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";
import { useCurrency } from '../../context/hooks/useCurrency';
import MobileResponsive from "../../components/ui/MobileResponsive";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import { createRefundSchema, parseFormSchema } from "../../validators/formSchemas";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


const ITEMS_PER_LOAD = 10;

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
        <div className="p-4 border border-border-token rounded-lg bg-surface">
          <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">{t('pages.totalRefunds')}</p>
          <p className="text-2xl font-bold text-fg">{fmt(totalRefunds)}</p>
        </div>
        <div className="p-4 border border-border-token rounded-lg bg-surface">
          <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">{t('pages.pending2')}</p>
          <p className="text-2xl font-bold text-fg">{pendingCount}</p>
        </div>
        <div className="p-4 border border-border-token rounded-lg bg-surface">
          <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">{t('pages.processed')}</p>
          <p className="text-2xl font-bold text-fg">{processedCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-border-token py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-surface rounded-lg border border-border-token hover:border-border-strong focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all">
            <Search size={16} className="text-fg-faint" />
            <input
              type="text"
              placeholder={t('pages.searchStudent')}
              className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-gray-500 dark:placeholder:text-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-surface-2 rounded">
                <X size={14} className="text-fg-faint" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            size="sm"
            placeholder={t('pages.allStatus1')}
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{ trigger: "h-9 min-h-9 bg-surface border-border-token hover:border-border-strong", value: "text-sm" }}
          >
            <SelectItem key="all">{t('pages.allStatus1')}</SelectItem>
            <SelectItem key="pending">{t('pages.pending2')}</SelectItem>
            <SelectItem key="approved">{t('pages.approved1')}</SelectItem>
            <SelectItem key="processed">{t('pages.processed')}</SelectItem>
          </Select>

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
      <MobileResponsive className="border border-border-token rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <Table
          aria-label={t('aria.misc.refunds')}
          removeWrapper
          classNames={{
            th: "bg-surface-2 text-fg-muted font-medium text-xs uppercase tracking-wider h-11 border-b border-border-token",
            td: "py-4 border-b border-divider",
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.sTUDENT')}</TableColumn>
            <TableColumn scope="col">{t('pages.aMOUNT')}</TableColumn>
            <TableColumn scope="col">{t('pages.rEASON')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn scope="col">{t('pages.dATE')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<div className="text-center py-8"><p className="text-fg-faint text-sm">{t('pages.noRefundRecords')}</p></div>}>
            {visibleRefunds.map((refund) => (
              <TableRow key={refund._id} className="hover:bg-surface-2">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                      <span className="text-xs font-medium text-fg-muted">{refund.studentId?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg hover:text-gray-600 dark:hover:text-zinc-400 cursor-pointer" onClick={() => navigate(`/students/${refund.studentId?._id}`)}>
                        {refund.studentId?.name}
                      </p>
                      <p className="text-xs text-fg-muted">{t('common.class')} {refund.classId?.name} {refund.classId?.section}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-fg">{fmt(refund.amount || 0)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-fg-muted">{refund.reason || '—'}</span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded ${
                    refund.status === "processed" ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" :
                    refund.status === "approved" ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400" :
                    refund.status === "rejected" ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400" :
                    "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      refund.status === "processed" ? "bg-green-500" :
                      refund.status === "approved" ? "bg-blue-500" :
                      refund.status === "rejected" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`}></span>
                    {refund.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-fg-muted">{refund.refundDate || '—'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {refund.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={actionLoading === refund._id}
                        disabled={actionLoading === refund._id}
                        onClick={() => handleApprove(refund)}
                      >
                        {t('pages.approve1')}
                      </Button>
                    )}
                    {refund.status === "approved" && (
                      <Button
                        size="sm"
                        loading={actionLoading === refund._id}
                        disabled={actionLoading === refund._id}
                        onClick={() => handleProcess(refund)}
                      >
                        {t('pages.process')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download size={14} />}
                      aria-label={t('pages.download', 'Download')}
                      title={t('pages.download', 'Download refund details')}
                      onClick={() => handleDownloadRefund(refund)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Load more */}
        <div ref={loaderRef} className="flex justify-center py-4 bg-surface-2 border-t border-border-token">
          {isLoadingMore && <Spinner size="sm" />}
          {!hasMore && filteredRefunds.length > ITEMS_PER_LOAD && (
            <span className="text-fg-faint text-xs">{t('pages.allRefundsLoaded')}</span>
          )}
        </div>
      </MobileResponsive>

      {/* New Refund Modal */}
      <Modal isOpen={newRefundOpen} onClose={() => { setNewRefundOpen(false); setFormErrors({}); handleClearStudent(); }} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-border-token">{t('pages.newRefundRequest')}</ModalHeader>
              <ModalBody className="py-4 space-y-4">
                {/* [AUDIT-515] Student search picker — replaces raw ObjectId inputs */}
                <div>
                  <label className="text-sm font-medium text-fg mb-1 block">
                    {t('pages.student', 'Student')} <span className="text-danger">*</span>
                  </label>
                  {selectedStudent ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-border-token rounded-lg bg-surface-2 dark:bg-zinc-900">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">{selectedStudent.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg truncate">{selectedStudent.name}</p>
                        <p className="text-xs text-fg-muted">
                          {selectedStudent.admissionNo || selectedStudent.admissionId || ''} — {t('common.class')} {selectedStudent.classId?.name || ''}{selectedStudent.classId?.section ? ` ${selectedStudent.classId.section}` : ''}
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
                        placeholder={t('pages.searchStudentsByNameOrAdmissionNo', 'Search by name or admission number...')}
                        value={studentSearch}
                        onValueChange={(v) => setStudentSearch(v)}
                        variant="bordered"
                        startContent={<Search size={14} className="text-gray-400" />}
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
                              <span className="font-medium text-fg">{s.name}</span>
                              <span className="text-fg-muted ml-2 text-xs">
                                {s.admissionNo || s.admissionId || ''} — {t('common.class')} {s.classId?.name || ''}{s.classId?.section ? ` ${s.classId.section}` : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {studentSearch.length >= 2 && studentResults.length === 0 && (
                        <div className="absolute z-50 w-full border border-border-token rounded-lg mt-1 bg-surface shadow-lg px-3 py-3 text-sm text-fg-muted">
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
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, amount: v })}
                  variant="bordered"
                  isRequired
                  description={studentTotalPaid !== null ? t('fees.maxRefundable', { amount: studentTotalPaid.toLocaleString() }) : undefined}
                  isInvalid={Boolean(formErrors.amount) || (studentTotalPaid !== null && parseFloat(newRefundForm.amount) > studentTotalPaid)}
                  errorMessage={formErrors.amount || (studentTotalPaid !== null && parseFloat(newRefundForm.amount) > studentTotalPaid ? t('fees.cannotExceedTotalPaid', { amount: studentTotalPaid.toLocaleString() }) : undefined)}
                />
                <Textarea
                  label={t('pages.reason')}
                  placeholder={t('pages.reasonForRefund')}
                  value={newRefundForm.reason}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, reason: v })}
                  variant="bordered"
                  isRequired
                  minRows={2}
                  isInvalid={Boolean(formErrors.reason)}
                  errorMessage={formErrors.reason}
                />
                <Select
                  label={t('pages.refundMode')}
                  variant="bordered"
                  selectedKeys={[newRefundForm.refundMode]}
                  onChange={(e) => setNewRefundForm({ ...newRefundForm, refundMode: e.target.value })}
                  isInvalid={Boolean(formErrors.refundMode)}
                  errorMessage={formErrors.refundMode}
                >
                  <SelectItem key="cash">{t('pages.cash1')}</SelectItem>
                  <SelectItem key="cheque">{t('pages.cheque1')}</SelectItem>
                  <SelectItem key="bank_transfer">{t('pages.bankTransfer1')}</SelectItem>
                </Select>
                <Textarea
                  label={t('pages.remarksOptional')}
                  placeholder={t('pages.additionalNotes1')}
                  value={newRefundForm.remarks}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, remarks: v })}
                  variant="bordered"
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter className="border-t border-border-token gap-3">
                <Button variant="outline" onClick={onClose} disabled={savingRefund}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateRefund}
                  loading={savingRefund}
                  disabled={savingRefund}
                >
                  {savingRefund ? t('common.creating', 'Creating...') : t('fees.createRefund', 'Create Refund')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
