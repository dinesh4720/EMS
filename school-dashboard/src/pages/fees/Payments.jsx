import { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
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
import { Search, X, IndianRupee, Download, Printer, Bell, ChevronDown, Calendar, SlidersHorizontal } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";

export default function Payments() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
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
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const paymentsData = await feesApi.getPayments({});
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const loadStudents = useCallback(async (pageToLoad) => {
    try {
      setStudentsLoading(true);
      const response = await studentsApi.list({
        page: pageToLoad,
        limit: 20,
        status: 'active',
        search: deferredSearchQuery || undefined,
      });
      setStudents(response.data || []);
      setPagination(response.pagination || {
        currentPage: pageToLoad,
        totalPages: 1,
        totalItems: response.data?.length || 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [deferredSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery]);

  useEffect(() => {
    loadStudents(currentPage);
  }, [currentPage, loadStudents]);

  // Transform students to payment format
  const feePayments = useMemo(() => {
    return students.map((s) => {
      const studentPayments = payments.filter(p => p.studentId?._id === s.id || p.studentId === s.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalAnnualFee = 60000;
      const pending = totalAnnualFee - totalPaid;

      return {
        id: s.id,
        student: s.name,
        class: s.class || s.className,
        rollNo: s.rollNo,
        pending: pending > 0 ? pending : 0,
        paid: totalPaid,
        status: pending > 0 ? "pending" : "paid",
        lastPayment: studentPayments.length > 0 ? studentPayments[0].paymentDate : null,
      };
    });
  }, [students, payments]);

  const filteredPayments = useMemo(() => {
    return feePayments.filter((p) => {
      const matchesSearch =
        p.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rollNo?.toString().includes(searchQuery);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      // Date range filter
      let matchesDate = true;
      if (dateFrom && p.lastPayment) {
        matchesDate = new Date(p.lastPayment) >= new Date(dateFrom);
      }
      if (dateTo && p.lastPayment) {
        matchesDate = matchesDate && new Date(p.lastPayment) <= new Date(dateTo);
      }

      // Amount range filter
      let matchesAmount = true;
      if (amountMin) {
        matchesAmount = p.pending >= parseInt(amountMin);
      }
      if (amountMax) {
        matchesAmount = matchesAmount && p.pending <= parseInt(amountMax);
      }

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });
  }, [feePayments, searchQuery, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

  const visiblePayments = filteredPayments;

  // Calculate fee heads dynamically based on selected student's pending amount
  const getStudentFees = (student) => {
    if (!student) return [];

    const pending = student.pending;
    if (pending <= 0) return [];

    const monthlyTuition = 5000;
    const monthlyTransport = 2000;
    const totalMonthlyFee = monthlyTuition + monthlyTransport;

    const completeMonths = Math.floor(pending / totalMonthlyFee);
    const remainingAmount = pending % totalMonthlyFee;

    const fees = [];
    const currentDate = new Date();

    for (let i = 0; i < completeMonths; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      fees.push({
        id: `tuition-${i}`,
        head: "Tuition Fee",
        month: monthName,
        amount: monthlyTuition,
        status: i === 0 ? "pending" : "overdue"
      });

      fees.push({
        id: `transport-${i}`,
        head: "Transport Fee",
        month: monthName,
        amount: monthlyTransport,
        status: i === 0 ? "pending" : "overdue"
      });
    }

    if (remainingAmount > 0) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - completeMonths, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (remainingAmount >= monthlyTuition) {
        fees.push({
          id: `tuition-${completeMonths}`,
          head: "Tuition Fee",
          month: monthName,
          amount: monthlyTuition,
          status: "overdue"
        });

        const partialTransport = remainingAmount - monthlyTuition;
        if (partialTransport > 0) {
          fees.push({
            id: `transport-${completeMonths}`,
            head: "Transport Fee",
            month: monthName,
            amount: partialTransport,
            status: "overdue"
          });
        }
      } else {
        fees.push({
          id: `tuition-${completeMonths}`,
          head: "Tuition Fee (Partial)",
          month: monthName,
          amount: remainingAmount,
          status: "overdue"
        });
      }
    }

    return fees;
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
    if (selectedStudent && totalSelected > 0) {
      try {
        const student = students.find(s => s.id === selectedStudent.id);

        const paymentData = {
          studentId: selectedStudent.id,
          classId: student.classId,
          paymentDate: new Date().toISOString().split("T")[0],
          amount: totalSelected,
          paymentMode,
          feeHeads: studentFees
            .filter((f) => selectedFees.includes(f.id.toString()))
            .map(f => ({
              name: f.head,
              amount: f.amount,
              month: f.month
            })),
          collectedBy: null,
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
          date: new Date().toLocaleDateString()
        });

        setSelectedStudent(null);
        setSelectedFees([]);
        setReceiptModalOpen(true);
      } catch (error) {
        console.error('Error creating payment:', error);
      }
    }
  };

  const handleSendReminder = (payment) => {
    alert(`Reminder will be sent to ${payment.student}`);
  };

  const handleDownloadReceipt = (payment) => {
    alert(`Downloading receipt for ${payment.student}`);
  };

  const handleExportData = () => {
    const headers = ['Student', 'Class', 'Roll No', 'Paid', 'Pending', 'Status', 'Last Payment'];
    const rows = filteredPayments.map(p => [
      p.student,
      p.class,
      p.rollNo,
      p.paid,
      p.pending,
      p.status,
      p.lastPayment || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
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

  const handleCollectAllPending = () => {
    const firstPending = filteredPayments.find(p => p.status === "pending");
    if (firstPending) {
      setSelectedStudent(firstPending);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const totalPending = filteredPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.pending, 0);
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.paid, 0);
  const pendingCount = filteredPayments.filter((p) => p.status === "pending").length;

  if (loading || studentsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Minimal Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Collected</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Defaulters</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{feePayments.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b border-gray-200 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-gray-400 transition-all duration-200">
            <Search size={16} className="text-gray-400" />
            <input
              type="search"
              name="payments-search"
              autoComplete="off"
              data-form-type="other"
              placeholder="Search student..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-100 rounded">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <Popover isOpen={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger>
              <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all text-sm">
                <SlidersHorizontal size={16} className="text-gray-500" />
                <span className="text-gray-600">Filters</span>
                {(dateFrom || dateTo || amountMin || amountMax) && (
                  <span className="w-2 h-2 rounded-full bg-gray-800"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-4">
              <div className="space-y-4 w-72">
                <p className="text-sm font-medium text-gray-900">Advanced Filters</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md"
                        placeholder="To"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amount Range (Pending)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={amountMin}
                        onChange={(e) => setAmountMin(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={amountMax}
                        onChange={(e) => setAmountMax(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Filter by Status */}
          <Select
            size="sm"
            placeholder="All Status"
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{
              trigger: "h-9 min-h-9 bg-white border-gray-200 hover:border-gray-300",
              value: "text-sm",
            }}
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="paid">Paid</SelectItem>
            <SelectItem key="pending">Pending</SelectItem>
          </Select>

          {pendingCount > 0 && (
            <button
              onClick={handleCollectAllPending}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-sm"
            >
              <IndianRupee size={14} />
              <span>Collect All</span>
            </button>
          )}

          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all text-sm"
          >
            <Download size={14} className="text-gray-500" />
            <span className="text-gray-700">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <Table
          aria-label="Fee payments"
          removeWrapper
          classNames={{
            base: "overflow-visible [&_table]:w-full",
            th: "bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200",
            td: "py-4 border-b border-gray-100",
          }}
        >
          <TableHeader>
            <TableColumn>STUDENT</TableColumn>
            <TableColumn>PAID</TableColumn>
            <TableColumn>PENDING</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>LAST PAYMENT</TableColumn>
            <TableColumn align="end">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No payment records found</p>
              </div>
            }
          >
            {visiblePayments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {payment.student.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium text-gray-900 hover:text-gray-600 cursor-pointer"
                        onClick={() => navigate(`/students/${payment.id}`)}
                      >
                        {payment.student}
                      </p>
                      <p className="text-xs text-gray-500">Class {payment.class}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-700">
                    ₹{payment.paid.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-700">
                    ₹{payment.pending.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 rounded bg-gray-50">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      payment.status === "paid" ? "bg-gray-400" : "bg-gray-300"
                    }`}></span>
                    {payment.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500">
                    {payment.lastPayment || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {payment.status === "pending" && (
                      <>
                        <button
                          onClick={() => setSelectedStudent(payment)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-medium"
                        >
                          Collect
                        </button>
                        <button
                          onClick={() => handleSendReminder(payment)}
                          className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          <Bell size={14} className="text-gray-500" />
                        </button>
                      </>
                    )}
                    {payment.status === "paid" && (
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="p-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        <Download size={14} className="text-gray-500" />
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
        <span className="text-gray-500 text-sm">
          Page {currentPage} of {pagination.totalPages} ({pagination.totalItems} students)
        </span>
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevPage || studentsLoading}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage || studentsLoading}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Collection Modal - Simplified */}
      <Modal isOpen={selectedStudent !== null} onClose={() => setSelectedStudent(null)} size="xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center w-full">
                  <h3 className="text-base font-semibold text-gray-900">
                    Collect Fee — {selectedStudent?.student}
                  </h3>
                  <span className="text-sm text-gray-500">Class {selectedStudent?.class}</span>
                </div>
              </ModalHeader>
              <ModalBody className="p-0">
                {/* Fee Selection with inline total */}
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {studentFees.map((fee) => (
                    <label
                      key={fee.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
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
                          <p className="text-sm font-medium text-gray-900">{fee.head}</p>
                          <p className="text-xs text-gray-500">{fee.month}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono text-gray-700">₹{fee.amount.toLocaleString()}</span>
                    </label>
                  ))}
                </div>

                {/* Combined Payment Mode and Total */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Mode:</span>
                      <div className="flex gap-2">
                        {["cash", "online", "card", "cheque"].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setPaymentMode(mode)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                              paymentMode === mode
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="text-xl font-bold text-gray-900">₹{totalSelected.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-200 px-6 py-4 gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCollect}
                  disabled={selectedFees.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Collect ₹{totalSelected.toLocaleString()}
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
              <ModalHeader className="border-b border-gray-200">Payment Receipt</ModalHeader>
              <ModalBody className="py-6">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <span className="text-2xl text-gray-600">✓</span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Payment Successful</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{receiptData?.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Receipt No: {receiptData?.receiptNumber}</p>
                  <div className="border-t border-gray-200 my-4"></div>
                  <div className="text-left space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Student</span>
                      <span className="text-gray-900">{receiptData?.student}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Class</span>
                      <span className="text-gray-900">{receiptData?.class}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mode</span>
                      <span className="text-gray-900 capitalize">{receiptData?.paymentMode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-900">{receiptData?.date}</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-200 gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                  <Download size={14} />
                  <span>Download</span>
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
