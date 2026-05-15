import { useState, useRef, useEffect } from "react";
import {
  Filter, Search, Play, Wallet, CreditCard, X, ChevronDown, Download
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";

/**
 * REVAMP-17: Toolbar follows the StaffList toolbar pattern —
 * search + seg-style cycle pill + filter dropdown on the left,
 * action cluster (Run / Bulk / Export / Fix) on the right.
 *
 * Cycle filter renders two native <select> elements inside a
 * .payroll-cycle pill so the month/year switcher has the same
 * density as .seg pills used elsewhere.
 */

const STATUS_OPTIONS = [
  { key: 'all', label: 'All status' },
  { key: 'generated', label: 'Generated' },
  { key: 'paid', label: 'Recorded' },
];

const EMPLOYMENT_OPTIONS = [
  { key: 'all', label: 'All types' },
  { key: 'full_time', label: 'Full-time' },
  { key: 'part_time', label: 'Part-time' },
  { key: 'contractor', label: 'Contractor' },
];

export default function PayrollToolbar({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  availableMonths,
  months,
  years,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  employmentFilter,
  setEmploymentFilter,
  isAnySelected,
  selectedCount,
  handleBulkPay,
  handlePrepareRecords,
  handleExportPayroll,
  setFixSalariesConfirmOpen,
  preparingRecords,
}) {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Click-outside to close filter dropdown
  useEffect(() => {
    if (!filterOpen) return;
    const onDocClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [filterOpen]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) + (employmentFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setEmploymentFilter('all');
    setSearchQuery('');
    toast.success(t('toast.success.filtersCleared'));
  };

  return (
    <div className="payroll-toolbar">
      <div className="payroll-toolbar__cluster">
        {/* Cycle: month + year as a single .seg-flavored pill */}
        <div className="payroll-cycle" aria-label="Payroll cycle">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            aria-label={t('pages.month1')}
          >
            {availableMonths.map((month) => {
              const idx = months.indexOf(month) + 1;
              return (
                <option key={idx} value={idx}>{month}</option>
              );
            })}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            aria-label={t('pages.year1')}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="toolbar__search" style={{ width: 240 }}>
          <Search size={13} aria-hidden style={{ color: 'var(--fg-faint)' }} />
          <input
            type="text"
            placeholder={t('pages.searchEmployee1')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search staff"
          />
          {searchQuery && (
            <button
              type="button"
              className="iconbtn"
              style={{ width: 20, height: 20 }}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={11} aria-hidden />
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            aria-haspopup="menu"
          >
            <Filter size={12} aria-hidden />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="chip chip--accent mono tnum" style={{ height: 16, padding: '0 5px' }}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={12} aria-hidden />
          </button>
          {filterOpen && (
            <div
              className="glass"
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                width: 220,
                borderRadius: 8,
                padding: 8,
                zIndex: 20,
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div>
                <div className="card__title" style={{ marginBottom: 4 }}>Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      className="cnav"
                      style={{ height: 26, fontSize: 12.5 }}
                      onClick={() => { setStatusFilter(o.key); setFilterOpen(false); }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
                      {statusFilter === o.key && (
                        <span className="chip chip--accent">on</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--divider)' }} />
              <div>
                <div className="card__title" style={{ marginBottom: 4 }}>Employment</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {EMPLOYMENT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      className="cnav"
                      style={{ height: 26, fontSize: 12.5 }}
                      onClick={() => { setEmploymentFilter(o.key); setFilterOpen(false); }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
                      {employmentFilter === o.key && (
                        <span className="chip chip--accent">on</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {(statusFilter !== 'all' || employmentFilter !== 'all' || searchQuery) && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={clearFilters}
            style={{ color: 'var(--fg-muted)' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="payroll-toolbar__actions">
        {isAnySelected && (
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleBulkPay}
            style={{ color: 'var(--ok)' }}
          >
            <CreditCard size={12} aria-hidden />
            Log selected (<span className="mono tnum">{selectedCount}</span>)
          </button>
        )}
        <button
          type="button"
          className="btn btn--accent btn--sm"
          onClick={handlePrepareRecords}
          disabled={preparingRecords}
        >
          <Play size={12} aria-hidden />
          {preparingRecords ? 'Processing…' : 'Run payroll'}
        </button>
        {handleExportPayroll && (
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleExportPayroll}
          >
            <Download size={12} aria-hidden />
            Export
          </button>
        )}
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => setFixSalariesConfirmOpen(true)}
          style={{ color: 'var(--warn)' }}
        >
          <Wallet size={12} aria-hidden />
          Fix salaries
        </button>
      </div>
    </div>
  );
}
