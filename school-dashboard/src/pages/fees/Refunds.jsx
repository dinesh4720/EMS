import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Spinner } from "@heroui/react";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Search, X, Plus, Download } from "lucide-react";
import { feesApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function Refunds() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // refund id being actioned

  // New Refund modal
  const [newRefundOpen, setNewRefundOpen] = useState(false);
  const [newRefundForm, setNewRefundForm] = useState({ studentId: "", classId: "", amount: "", reason: "", refundMode: "cash", remarks: "" });
  const [savingRefund, setSavingRefund] = useState(false);
  // BUG-30: track total paid for the selected student to prevent over-refund
  const [studentTotalPaid, setStudentTotalPaid] = useState(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await feesApi.getRefunds({});
      setRefunds(data);
    } catch (error) {
      console.error('Error fetching refunds:', error);
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

  // BUG-30: fetch student total paid when a valid studentId is entered
  useEffect(() => {
    if (!OBJECT_ID_REGEX.test(newRefundForm.studentId)) {
      setStudentTotalPaid(null);
      return;
    }
    feesApi.getPayments({ studentId: newRefundForm.studentId })
      .then(data => {
        const total = Array.isArray(data)
          ? data.reduce((sum, p) => sum + (p.amount || 0), 0)
          : 0;
        setStudentTotalPaid(total);
      })
      .catch(() => setStudentTotalPaid(null));
  }, [newRefundForm.studentId]);

  const handleCreateRefund = async () => {
    if (!newRefundForm.studentId || !newRefundForm.classId || !newRefundForm.amount || !newRefundForm.reason || !newRefundForm.refundMode) {
      toast.error(t('toast.error.pleaseFillAllRequiredFields'));
      return;
    }
    if (!OBJECT_ID_REGEX.test(newRefundForm.studentId)) {
      toast.error(t('toast.error.invalidStudentIdFormat'));
      return;
    }
    if (!OBJECT_ID_REGEX.test(newRefundForm.classId)) {
      toast.error(t('toast.error.invalidClassIdFormat'));
      return;
    }
    const parsedAmount = parseFloat(newRefundForm.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(t('toast.error.refundAmountMustBeGreaterThanZero'));
      return;
    }
    // BUG-30: prevent refund amount from exceeding total paid
    if (studentTotalPaid !== null && parsedAmount > studentTotalPaid) {
      toast.error(`Refund amount (₹${parsedAmount}) cannot exceed total paid (₹${studentTotalPaid})`);
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
      fetchRefunds();
    } catch (error) {
      toast.error(t('toast.error.failedToCreateRefund'));
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

  // Lazy loading
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleRefunds = useMemo(() => filteredRefunds.slice(0, visibleCount), [filteredRefunds, visibleCount]);
  const hasMore = visibleCount < filteredRefunds.length;

  useEffect(() => { setVisibleCount(ITEMS_PER_LOAD); }, [searchQuery, statusFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingCount = filteredRefunds.filter((r) => r.status === "pending").length;
  const processedCount = filteredRefunds.filter((r) => r.status === "processed").length;

  if (loading) {
    return <TablePageSkeleton kpiCards={3} columns={5} rows={8} />;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.totalRefunds')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">₹{totalRefunds.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.pending2')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{pendingCount}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.processed')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{processedCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 dark:border-zinc-800 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all">
            <Search size={16} className="text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={t('pages.searchStudent')}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                <X size={14} className="text-gray-400 dark:text-zinc-500" />
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
            classNames={{ trigger: "h-9 min-h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700", value: "text-sm" }}
          >
            <SelectItem key="all">{t('pages.allStatus1')}</SelectItem>
            <SelectItem key="pending">{t('pages.pending2')}</SelectItem>
            <SelectItem key="approved">{t('pages.approved1')}</SelectItem>
            <SelectItem key="processed">{t('pages.processed')}</SelectItem>
          </Select>

          <button
            onClick={() => setNewRefundOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus size={14} />
            <span>{t('pages.newRefund')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <Table
          aria-label={t('aria.misc.refunds')}
          removeWrapper
          classNames={{
            th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200 dark:border-zinc-800",
            td: "py-4 border-b border-gray-100 dark:border-zinc-800",
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
          <TableBody emptyContent={<div className="text-center py-8"><p className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noRefundRecords')}</p></div>}>
            {visibleRefunds.map((refund) => (
              <TableRow key={refund._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{refund.studentId?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 hover:text-gray-600 dark:hover:text-zinc-400 cursor-pointer" onClick={() => navigate(`/students/${refund.studentId?._id}`)}>
                        {refund.studentId?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Class {refund.classId?.name} {refund.classId?.section}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900 dark:text-zinc-100">₹{refund.amount?.toLocaleString() || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{refund.reason || '—'}</span>
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
                  <span className="text-xs text-gray-500 dark:text-zinc-400">{refund.refundDate || '—'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {refund.status === "pending" && (
                      <button
                        onClick={() => handleApprove(refund)}
                        disabled={actionLoading === refund._id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
                      >
                        {actionLoading === refund._id ? '...' : 'Approve'}
                      </button>
                    )}
                    {refund.status === "approved" && (
                      <button
                        onClick={() => handleProcess(refund)}
                        disabled={actionLoading === refund._id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        {actionLoading === refund._id ? '...' : 'Process'}
                      </button>
                    )}
                    <button className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all">
                      <Download size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Load more */}
        <div ref={loaderRef} className="flex justify-center py-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
          {isLoadingMore && <Spinner size="sm" />}
          {!hasMore && filteredRefunds.length > ITEMS_PER_LOAD && (
            <span className="text-gray-400 dark:text-zinc-500 text-xs">{t('pages.allRefundsLoaded')}</span>
          )}
        </div>
      </div>

      {/* New Refund Modal */}
      <Modal isOpen={newRefundOpen} onClose={() => setNewRefundOpen(false)} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200 dark:border-zinc-800">{t('pages.newRefundRequest')}</ModalHeader>
              <ModalBody className="py-4 space-y-4">
                <Input
                  label={t('pages.studentId')}
                  placeholder={t('pages.enterStudentId')}
                  value={newRefundForm.studentId}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, studentId: v })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label={t('pages.classId')}
                  placeholder={t('pages.enterClassId')}
                  value={newRefundForm.classId}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, classId: v })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  type="number"
                  label="Amount (₹)"
                  placeholder={t('fees.amountPlaceholder')}
                  value={newRefundForm.amount}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, amount: v })}
                  variant="bordered"
                  isRequired
                  description={studentTotalPaid !== null ? `Max refundable: ₹${studentTotalPaid.toLocaleString()}` : undefined}
                  isInvalid={studentTotalPaid !== null && parseFloat(newRefundForm.amount) > studentTotalPaid}
                  errorMessage={studentTotalPaid !== null && parseFloat(newRefundForm.amount) > studentTotalPaid ? `Cannot exceed ₹${studentTotalPaid.toLocaleString()} (total paid)` : undefined}
                />
                <Textarea
                  label={t('pages.reason')}
                  placeholder={t('pages.reasonForRefund')}
                  value={newRefundForm.reason}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, reason: v })}
                  variant="bordered"
                  isRequired
                  minRows={2}
                />
                <Select
                  label={t('pages.refundMode')}
                  variant="bordered"
                  selectedKeys={[newRefundForm.refundMode]}
                  onChange={(e) => setNewRefundForm({ ...newRefundForm, refundMode: e.target.value })}
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
              <ModalFooter className="border-t border-gray-200 dark:border-zinc-800 gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleCreateRefund}
                  disabled={savingRefund}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {savingRefund ? 'Creating...' : 'Create Refund'}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
