import {
  Spinner, Chip,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Select, SelectItem
} from "@heroui/react";
import {
  Filter, Search, Play, Wallet, CreditCard, X, CheckCircle2, ChevronDown,
  Download
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";

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
  isFilterDropdownOpen,
  setIsFilterDropdownOpen,
  isAnySelected,
  selectedCount,
  handleBulkPay,
  handlePrepareRecords,
  handleExportPayroll,
  setFixSalariesConfirmOpen,
  preparingRecords,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start bg-white dark:bg-zinc-950 border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
      <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
        {/* Month/Year Selector */}
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
            {availableMonths.map((month) => {
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
  );
}
