import { useTranslation } from "react-i18next";
import { Button, Chip, Checkbox } from "@heroui/react";
import { FileText, Lock, RotateCcw, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../../utils/numberFormatter";
import { TablePageSkeleton } from "../../../components/skeletons/PageSkeletons";
import VirtualizedTable from "../../../components/common/VirtualizedTable";
import PhotoAvatar from "../../../components/PhotoAvatar";

const STATUS_CHIP_CLASS = {
  paid: "bg-ok-bg text-ok border-ok/20",
  generated: "bg-info-bg text-info border-info/20",
  reversed: "bg-danger-bg text-danger-token border-danger-token/20",
  default: "bg-surface-2 text-fg-muted border-border-token",
};

export default function PayrollTable({
  loading,
  filteredRecords,
  staff,
  selectedKeys,
  setSelectedKeys,
  setIsFilterDropdownOpen,
  handleMarkAsPaid,
  handleReversePayment,
  setEditingRecord,
  setPaymentForm,
  setPaymentModalOpen,
  getStatusColor,
  getStatusLabel,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Guard against undefined props
  const safeRecords = filteredRecords || [];
  const safeStaff = staff || [];

  if (loading) {
    return <TablePageSkeleton title={false} columns={6} rows={8} hasAvatar kpiCards={0} />;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="-mx-6"
      role="region"
      tabIndex={-1}
      onClick={() => setIsFilterDropdownOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setIsFilterDropdownOpen(false);
      }}
    >
      <VirtualizedTable
        ariaLabel="Payroll records table"
        data={filteredRecords}
        getRowKey={(record) => record._id}
        rowHeight={65}
        columns={[
          { key: "select", label: "", width: 48, className: "pl-6 pr-3",
            headerContent: (
              <Checkbox
                size="md"
                classNames={{ base: "p-0 m-0", wrapper: "m-0" }}
                isSelected={filteredRecords.length > 0 && selectedKeys.size === filteredRecords.length}
                isIndeterminate={selectedKeys.size > 0 && selectedKeys.size < filteredRecords.length}
                onValueChange={(checked) => {
                  if (checked) setSelectedKeys(new Set(filteredRecords.map(r => r._id)));
                  else setSelectedKeys(new Set());
                }}
                aria-label={t('aria.buttons.selectAll')}
              />
            ),
          },
          { key: "employee", label: t('staff.payroll.colEmployee'), width: 220 },
          { key: "type", label: t('staff.payroll.colType'), width: 120 },
          { key: "baseSalary", label: t('staff.payroll.colBaseSalary'), width: 110 },
          { key: "allowances", label: t('staff.payroll.colAllowances'), width: 110 },
          { key: "deductions", label: t('staff.payroll.colDeductions'), width: 110 },
          { key: "netPay", label: t('staff.payroll.colNetPay'), width: 110 },
          { key: "status", label: t('staff.payroll.colStatus'), width: 100 },
          { key: "actions", label: t('staff.payroll.colActions'), align: "end", width: 200 },
        ]}
        getRowClassName={(record) => {
          const isSelected = selectedKeys.has(record._id);
          return isSelected ? "bg-accent-bg-subtle" : "";
        }}
        emptyContent={
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-3">
              <Wallet size={24} className="text-fg-faint" />
            </div>
            <p className="text-base font-semibold text-fg mb-1">{t('staff.payroll.noPayrollRecords', 'No Payroll Records')}</p>
            <p className="text-sm text-fg-muted text-center max-w-sm">
              {t('staff.payroll.noPayrollRecordsDesc', 'No payroll records found for this period. Run payroll to generate salary records for active staff.')}
            </p>
          </div>
        }
        renderRow={(record) => {
          const employee = staff.find(s => String(s._id || s.id) === String(record.employeeId));
          if (!employee) return null;
          const isSelected = selectedKeys.has(record._id);
          const cellClass = `py-5 border-b border-divider px-3 transition-colors ${isSelected ? "bg-accent-bg-subtle" : "group-hover:bg-surface-hover"}`;
          return (
            <>
              <td className={`py-5 border-b border-divider pl-6 pr-3 transition-colors w-12 ${isSelected ? "bg-accent-bg-subtle" : "group-hover:bg-surface-hover"}`} onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  size="md"
                  classNames={{ base: "p-0 m-0", wrapper: "m-0" }}
                  isSelected={isSelected}
                  onValueChange={(checked) => {
                    const newKeys = new Set(selectedKeys);
                    if (checked) newKeys.add(record._id); else newKeys.delete(record._id);
                    setSelectedKeys(newKeys);
                  }}
                />
              </td>
              <td className={cellClass}>
                <div className="flex items-center gap-3">
                  <PhotoAvatar src={employee.photo || employee.picture} alt={employee.name} name={employee.name} size="md" type="staff" />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      className="text-fg font-medium text-base hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-left"
                      onClick={() => navigate(`/staffs/${employee.id}`)}
                    >
                      {employee.name}
                    </button>
                    <span className="text-fg-muted text-xs">{employee.code}</span>
                  </div>
                </div>
              </td>
              <td className={cellClass}>
                <Chip size="sm" variant="flat" className="capitalize">{record.employmentType.replace(/_/g, ' ')}</Chip>
              </td>
              <td className={cellClass}>
                <span className="font-mono text-sm text-fg-muted">{formatCurrency(record.baseSalary)}</span>
              </td>
              <td className={cellClass}>
                <span className="font-mono text-sm text-ok">+{formatCurrency(record.totalAllowances)}</span>
              </td>
              <td className={cellClass}>
                <span className="font-mono text-sm text-danger-token">-{formatCurrency(record.totalDeductions)}</span>
              </td>
              <td className={cellClass}>
                <span className="font-mono text-sm font-semibold text-fg">{formatCurrency(record.netPay)}</span>
              </td>
              <td className={cellClass}>
                <Chip className={STATUS_CHIP_CLASS[record.status] || STATUS_CHIP_CLASS.default} size="sm" variant="flat">{getStatusLabel(record.status)}</Chip>
              </td>
              <td className={`py-5 border-b border-divider pr-6 transition-colors ${isSelected ? "bg-accent-bg-subtle" : "group-hover:bg-surface-hover"}`}>
                <div className="flex justify-end gap-1 items-center">
                  {record.isLocked && (
                    <div className="flex items-center gap-1 text-xs text-warn bg-warn-bg px-2 py-1 rounded-full border border-warn/20">
                      <Lock size={12} /><span>{t('staff.payroll.locked')}</span>
                    </div>
                  )}
                  {record.status === 'generated' && (
                    <Button size="sm" variant="flat" className="bg-ok-bg text-ok" onPress={() => handleMarkAsPaid(record._id)}>{t('staff.payroll.logPayment')}</Button>
                  )}
                  {record.status === 'paid' && record.isLocked && (
                    <Button size="sm" variant="flat" className="bg-warn-bg text-warn" onPress={() => handleReversePayment(record)} startContent={<RotateCcw size={14} />}>{t('staff.payroll.reverse')}</Button>
                  )}
                  <Button size="sm" variant="flat" className="bg-accent-bg text-accent" onPress={() => {
                    setEditingRecord(record);
                    setPaymentForm({ paymentMethod: 'bank_transfer', paymentReference: '', notes: '' });
                    setPaymentModalOpen(true);
                  }}>{t('common.edit')}</Button>
                  <Button size="sm" variant="light" isIconOnly className="text-fg-faint"><FileText size={16} /></Button>
                </div>
              </td>
            </>
          );
        }}
      />
    </div>
  );
}
