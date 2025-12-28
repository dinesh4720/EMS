import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  User,
  Spinner,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
} from "@heroui/react";
import { Search, X, IndianRupee, Download, Printer, Bell } from "lucide-react";
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
  
  // Data from API
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch students and payments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsData, paymentsData] = await Promise.all([
          studentsApi.getAll(),
          feesApi.getPayments({})
        ]);
        console.log('Students loaded:', studentsData.length);
        console.log('Payments loaded:', paymentsData.length);
        setStudents(studentsData);
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.message);
        // Show user-friendly error
        alert(`Failed to load data: ${error.message}. Please check if the backend is running.`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Transform students to payment format
  const feePayments = useMemo(() => {
    return students.map((s) => {
      // Get all payments for this student
      const studentPayments = payments.filter(p => p.studentId?._id === s.id || p.studentId === s.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate pending (simplified - 60000 annual fee)
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
      return matchesSearch && matchesStatus;
    });
  }, [feePayments, searchQuery, statusFilter]);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visiblePayments = useMemo(
    () => filteredPayments.slice(0, visibleCount),
    [filteredPayments, visibleCount]
  );

  const hasMore = visibleCount < filteredPayments.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, statusFilter]);

  // Lazy loading intersection observer
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

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const studentFees = [
    { id: 1, head: "Tuition Fee", month: "December 2024", amount: 5000, status: "pending" },
    { id: 2, head: "Transport Fee", month: "December 2024", amount: 2000, status: "pending" },
    { id: 3, head: "Tuition Fee", month: "November 2024", amount: 5000, status: "overdue" },
  ];

  const totalSelected = studentFees
    .filter((f) => selectedFees.includes(f.id.toString()))
    .reduce((sum, f) => sum + f.amount, 0);

  const handleCollect = async () => {
    if (selectedStudent && totalSelected > 0) {
      try {
        // Find the student's full data
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
          collectedBy: null, // In production, get from logged-in user
          remarks: "Payment collected via dashboard"
        };
        
        const newPayment = await feesApi.createPayment(paymentData);
        
        // Update local state
        setPayments([newPayment, ...payments]);
        
        // Refresh students data to get updated fee status
        const updatedStudents = await studentsApi.getAll();
        setStudents(updatedStudents);
        
        // Set receipt data
        setReceiptData({
          receiptNumber: newPayment.receiptNumber,
          amount: totalSelected,
          student: selectedStudent.student,
          class: selectedStudent.class,
          paymentMode,
          date: new Date().toLocaleDateString()
        });
        
        // Close collection modal and open receipt modal
        setSelectedStudent(null);
        setSelectedFees([]);
        setReceiptModalOpen(true);
      } catch (error) {
        console.error('Error creating payment:', error);
        alert('Failed to process payment. Please try again.');
      }
    }
  };

  const handleSendReminder = (payment) => {
    // TODO: Implement SMS/Email reminder functionality
    alert(`Reminder will be sent to ${payment.student} at ${payment.phone || 'N/A'}`);
  };

  const handleDownloadReceipt = (payment) => {
    // TODO: Implement receipt download functionality
    alert(`Downloading receipt for ${payment.student}`);
  };

  const handleExportData = () => {
    // Create CSV content
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
    
    // Create download link
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

  const totalPending = filteredPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.pending, 0);
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.paid, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 bg-success-50 rounded-lg border border-success-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-success-600" />
            <span className="text-xs text-success-700 uppercase tracking-wider">Collected</span>
          </div>
          <p className="text-2xl font-semibold text-success-700">
            ₹{totalCollected.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-danger-600" />
            <span className="text-xs text-danger-700 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-danger-700">
            ₹{totalPending.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-warning-600" />
            <span className="text-xs text-warning-700 uppercase tracking-wider">Defaulters</span>
          </div>
          <p className="text-2xl font-semibold text-warning-700">
            {filteredPayments.filter((p) => p.status === "pending").length}
          </p>
        </div>

        <div className="p-4 bg-default-50 rounded-lg border border-default-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-default-500" />
            <span className="text-xs text-default-500 uppercase tracking-wider">Total Students</span>
          </div>
          <p className="text-2xl font-semibold text-default-900">{feePayments.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <Search size={16} className="text-default-400" />
            <input
              type="text"
              placeholder="Search student..."
              className="flex-1 bg-transparent outline-none text-sm text-default-900 placeholder:text-default-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-0.5 hover:bg-default-200 rounded cursor-pointer"
              >
                <X size={14} className="text-default-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Filter by Status */}
          <Select
            size="sm"
            placeholder="All Status"
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{
              trigger:
                "h-9 min-h-9 bg-transparent border-default-300 hover:border-primary transition-all duration-200",
              value: "text-sm",
            }}
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="paid">Paid</SelectItem>
            <SelectItem key="pending">Pending</SelectItem>
          </Select>

          <button 
            onClick={handleExportData}
            className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
            <Download size={16} className="text-default-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        aria-label="Fee payments"
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors",
          td: "py-5 border-b border-default-200 last:pr-6",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr:last-child>td]:border-none",
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
              <p className="text-default-400 text-sm">No payment records found</p>
            </div>
          }
        >
          {visiblePayments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-default-50 transition-colors">
              <TableCell>
                <User
                  avatarProps={{
                    radius: "full",
                    size: "sm",
                    src: `https://i.pravatar.cc/150?u=${payment.id}`,
                  }}
                  description={<span className="text-xs text-default-500">Class {payment.class}</span>}
                  name={
                    <span
                      className="text-sm font-medium text-default-900 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/students/${payment.id}`)}
                    >
                      {payment.student}
                    </span>
                  }
                />
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-success-600">
                  ₹{payment.paid.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-danger-600">
                  ₹{payment.pending.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={payment.status === "paid" ? "success" : "danger"}
                  variant="dot"
                  classNames={{
                    base: "h-6 border border-default-200",
                    content: "text-xs font-medium capitalize",
                  }}
                >
                  {payment.status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-xs text-default-600">{payment.lastPayment || 'N/A'}</span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {payment.status === "pending" && (
                    <>
                      <button
                        onClick={() => setSelectedStudent(payment)}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-xs font-medium cursor-pointer"
                      >
                        Collect
                      </button>
                      <button 
                        onClick={() => handleSendReminder(payment)}
                        className="p-1.5 bg-transparent rounded-lg border border-transparent hover:border-warning hover:bg-warning-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-warning"
                      >
                        <Bell size={16} />
                      </button>
                    </>
                  )}
                  {payment.status === "paid" && (
                    <button 
                      onClick={() => handleDownloadReceipt(payment)}
                      className="p-1.5 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Lazy loading indicator */}
      <div ref={loaderRef} className="flex justify-center py-4 -mx-6">
        {isLoadingMore && <Spinner size="sm" color="primary" />}
        {!hasMore && filteredPayments.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">
            All {filteredPayments.length} payments loaded
          </span>
        )}
      </div>

      {/* Collection Modal */}
      <Modal isOpen={selectedStudent !== null} onClose={() => setSelectedStudent(null)} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-default-200">
                <h3 className="text-lg font-semibold text-default-900">
                  Collect Fee - {selectedStudent?.student}
                </h3>
              </ModalHeader>
              <ModalBody className="py-4">
                <Table
                  aria-label="Student fees"
                  removeWrapper
                  radius="none"
                  classNames={{
                    base: "overflow-visible",
                    th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-10 border-b border-default-200",
                    td: "py-3 border-b border-default-200",
                    tbody: "[&>tr:last-child>td]:border-none",
                  }}
                >
                  <TableHeader>
                    <TableColumn width={40}></TableColumn>
                    <TableColumn>FEE HEAD</TableColumn>
                    <TableColumn>PERIOD</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {studentFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <Checkbox
                            size="sm"
                            isSelected={selectedFees.includes(fee.id.toString())}
                            onValueChange={(v) => {
                              if (v) setSelectedFees([...selectedFees, fee.id.toString()]);
                              else setSelectedFees(selectedFees.filter((f) => f !== fee.id.toString()));
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{fee.head}</TableCell>
                        <TableCell className="text-sm">{fee.month}</TableCell>
                        <TableCell className="text-sm font-medium">
                          ₹{fee.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                    <span className="text-sm font-medium text-default-700">Total Selected:</span>
                    <span className="text-xl font-semibold text-primary">
                      ₹{totalSelected.toLocaleString()}
                    </span>
                  </div>
                  <Select
                    size="sm"
                    label="Payment Mode"
                    variant="bordered"
                    selectedKeys={[paymentMode]}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <SelectItem key="cash">Cash</SelectItem>
                    <SelectItem key="cheque">Cheque</SelectItem>
                    <SelectItem key="online">Online Transfer</SelectItem>
                    <SelectItem key="card">Card</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-default-200">
                <button
                  onClick={onClose}
                  className="px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:bg-default-100 transition-all duration-200 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCollect}
                  disabled={selectedFees.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IndianRupee size={16} />
                  <span>Collect ₹{totalSelected.toLocaleString()}</span>
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
              <ModalHeader className="border-b border-default-200">Payment Receipt</ModalHeader>
              <ModalBody className="py-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl text-success-600">✓</span>
                  </div>
                  <p className="text-success-600 text-lg font-medium">Payment Successful</p>
                  <p className="text-3xl font-bold text-default-900">
                    ₹{receiptData?.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-default-500">Receipt No: {receiptData?.receiptNumber}</p>
                  <div className="border-t border-default-200 my-4"></div>
                  <div className="text-left space-y-2 bg-default-50 p-4 rounded-lg">
                    <p className="text-sm">
                      <strong>Student:</strong> {receiptData?.student}
                    </p>
                    <p className="text-sm">
                      <strong>Class:</strong> {receiptData?.class}
                    </p>
                    <p className="text-sm">
                      <strong>Mode:</strong> {receiptData?.paymentMode}
                    </p>
                    <p className="text-sm">
                      <strong>Date:</strong> {receiptData?.date}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-default-200">
                <button className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:bg-default-100 transition-all duration-200 text-sm cursor-pointer">
                  <Printer size={16} />
                  <span>Print</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:bg-default-100 transition-all duration-200 text-sm cursor-pointer">
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer"
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
