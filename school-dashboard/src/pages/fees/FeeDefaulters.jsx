import { useState, useMemo, useEffect, useRef } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Spinner } from "@heroui/react";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Download, Bell, MoreVertical, CreditCard } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { useCurrency } from '../../context/hooks/useCurrency';
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { formatShortDate, toTodayDateString } from "../../utils/dateFormatter";
import SearchInput from "../../components/ui/SearchInput";
import FilterToolbar from "../../components/ui/FilterToolbar";
import MobileResponsive from "../../components/ui/MobileResponsive";
import ErrorBoundary from "../../components/ui/ErrorBoundary";
import logger from '../../utils/logger';


export default function FeeDefaulters() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const navigate = useNavigate();
  const { selectedAcademicYear } = useApp();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [defaulters, setDefaulters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDefaulters = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const DEFAULTER_LIMIT = 100;
        const response = await feesApi.getDefaulters({
          limit: DEFAULTER_LIMIT,
          ...(selectedAcademicYear ? { academicYear: selectedAcademicYear } : {}),
        });
        // Backend returns { data: [...], pagination: {...} }
        const raw = Array.isArray(response) ? response : (response?.data || []);
        const serverTotal = response?.pagination?.total || response?.total || raw.length;
        setTotalCount(serverTotal);
        setIsTruncated(raw.length >= DEFAULTER_LIMIT && serverTotal > DEFAULTER_LIMIT);
        // Map backend StudentFeeStructure fields to frontend display fields
        const mapped = raw.map((d) => {
          const student = d.studentId || {};
          const cls = d.classId || {};
          const daysOverdue = d.lastPaymentDate
            ? Math.floor((Date.now() - new Date(d.lastPaymentDate).getTime()) / 86400000)
            : Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000);
          return {
            id: d.studentId?._id || d.studentId || d._id,
            student: student?.name || 'Unknown',
            class: cls.name ? `${cls.name} ${cls.section || ''}`.trim() : '—',
            rollNo: student.rollNo || '—',
            pending: d.totalBalance || 0,
            dueDate: formatShortDate(d.lastPaymentDate),
            days: daysOverdue > 0 ? daysOverdue : 0,
            phone: student.parentPhone || student.phone || '',
          };
        });
        setDefaulters(mapped);
      } catch (error) {
        logger.error('Error fetching defaulters:', error);
        setFetchError(error.message || t('toast.error.failedToLoadData', 'Failed to load fee defaulters'));
        toast.error(error.message || t('toast.error.failedToLoadData', 'Failed to load fee defaulters'));
      } finally {
        setLoading(false);
      }
    };
    fetchDefaulters();
  }, [selectedAcademicYear, refreshKey]);

  const filteredDefaulters = useMemo(() => {
    return defaulters.filter((d) => {
      const matchSearch = (d.student || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "7" && d.days >= 7) ||
        (filter === "15" && d.days >= 15) ||
        (filter === "30" && d.days >= 30);
      return matchSearch && matchFilter;
    });
  }, [defaulters, search, filter]);

  const { visibleItems: visibleDefaulters, hasMore, isLoadingMore, loaderRef } = useEntityFetch(
    filteredDefaulters,
    [search, filter]
  );

  const totalPending = filteredDefaulters.reduce((sum, d) => sum + d.pending, 0);

  const [sendingReminders, setSendingReminders] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSendReminders = async () => {
    if (filteredDefaulters.length === 0) return;
    setSendingReminders(true);
    const loadingToast = toast.loading(t('fees.sendingRemindersToDefaulters', { count: filteredDefaulters.length }));
    try {
      const { succeeded, failed } = await studentsApi.sendRemindersBulk({
        studentIds: filteredDefaulters.map(d => d.id),
        type: 'fee',
      });
      if (failed > 0) {
        toast.success(t('toast.success.remindersSentPartial', { succeeded, failed }), { id: loadingToast });
      } else {
        toast.success(t('toast.success.remindersSentAll', { count: succeeded }), { id: loadingToast });
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.message || t('toast.error.failedToSendReminder'), { id: loadingToast });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleExportDefaulters = async () => {
    if (isExporting) return;
    setIsExporting(true);
    // Yield to event loop so the UI re-renders with disabled state before heavy work
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      const headers = [t('common.student', 'Student'), t('common.class', 'Class'), t('common.rollNo', 'Roll No'), t('fees.pendingAmount', 'Pending Amount'), t('fees.dueDate', 'Due Date'), t('fees.daysOverdue', 'Days Overdue'), t('common.phone', 'Phone')];
      const rows = filteredDefaulters.map(d => [d.student, d.class, d.rollNo, d.pending, d.dueDate, d.days, d.phone || 'N/A']);
      const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const csvContent = [headers.map(escapeCSV).join(','), ...rows.map(row => row.map(escapeCSV).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee-defaulters-${toTodayDateString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendReminder = async (defaulter) => {
    const loadingToast = toast.loading(t('fees.sendingReminderTo', { name: defaulter.student }));
    try {
      await studentsApi.sendReminder(defaulter.id, {
        type: 'fee',
        message: `Fee payment of \u20B9${defaulter.pending?.toLocaleString()} is pending for ${defaulter.student}. Please pay at your earliest convenience.`,
      });
      toast.success(t('toast.success.reminderSentTo', { name: defaulter.student }), { id: loadingToast });
    } catch (error) {
      toast.error(error.message || t('toast.error.failedToSendReminderTo', { name: defaulter.student }), { id: loadingToast });
    }
  };

  const handleCollectFee = (defaulter) => {
    navigate('/fees', { state: { selectedStudentId: defaulter.id } });
  };

  if (loading) {
    return <TablePageSkeleton kpiCards={3} columns={6} rows={8} />;
  }

  if (fetchError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-zinc-200 mb-2">{t('common.somethingWentWrong', 'Something went wrong')}</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
        >
          {t('common.tryAgain', 'Try again')}
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="w-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.totalDefaulters')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{filteredDefaulters.length}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.totalPending')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{fmt(totalPending)}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('fees.thirtyDaysOverdue', '30+ Days Overdue')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{defaulters.filter((d) => d.days >= 30).length}</p>
        </div>
      </div>

      {/* Truncation Warning */}
      {isTruncated && (
        <div className="flex items-center gap-2 px-4 py-2.5 -mx-6 px-6 mb-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
          <span className="font-medium">{t('fees.showingLimitedDefaulters', { limit: 100, total: totalCount.toLocaleString(), defaultValue: `Showing 100 of ${totalCount.toLocaleString()} total defaulters.` })}</span>
          <span>{t('pages.useFiltersToNarrow')}</span>
        </div>
      )}

      {/* Toolbar */}
      <FilterToolbar
        left={<>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('pages.searchStudent')}
          />
          <Select
            size="sm"
            placeholder={t('pages.filterByDays')}
            selectedKeys={new Set([filter])}
            onSelectionChange={(keys) => setFilter(Array.from(keys)[0])}
            className="w-36"
            classNames={{ trigger: "h-9 bg-white border-gray-200 hover:border-gray-300" }}
          >
            <SelectItem key="all">{t('pages.all1')}</SelectItem>
            <SelectItem key="7">{t('pages.sevenPlusDays')}</SelectItem>
            <SelectItem key="15">{t('pages.fifteenPlusDays')}</SelectItem>
            <SelectItem key="30">{t('pages.thirtyPlusDays')}</SelectItem>
          </Select>
        </>}
        right={<>
          <button onClick={handleSendReminders} disabled={sendingReminders} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {sendingReminders ? <Spinner size="sm" className="w-3.5 h-3.5" /> : <Bell size={14} />}
            <span>{sendingReminders ? t('pages.sending', 'Sending...') : t('pages.remindAll')}</span>
          </button>
          <button onClick={handleExportDefaulters} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isExporting ? <Spinner size="sm" className="w-3.5 h-3.5" /> : <Download size={14} />}
            <span>{isExporting ? t('pages.exporting', 'Exporting...') : t('pages.export1')}</span>
          </button>
        </>}
      />

      {/* Table */}
      <MobileResponsive className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <Table
          aria-label={t('aria.misc.feeDefaulters')}
          removeWrapper
          classNames={{
            th: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200 dark:border-zinc-800",
            td: "py-4 border-b border-gray-100 dark:border-zinc-800",
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.sTUDENT')}</TableColumn>
            <TableColumn scope="col">{t('pages.pENDING')}</TableColumn>
            <TableColumn scope="col">{t('pages.dUEDate')}</TableColumn>
            <TableColumn scope="col">{t('pages.oVERDUE')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<div className="text-center py-8"><p className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noDefaultersFound')}</p></div>}>
            {visibleDefaulters.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{item.student?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 hover:text-gray-600 dark:hover:text-zinc-400 cursor-pointer" onClick={() => navigate(`/students/${item.id}`)}>
                        {item.student}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{t('common.class')} {item.class}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900 dark:text-zinc-100">{fmt(item.pending || 0)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{item.dueDate || '—'}</span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded ${
                    item.days >= 30 ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400" :
                    item.days >= 15 ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400" :
                    "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.days >= 30 ? "bg-red-500" :
                      item.days >= 15 ? "bg-orange-500" :
                      "bg-yellow-500"
                    }`}></span>
                    {t('fees.daysOverdueBadge', { days: item.days })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleCollectFee(item)} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all">
                      {t('pages.collect')}
                    </button>
                    <button onClick={() => handleSendReminder(item)} className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all">
                      <Bell size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Load more */}
        <div ref={loaderRef} className="flex justify-center py-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
          {isLoadingMore && <Spinner size="sm" />}
          {!hasMore && visibleDefaulters.length < filteredDefaulters.length && (
            <span className="text-gray-400 dark:text-zinc-500 text-xs">{t('pages.allDefaultersLoaded')}</span>
          )}
        </div>
      </MobileResponsive>
    </div>
    </ErrorBoundary>
  );
}
