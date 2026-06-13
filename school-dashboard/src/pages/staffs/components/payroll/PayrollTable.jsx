import { Spinner } from "@heroui/react";
import { Play, FileText, Wallet, Lock, RotateCcw, CreditCard, Pencil } from "lucide-react";
import { useTranslation } from 'react-i18next';
import PhotoAvatar from "../../../../components/PhotoAvatar";
import { TablePageSkeleton } from '../../../../components/skeletons/PageSkeletons';
import logger from "../../../../utils/logger";

/**
 * REVAMP-17: Dense payroll table styled with the design-system
 * `.payroll-table` atoms (mono tnum for money, status pills, chip
 * for employment type, iconbtn for trailing actions). Horizontal
 * scroll on narrow viewports preserves all 8 columns.
 */

const STATUS_TONE = {
  paid: 'ok',
  generated: 'info',
  on_hold: 'warn',
  failed: 'danger',
};

function statusLabel(status) {
  if (status === 'paid') return 'Recorded';
  return (status || '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function PayrollTable({
  loading,
  visibleRecords,
  staff,
  selectedKeys,
  setSelectedKeys,
  setRunPayrollModalOpen,
  handleMarkAsPaid,
  handleReversePayment,
  setEditingRecord,
  setPaymentForm,
  setPaymentModalOpen,
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

  const allSelected = selectedKeys === 'all' ||
    (visibleRecords.length > 0 && visibleRecords.every(r => selectedKeys?.has?.(r._id)));
  const someSelected = selectedKeys !== 'all' && selectedKeys?.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set([]));
    } else {
      setSelectedKeys(new Set(visibleRecords.map(r => r._id)));
    }
  };

  const toggleOne = (id) => {
    if (selectedKeys === 'all') {
      const next = new Set(visibleRecords.map(r => r._id));
      next.delete(id);
      setSelectedKeys(next);
      return;
    }
    const next = new Set(selectedKeys || []);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedKeys(next);
  };

  const isChecked = (id) =>
    selectedKeys === 'all' || (selectedKeys && selectedKeys.has && selectedKeys.has(id));

  if (visibleRecords.length === 0) {
    return (
      <div className="payroll-table-wrap">
        <div className="payroll-empty">
          <div className="payroll-empty__icon">
            <Wallet size={20} aria-hidden />
          </div>
          <div className="payroll-empty__title">No payroll records</div>
          <div className="payroll-empty__sub">
            No records found for this period. Run payroll to generate salary records for active staff.
          </div>
          <button
            type="button"
            className="btn btn--accent btn--sm"
            style={{ marginTop: 8 }}
            onClick={() => setRunPayrollModalOpen(true)}
          >
            <Play size={12} aria-hidden /> Run payroll
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="payroll-table-wrap">
        <div className="payroll-table-scroll">
          <table className="payroll-table" aria-label={t('aria.tables.payrollRecords')}>
            <thead>
              <tr>
                <th className="payroll-table__checkbox" scope="col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th scope="col">Employee</th>
                <th scope="col">Type</th>
                <th scope="col" className="is-num">Base salary</th>
                <th scope="col" className="is-num">Allowances</th>
                <th scope="col" className="is-num">Deductions</th>
                <th scope="col" className="is-num">Net pay</th>
                <th scope="col">Status</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => {
                const employee = staff.find(
                  s => String(s._id || s.id) === String(record.employeeId)
                );
                if (!employee) {
                  logger.warn('⚠️ Employee not found for record:', {
                    employeeId: record.employeeId,
                  });
                  return null;
                }
                const tone = STATUS_TONE[record.status] || 'info';
                const selected = isChecked(record._id);

                return (
                  <tr key={record._id} className={selected ? 'is-selected' : ''}>
                    <td className="payroll-table__checkbox">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleOne(record._id)}
                        aria-label={`Select ${employee.name}`}
                      />
                    </td>
                    <td>
                      <div className="payroll-table__employee">
                        <PhotoAvatar
                          src={employee.photo}
                          name={employee.name}
                          alt={employee.name}
                          type="staff"
                          size="sm"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <button
                            type="button"
                            className="payroll-table__employee-name"
                            onClick={() => navigate(`/staffs/${employee.id}`)}
                          >
                            {employee.name}
                          </button>
                          <span className="payroll-table__employee-code">{employee.code}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip" style={{ textTransform: 'capitalize' }}>
                        {(record.employmentType || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="is-num">{formatCurrency(record.baseSalary)}</td>
                    <td className="is-num is-num--positive">
                      +{formatCurrency(record.totalAllowances)}
                    </td>
                    <td className="is-num is-num--negative">
                      −{formatCurrency(record.totalDeductions)}
                    </td>
                    <td className="is-num is-num--total">
                      {formatCurrency(record.netPay)}
                    </td>
                    <td>
                      <span className={`status status--${tone}`}>
                        <span className="dot" />
                        {statusLabel(record.status)}
                      </span>
                      {record.isLocked && (
                        <span className="chip chip--warn" style={{ marginLeft: 6 }}>
                          <Lock size={10} aria-hidden /> Locked
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="payroll-table__actions">
                        {record.status === 'generated' && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => handleMarkAsPaid(record._id)}
                            style={{ color: 'var(--ok)' }}
                          >
                            <CreditCard size={12} aria-hidden /> Log
                          </button>
                        )}
                        {record.status === 'paid' && record.isLocked && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => handleReversePayment(record)}
                            style={{ color: 'var(--warn)' }}
                          >
                            <RotateCcw size={12} aria-hidden /> Reverse
                          </button>
                        )}
                        <button
                          type="button"
                          className="iconbtn"
                          style={{ width: 24, height: 24 }}
                          onClick={() => {
                            setEditingRecord(record);
                            setPaymentForm({
                              paymentMethod: 'bank_transfer',
                              paymentReference: '',
                              notes: ''
                            });
                            setPaymentModalOpen(true);
                          }}
                          aria-label="Edit payment"
                          title="Edit"
                        >
                          <Pencil size={13} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          style={{ width: 24, height: 24 }}
                          aria-label="View payslip"
                          title="View payslip"
                        >
                          <FileText size={13} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={loaderRef} className="row" style={{ justifyContent: 'center', padding: '12px 0' }}>
        {isLoadingMore && <Spinner size="sm" color="primary" />}
        {!hasMore && filteredRecords.length > 20 && (
          <span className="subtle" style={{ fontSize: 12 }}>
            All <span className="mono tnum">{filteredRecords.length}</span> records loaded
          </span>
        )}
      </div>
    </>
  );
}
