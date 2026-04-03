import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Search, X, IndianRupee, Download, Printer, Bell, SlidersHorizontal } from "lucide-react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { feesApi, studentsApi, studentFeesApi } from "../../services/api";
import { showErrorToast } from "../../utils/errorHandling";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../utils/dateFormatter';

function getCurrentUser() {
  try {
    const stored = sessionStorage.getItem('app_user');
    if (stored) return JSON.parse(stored);
  } catch (_) { /* ignored */ }
  return null;
}

export default function Payments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Advanced filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Data from API
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search to avoid API call on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (amountMin) filters.amountMin = amountMin;
      if (amountMax) filters.amountMax = amountMax;
      const paymentsData = await feesApi.getPayments(filters);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(t('toast.error.failedToLoadPayments', 'Failed to load payments'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, amountMin, amountMax]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const loadStudents = useCallback(async (pageToLoad) => {
    try {
      setStudentsLoading(true);
      const response = await studentsApi.list({
        page: pageToLoad,
        limit: 20,
        status: 'active',
        search: debouncedSearchQuery || undefined,
        ...(statusFilter !== 'all' && { feeStatus: statusFilter }),
      });
      const studentList = response.data || [];
      setStudents(studentList);
      setPagination(response.pagination || {
        currentPage: pageToLoad,
        totalPages: 1,
        totalItems: studentList.length || 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
      });

      // Fetch fee structures for all students on this page
      if (studentList.length > 0) {
        try {
          const studentIds = studentList.map(s => s.id || s._id);
          const structures = await studentFeesApi.getBatch(studentIds);
          setFeeStructures(structures || {});
        } catch (feeErr) {
          console.error('Error fetching fee structures:', feeErr);
          setFeeStructures({});
        }
      } else {
        setFeeStructures({});
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(t('toast.error.failedToLoadStudentsPleaseRefresh'));
      setStudents([]);
      setFeeStructures({});
    } finally {
      setStudentsLoading(false);
      setInitialLoadDone(true);
    }
  }, [debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    loadStudents(currentPage);
  }, [currentPage, loadStudents]);

  // Transform students to payment format
  const feePayments = useMemo(() => {
    return students.map((s) => {
      const studentId = s.id || s._id;
      // BUG-24: skip payments without a valid _id to avoid downstream reference errors
      const studentPayments = payments.filter(p => {
        if (!p?._id) return false;
        return p.studentId?._id === studentId || p.studentId === studentId;
      });

      // Use StudentFeeStructure as the authoritative source of truth for fee totals.
      // Previously, totalPaid was recomputed from the local (potentially filtered/paginated)
      // payments array, causing "Pending 0" when the payments list was incomplete.
      const sfs = feeStructures[studentId];
      const totalAnnualFee = sfs?.totalFee ?? s.feeDetails?.totalFee ?? 0;
      const totalPaid = sfs?.totalPaid ?? s.feeDetails?.paidAmount ?? 0;
      const pending = sfs?.totalBalance ?? s.feeDetails?.balanceAmount ?? Math.max(totalAnnualFee - totalPaid, 0);
      const feeAssigned = totalAnnualFee > 0;

      return {
        id: studentId,
        student: s.name,
        class: s.class || s.className,
        rollNo: s.rollNo,
        classId: s.classId,
        pending: pending > 0 ? pending : 0,
        paid: totalPaid,
        status: !feeAssigned ? "not_assigned" : pending > 0 ? "pending" : "paid",
        feeAssigned,
        totalAnnualFee,
        feeStructure: sfs || null,
        lastPayment: sfs?.lastPaymentDate || (studentPayments.length > 0 ? studentPayments[0].paymentDate : null),
      };
    });
  }, [students, payments, feeStructures]);

  // Auto-select student from location state (e.g. navigated from Defaulters page)
  useEffect(() => {
    const targetId = location.state?.selectedStudentId;
    if (targetId && feePayments.length > 0) {
      const match = feePayments.find(p => p.id === targetId);
      if (match) {
        setSelectedStudent(match);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.selectedStudentId, feePayments]);

  const filteredPayments = useMemo(() => {
    return feePayments.filter((p) => {
      const matchesSearch =
        p.student.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        p.rollNo?.toString().includes(debouncedSearchQuery);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      // Date range filter — exclude students with no payment history when date filter is active
      let matchesDate = true;
      if (dateFrom || dateTo) {
        if (!p.lastPayment) {
          matchesDate = false;
        } else {
          if (dateFrom) matchesDate = new Date(p.lastPayment) >= new Date(dateFrom);
          if (dateTo) matchesDate = matchesDate && new Date(p.lastPayment) <= new Date(dateTo);
        }
      }

      // Amount range filter
      let matchesAmount = true;
      if (amountMin) matchesAmount = p.pending >= parseInt(amountMin);
      if (amountMax) matchesAmount = matchesAmount && p.pending <= parseInt(amountMax);

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });
  }, [feePayments, debouncedSearchQuery, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

  // Build fee line items from the student's actual StudentFeeStructure data
  const getStudentFees = (student) => {
    if (!student) return [];
    if (!student.feeAssigned || !student.feeStructure) return [];

    const sfs = student.feeStructure;
    if (!Array.isArray(sfs.feeHeads) || sfs.feeHeads.length === 0) return [];

    return sfs.feeHeads
      .filter(h => (h.balanceAmount ?? (h.amount - (h.paidAmount || 0))) > 0)
      .map((h, index) => {
        const balance = h.balanceAmount ?? Math.max((h.amount || 0) - (h.paidAmount || 0), 0);
        return {
          id: h.feeHeadId?._id || h.feeHeadId || `head-${index}`,
          head: h.name || 'Fee',
          category: h.category || '',
          frequency: h.frequency || '',
          month: h.frequency === 'monthly' ? 'Monthly' : h.frequency === 'quarterly' ? 'Quarterly' : 'Annual',
          amount: balance,
          totalAmount: h.amount || 0,
          paidAmount: h.paidAmount || 0,
          status: h.status || (balance > 0 ? 'pending' : 'paid'),
        };
      });
  };

  const studentFees = getStudentFees(selectedStudent);

  // Auto-select all pending fees by default
  useEffect(() => {
    if (selectedStudent && studentFees.length > 0) {
      setSelectedFees(studentFees.map(f => f.id.toString()));
    }
  }, [selectedStudent, studentFees.length]);

  const totalSelected = studentFees
    .filter((f) => selectedFees.includes(f.id.toString()))
    .reduce((sum, f) => sum + f.amount, 0);

  const handleCollect = async () => {
    if (!selectedStudent || totalSelected === 0) return;
    setCollectingPayment(true);
    try {
      const student = students.find(s => s.id === selectedStudent.id);
      const currentUser = getCurrentUser();

      const paymentData = {
        studentId: selectedStudent.id,
        classId: student?.classId,
        paymentDate: new Date().toISOString().split("T")[0],
        amount: totalSelected,
        paymentMode,
        feeHeads: studentFees
          .filter((f) => selectedFees.includes(f.id.toString()))
          .map(f => ({ feeHeadId: f.id, name: f.head, amount: f.amount, month: f.month })),
        collectedBy: currentUser?._id || currentUser?.id || null,
        remarks: "Payment collected via dashboard"
      };

      const newPayment = await feesApi.createPayment(paymentData);
      setPayments([newPayment, ...payments]);
      await loadStudents(currentPage);

      setReceiptData({
        receiptNumber: newPayment.receiptNumber,
        amount: totalSelected,
        student: selectedStudent.student,
        class: selectedStudent.class,
        paymentMode,
        date: formatShortDate(new Date())
      });

      setSelectedStudent(null);
      setSelectedFees([]);
      setReceiptModalOpen(true);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(t('toast.error.failedToCollectPaymentPleaseTryAgain'));
    } finally {
      setCollectingPayment(false);
    }
  };

  const handleSendReminder = async (payment) => {
    const studentId = payment.studentId?._id || payment.studentId || payment.id;
    if (!studentId) {
      toast.error('Cannot send reminder: student not found');
      return;
    }
    const loadingToast = toast.loading(`Sending reminder to ${payment.student}'s parents...`);
    try {
      await studentsApi.sendReminder(studentId, {
        type: 'fee',
        message: `Fee payment reminder for ${payment.student}. Please pay at your earliest convenience.`,
      });
      toast.success(`Reminder sent to ${payment.student}'s parents`, { id: loadingToast });
    } catch (error) {
      toast.error(error.message || 'Failed to send reminder', { id: loadingToast });
    }
  };

  const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

  const generateReceiptPDF = (data) => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Fee Receipt</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:40px;max-width:620px;margin:auto}
.logo-row{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px}
.logo-row h1{font-size:20px;font-weight:700}.logo-row p{font-size:12px;color:#666}
.badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600}
.amount-block{text-align:center;margin:28px 0 20px}
.amount-block .amt{font-size:48px;font-weight:800}
.amount-block .lbl{font-size:12px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
.receipt-no{text-align:center;font-size:13px;color:#888;margin-bottom:28px}
.rows{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
.row{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #f0f0f0}
.row:last-child{border-bottom:none}
.row .lbl{color:#6b7280}.row .val{font-weight:500}
.footer{text-align:center;font-size:11px;color:#aaa;margin-top:28px}
@media print{body{padding:20px}}
</style></head>
<body>
<div class="logo-row"><div><h1>Fee Receipt</h1><p>Payment Confirmation</p></div><span class="badge">&#x2713; Paid</span></div>
<div class="amount-block"><div class="amt">&#8377;${(data.amount||0).toLocaleString()}</div><div class="lbl">Amount Received</div></div>
<div class="receipt-no">Receipt No: <strong>${escapeHtml(data.receiptNumber||'—')}</strong></div>
<div class="rows">
<div class="row"><span class="lbl">Student</span><span class="val">${escapeHtml(data.student)}</span></div>
<div class="row"><span class="lbl">Class</span><span class="val">${escapeHtml(data.class)}</span></div>
<div class="row"><span class="lbl">Payment Mode</span><span class="val" style="text-transform:capitalize">${escapeHtml(data.paymentMode)}</span></div>
<div class="row"><span class="lbl">Date</span><span class="val">${escapeHtml(data.date)}</span></div>
</div>
<div class="footer">Thank you — keep this receipt for your records.</div>
<script>setTimeout(()=>{window.print();},400);<\/script>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'width=700,height=580');
    if (!w) { toast.error('Pop-up blocked. Allow pop-ups to download receipt.'); URL.revokeObjectURL(url); return; }
    w.addEventListener('afterprint', () => URL.revokeObjectURL(url));
  };

  const handleDownloadReceipt = (payment) => {
    const studentPayments = payments.filter(
      p => p.studentId?._id === payment.id || p.studentId === payment.id
    );
    if (studentPayments.length === 0) {
      toast.error('No payment record found for this student.');
      return;
    }
    const latest = studentPayments[0];
    generateReceiptPDF({
      receiptNumber: latest.receiptNumber || latest._id,
      amount: latest.amount,
      student: payment.student,
      class: payment.class,
      paymentMode: latest.paymentMode || 'cash',
      date: latest.paymentDate ? formatShortDate(latest.paymentDate) : formatShortDate(new Date()),
    });
  };

  const handleExportData = () => {
    const headers = ['Student', 'Class', 'Roll No', 'Paid', 'Pending', 'Status', 'Last Payment'];
    const rows = filteredPayments.map(p => [
      p.student, p.class, p.rollNo, p.paid, p.pending, p.status, p.lastPayment || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const totalPending = filteredPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.pending, 0);
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.paid, 0);
  // Use unfiltered feePayments for overdue count to match dashboard's feeDefaultersCount
  const pendingCount = feePayments.filter(p => p.status === "pending").length;

  if (!initialLoadDone && (loading || studentsLoading)) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.collected1')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.pending2')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.overdueStudents')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{pendingCount}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.totalStudents1')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{pagination.totalItems}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b border-gray-200 dark:border-zinc-800 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all duration-200">
            <Search size={16} className="text-gray-400 dark:text-zinc-500" />
            <input
              type="search"
              name="payments-search"
              autoComplete="off"
              data-form-type="other"
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

          <Popover isOpen={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger>
              <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all text-sm">
                <SlidersHorizontal size={16} className="text-gray-500 dark:text-zinc-400" />
                <span className="text-gray-600 dark:text-zinc-400">{t('pages.filters2')}</span>
                {(dateFrom || dateTo || amountMin || amountMax) && (
                  <span className="w-2 h-2 rounded-full bg-gray-800 dark:bg-zinc-200"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-4">
              <div className="space-y-4 w-72">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.advancedFilters')}</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">{t('pages.dateRangeLastPayment')}</label>
                    <div className="flex gap-2">
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 dark:text-zinc-100" />
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 dark:text-zinc-100" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">{t('pages.pendingAmountRange')}</label>
                    <div className="flex gap-2">
                      <input type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 dark:text-zinc-100" placeholder={t('pages.min')} />
                      <input type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 dark:text-zinc-100" placeholder={t('pages.max1')} />
                    </div>
                  </div>
                </div>
                <button onClick={clearFilters} className="w-full py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100">
                  Clear Filters
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            size="sm"
            placeholder={t('pages.allStatus1')}
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{
              trigger: "h-9 min-h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700",
              value: "text-sm",
            }}
          >
            <SelectItem key="all">{t('pages.allStatus1')}</SelectItem>
            <SelectItem key="paid">{t('pages.paid2')}</SelectItem>
            <SelectItem key="pending">{t('pages.pending2')}</SelectItem>
          </Select>

          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all text-sm"
          >
            <Download size={14} className="text-gray-500 dark:text-zinc-400" />
            <span className="text-gray-700 dark:text-zinc-300">{t('pages.export1')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden -mx-6 sm:mx-0 transition-opacity duration-200 ${studentsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Table
          aria-label={t('aria.misc.feePayments')}
          removeWrapper
          classNames={{
            base: "overflow-visible [&_table]:w-full",
            th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200 dark:border-zinc-800",
            td: "py-4 border-b border-gray-100 dark:border-zinc-800",
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.sTUDENT')}</TableColumn>
            <TableColumn scope="col">{t('pages.pAID')}</TableColumn>
            <TableColumn scope="col">{t('pages.pENDING')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn scope="col">{t('pages.lASTPayment')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noPaymentRecordsFound')}</p>
              </div>
            }
          >
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                        {payment.student.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium text-gray-900 dark:text-zinc-100 hover:text-gray-600 dark:hover:text-zinc-400 cursor-pointer"
                        onClick={() => navigate(`/students/${payment.id}`)}
                      >
                        {payment.student}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Class {payment.class}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-700 dark:text-zinc-300">₹{payment.paid.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-700 dark:text-zinc-300">₹{payment.pending.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded ${
                    payment.status === "paid"
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                      : payment.status === "not_assigned"
                      ? "border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400"
                      : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      payment.status === "paid" ? "bg-green-500" : payment.status === "not_assigned" ? "bg-gray-400" : "bg-yellow-500"
                    }`}></span>
                    {payment.status === "not_assigned" ? "Fee not assigned" : payment.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">{payment.lastPayment ? new Date(payment.lastPayment).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {payment.status === "pending" && payment.feeAssigned && (
                      <>
                        <button
                          onClick={() => setSelectedStudent(payment)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-medium"
                        >
                          Collect
                        </button>
                        <button
                          onClick={() => handleSendReminder(payment)}
                          className="p-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                        >
                          <Bell size={14} className="text-gray-500 dark:text-zinc-400" />
                        </button>
                      </>
                    )}
                    {payment.status === "paid" && (
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="p-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                      >
                        <Download size={14} className="text-gray-500 dark:text-zinc-400" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-500 dark:text-zinc-400 text-sm">
          Page {currentPage} of {pagination.totalPages} ({pagination.totalItems} students)
        </span>
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevPage || studentsLoading}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 dark:text-zinc-300"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage || studentsLoading}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-800 rounded hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 dark:text-zinc-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Collection Modal */}
      <Modal isOpen={selectedStudent !== null} onClose={() => setSelectedStudent(null)} isDismissable={!collectingPayment} size="xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
                <div className="flex justify-between items-center w-full">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                    Collect Fee — {selectedStudent?.student}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-zinc-400">Class {selectedStudent?.class}</span>
                </div>
              </ModalHeader>
              <ModalBody className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
                  {studentFees.map((fee) => (
                    <label
                      key={fee.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          size="sm"
                          isSelected={selectedFees.includes(fee.id.toString())}
                          onValueChange={(v) => {
                            if (v) setSelectedFees([...selectedFees, fee.id.toString()]);
                            else setSelectedFees(selectedFees.filter((f) => f !== fee.id.toString()));
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{fee.head}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{fee.month}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono text-gray-700 dark:text-zinc-300">₹{fee.amount.toLocaleString()}</span>
                    </label>
                  ))}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.mode')}</span>
                      <div className="flex gap-2">
                        {["cash", "online", "card", "cheque"].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setPaymentMode(mode)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                              paymentMode === mode
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white dark:bg-zinc-950 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.total1')}</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-zinc-100">₹{totalSelected.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4 gap-3">
                <button
                  onClick={onClose}
                  disabled={collectingPayment}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCollect}
                  disabled={selectedFees.length === 0 || collectingPayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {collectingPayment ? 'Processing...' : `Collect ₹${totalSelected.toLocaleString()}`}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={receiptModalOpen} onClose={() => setReceiptModalOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200 dark:border-zinc-800">{t('pages.paymentReceipt')}</ModalHeader>
              <ModalBody className="py-6">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto">
                    <span className="text-2xl text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm font-medium">{t('pages.paymentSuccessful')}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                    ₹{(receiptData?.amount ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Receipt No: {receiptData?.receiptNumber}</p>
                  <div className="border-t border-gray-200 dark:border-zinc-800 my-4"></div>
                  <div className="text-left space-y-2 bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">{t('pages.student')}</span>
                      <span className="text-gray-900 dark:text-zinc-100">{receiptData?.student}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">{t('pages.class1')}</span>
                      <span className="text-gray-900 dark:text-zinc-100">{receiptData?.class}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">{t('pages.mode1')}</span>
                      <span className="text-gray-900 dark:text-zinc-100 capitalize">{receiptData?.paymentMode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">{t('pages.date2')}</span>
                      <span className="text-gray-900 dark:text-zinc-100">{receiptData?.date}</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-200 dark:border-zinc-800 gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                >
                  <Printer size={14} />
                  <span>{t('pages.print')}</span>
                </button>
                <button
                  onClick={() => receiptData && generateReceiptPDF(receiptData)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                >
                  <Download size={14} />
                  <span>{t('pages.download')}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all"
                >
                  Done
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
