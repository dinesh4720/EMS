import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Spinner, Chip, Card, Breadcrumbs, BreadcrumbItem,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea
} from "@heroui/react";
import {
  Clock, Filter, Search, Play, FileText,
  TrendingUp, Wallet, CreditCard, Users, X, AlertCircle, CheckCircle2, ChevronDown,
  Download, Lock, RotateCcw, ShieldCheck, AlertTriangle
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { payrollApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function StaffPayroll() {
  const { staff, loading: appLoading } = useApp();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preparingRecords, setPreparingRecords] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState("all");

  // Helper function to check if staff is active (case-insensitive, handles undefined)
  const isActiveStaff = (s) => {
    const status = (s.status || '').toLowerCase().trim();
    return status === 'active' || !s.status;
  };

  // Helper function to count active staff
  const getActiveStaffCount = () => staff.filter(isActiveStaff).length;

  // Lazy loading
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    notes: ''
  });

  // Confirmation modals
  const [runPayrollModalOpen, setRunPayrollModalOpen] = useState(false);
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false);
  const [pendingBulkPay, setPendingBulkPay] = useState(null);

  // New modals and states
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reverseRecord, setReverseRecord] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Restrict years to only current and past years
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Get current month and year for validation
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter available months based on selected year
  const availableMonths = months.filter((_, idx) => {
    const monthNum = idx + 1;
    // If current year is selected, only allow months up to current month
    if (selectedYear === currentYear) {
      return monthNum <= currentMonth;
    }
    // For past years, allow all months
    return true;
  });

  // Fetch dashboard data
  useEffect(() => {
    // Only fetch if staff data is loaded
    if (!appLoading && staff && staff.length > 0) {
      fetchDashboard();
      fetchPayrollRecords();
    }
  }, [selectedMonth, selectedYear, appLoading, staff]);

  // Auto-adjust month if it becomes invalid when year changes
  useEffect(() => {
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      // If selected year is current year and selected month is in future, reset to current month
      setSelectedMonth(currentMonth);
    }
  }, [selectedYear, currentMonth, currentYear]);

  const fetchDashboard = async () => {
    try {
      const response = await payrollApi.getDashboard(selectedMonth, selectedYear);
      if (response.success) {
        setDashboardData(response.data);
        console.log('💰 Payroll Dashboard Data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching payroll records for month:', selectedMonth, 'year:', selectedYear);
      const response = await payrollApi.getRecords({
        month: selectedMonth,
        year: selectedYear,
        limit: 1000
      });
      console.log('📦 API Response:', response);

      if (response.success) {
        const records = response.data || [];
        setPayrollRecords(records);
        console.log('📋 Payroll Records:', records.length, 'records');
        console.log('📋 Record details:', records.map(r => ({
          id: r._id,
          employeeId: r.employeeId,
          month: r.month,
          year: r.year,
          status: r.status,
          netPay: r.netPay
        })));
        console.log('👥 Total Staff in System:', staff.length);
        console.log('✅ Active Staff:', getActiveStaffCount());
        console.log('📊 Staff Status Breakdown:', staff.reduce((acc, s) => {
          const status = s.status || 'undefined';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}));
        
        // CRITICAL DEBUG: Check ID matching
        if (records.length > 0 && staff.length > 0) {
          console.log('🔍 First payroll employeeId:', records[0].employeeId, '(type:', typeof records[0].employeeId, ')');
          console.log('🔍 First 3 staff members:', staff.slice(0, 3).map(s => ({
            _id: s._id,
            id: s.id,
            name: s.name,
            _idType: typeof s._id,
            idType: typeof s.id
          })));
          
          // Try to find a match
          const testMatch = staff.find(s => String(s._id || s.id) === String(records[0].employeeId));
          console.log('🔍 Can we match first record?', testMatch ? 'YES - ' + testMatch.name : 'NO');
        }
      } else {
        console.error('❌ API returned success=false:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareRecords = async () => {
    // First, validate before showing the modal
    try {
      setValidating(true);
      const activeStaff = staff.filter(isActiveStaff);
      const employeeIds = activeStaff.map(s => s._id || s.id);

      const response = await payrollApi.validatePayroll({
        month: selectedMonth,
        year: selectedYear,
        employeeIds
      });

      if (response.success) {
        setValidationResults(response.data);
        setValidationModalOpen(true);
      } else {
        toast.error(response.error || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating payroll:', error);
      toast.error(error.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const confirmPrepareRecords = async () => {
    setValidationModalOpen(false);
    setRunPayrollModalOpen(false);

    try {
      setPreparingRecords(true);
      // Use helper function to filter active staff
      const activeStaff = staff.filter(isActiveStaff);
      // FIXED: Use _id from MongoDB
      const employeeIds = activeStaff.map(s => s._id || s.id);

      const response = await payrollApi.runPayroll({
        month: selectedMonth,
        year: selectedYear,
        employeeIds
      });

      if (response.success) {
        const { success: succeeded, failed } = response.data.results;
        if (failed.length === 0) {
          toast.success(`Records prepared! ${succeeded.length} employees processed`);
        } else {
          toast.success(`Records prepared!\n✅ ${succeeded.length} processed\n❌ ${failed.length} failed`);
        }
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error preparing records:', error);
      toast.error(error.message || 'Error preparing records');
    } finally {
      setPreparingRecords(false);
    }
  };

  const handleMarkAsPaid = async (recordId) => {
    setEditingRecord(recordId);
    setPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
    try {
      const response = await payrollApi.markAsPaid(editingRecord, paymentForm);

      if (response.success) {
        toast.success('Payment recorded successfully!');
        setPaymentModalOpen(false);
        setPaymentForm({ paymentMethod: 'bank_transfer', paymentReference: '', notes: '' });
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error(error.message || 'Failed to record payment');
    }
  };

  const handleBulkPay = async () => {
    const recordIds = selectedKeys === 'all' 
      ? payrollRecords.map(r => r._id)
      : Array.from(selectedKeys);

    setPendingBulkPay({
      count: recordIds.length,
      recordIds: recordIds
    });
    // Initialize form with defaults
    setPaymentForm({
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      notes: ''
    });
    setBulkPayModalOpen(true);
  };

  const confirmBulkPay = async () => {
    setBulkPayModalOpen(false);

    try {
      const response = await payrollApi.bulkPay({
        recordIds: pendingBulkPay.recordIds,
        paymentMethod: paymentForm.paymentMethod,
        paymentReference: paymentForm.paymentReference,
        notes: paymentForm.notes
      });

      if (response.success) {
        const { success: succeeded, failed } = response.data;
        if (failed.length === 0) {
          toast.success(`Records updated! ${succeeded.length} payments logged`);
        } else {
          toast.success(`Updates completed!\n✅ ${succeeded.length} logged\n❌ ${failed.length} failed`);
        }
        setSelectedKeys(new Set([]));
        setPendingBulkPay(null);
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error logging bulk payments:', error);
      toast.error(error.message || 'Failed to log bulk payments');
    }
  };

  // Reverse payment function
  const handleReversePayment = async (record) => {
    setReverseRecord(record);
    setReverseReason('');
    setReverseModalOpen(true);
  };

  const confirmReversePayment = async () => {
    if (!reverseReason.trim()) {
      toast.error('Please provide a reason for reversal');
      return;
    }

    try {
      setReversing(true);
      const response = await payrollApi.reversePayment(reverseRecord._id, {
        reason: reverseReason
      });

      if (response.success) {
        toast.success('Payment reversed successfully!');
        setReverseModalOpen(false);
        setReverseRecord(null);
        setReverseReason('');
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error reversing payment:', error);
      toast.error(error.message || 'Failed to reverse payment');
    } finally {
      setReversing(false);
    }
  };

  // Export function
  const handleExportPayroll = async () => {
    try {
      toast.loading('Exporting payroll data...');
      await payrollApi.exportPayroll(selectedMonth, selectedYear);
      toast.dismiss();
      toast.success('Payroll export downloaded!');
    } catch (error) {
      toast.dismiss();
      console.error('Error exporting payroll:', error);
      toast.error(error.message || 'Failed to export payroll');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'generated': return 'primary';
      case 'on_hold': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'paid') return 'Recorded';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredRecords = useMemo(() => {
    let result = payrollRecords;

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (employmentFilter !== 'all') {
      result = result.filter(r => r.employmentType === employmentFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => {
        const emp = staff.find(s => String(s.id) === String(r.employeeId));
        return emp && (
          emp.name.toLowerCase().includes(query) ||
          emp.code.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [payrollRecords, statusFilter, employmentFilter, searchQuery, staff]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, visibleCount);
  }, [filteredRecords, visibleCount]);

  const hasMore = visibleCount < filteredRecords.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, statusFilter, employmentFilter]);

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isAnySelected = selectedKeys === 'all' || selectedKeys.size > 0;
  const selectedCount = selectedKeys === 'all' ? filteredRecords.length : selectedKeys.size;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Show loading spinner while staff data is loading */}
      {(appLoading || !staff || staff.length === 0) ? (
        <div className="flex items-center justify-center h-screen">
          <Spinner size="lg" label="Loading staff data..." />
        </div>
      ) : (
        <>
      {/* Payment Modal */}
      <Modal isOpen={paymentModalOpen} onOpenChange={setPaymentModalOpen} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Log Payment Details</ModalHeader>
              <ModalBody className="gap-4">
                <Select
                  label="Payment Method"
                  selectedKeys={new Set([paymentForm.paymentMethod])}
                  onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMethod: Array.from(keys)[0] })}
                  variant="bordered"
                >
                  <SelectItem key="bank_transfer" textValue="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem key="cash" textValue="Cash">Cash</SelectItem>
                  <SelectItem key="cheque" textValue="Cheque">Cheque</SelectItem>
                  <SelectItem key="online" textValue="Online Payment">Online Payment</SelectItem>
                </Select>
                <Input
                  label="Payment Reference"
                  placeholder="Transaction ID / Cheque Number"
                  value={paymentForm.paymentReference}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentReference: v })}
                  variant="bordered"
                />
                <Textarea
                  label="Notes (Optional)"
                  placeholder="Additional notes..."
                  value={paymentForm.notes}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                  variant="bordered"
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="success" onPress={confirmPayment}>
                  Record Payment
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Payroll Status Banner */}
      {dashboardData && dashboardData.payrollRun && (
        <div className={`
          rounded-lg border p-4 flex items-start gap-4
          ${dashboardData.payrollRun.status === 'completed'
            ? 'bg-success-50 border-success-200'
            : dashboardData.payrollRun.status === 'processing'
            ? 'bg-warning-50 border-warning-200'
            : 'bg-default-50 border-default-200'}
        `}>
          <div className={`
            p-2 rounded-lg
            ${dashboardData.payrollRun.status === 'completed'
              ? 'bg-success-100'
              : dashboardData.payrollRun.status === 'processing'
              ? 'bg-warning-100'
              : 'bg-default-200'}
          `}>
            {dashboardData.payrollRun.status === 'completed' ? (
              <CheckCircle2 size={20} className="text-success-600" />
            ) : dashboardData.payrollRun.status === 'processing' ? (
              <Clock size={20} className="text-warning-600" />
            ) : (
              <AlertCircle size={20} className="text-default-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${
              dashboardData.payrollRun.status === 'completed'
                ? 'text-success-900'
                : dashboardData.payrollRun.status === 'processing'
                ? 'text-warning-900'
                : 'text-default-900'
            }`}>
              {dashboardData.payrollRun.status === 'completed'
                ? 'Payment Records Finalized'
                : dashboardData.payrollRun.status === 'processing'
                ? 'Generating Records...'
                : 'Payroll Status'}
            </h4>
            <p className={`text-sm mt-1 ${
              dashboardData.payrollRun.status === 'completed'
                ? 'text-success-700'
                : dashboardData.payrollRun.status === 'processing'
                ? 'text-warning-700'
                : 'text-default-600'
            }`}>
              {dashboardData.payrollRun.status === 'completed'
                ? `Records for ${months[selectedMonth - 1]} ${selectedYear} were prepared on ${new Date(dashboardData.payrollRun.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. `
                : `Payroll records for ${months[selectedMonth - 1]} ${selectedYear} are currently being generated. `
              }
              {dashboardData.payrollRun.processedEmployees} of {dashboardData.payrollRun.totalEmployees} active {dashboardData.payrollRun.totalEmployees === 1 ? 'employee' : 'employees'} processed
              {staff.length > dashboardData.payrollRun.totalEmployees && (
                <span className="text-xs ml-2 text-default-500">(Total staff in system: {staff.length})</span>
              )}
              {(() => {
                // Count active staff using same robust logic as payroll run
                const activeCount = getActiveStaffCount();
                if (activeCount > dashboardData.payrollRun.totalEmployees) {
                  return (
                    <span className="text-xs ml-2 text-warning-600 font-medium">
                      ({activeCount - dashboardData.payrollRun.totalEmployees} more active staff not included)
                    </span>
                  );
                }
                return null;
              })()}
              {dashboardData.payrollRun.status === 'completed' && dashboardData.payrollRun.totalPaid > 0 && (
                <>. Total amount recorded: <strong>{formatCurrency(dashboardData.payrollRun.totalPaid)}</strong></>
              )}
            </p>

            {/* Staff Status Breakdown */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-default-500">System Staff:</span>
              {Object.entries(staff.reduce((acc, s) => {
                const status = s.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {})).map(([status, count]) => (
                <span key={status} className="text-xs px-2 py-1 bg-default-100 rounded-full">
                  {count} {status}
                </span>
              ))}
            </div>

            {dashboardData.payrollRun.errorLog && dashboardData.payrollRun.errorLog.length > 0 && (
              <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded">
                <p className="text-xs text-danger-700">
                  <strong>Errors:</strong> {dashboardData.payrollRun.errorLog.length} employees failed
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <Chip
              size="sm"
              color={dashboardData.payrollRun.status === 'completed' ? 'success' : dashboardData.payrollRun.status === 'processing' ? 'warning' : 'default'}
              variant="flat"
              className="capitalize"
            >
              {dashboardData.payrollRun.status === 'completed' && 'Finalized'}
              {dashboardData.payrollRun.status === 'processing' && 'Processing'}
              {dashboardData.payrollRun.status === 'partial' && 'Partial'}
            </Chip>
          </div>
        </div>
      )}

      {!dashboardData?.payrollRun && (
        <div className="bg-info-50 border border-info-200 rounded-lg p-4 flex items-start gap-4">
          <div className="p-2 bg-info-100 rounded-lg">
            <AlertCircle size={20} className="text-info-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-info-900">Records Not Yet Generated</h4>
            <p className="text-sm text-info-700 mt-1">
              Payroll records for <strong>{months[selectedMonth - 1]} {selectedYear}</strong> have not been generated yet.
              {(() => {
                const activeCount = getActiveStaffCount();
                const inactiveCount = staff.length - activeCount;
                return (
                  <>
                    {activeCount > 0 && (
                      <> {activeCount} active {activeCount === 1 ? 'employee' : 'employees'} available for records.</>
                    )}
                    {inactiveCount > 0 && (
                      <> {inactiveCount} inactive {inactiveCount === 1 ? 'employee' : 'employees'} will be excluded.</>
                    )}
                  </>
                );
              })()}
              Click "Run Payroll" to generate salary records for all active staff.
            </p>

            {/* Staff Status Breakdown */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-info-600">All Staff:</span>
              {Object.entries(staff.reduce((acc, s) => {
                const status = s.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {})).map(([status, count]) => (
                <span key={status} className="text-xs px-2 py-1 bg-info-100 rounded-full">
                  {count} {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Wrapper with Padding Context */}
      {/* This mimics the padding a parent Card would provide, allowing the full-bleed children to work correctly using negative margins */}
      <div className="relative">

        {/* KPI Cards */}
        {dashboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
            <div className="p-4 bg-success-50 rounded-lg border border-success-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-success-600" />
                <span className="text-xs text-success-700 uppercase tracking-wider">Total Recorded</span>
              </div>
              <p className="text-2xl font-semibold text-success-700">
                {formatCurrency(dashboardData.totalPayout)}
              </p>
              <p className="text-xs text-success-600 mt-1">
                {dashboardData.paidCount} records logged
              </p>
            </div>

            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-primary-600" />
                <span className="text-xs text-primary-700 uppercase tracking-wider">Unrecorded</span>
              </div>
              <p className="text-2xl font-semibold text-primary-700">
                {formatCurrency(dashboardData.pendingAmount)}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                {dashboardData.pendingCount} records pending
              </p>
            </div>

            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-warning-600" />
                <span className="text-xs text-warning-700 uppercase tracking-wider">Estimated</span>
              </div>
              <p className="text-2xl font-semibold text-warning-700">
                {formatCurrency(dashboardData.projectedPayout)}
              </p>
              <p className="text-xs text-warning-600 mt-1">
                Next month estimate
              </p>
            </div>

            <div className="p-4 bg-default-50 rounded-lg border border-default-200">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-default-500" />
                <span className="text-xs text-default-500 uppercase tracking-wider">Total Staff</span>
              </div>
              <p className="text-2xl font-semibold text-default-900">
                {dashboardData.totalEmployees}
              </p>
              <p className="text-xs text-default-500 mt-1">
                Active in payroll
              </p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start bg-white border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
          <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
            {/* Month/Year Selector - Moved here */}
            <div className="flex gap-2 items-center">
              <Select
                label="Month"
                selectedKeys={new Set([selectedMonth.toString()])}
                onSelectionChange={(keys) => setSelectedMonth(parseInt(Array.from(keys)[0]))}
                className="w-36"
                size="sm"
                variant="bordered"
                classNames={{
                  label: "text-xs",
                  trigger: "min-h-unit-8"
                }}
              >
                {availableMonths.map((month, idx) => {
                  const actualMonthIndex = months.indexOf(month) + 1;
                  return (
                    <SelectItem key={actualMonthIndex.toString()} textValue={month} className="text-sm">{month}</SelectItem>
                  );
                })}
              </Select>
              <Select
                label="Year"
                selectedKeys={new Set([selectedYear.toString()])}
                onSelectionChange={(keys) => setSelectedYear(parseInt(Array.from(keys)[0]))}
                className="w-28"
                size="sm"
                variant="bordered"
                classNames={{
                  label: "text-xs",
                  trigger: "min-h-unit-8"
                }}
              >
                {years.map(year => (
                  <SelectItem key={year.toString()} textValue={year.toString()} className="text-sm">{year}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
              <Search size={16} className="text-default-400" />
              <input
                type="text"
                placeholder="Search employee..."
                className="flex-1 bg-transparent outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                  <X size={14} className="text-default-400" />
                </button>
              )}
            </div>

            {/* Unified Filter Dropdown */}
            <Dropdown>
              <DropdownTrigger>
                <button className="flex items-center gap-2 px-3 py-2 bg-default-100 rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer text-sm">
                  <Filter size={16} className="text-default-400" />
                  <span className="text-default-600">Filters</span>
                  {(statusFilter !== 'all' || employmentFilter !== 'all') && (
                    <Chip size="sm" color="primary" variant="solid" className="h-5 min-w-5 px-1">
                      {(statusFilter !== 'all' ? 1 : 0) + (employmentFilter !== 'all' ? 1 : 0)}
                    </Chip>
                  )}
                  <ChevronDown size={14} className="text-default-400" />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Filters" className="w-64">
                <DropdownItem key="status-header" isReadOnly className="opacity-100 font-semibold text-default-500 text-xs uppercase">
                  Status
                </DropdownItem>
                <DropdownItem
                  key="status-all"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>All Status</span>
                    {statusFilter === 'all' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="status-generated"
                  onClick={() => setStatusFilter('generated')}
                  className={statusFilter === 'generated' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Generated</span>
                    {statusFilter === 'generated' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="status-paid"
                  onClick={() => setStatusFilter('paid')}
                  className={statusFilter === 'paid' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Paid</span>
                    {statusFilter === 'paid' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem key="divider1" isReadOnly className="opacity-100">
                  <div className="h-px bg-default-200 my-1" />
                </DropdownItem>
                <DropdownItem key="employment-header" isReadOnly className="opacity-100 font-semibold text-default-500 text-xs uppercase">
                  Employment Type
                </DropdownItem>
                <DropdownItem
                  key="employment-all"
                  onClick={() => setEmploymentFilter('all')}
                  className={employmentFilter === 'all' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>All Types</span>
                    {employmentFilter === 'all' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="full_time"
                  onClick={() => setEmploymentFilter('full_time')}
                  className={employmentFilter === 'full_time' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Full Time</span>
                    {employmentFilter === 'full_time' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="part_time"
                  onClick={() => setEmploymentFilter('part_time')}
                  className={employmentFilter === 'part_time' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Part Time</span>
                    {employmentFilter === 'part_time' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="contractor"
                  onClick={() => setEmploymentFilter('contractor')}
                  className={employmentFilter === 'contractor' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Contractor</span>
                    {employmentFilter === 'contractor' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {isAnySelected && (
              <button
                className="flex items-center gap-2 px-3 py-2 bg-success text-white rounded-lg border border-success hover:bg-success-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
                onClick={handleBulkPay}
              >
                <CreditCard size={16} />
                <span>Log Selected ({selectedCount})</span>
              </button>
            )}
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrepareRecords}
              disabled={preparingRecords}
            >
              {preparingRecords ? <Spinner size="sm" color="white" /> : <Play size={16} />}
              <span>{preparingRecords ? 'Processing...' : 'Run Payroll'}</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-default-100 text-default-700 rounded-lg border border-default-300 hover:bg-default-200 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
              onClick={handleExportPayroll}
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-warning-500 text-white rounded-lg border border-warning-600 hover:bg-warning-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
              onClick={async () => {
                if (confirm('This will set a default salary of 50,000 for all staff who have 0 salary. Continue?')) {
                  try {
                    const res = await payrollApi.fixSalaries();
                    if (res.success) {
                      toast.success(res.message);
                      fetchDashboard();
                    } else {
                        toast.error('Failed to fix salaries');
                    }
                  } catch (e) {
                    console.error(e);
                    toast.error('Error fixing salaries');
                  }
                }
              }}
            >
              <Wallet size={16} />
              <span>Fix Salaries</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Table
              aria-label="Payroll records table"
              selectionMode="multiple"
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              removeWrapper
              radius="none"
              classNames={{
                base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
                th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6",
                td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
                tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5",
              }}
            >
              <TableHeader>
                <TableColumn>EMPLOYEE</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>BASE SALARY</TableColumn>
                <TableColumn>ALLOWANCES</TableColumn>
                <TableColumn>DEDUCTIONS</TableColumn>
                <TableColumn>NET PAY</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn align="end">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No payroll records found">
                {(() => {
                  // Debug: Check how many records are being filtered out
                  const recordsWithEmployee = visibleRecords.filter(r => staff.find(s => String(s._id || s.id) === String(r.employeeId)));
                  if (visibleRecords.length !== recordsWithEmployee.length) {
                    console.warn(`⚠️ ${visibleRecords.length - recordsWithEmployee.length} of ${visibleRecords.length} records missing employee mapping`);
                    console.log('📋 Sample record:', visibleRecords[0]);
                    console.log('👋 Sample staff:', staff.slice(0, 3).map(s => ({ id: s._id || s.id, idType: typeof (s._id || s.id), name: s.name })));
                  }
                  return null; // This is just for debug, doesn't render
                })()}
                {visibleRecords.map((record) => {
                  // FIXED: Use _id from MongoDB and string comparison for ID matching
                  const employee = staff.find(s => String(s._id || s.id) === String(record.employeeId));
                  if (!employee) {
                    console.warn('⚠️ Employee not found for record:', { 
                      employeeId: record.employeeId, 
                      employeeIdType: typeof record.employeeId,
                      availableStaffIds: staff.slice(0, 3).map(s => s._id || s.id)
                    });
                    return null;
                  }

                  return (
                    <TableRow key={record._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://i.pravatar.cc/150?u=${employee.id}`}
                            alt={employee.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex flex-col">
                            <span
                              className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                              onClick={() => navigate(`/staffs/${employee.id}`)}
                            >
                              {employee.name}
                            </span>
                            <span className="text-default-500 text-xs">{employee.code}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" className="capitalize">
                          {record.employmentType.replace('_', ' ')}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-default-600">{formatCurrency(record.baseSalary)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-success-600">
                          +{formatCurrency(record.totalAllowances)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-danger-600">
                          -{formatCurrency(record.totalDeductions)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-default-900">
                          {formatCurrency(record.netPay)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip color={getStatusColor(record.status)} size="sm" variant="flat">
                          {getStatusLabel(record.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 items-center">
                          {/* Locked indicator */}
                          {record.isLocked && (
                            <div className="flex items-center gap-1 text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded-full border border-warning-200">
                              <Lock size={12} />
                              <span>Locked</span>
                            </div>
                          )}
                          {record.status === 'generated' && (
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => handleMarkAsPaid(record._id)}
                            >
                              Log Payment
                            </Button>
                          )}
                          {record.status === 'paid' && record.isLocked && (
                            <Button
                              size="sm"
                              color="warning"
                              variant="flat"
                              onPress={() => handleReversePayment(record)}
                              startContent={<RotateCcw size={14} />}
                            >
                              Reverse
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => {
                              setEditingRecord(record);
                              setPaymentForm({
                                paymentMethod: 'bank_transfer',
                                paymentReference: '',
                                notes: ''
                              });
                              setPaymentModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            className="text-default-400"
                          >
                            <FileText size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Lazy Loading Indicator */}
            <div ref={loaderRef} className="flex justify-center py-4">
              {isLoadingMore && (
                <Spinner size="sm" color="primary" />
              )}
              {!hasMore && filteredRecords.length > ITEMS_PER_LOAD && (
                <span className="text-default-400 text-sm">All {filteredRecords.length} records loaded</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Run Payroll Confirmation Modal */}
      <Modal isOpen={runPayrollModalOpen} onOpenChange={setRunPayrollModalOpen} size="md">
        <ModalContent>
          <ModalHeader className="flex gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <AlertCircle className="text-warning-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Prepare Salary Records</h3>
              <p className="text-sm text-default-500">This will generate payroll records for all active staff</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-default-50 rounded-lg p-4">
                <p className="text-sm text-default-600 mb-2">You are about to generate records for:</p>
                <p className="text-lg font-semibold text-default-900">{months[selectedMonth - 1]} {selectedYear}</p>
              </div>
              <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                <p className="text-sm text-warning-800">
                  <strong>Note:</strong> This step only generates the salary breakdown. You will need to manually log the payment status afterwards.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setRunPayrollModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={confirmPrepareRecords} isDisabled={preparingRecords}>
              {preparingRecords ? <Spinner size="sm" color="white" /> : 'Confirm & Generate'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Pay Confirmation Modal */}
      <Modal isOpen={bulkPayModalOpen} onOpenChange={setBulkPayModalOpen} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CreditCard className="text-success-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Log Bulk Payments</h3>
                  <p className="text-sm text-default-500">Processing {pendingBulkPay?.count || 0} records</p>
                </div>
              </ModalHeader>
              <ModalBody className="gap-4">
                 <div className="bg-default-50 rounded-lg p-3 mb-2">
                    <p className="text-sm text-default-600">
                      You are about to record payments for <strong>{pendingBulkPay?.count || 0}</strong> staff members.
                    </p>
                 </div>
                 
                 <Select
                  label="Payment Method"
                  selectedKeys={new Set([paymentForm.paymentMethod])}
                  onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMethod: Array.from(keys)[0] })}
                  variant="bordered"
                >
                  <SelectItem key="bank_transfer" textValue="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem key="cash" textValue="Cash">Cash</SelectItem>
                  <SelectItem key="cheque" textValue="Cheque">Cheque</SelectItem>
                  <SelectItem key="online" textValue="Online Payment">Online Payment</SelectItem>
                </Select>

                <Input
                  label="Payment Reference / Batch ID"
                  placeholder="e.g. BATCH-2024-001"
                  value={paymentForm.paymentReference}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentReference: v })}
                  variant="bordered"
                  description="Applied to all selected records"
                />

                <Textarea
                  label="Notes (Optional)"
                  placeholder="Additional notes for this batch..."
                  value={paymentForm.notes}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                  variant="bordered"
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="success" onPress={confirmBulkPay}>
                  Log Payments
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Validation Modal */}
      <Modal isOpen={validationModalOpen} onOpenChange={setValidationModalOpen} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex gap-3">
            <div className="p-2 bg-info-100 rounded-lg">
              <ShieldCheck className="text-info-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payroll Validation Results</h3>
              <p className="text-sm text-default-500">Review before generating records</p>
            </div>
          </ModalHeader>
          <ModalBody>
            {validating ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" label="Validating payroll..." />
              </div>
            ) : validationResults && (
              <div className="space-y-4">
                {/* Valid Employees */}
                <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                  <h4 className="font-semibold text-success-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    Ready to Process ({validationResults.valid?.length || 0})
                  </h4>
                  {validationResults.valid?.length > 0 && (
                    <div className="max-h-40 overflow-y-auto text-sm">
                      {validationResults.valid.slice(0, 5).map(emp => (
                        <div key={emp.employeeId} className="py-1">{emp.name} - {formatCurrency(emp.salary)}</div>
                      ))}
                      {validationResults.valid.length > 5 && (
                        <div className="text-success-700 italic">...and {validationResults.valid.length - 5} more</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Invalid Employees */}
                {validationResults.invalid?.length > 0 && (
                  <div className="bg-danger-50 rounded-lg p-4 border border-danger-200">
                    <h4 className="font-semibold text-danger-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={18} />
                      Will Be Excluded ({validationResults.invalid.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                      {validationResults.invalid.map(emp => (
                        <div key={emp.employeeId} className="text-danger-700">
                          {emp.name}: {emp.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validationResults.warnings?.length > 0 && (
                  <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                    <h4 className="font-semibold text-warning-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={18} />
                      Warnings ({validationResults.warnings.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                      {validationResults.warnings.map((warning, idx) => (
                        <div key={idx} className="text-warning-700">
                          {warning.name || warning.message || `Warning: ${warning.reason}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setValidationModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={confirmPrepareRecords} isDisabled={preparingRecords || !validationResults?.valid?.length}>
              {preparingRecords ? <Spinner size="sm" color="white" /> : `Generate Records (${validationResults?.valid?.length || 0})`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reverse Payment Modal */}
      <Modal isOpen={reverseModalOpen} onOpenChange={setReverseModalOpen} size="md">
        <ModalContent>
          <ModalHeader className="flex gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <RotateCcw className="text-warning-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Reverse Payment</h3>
              <p className="text-sm text-default-500">Unlock and reset payment status</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                <p className="text-sm text-warning-800">
                  <strong>Warning:</strong> This will unlock the record and reset its status to "Generated". You will need to log the payment again.
                </p>
              </div>
              <Textarea
                label="Reason for Reversal *"
                placeholder="Please explain why this payment is being reversed..."
                value={reverseReason}
                onValueChange={setReverseReason}
                variant="bordered"
                minRows={3}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setReverseModalOpen(false)}>
              Cancel
            </Button>
            <Button color="warning" onPress={confirmReversePayment} isDisabled={reversing || !reverseReason.trim()}>
              {reversing ? <Spinner size="sm" color="white" /> : 'Confirm Reversal'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
        </>
      )}
    </div>
  );
}
