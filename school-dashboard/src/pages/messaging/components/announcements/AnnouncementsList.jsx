import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from '@heroui/react';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Send,
  MoreVertical,
  Calendar,
  Megaphone,
  Sparkles,
  Filter,
  X,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { announcementsApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { getDateLocale } from '../../../../i18n/index';
import { useTranslation } from 'react-i18next';
import SkeletonList from '../../../../components/skeletons/SkeletonList';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';


export default function AnnouncementsList({
  onView, onEdit, onRefresh }) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await announcementsApi.getAll(params);
      // Backend returns { announcements: [], ... }
      setAnnouncements(response.announcements || response || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      const errorMsg = error.message || 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to load announcements: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
      const matchesChannel = channelFilter === 'all' ||
        announcement.channels?.includes(channelFilter);

      let matchesDate = true;
      const announcementDate = new Date(announcement.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      if (dateFilter === 'today') {
        matchesDate = announcementDate >= today;
      } else if (dateFilter === 'week') {
        matchesDate = announcementDate >= thisWeek;
      } else if (dateFilter === 'month') {
        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() - 1);
        matchesDate = announcementDate >= thisMonth;
      }

      return matchesSearch && matchesStatus && matchesChannel && matchesDate;
    });
  }, [announcements, searchQuery, statusFilter, channelFilter, dateFilter]);

  const handleDelete = (announcementId) => {
    showConfirm({
      title: 'Delete Announcement',
      message: t('confirm.deleteAnnouncement'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await announcementsApi.delete(announcementId);
          toast.success(t('toast.success.announcementDeleted'));
          loadAnnouncements();
          onRefresh?.();
        } catch (error) {
          console.error('Error deleting announcement:', error);
          toast.error(t('toast.error.failedToDeleteAnnouncement'));
        }
      },
    });
  };

  const handleDuplicate = async (announcement) => {
    try {
      const duplicate = {
        title: `${announcement.title} (Copy)`,
        content: announcement.content,
        recipients: announcement.recipients,
        channels: announcement.channels,
        status: 'draft',
      };

      await announcementsApi.create(duplicate);
      toast.success(t('toast.success.announcementDuplicated'));
      loadAnnouncements();
      onRefresh?.();
    } catch (error) {
      console.error('Error duplicating announcement:', error);
      toast.error(t('toast.error.failedToDuplicateAnnouncement'));
    }
  };

  const handleResend = async (announcementId) => {
    try {
      await announcementsApi.resend(announcementId);
      toast.success(t('toast.success.announcementResentSuccessfully'));
      loadAnnouncements();
      onRefresh?.();
    } catch (error) {
      console.error('Error resending announcement:', error);
      toast.error(t('toast.error.failedToResendAnnouncement'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(getDateLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'sent':
        return {
          color: 'success',
          icon: CheckCircle,
          label: 'Sent',
          gradient: 'from-emerald-500 to-teal-600',
          bgLight: 'bg-emerald-50',
          bgDark: 'dark:bg-emerald-500/10',
          textLight: 'text-emerald-700',
          textDark: 'dark:text-emerald-400',
        };
      case 'scheduled':
        return {
          color: 'warning',
          icon: Clock,
          label: 'Scheduled',
          gradient: 'from-amber-500 to-orange-600',
          bgLight: 'bg-amber-50',
          bgDark: 'dark:bg-amber-500/10',
          textLight: 'text-amber-700',
          textDark: 'dark:text-amber-400',
        };
      case 'draft':
      default:
        return {
          color: 'default',
          icon: FileText,
          label: 'Draft',
          gradient: 'from-gray-400 to-gray-500',
          bgLight: 'bg-gray-100',
          bgDark: 'dark:bg-zinc-700',
          textLight: 'text-gray-600',
          textDark: 'dark:text-zinc-400',
        };
    }
  };

  const getRecipientsLabel = (recipients) => {
    if (recipients?.some(r => r.type === 'all')) return 'Whole School';
    return recipients?.map(r => r.type).join(', ') || 'None';
  };

  const getChannelsLabel = (channels) => {
    if (!channels || channels.length === 0) return 'None';
    return channels.join(', ').toUpperCase();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setChannelFilter('all');
    setDateFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || channelFilter !== 'all' || dateFilter !== 'all' || searchQuery;

  // Modern pill-style filter button component
  const FilterPill = ({ label, icon: Icon, active, onClick, options, value, onChange }) => (
    <Dropdown>
      <DropdownTrigger>
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${active
              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-transparent'
            }`}
        >
          {Icon && <Icon size={14} />}
          <span>{label}</span>
          <svg className={`w-4 h-4 transition-transform ${active ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownTrigger>
      <DropdownMenu
        selectedKeys={[value]}
        onSelectionChange={(keys) => onChange(Array.from(keys)[0])}
        classNames={{
          base: "min-w-[180px]",
          list: "py-1",
        }}
      >
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            classNames={{
              base: `px-3 py-2 ${value === option.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : ''}`,
            }}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );

  if (loading) {
    return (
      <SkeletonList items={5} avatar subtitle />
    );
  }

  if (error && announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">{t('pages.failedToLoadAnnouncements')}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md text-center mt-2">{error}</p>
        </div>
        <Button
          color="primary"
          size="sm"
          onPress={() => loadAnnouncements()}
          className="mt-2 bg-gradient-to-r from-indigo-500 to-indigo-600"
          startContent={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {/* Filter Section */}
      <div className="flex flex-col gap-4">
        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Enhanced Search Input */}
          <div className="relative w-full sm:w-80">
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200
                ${searchFocused
                  ? 'bg-white dark:bg-zinc-800 border-indigo-300 dark:border-indigo-500/50 shadow-sm ring-2 ring-indigo-500/10'
                  : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'
                }`}
            >
              <Search
                size={18}
                className={`transition-colors duration-200 ${searchFocused ? 'text-indigo-500' : 'text-gray-400 dark:text-zinc-500'}`}
              />
              <input
                type="text"
                placeholder={t('pages.searchAnnouncements')}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  <X size={14} className="text-gray-400 dark:text-zinc-500" />
                </button>
              )}
            </div>
          </div>

          {/* Modern Pill-style Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterPill
              label={`Status: ${statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
              active={statusFilter !== 'all'}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'sent', label: 'Sent' },
              ]}
            />

            <FilterPill
              label={`Channel: ${channelFilter === 'all' ? 'All' : channelFilter.toUpperCase()}`}
              active={channelFilter !== 'all'}
              value={channelFilter}
              onChange={setChannelFilter}
              options={[
                { value: 'all', label: 'All Channels' },
                { value: 'inapp', label: 'In-App' },
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'whatsapp', label: 'WhatsApp' },
              ]}
            />

            <FilterPill
              label={`Date: ${dateFilter === 'all' ? 'All' : dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}`}
              icon={Calendar}
              active={dateFilter !== 'all'}
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
              ]}
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <X size={14} />
                <span>{t('pages.clear1')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
          <Filter size={12} />
          <span>
            {filteredAnnouncements.length} of {announcements.length} announcements
            {hasActiveFilters && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800">
        <Table
          aria-label={t('aria.misc.announcements')}
          removeWrapper
          classNames={{
            th: "bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider",
            tr: "hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-gray-100 dark:border-zinc-800/50 last:border-0",
            td: "py-4",
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.aNNOUNCEMENT')}</TableColumn>
            <TableColumn scope="col">{t('pages.rECIPIENTS')}</TableColumn>
            <TableColumn scope="col">{t('pages.cHANNELS')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn scope="col">{t('pages.dATE')}</TableColumn>
            <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="text-center py-16">
                <Megaphone size={48} className="mx-auto mb-4 text-gray-300 dark:text-zinc-600" />
                <p className="text-gray-500 dark:text-zinc-400 font-medium">{t('pages.noAnnouncementsFound')}</p>
                <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">{t('pages.tryAdjustingYourFilters')}</p>
              </div>
            }
          >
            {filteredAnnouncements.map((announcement, index) => {
              const statusConfig = getStatusConfig(announcement.status);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow
                  key={announcement._id}
                  className="group animate-in fade-in slide-in-from-bottom-2 duration-200"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                        {announcement.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300">
                      {getRecipientsLabel(announcement.recipients)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-600 dark:text-zinc-300 font-medium">
                      {getChannelsLabel(announcement.channels)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgLight} ${statusConfig.bgDark}`}>
                      <StatusIcon size={12} className={`${statusConfig.textLight} ${statusConfig.textDark}`} />
                      <span className={`text-xs font-medium ${statusConfig.textLight} ${statusConfig.textDark}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="text-gray-600 dark:text-zinc-300">
                        {formatDate(announcement.createdAt)}
                      </p>
                      {announcement.scheduledFor && (
                        <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          Scheduled: {formatDate(announcement.scheduledFor)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content="View Details" placement="top">
                        <button
                          onClick={() => onView(announcement)}
                          className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </Tooltip>

                      {announcement.status === 'draft' && (
                        <Tooltip content="Edit" placement="top">
                          <button
                            onClick={() => onEdit(announcement)}
                            className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                        </Tooltip>
                      )}

                      {announcement.status === 'sent' && (
                        <Tooltip content="Resend" placement="top">
                          <button
                            onClick={() => handleResend(announcement._id)}
                            className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          >
                            <Send size={16} />
                          </button>
                        </Tooltip>
                      )}

                      <Dropdown>
                        <DropdownTrigger>
                          <button className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          classNames={{
                            list: "py-1 min-w-[160px]",
                          }}
                        >
                          <DropdownItem
                            key="view"
                            startContent={<Eye size={16} className="text-gray-500 dark:text-zinc-400" />}
                            onPress={() => onView(announcement)}
                            className="hover:bg-gray-50 dark:hover:bg-zinc-700"
                          >
                            View Details
                          </DropdownItem>
                          {announcement.status === 'draft' && (
                            <DropdownItem
                              key="edit"
                              startContent={<Edit size={16} className="text-gray-500 dark:text-zinc-400" />}
                              onPress={() => onEdit(announcement)}
                              className="hover:bg-gray-50 dark:hover:bg-zinc-700"
                            >
                              Edit
                            </DropdownItem>
                          )}
                          <DropdownItem
                            key="duplicate"
                            startContent={<Copy size={16} className="text-gray-500 dark:text-zinc-400" />}
                            onPress={() => handleDuplicate(announcement)}
                            className="hover:bg-gray-50 dark:hover:bg-zinc-700"
                          >
                            Duplicate
                          </DropdownItem>
                          {announcement.status === 'sent' && (
                            <DropdownItem
                              key="resend"
                              startContent={<Send size={16} className="text-gray-500 dark:text-zinc-400" />}
                              onPress={() => handleResend(announcement._id)}
                              className="hover:bg-gray-50 dark:hover:bg-zinc-700"
                            >
                              Resend
                            </DropdownItem>
                          )}
                          <DropdownItem
                            key="delete"
                            startContent={<Trash2 size={16} className="text-red-500" />}
                            onPress={() => handleDelete(announcement._id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {filteredAnnouncements.length === 0 && !loading && announcements.length > 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
            <Search size={32} className="text-gray-400 dark:text-zinc-500" />
          </div>
          <p className="text-gray-600 dark:text-zinc-300 font-medium text-lg">{t('pages.noMatchingAnnouncements')}</p>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-2 max-w-sm mx-auto">
            We couldn't find any announcements matching your current filters. Try adjusting your search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <X size={14} />
            Clear all filters
          </button>
        </div>
      )}

      {/* Empty State - No Announcements at all */}
      {announcements.length === 0 && !loading && (
        <div className="text-center py-16 px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center">
            <Megaphone size={40} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-500" />
            <p className="text-gray-700 dark:text-zinc-200 font-semibold text-lg">{t('pages.noAnnouncementsYet')}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Create your first announcement to start communicating with your school community.
          </p>
        </div>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
