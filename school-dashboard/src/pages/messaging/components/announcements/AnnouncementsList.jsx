import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Megaphone,
  Filter,
  X,
  CheckCircle,
  Clock,
  FileText,
  Paperclip,
} from 'lucide-react';
import { announcementsApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { getDateLocale } from '../../../../i18n/index';
import { useTranslation } from 'react-i18next';
import { SkeletonList } from '../../../../components/ui/Skeleton';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';
import logger from '../../../../utils/logger';

const PAGE_SIZE = 20;

const STATUS_TONE = {
  sent: { tone: 'ok', label: 'Sent', icon: CheckCircle },
  scheduled: { tone: 'warn', label: 'Scheduled', icon: Clock },
  draft: { tone: 'info', label: 'Draft', icon: FileText },
};

const AUDIENCE_LABELS = {
  all: 'All',
  staff: 'Staff',
  students: 'Students',
  parents: 'Parents',
  class: 'Class',
};

function getAudienceChips(recipients) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return [{ key: 'none', label: 'No audience', tone: 'info' }];
  }
  if (recipients.some((r) => r.type === 'all')) {
    return [{ key: 'all', label: 'Whole School', tone: 'accent' }];
  }
  return recipients.map((r, i) => {
    const baseLabel = AUDIENCE_LABELS[r.type] || r.type;
    const label = r.classLabel || r.className || (r.type === 'class' && r.classId ? `Class ${r.classId}` : baseLabel);
    return { key: `${r.type}-${i}`, label, tone: 'info' };
  });
}

export default function AnnouncementsList({ onView, onEdit, onRefresh }) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const mountedRef = useRef(true);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    return window.localStorage.getItem('announcements:statusFilter') || 'all';
  });
  const [audienceFilter, setAudienceFilter] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    return window.localStorage.getItem('announcements:audienceFilter') || 'all';
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadAnnouncements = useCallback(async (pageToLoad = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementsApi.getAll({
        page: pageToLoad,
        limit: PAGE_SIZE,
      });
      if (mountedRef.current) {
        setAnnouncements(response.announcements || response || []);
        const nextTotal = Number(response.total ?? 0);
        const nextTotalPages = Number(response.totalPages ?? (nextTotal ? Math.ceil(nextTotal / PAGE_SIZE) : 1));
        setTotal(nextTotal);
        setTotalPages(Math.max(1, nextTotalPages));
      }
    } catch (err) {
      logger.error('Error loading announcements:', err);
      if (mountedRef.current) {
        const errorMsg = err.message || 'Unknown error';
        setError(errorMsg);
        toast.error(`Failed to load announcements: ${errorMsg}`);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    mountedRef.current = true;
    loadAnnouncements(1);
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('announcements:statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('announcements:audienceFilter', audienceFilter);
  }, [audienceFilter]);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, audienceFilter, searchQuery]);

  // Clamp page if totalPages shrinks after data refresh.
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handlePageChange = (next) => {
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (clamped === page) return;
    setPage(clamped);
    loadAnnouncements(clamped);
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q
        || a.title?.toLowerCase().includes(q)
        || a.content?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchesAudience = audienceFilter === 'all'
        || a.recipients?.some((r) => r.type === audienceFilter);
      return matchesSearch && matchesStatus && matchesAudience;
    });
  }, [announcements, searchQuery, statusFilter, audienceFilter]);

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Announcement',
      message: t('confirm.deleteAnnouncement'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await announcementsApi.delete(id);
          toast.success(t('toast.success.announcementDeleted'));
          loadAnnouncements();
          onRefresh?.();
        } catch (err) {
          logger.error('Error deleting announcement:', err);
          toast.error(t('toast.error.failedToDeleteAnnouncement'));
        }
      },
    });
  };

  const handleDuplicate = async (announcement) => {
    try {
      await announcementsApi.create({
        title: `${announcement.title} (Copy)`,
        content: announcement.content,
        recipients: announcement.recipients?.length ? announcement.recipients : [{ type: 'all' }],
        channels: announcement.channels?.length ? announcement.channels : ['inapp'],
        status: 'draft',
      });
      toast.success(t('toast.success.announcementDuplicated'));
      loadAnnouncements();
      onRefresh?.();
    } catch (err) {
      logger.error('Error duplicating announcement:', err);
      toast.error(t('toast.error.failedToDuplicateAnnouncement'));
    }
  };

  const handleResend = async (id) => {
    try {
      await announcementsApi.resend(id);
      toast.success(t('toast.success.announcementResentSuccessfully'));
      loadAnnouncements();
      onRefresh?.();
    } catch (err) {
      logger.error('Error resending announcement:', err);
      toast.error(t('toast.error.failedToResendAnnouncement'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(getDateLocale(), {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setAudienceFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || audienceFilter !== 'all' || !!searchQuery;

  if (loading) return <SkeletonList items={5} avatar subtitle />;

  if (error && announcements.length === 0) {
    return (
      <div className="col gap-3" style={{ alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
        <div className="subtle" style={{ fontSize: 13 }}>
          {t('pages.failedToLoadAnnouncements')}
        </div>
        <div className="faint" style={{ fontSize: 12 }}>{error}</div>
        <button type="button" className="btn btn--accent btn--sm" onClick={loadAnnouncements}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="col gap-3" style={{ width: '100%' }}>
      {/* Toolbar: search + filters */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div
          className="row gap-2"
          style={{
            flex: '1 1 240px',
            minWidth: 200,
            padding: '6px 10px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <Search size={14} className="subtle" aria-hidden />
          <input
            type="text"
            placeholder={t('pages.searchAnnouncements')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search announcements"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--fg)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="iconbtn"
              aria-label="Clear search"
              style={{ width: 20, height: 20 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="seg" role="tablist" aria-label="Filter by status">
          {['all', 'draft', 'scheduled', 'sent'].map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={statusFilter === key}
              className={`seg__btn ${statusFilter === key ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <div className="seg" role="tablist" aria-label="Filter by audience">
          {[
            { key: 'all', label: 'Any' },
            { key: 'parents', label: 'Parents' },
            { key: 'staff', label: 'Staff' },
            { key: 'students', label: 'Students' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={audienceFilter === opt.key}
              className={`seg__btn ${audienceFilter === opt.key ? 'is-active' : ''}`}
              onClick={() => setAudienceFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={clearFilters}
            style={{ color: 'var(--fg-muted)' }}
          >
            <X size={12} aria-hidden /> Clear
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="row gap-2 subtle" style={{ fontSize: 11, padding: '0 4px' }}>
        <Filter size={11} aria-hidden />
        <span className="mono tnum">{filteredAnnouncements.length}</span>
        <span>of</span>
        <span className="mono tnum">{announcements.length}</span>
        <span>announcements{hasActiveFilters ? ' (filtered)' : ''}</span>
        {total > 0 && (
          <>
            <span>·</span>
            <span className="mono tnum">{total.toLocaleString()}</span>
            <span>total</span>
          </>
        )}
      </div>

      {/* Rows */}
      <div
        role="list"
        aria-label={t('aria.misc.announcements')}
        className="announce-list"
      >
        {filteredAnnouncements.length === 0 && announcements.length > 0 && (
          <div className="col gap-2" style={{ alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
            <Search size={28} className="faint" aria-hidden />
            <div style={{ fontSize: 13, fontWeight: 520 }}>{t('pages.noMatchingAnnouncements')}</div>
            <div className="subtle" style={{ fontSize: 12 }}>{t('pages.tryAdjustingYourFilters')}</div>
            <button type="button" className="btn btn--sm" onClick={clearFilters}>
              <X size={12} aria-hidden /> Clear filters
            </button>
          </div>
        )}

        {announcements.length === 0 && (
          <div className="col gap-2" style={{ alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
            <Megaphone size={32} className="faint" aria-hidden />
            <div style={{ fontSize: 13, fontWeight: 520 }}>{t('pages.noAnnouncementsYet')}</div>
            <div className="subtle" style={{ fontSize: 12, maxWidth: 320 }}>
              Create your first announcement to start communicating with your school community.
            </div>
          </div>
        )}

        {filteredAnnouncements.map((announcement) => {
          const cfg = STATUS_TONE[announcement.status] || STATUS_TONE.draft;
          const StatusIcon = cfg.icon;
          const audienceChips = getAudienceChips(announcement.recipients);
          const channels = announcement.channels || [];
          const attachmentCount = announcement.attachments?.length || 0;

          return (
            <div
              key={announcement._id}
              role="listitem"
              className="stafflist__row announce-list__row"
              onClick={() => onView(announcement)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onView(announcement);
                }
              }}
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="col" style={{ flex: 1, minWidth: 0, gap: 4, alignItems: 'flex-start' }}>
                <div className="row gap-2" style={{ width: '100%', minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 520,
                      fontSize: 13,
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {announcement.title || 'Untitled announcement'}
                  </span>
                  <span className={`status status--${cfg.tone}`} style={{ flexShrink: 0 }}>
                    <StatusIcon size={10} aria-hidden />
                    {cfg.label}
                  </span>
                </div>

                <div
                  className="subtle"
                  style={{
                    fontSize: 12,
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {announcement.content || ''}
                </div>

                <div className="row gap-2" style={{ flexWrap: 'wrap', width: '100%' }}>
                  {audienceChips.slice(0, 4).map((chip) => (
                    <span key={chip.key} className={`chip chip--${chip.tone}`}>
                      {chip.label}
                    </span>
                  ))}
                  {audienceChips.length > 4 && (
                    <span className="chip">+{audienceChips.length - 4}</span>
                  )}
                  {channels.length > 0 && (
                    <span className="chip mono tnum" title={channels.join(', ')}>
                      {channels.map((c) => c.toUpperCase()).join(' · ')}
                    </span>
                  )}
                  {attachmentCount > 0 && (
                    <span className="chip">
                      <Paperclip size={10} aria-hidden /> {attachmentCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="col gap-1" style={{ alignItems: 'flex-end', flexShrink: 0, minWidth: 0 }}>
                <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                  {formatDate(announcement.createdAt)}
                </span>
                {announcement.scheduledFor && (
                  <span className="chip chip--warn" title="Scheduled for">
                    <Clock size={10} aria-hidden /> {formatDate(announcement.scheduledFor)}
                  </span>
                )}
                {announcement.status === 'sent' && announcement.deliveredCount != null && (
                  <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                    {announcement.deliveredCount}/{announcement.recipientCount || announcement.deliveredCount} delivered
                  </span>
                )}
              </div>

              <div
                className="row gap-1"
                style={{ flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content="View analytics" placement="top">
                  <button
                    type="button"
                    className="iconbtn"
                    style={{ width: 28, height: 28 }}
                    onClick={() => onView(announcement)}
                    aria-label="View analytics"
                  >
                    <Eye size={14} />
                  </button>
                </Tooltip>
                {announcement.status === 'draft' && (
                  <Tooltip content="Edit" placement="top">
                    <button
                      type="button"
                      className="iconbtn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => onEdit(announcement)}
                      aria-label="Edit"
                    >
                      <Edit size={14} />
                    </button>
                  </Tooltip>
                )}
                {announcement.status === 'sent' && (
                  <Tooltip content="Resend" placement="top">
                    <button
                      type="button"
                      className="iconbtn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => handleResend(announcement._id)}
                      aria-label="Resend"
                    >
                      <Send size={14} />
                    </button>
                  </Tooltip>
                )}
                <Dropdown>
                  <DropdownTrigger>
                    <button
                      type="button"
                      className="iconbtn"
                      style={{ width: 28, height: 28 }}
                      aria-label="More actions"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Announcement actions">
                    <DropdownItem
                      key="view"
                      startContent={<Eye size={14} />}
                      onPress={() => onView(announcement)}
                    >
                      View analytics
                    </DropdownItem>
                    {announcement.status === 'draft' ? (
                      <DropdownItem
                        key="edit"
                        startContent={<Edit size={14} />}
                        onPress={() => onEdit(announcement)}
                      >
                        Edit
                      </DropdownItem>
                    ) : null}
                    <DropdownItem
                      key="duplicate"
                      startContent={<Copy size={14} />}
                      onPress={() => handleDuplicate(announcement)}
                    >
                      Duplicate
                    </DropdownItem>
                    {announcement.status === 'sent' ? (
                      <DropdownItem
                        key="resend"
                        startContent={<Send size={14} />}
                        onPress={() => handleResend(announcement._id)}
                      >
                        Resend
                      </DropdownItem>
                    ) : null}
                    <DropdownItem
                      key="delete"
                      startContent={<Trash2 size={14} />}
                      className="text-danger"
                      color="danger"
                      onPress={() => handleDelete(announcement._id)}
                    >
                      Delete
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 4px 0',
            borderTop: '1px solid var(--border)',
            marginTop: 4,
          }}
        >
          <span className="subtle" style={{ fontSize: 11 }}>
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </span>
          <div className="row gap-2">
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              disabled={page <= 1 || loading}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} aria-hidden />
              Previous
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              disabled={page >= totalPages || loading}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
