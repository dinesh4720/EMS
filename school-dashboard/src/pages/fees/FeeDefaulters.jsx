import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Spinner } from "@heroui/react";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { Search, X, Download, Bell, MoreVertical, CreditCard } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

const ITEMS_PER_LOAD = 10;

export default function FeeDefaulters() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [defaulters, setDefaulters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  useEffect(() => {
    const fetchDefaulters = async () => {
      try {
        setLoading(true);
        const DEFAULTER_LIMIT = 500;
        const response = await feesApi.getDefaulters({ limit: DEFAULTER_LIMIT });
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
            dueDate: d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString('en-IN') : '—',
            days: daysOverdue > 0 ? daysOverdue : 0,
            phone: student.parentPhone || student.phone || '',
          };
        });
        setDefaulters(mapped);
      } catch (error) {
        console.error('Error fetching defaulters:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaulters();
  }, []);

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

  const visibleDefaulters = useMemo(() => filteredDefaulters.slice(0, visibleCount), [filteredDefaulters, visibleCount]);
  const hasMore = visibleCount < filteredDefaulters.length;

  useEffect(() => { setVisibleCount(ITEMS_PER_LOAD); }, [search, filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const totalPending = filteredDefaulters.reduce((sum, d) => sum + d.pending, 0);

  const [, setSendingReminders] = useState(false);

  const handleSendReminders = async () => {
    if (filteredDefaulters.length === 0) return;
    setSendingReminders(true);
    const loadingToast = toast.loading(`Sending reminders to ${filteredDefaulters.length} defaulters...`);
    try {
      const results = await Promise.allSettled(
        filteredDefaulters.map(d =>
          studentsApi.sendReminder(d.id, {
            type: 'fee',
            message: `Fee payment of \u20B9${d.pending?.toLocaleString()} is pending. Please pay at your earliest convenience.`,
          })
        )
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        toast.success(`Reminders sent: ${succeeded} succeeded, ${failed} failed`, { id: loadingToast });
      } else {
        toast.success(`Reminders sent to ${succeeded} defaulters`, { id: loadingToast });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send reminders', { id: loadingToast });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleExportDefaulters = () => {
    const headers = [t('common.student', 'Student'), t('common.class', 'Class'), t('common.rollNo', 'Roll No'), t('fees.pendingAmount', 'Pending Amount'), t('fees.dueDate', 'Due Date'), t('fees.daysOverdue', 'Days Overdue'), t('common.phone', 'Phone')];
    const rows = filteredDefaulters.map(d => [d.student, d.class, d.rollNo, d.pending, d.dueDate, d.days, d.phone || 'N/A']);
    const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCSV).join(','), ...rows.map(row => row.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-defaulters-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSendReminder = async (defaulter) => {
    const loadingToast = toast.loading(`Sending reminder to ${defaulter.student}...`);
    try {
      await studentsApi.sendReminder(defaulter.id, {
        type: 'fee',
        message: `Fee payment of \u20B9${defaulter.pending?.toLocaleString()} is pending for ${defaulter.student}. Please pay at your earliest convenience.`,
      });
      toast.success(`Reminder sent to ${defaulter.student}`, { id: loadingToast });
    } catch (error) {
      toast.error(error.message || `Failed to send reminder to ${defaulter.student}`, { id: loadingToast });
    }
  };

  const handleCollectFee = (defaulter) => {
    navigate('/fees', { state: { selectedStudentId: defaulter.id } });
  };

  if (loading) {
    return <TablePageSkeleton kpiCards={3} columns={6} rows={8} />;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.totalDefaulters')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{filteredDefaulters.length}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.totalPending')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('fees.thirtyDaysOverdue', '30+ Days Overdue')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{defaulters.filter((d) => d.days >= 30).length}</p>
        </div>
      </div>

      {/* Truncation Warning */}
      {isTruncated && (
        <div className="flex items-center gap-2 px-4 py-2.5 -mx-6 px-6 mb-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
          <span className="font-medium">{t('fees.showingLimitedDefaulters', { limit: 500, total: totalCount.toLocaleString(), defaultValue: `Showing 500 of ${totalCount.toLocaleString()} total defaulters.` })}</span>
          <span>Use filters to narrow results.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 dark:border-zinc-800 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all">
            <Search size={16} className="text-gray-400 dark:text-zinc-500" />
            <input
              type="search"
              placeholder={t('pages.searchStudent')}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                <X size={14} className="text-gray-400 dark:text-zinc-500" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <Select
            size="sm"
            placeholder={t('pages.filterByDays')}
            selectedKeys={new Set([filter])}
            onSelectionChange={(keys) => setFilter(Array.from(keys)[0])}
            className="w-36"
            classNames={{ trigger: "h-9 bg-white border-gray-200 hover:border-gray-300" }}
          >
            <SelectItem key="all">{t('pages.all1')}</SelectItem>
            <SelectItem key="7">7+ Days</SelectItem>
            <SelectItem key="15">15+ Days</SelectItem>
            <SelectItem key="30">30+ Days</SelectItem>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleSendReminders} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all">
            <Bell size={14} />
            <span>{t('pages.remindAll')}</span>
          </button>
          <button onClick={handleExportDefaulters} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all">
            <Download size={14} />
            <span>{t('pages.export1')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden -mx-6 sm:mx-0">
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
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Class {item.class}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900 dark:text-zinc-100">₹{item.pending?.toLocaleString() || 0}</span>
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
                    {item.days} days
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleCollectFee(item)} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all">
                      Collect
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
          {!hasMore && filteredDefaulters.length > ITEMS_PER_LOAD && (
            <span className="text-gray-400 dark:text-zinc-500 text-xs">{t('pages.allDefaultersLoaded')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
