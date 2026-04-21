import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Spinner, Chip
} from "@heroui/react";
import { Play, FileText, Wallet, Lock, RotateCcw } from "lucide-react";
import { useTranslation } from 'react-i18next';
import PhotoAvatar from "../../../../components/PhotoAvatar";
import { TablePageSkeleton } from '../../../../components/skeletons/PageSkeletons';
import logger from "../../../../utils/logger";

export default function PayrollTable({
  loading,
  visibleRecords,
  staff,
  selectedKeys,
  setSelectedKeys,
  setIsFilterDropdownOpen,
  setRunPayrollModalOpen,
  handleMarkAsPaid,
  handleReversePayment,
  setEditingRecord,
  setPaymentForm,
  setPaymentModalOpen,
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  navigate,
  loaderRef,
  isLoadingMore,
  hasMore,
  filteredRecords,
}) {
  const { t } = useTranslation();

  if (loading) {
    return <TablePageSkeleton kpiCards={0} searchBar={false} rows={5} />;
  }

  return (
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
        {!hasMore && filteredRecords.length > 20 && (
          <span className="text-default-400 text-sm">All {filteredRecords.length} records loaded</span>
        )}
      </div>
    </>
  );
}
