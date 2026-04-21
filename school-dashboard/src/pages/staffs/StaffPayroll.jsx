import { useState, useMemo, useEffect, useRef } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import logger from "../../utils/logger";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Spinner, Chip, Card, Breadcrumbs, BreadcrumbItem,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Select, SelectItem
} from "@heroui/react";
import {
  Filter, Search, Play, FileText,
  Wallet, CreditCard, X, AlertCircle, CheckCircle2, ChevronDown,
  Download, Lock, RotateCcw
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import PhotoAvatar from "../../components/PhotoAvatar";
import { payrollApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import PaymentModal from './components/payroll/PaymentModal';
import RunPayrollModal from './components/payroll/RunPayrollModal';
import BulkPayModal from './components/payroll/BulkPayModal';
import ValidationResultsModal from './components/payroll/ValidationResultsModal';
import ReversePaymentModal from './components/payroll/ReversePaymentModal';
import FixSalariesModal from './components/payroll/FixSalariesModal';
import PayrollKPICards from './components/payroll/PayrollKPICards';
import PayrollStatusBanner from './components/payroll/PayrollStatusBanner';
import PayrollToolbar from './components/payroll/PayrollToolbar';
import PayrollRecordsTable from './components/payroll/PayrollTable';


export default function StaffPayroll() {
  const { t } = useTranslation();
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
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Helper function to check if staff is active (case-insensitive, handles undefined)
  const isActiveStaff = (s) => {
    const status = (s.status || '').toLowerCase().trim();
    return status === 'active' || !s.status;
  };

  // Helper function to count active staff
  const getActiveStaffCount = () => staff.filter(isActiveStaff).length;


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
  const [fixSalariesConfirmOpen, setFixSalariesConfirmOpen] = useState(false);
  const [fixingSalaries, setFixingSalaries] = useState(false);

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

  // Fetch dashboard data - use staff length as stable dependency
  const staffLength = staff?.length || 0;
  useEffect(() => {
    // Only fetch if staff data is loaded
    if (!appLoading && staffLength > 0) {
      fetchDashboard();
      fetchPayrollRecords();
    }
  }, [selectedMonth, selectedYear, appLoading, staffLength]);

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
      }
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
    }
  };

  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      const response = await payrollApi.getRecords({
        month: selectedMonth,
        year: selectedYear,
        limit: 1000
      });

      if (response.success) {
        const records = response.data || [];
        setPayrollRecords(records);
      } else {
        logger.error('❌ API returned success=false:', response);
      }
    } catch (error) {
      logger.error('❌ Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareRecords = async () => {
    // AUDIT-208: Prevent duplicate submissions
    if (validating || preparingRecords) return;
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
      logger.error('Error validating payroll:', error);
      toast.error(error.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const confirmPrepareRecords = async () => {
    if (preparingRecords) return;
    setPreparingRecords(true);
    setValidationModalOpen(false);
    setRunPayrollModalOpen(false);

    try {
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
        const { success: succeeded = [], failed = [] } = response?.data?.results || {};
        if (failed.length === 0) {
          toast.success(`Records prepared! ${succeeded.length} employees processed`);
        } else {
          toast.success(`Records prepared!\n✅ ${succeeded.length} processed\n❌ ${failed.length} failed`);
        }
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      logger.error('Error preparing records:', error);
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
    // editingRecord may be a string ID (from "Log Payment") or a full record object (from "Edit")
    const recordId = typeof editingRecord === 'object' && editingRecord !== null
      ? editingRecord._id
      : editingRecord;
    try {
      const response = await payrollApi.markAsPaid(recordId, paymentForm);

      if (response.success) {
        toast.success(t('toast.success.paymentRecordedSuccessfully'));
        setPaymentModalOpen(false);
        setPaymentForm({ paymentMethod: 'bank_transfer', paymentReference: '', notes: '' });
        // Immediately update the record's status in local state so the table
        // reflects the change without waiting for the async refetch
        setPayrollRecords(prev =>
          prev.map(r => r._id === recordId ? { ...r, status: 'paid' } : r)
        );
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      logger.error('Error marking as paid:', error);
      toast.error(error.message || 'Failed to record payment');
    }
  };

  const handleBulkPay = async () => {
    const recordIds = Array.from(selectedKeys);

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
      logger.error('Error logging bulk payments:', error);
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
      toast.error(t('toast.error.pleaseProvideAReasonForReversal'));
      return;
    }

    try {
      setReversing(true);
      const response = await payrollApi.reversePayment(reverseRecord._id, {
        reason: reverseReason
      });

      if (response.success) {
        toast.success(t('toast.success.paymentReversedSuccessfully'));
        setReverseModalOpen(false);
        setReverseRecord(null);
        setReverseReason('');
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      logger.error('Error reversing payment:', error);
      toast.error(error.message || 'Failed to reverse payment');
    } finally {
      setReversing(false);
    }
  };

  // Export function
  const handleExportPayroll = async () => {
    try {
      toast.loading(t('toast.loading.exportingPayrollData'));
      await payrollApi.exportPayroll(selectedMonth, selectedYear);
      toast.dismiss();
      toast.success(t('toast.success.payrollExportDownloaded'));
    } catch (error) {
      toast.dismiss();
      logger.error('Error exporting payroll:', error);
      toast.error(error.message || 'Failed to export payroll');
    }
  };

  // Fix salaries handler (replaces browser confirm())
  const handleFixSalaries = async () => {
    try {
      setFixingSalaries(true);
      const res = await payrollApi.fixSalaries();
      if (res.success) {
        toast.success(res.message);
        fetchDashboard();
        fetchPayrollRecords();
      } else {
        toast.error(t('toast.error.failedToFixSalaries'));
      }
    } catch (e) {
      logger.error(e);
      toast.error(t('toast.error.errorFixingSalaries'));
    } finally {
      setFixingSalaries(false);
      setFixSalariesConfirmOpen(false);
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
        const emp = staff.find(s => String(s._id || s.id) === String(r.employeeId));
        return emp && (
          emp.name.toLowerCase().includes(query) ||
          emp.code.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [payrollRecords, statusFilter, employmentFilter, searchQuery, staff]);

  const { visibleItems: visibleRecords, hasMore, isLoadingMore, loaderRef } = useEntityFetch(
    filteredRecords,
    [searchQuery, statusFilter, employmentFilter]
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(getDateLocale(), {
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
        <TablePageSkeleton />
      ) : (
        <>
      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        onConfirm={confirmPayment}
      />

      {/* Payroll Status Banner */}
      <PayrollStatusBanner
        dashboardData={dashboardData}
        staff={staff}
        months={months}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        getActiveStaffCount={getActiveStaffCount}
        formatCurrency={formatCurrency}
      />

      {/* Content Wrapper with Padding Context */}
      {/* This mimics the padding a parent Card would provide, allowing the full-bleed children to work correctly using negative margins */}
      <div className="relative">

        {/* KPI Cards */}
        <PayrollKPICards dashboardData={dashboardData} formatCurrency={formatCurrency} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start bg-white dark:bg-zinc-950 border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
          <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
            {/* Month/Year Selector - Moved here */}
            <div className="flex gap-2 items-center">
              <Select
                label={t('pages.month1')}
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
                label={t('pages.year1')}
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
                placeholder={t('pages.searchEmployee1')}
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
            <Dropdown isOpen={isFilterDropdownOpen} onOpenChange={setIsFilterDropdownOpen}>
              <DropdownTrigger>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-default-100 rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer text-sm">
                    <Filter size={16} className="text-default-400" />
                    <span className="text-default-600">{t('pages.filters2')}</span>
                    {(statusFilter !== 'all' || employmentFilter !== 'all') && (
                      <Chip size="sm" color="primary" variant="solid" className="h-5 min-w-5 px-1">
                        {(statusFilter !== 'all' ? 1 : 0) + (employmentFilter !== 'all' ? 1 : 0)}
                      </Chip>
                    )}
                    <ChevronDown size={14} className="text-default-400" />
                  </button>
                  {(statusFilter !== 'all' || employmentFilter !== 'all') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusFilter('all');
                        setEmploymentFilter('all');
                        setSearchQuery('');
                        toast.success(t('toast.success.filtersCleared'));
                      }}
                      className="flex items-center justify-center w-8 h-8 bg-danger-100 text-danger-600 rounded-lg border border-danger-200 hover:bg-danger-200 transition-all duration-200 cursor-pointer"
                      title={t('pages.clearAllFilters')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('aria.menus.filters')} className="w-64 max-h-[400px] overflow-y-auto">
                <DropdownItem key="status-header" isReadOnly className="opacity-100 font-semibold text-default-500 text-xs uppercase">
                  Status
                </DropdownItem>
                <DropdownItem
                  key="status-all"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{t('pages.allStatus1')}</span>
                    {statusFilter === 'all' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="status-generated"
                  onClick={() => setStatusFilter('generated')}
                  className={statusFilter === 'generated' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{t('pages.generated1')}</span>
                    {statusFilter === 'generated' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="status-paid"
                  onClick={() => setStatusFilter('paid')}
                  className={statusFilter === 'paid' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{t('pages.paid2')}</span>
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
                    <span>{t('pages.allTypes1')}</span>
                    {employmentFilter === 'all' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="full_time"
                  onClick={() => setEmploymentFilter('full_time')}
                  className={employmentFilter === 'full_time' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{t('pages.fullTime1')}</span>
                    {employmentFilter === 'full_time' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="part_time"
                  onClick={() => setEmploymentFilter('part_time')}
                  className={employmentFilter === 'part_time' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{t('pages.partTime1')}</span>
                    {employmentFilter === 'part_time' && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="contractor"
                  onClick={() => setEmploymentFilter('contractor')}
                  className={employmentFilter === 'contractor' ? 'bg-primary-50' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{t('pages.contractor1')}</span>
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
              <span>{t('pages.exportCsv1')}</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-warning-500 text-white rounded-lg border border-warning-600 hover:bg-warning-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
              onClick={() => setFixSalariesConfirmOpen(true)}
            >
              <Wallet size={16} />
              <span>{t('pages.fixSalaries1')}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TablePageSkeleton kpiCards={0} searchBar={false} rows={5} />
        ) : (
          <>
            <Table
              aria-label={t('aria.tables.payrollRecords')}
              selectionMode="multiple"
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              removeWrapper
              radius="none"
              onClick={() => setIsFilterDropdownOpen(false)}
              classNames={{
                base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
                th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6",
                td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 transition-colors",
                tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5 [&>tr[data-selected=true]>td]:bg-primary-50",
                tr: "transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900 data-[selected=true]:bg-primary-50",
              }}
            >
              <TableHeader>
                <TableColumn scope="col">{t('pages.eMPLOYEE')}</TableColumn>
                <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
                <TableColumn scope="col">{t('pages.bASESalary')}</TableColumn>
                <TableColumn scope="col">{t('pages.aLLOWANCES')}</TableColumn>
                <TableColumn scope="col">{t('pages.dEDUCTIONS')}</TableColumn>
                <TableColumn scope="col">{t('pages.nETPay')}</TableColumn>
                <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
                <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-default-100 flex items-center justify-center mb-3">
                    <Wallet size={24} className="text-default-400" />
                  </div>
                  <p className="text-base font-semibold text-default-700 mb-1">No Payroll Records</p>
                  <p className="text-sm text-default-500 text-center max-w-sm mb-4">
                    No payroll records found for this period. Run payroll to generate salary records for active staff.
                  </p>
                  <Button size="sm" color="primary" startContent={<Play size={14} />} onPress={() => setRunPayrollModalOpen(true)}>
                    Run Payroll
                  </Button>
                </div>
              }>
                {visibleRecords.map((record) => {
                  // FIXED: Use _id from MongoDB and string comparison for ID matching
                  const employee = staff.find(s => String(s._id || s.id) === String(record.employeeId));
                  if (!employee) {
                    logger.warn('⚠️ Employee not found for record:', { 
                      employeeId: record.employeeId, 
                      employeeIdType: typeof record.employeeId,
                      availableStaffIds: staff.map(s => s._id || s.id)
                    });
                    return null;
                  }

                  return (
                    <TableRow key={record._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PhotoAvatar
                            src={employee.photo}
                            name={employee.name}
                            alt={employee.name}
                            type="staff"
                            size="md"
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
                          {record.employmentType.replace(/_/g, ' ')}
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
                              <span>{t('pages.locked1')}</span>
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
      <RunPayrollModal
        isOpen={runPayrollModalOpen}
        onOpenChange={setRunPayrollModalOpen}
        preparingRecords={preparingRecords}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        months={months}
        onConfirm={confirmPrepareRecords}
      />

      {/* Bulk Pay Confirmation Modal */}
      <BulkPayModal
        isOpen={bulkPayModalOpen}
        onOpenChange={setBulkPayModalOpen}
        pendingBulkPay={pendingBulkPay}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        onConfirm={confirmBulkPay}
      />

      {/* Validation Modal */}
      <ValidationResultsModal
        isOpen={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        validating={validating}
        validationResults={validationResults}
        preparingRecords={preparingRecords}
        onConfirm={confirmPrepareRecords}
        formatCurrency={formatCurrency}
      />

      {/* Reverse Payment Modal */}
      <ReversePaymentModal
        isOpen={reverseModalOpen}
        onOpenChange={setReverseModalOpen}
        reversing={reversing}
        reverseReason={reverseReason}
        setReverseReason={setReverseReason}
        onConfirm={confirmReversePayment}
      />

      {/* Fix Salaries Confirmation Modal */}
      <FixSalariesModal
        isOpen={fixSalariesConfirmOpen}
        onOpenChange={setFixSalariesConfirmOpen}
        fixingSalaries={fixingSalaries}
        onConfirm={handleFixSalaries}
      />
        </>
      )}
    </div>
  );
}
