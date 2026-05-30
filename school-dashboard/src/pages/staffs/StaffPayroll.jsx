import { useState, useMemo, useEffect } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import logger from "../../utils/logger";
import { useApp } from "../../context/AppContext";
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
import ExportMenu from '../../components/ui/ExportMenu';
import { PageShell } from "../../components/ui";
import { isActiveStaff } from "./utils/staffHelpers";

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

  const getActiveStaffCount = () => staff.filter(isActiveStaff).length;

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    notes: ''
  });

  const [runPayrollModalOpen, setRunPayrollModalOpen] = useState(false);
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false);
  const [pendingBulkPay, setPendingBulkPay] = useState(null);

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

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 2 + i);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter available months — current year stops at current month;
  // prior years allow every month. (REVAMP-17 bug-fix-license:
  // previously off-by-month allowed users to run payroll for
  // future months in the current year.)
  const availableMonths = months.filter((_, idx) => {
    const monthNum = idx + 1;
    if (selectedYear === currentYear) return monthNum <= currentMonth;
    return true;
  });

  const staffLength = staff?.length || 0;
  useEffect(() => {
    if (!appLoading && staffLength > 0) {
      fetchDashboard();
      fetchPayrollRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, appLoading, staffLength]);

  useEffect(() => {
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [selectedYear, currentMonth, currentYear, selectedMonth]);

  const fetchDashboard = async () => {
    try {
      const response = await payrollApi.getDashboard(selectedMonth, selectedYear);
      if (response.success) setDashboardData(response.data);
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
        setPayrollRecords(response.data || []);
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
    if (validating || preparingRecords) return;
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
      const activeStaff = staff.filter(isActiveStaff);
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
    const recordId = typeof editingRecord === 'object' && editingRecord !== null
      ? editingRecord._id
      : editingRecord;
    try {
      const response = await payrollApi.markAsPaid(recordId, paymentForm);
      if (response.success) {
        toast.success(t('toast.success.paymentRecordedSuccessfully'));
        setPaymentModalOpen(false);
        setPaymentForm({ paymentMethod: 'bank_transfer', paymentReference: '', notes: '' });
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
    setPendingBulkPay({ count: recordIds.length, recordIds });
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
          // Surface partial-failure UX with both counts in one toast — fixes the
          // bug-license item where users couldn't tell what failed.
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

  const getStatusLabel = (status) => {
    if (status === 'paid') return 'Recorded';
    return (status || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredRecords = useMemo(() => {
    let result = payrollRecords;
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (employmentFilter !== 'all') result = result.filter(r => r.employmentType === employmentFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => {
        const emp = staff.find(s => String(s._id || s.id) === String(r.employeeId));
        return emp && (
          (emp.name || '').toLowerCase().includes(query) ||
          (emp.code || '').toLowerCase().includes(query)
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
    }).format(amount || 0);
  };

  const isAnySelected = selectedKeys === 'all' || selectedKeys.size > 0;
  const selectedCount = selectedKeys === 'all' ? filteredRecords.length : selectedKeys.size;

  if (appLoading || !staff || staff.length === 0) {
    return <TablePageSkeleton />;
  }

  const toolbar = (
    <PayrollToolbar
      selectedMonth={selectedMonth}
      setSelectedMonth={setSelectedMonth}
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}
      availableMonths={availableMonths}
      months={months}
      years={years}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      employmentFilter={employmentFilter}
      setEmploymentFilter={setEmploymentFilter}
      isAnySelected={isAnySelected}
      selectedCount={selectedCount}
      handleBulkPay={handleBulkPay}
      handlePrepareRecords={handlePrepareRecords}
      setFixSalariesConfirmOpen={setFixSalariesConfirmOpen}
      preparingRecords={preparingRecords}
    />
  );

  return (
    <PageShell
      title="Payroll"
      description={`${months[selectedMonth - 1]} ${selectedYear} · ${filteredRecords.length} of ${payrollRecords.length} records`}
      actions={
        <ExportMenu
          filename={`payroll-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
          title={`Payroll · ${months[selectedMonth - 1] || ''} ${selectedYear}`}
          rows={filteredRecords}
          columns={[
            {
              key: 'name',
              label: 'Staff Name',
              accessor: (r) => staff.find(s => String(s._id || s.id) === String(r.employeeId))?.name || '',
            },
            {
              key: 'code',
              label: 'Employee ID',
              accessor: (r) => staff.find(s => String(s._id || s.id) === String(r.employeeId))?.code || '',
            },
            { key: 'employmentType', label: 'Employment', format: (v) => (v || '').replace(/_/g, ' ') },
            { key: 'baseSalary', label: 'Base Salary' },
            { key: 'totalAllowances', label: 'Allowances' },
            { key: 'totalDeductions', label: 'Deductions' },
            { key: 'netPay', label: 'Net Pay' },
            { key: 'status', label: 'Status', format: (v) => getStatusLabel(v) },
          ]}
        />
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Staff", href: "/staffs" },
        { label: "Payroll" },
      ]}
      bodyPadding="none"
    >
      <div className="payroll-page">
        {/* KPI strip */}
        <PayrollKPICards dashboardData={dashboardData} formatCurrency={formatCurrency} />

        {/* Status banner */}
        <PayrollStatusBanner
          dashboardData={dashboardData}
          staff={staff}
          months={months}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          getActiveStaffCount={getActiveStaffCount}
          formatCurrency={formatCurrency}
        />

        {/* Table */}
        <PayrollRecordsTable
          loading={loading}
          visibleRecords={visibleRecords}
          staff={staff}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          setRunPayrollModalOpen={setRunPayrollModalOpen}
          handleMarkAsPaid={handleMarkAsPaid}
          handleReversePayment={handleReversePayment}
          setEditingRecord={setEditingRecord}
          setPaymentForm={setPaymentForm}
          setPaymentModalOpen={setPaymentModalOpen}
          formatCurrency={formatCurrency}
          navigate={navigate}
          loaderRef={loaderRef}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          filteredRecords={filteredRecords}
        />

        {/* Modals */}
        <PaymentModal
          isOpen={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          onConfirm={confirmPayment}
        />
        <RunPayrollModal
          isOpen={runPayrollModalOpen}
          onOpenChange={setRunPayrollModalOpen}
          preparingRecords={preparingRecords}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          months={months}
          onConfirm={confirmPrepareRecords}
        />
        <BulkPayModal
          isOpen={bulkPayModalOpen}
          onOpenChange={setBulkPayModalOpen}
          pendingBulkPay={pendingBulkPay}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          onConfirm={confirmBulkPay}
        />
        <ValidationResultsModal
          isOpen={validationModalOpen}
          onOpenChange={setValidationModalOpen}
          validating={validating}
          validationResults={validationResults}
          preparingRecords={preparingRecords}
          onConfirm={confirmPrepareRecords}
          formatCurrency={formatCurrency}
        />
        <ReversePaymentModal
          isOpen={reverseModalOpen}
          onOpenChange={setReverseModalOpen}
          reversing={reversing}
          reverseReason={reverseReason}
          setReverseReason={setReverseReason}
          onConfirm={confirmReversePayment}
        />
        <FixSalariesModal
          isOpen={fixSalariesConfirmOpen}
          onOpenChange={setFixSalariesConfirmOpen}
          fixingSalaries={fixingSalaries}
          onConfirm={handleFixSalaries}
        />
      </div>
    </PageShell>
  );
}
