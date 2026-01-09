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
  TrendingUp, Wallet, CreditCard, Users, X
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { payrollApi } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function StaffPayroll() {
  const { staff } = useApp();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState("all");

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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard();
    fetchPayrollRecords();
  }, [selectedMonth, selectedYear]);

  const fetchDashboard = async () => {
    try {
      const response = await payrollApi.getDashboard(selectedMonth, selectedYear);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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
        setPayrollRecords(response.data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    if (!confirm(`Run payroll for ${months[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    try {
      setRunningPayroll(true);
      const activeStaff = staff.filter(s => s.status === 'active');
      const employeeIds = activeStaff.map(s => s.id);

      const response = await payrollApi.runPayroll({
        month: selectedMonth,
        year: selectedYear,
        employeeIds,
        staffData: activeStaff
      });

      if (response.success) {
        alert(`Payroll completed!\nSuccess: ${response.data.results.success.length}\nFailed: ${response.data.results.failed.length}`);
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error running payroll:', error);
      alert('Error running payroll: ' + error.message);
    } finally {
      setRunningPayroll(false);
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
        alert('Payment recorded successfully!');
        setPaymentModalOpen(false);
        setPaymentForm({ paymentMethod: 'bank_transfer', paymentReference: '', notes: '' });
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleBulkPay = async () => {
    if (!confirm(`Mark ${selectedKeys.size} salaries as paid?`)) {
      return;
    }

    try {
      const recordIds = Array.from(selectedKeys);
      const response = await payrollApi.bulkPay({
        recordIds,
        paymentMethod: 'bank_transfer'
      });

      if (response.success) {
        alert(`Bulk payment completed!\nSuccess: ${response.data.success.length}\nFailed: ${response.data.failed.length}`);
        setSelectedKeys(new Set([]));
        fetchDashboard();
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error bulk paying:', error);
      alert('Error: ' + error.message);
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
        const emp = staff.find(s => s.id === r.employeeId);
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

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Payment Modal */}
      <Modal isOpen={paymentModalOpen} onOpenChange={setPaymentModalOpen} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Record Payment</ModalHeader>
              <ModalBody className="gap-4">
                <Select
                  label="Payment Method"
                  selectedKeys={new Set([paymentForm.paymentMethod])}
                  onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMethod: Array.from(keys)[0] })}
                  variant="bordered"
                >
                  <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem key="cash">Cash</SelectItem>
                  <SelectItem key="cheque">Cheque</SelectItem>
                  <SelectItem key="online">Online Payment</SelectItem>
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
                  Confirm Payment
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Header Controls (Month/Year Selection) */}
      <div className="flex justify-end gap-3 items-center mb-4">
        <Select
          label="Month"
          selectedKeys={new Set([selectedMonth.toString()])}
          onSelectionChange={(keys) => setSelectedMonth(parseInt(Array.from(keys)[0]))}
          className="w-40"
          size="sm"
          variant="flat"
          bg-white
        >
          {months.map((month, idx) => (
            <SelectItem key={(idx + 1).toString()}>{month}</SelectItem>
          ))}
        </Select>
        <Select
          label="Year"
          selectedKeys={new Set([selectedYear.toString()])}
          onSelectionChange={(keys) => setSelectedYear(parseInt(Array.from(keys)[0]))}
          className="w-32"
          size="sm"
          variant="flat"
          bg-white
        >
          {years.map(year => (
            <SelectItem key={year.toString()}>{year}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Content Wrapper with Padding Context */}
      {/* This mimics the padding a parent Card would provide, allowing the full-bleed children to work correctly using negative margins */}
      <div className="relative">

        {/* KPI Cards */}
        {dashboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
            <div className="p-4 bg-success-50 rounded-lg border border-success-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-success-600" />
                <span className="text-xs text-success-700 uppercase tracking-wider">Total Payout</span>
              </div>
              <p className="text-2xl font-semibold text-success-700">
                {formatCurrency(dashboardData.totalPayout)}
              </p>
              <p className="text-xs text-success-600 mt-1">
                {dashboardData.paidCount} employees paid
              </p>
            </div>

            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-primary-600" />
                <span className="text-xs text-primary-700 uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-2xl font-semibold text-primary-700">
                {formatCurrency(dashboardData.pendingAmount)}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                {dashboardData.pendingCount} salaries pending
              </p>
            </div>

            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-warning-600" />
                <span className="text-xs text-warning-700 uppercase tracking-wider">Projected</span>
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
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
          <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
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
            <Dropdown>
              <DropdownTrigger>
                <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                  <Filter size={16} className="text-default-400" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by status"
                selectionMode="single"
                selectedKeys={new Set([statusFilter])}
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
              >
                <DropdownItem key="all">All Status</DropdownItem>
                <DropdownItem key="generated">Generated</DropdownItem>
                <DropdownItem key="paid">Paid</DropdownItem>
                <DropdownItem key="on_hold">On Hold</DropdownItem>
                <DropdownItem key="failed">Failed</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger>
                <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                  <Filter size={16} className="text-default-400" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by employment type"
                selectionMode="single"
                selectedKeys={new Set([employmentFilter])}
                onSelectionChange={(keys) => setEmploymentFilter(Array.from(keys)[0])}
              >
                <DropdownItem key="all">All Types</DropdownItem>
                <DropdownItem key="full_time">Full Time</DropdownItem>
                <DropdownItem key="part_time">Part Time</DropdownItem>
                <DropdownItem key="contractor">Contractor</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {selectedKeys.size > 0 && (
              <button
                className="flex items-center gap-2 px-3 py-2 bg-success text-white rounded-lg border border-success hover:bg-success-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
                onClick={handleBulkPay}
              >
                <CreditCard size={16} />
                <span>Pay Selected ({selectedKeys.size})</span>
              </button>
            )}
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRunPayroll}
              disabled={runningPayroll}
            >
              {runningPayroll ? <Spinner size="sm" color="white" /> : <Play size={16} />}
              <span>{runningPayroll ? 'Running...' : 'Run Payroll'}</span>
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
                {visibleRecords.map((record) => {
                  const employee = staff.find(s => s.id === record.employeeId);
                  if (!employee) return null;

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
                        <div className="flex justify-end gap-1">
                          {record.status === 'generated' && (
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => handleMarkAsPaid(record._id)}
                            >
                              Pay
                            </Button>
                          )}
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
    </div>
  );
}
