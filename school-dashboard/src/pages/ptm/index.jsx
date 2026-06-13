import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Calendar, Clock, Plus, Eye, Trash2, Home, MapPin, BookOpen,
  CheckCircle, XCircle, AlertCircle, Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ptmApi, classesApi, staffApi } from '../../services/api';
import {
  PageLayout, MinimalButton, Breadcrumbs, Card, Chip, Button, IconButton,
  StatCard, EmptyState, ErrorState, ConfirmDialog, Modal, Bone, SkeletonCard,
} from '../../components/ui';
import { formatShortDate } from '../../utils/dateFormatter';
import CreatePTMSessionModal from './CreatePTMSessionModal';
import PTMSessionDetailModal from './PTMSessionDetailModal';

const STATUS_FILTERS = ['all', 'scheduled', 'ongoing', 'completed', 'cancelled'];

const STATUS_CHIP_COLOR = {
  scheduled: 'info',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const PTMPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessRes, classRes, staffRes] = await Promise.all([
        ptmApi.getAll(),
        classesApi.getAll(),
        staffApi.getAll(),
      ]);
      setSessions(sessRes?.data || sessRes || []);
      setClasses(classRes?.classes || classRes || []);
      setStaff(staffRes?.staff || staffRes || []);
    } catch (err) {
      setError(err);
      toast.error('Failed to load PTM sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(
    () => ({
      total: sessions.length,
      scheduled: sessions.filter((session) => session.status === 'scheduled').length,
      completed: sessions.filter((session) => session.status === 'completed').length,
      cancelled: sessions.filter((session) => session.status === 'cancelled').length,
    }),
    [sessions]
  );

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? sessions
        : sessions.filter((session) => session.status === statusFilter),
    [sessions, statusFilter]
  );

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteLoading(true);
    try {
      await ptmApi.delete(deleteModal.id);
      toast.success('PTM session cancelled');
      setDeleteModal({ isOpen: false, id: null, title: '' });
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel session');
    } finally {
      setDeleteLoading(false);
    }
  };

  const header = {
    title: t('ptm.pageTitle', 'Parent-Teacher Meetings'),
    description: t('ptm.pageDescription', 'Schedule and manage PTM sessions'),
  };

  const actions = (
    <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
      New PTM Session
    </MinimalButton>
  );

  const renderSessionCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((session) => {
        const cls = session.classId;
        const teacher = session.staffId;
        const slotsCount = (session.slots || []).filter((slot) => slot.status !== 'cancelled').length;
        return (
          <Card key={session._id} padding="sm" elevation="raised" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-fg line-clamp-1">
                {session.title}
              </h3>
              <Chip size="sm" color={STATUS_CHIP_COLOR[session.status] || 'neutral'}>
                {session.status}
              </Chip>
            </div>

            {session.description && (
              <p className="text-sm text-fg-muted line-clamp-2">
                {session.description}
              </p>
            )}

            <div className="space-y-1.5 text-sm text-fg-muted">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-fg-muted" aria-hidden="true" />
                {formatShortDate(session.sessionDate)}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-fg-muted" aria-hidden="true" />
                {session.startTime} – {session.endTime}
                <span className="text-xs text-fg-muted">({session.slotDuration} min slots)</span>
              </div>
              {session.venue && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-fg-muted" aria-hidden="true" />
                  {session.venue}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users size={14} className="text-fg-muted" aria-hidden="true" />
                {slotsCount} slot{slotsCount === 1 ? '' : 's'} booked
              </div>
            </div>

            <div className="pt-2 border-t border-divider flex items-center justify-between gap-2">
              <div className="text-xs text-fg-muted min-w-0 truncate">
                {cls && (
                  <div className="truncate">
                    {cls.name}
                    {cls.section ? ` (${cls.section})` : ''}
                  </div>
                )}
                {teacher && <div className="text-fg-muted truncate">{teacher.name}</div>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="View session details"
                  icon={<Eye size={15} />}
                  onClick={() => setDetailId(session._id)}
                />
                <IconButton
                  size="sm"
                  variant="danger"
                  aria-label="Cancel session"
                  icon={<Trash2 size={15} />}
                  onClick={() =>
                    setDeleteModal({ isOpen: true, id: session._id, title: session.title })
                  }
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <div role="status" aria-busy="true" aria-label="Loading PTM sessions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`stat-${i}`} className="bg-surface rounded-lg border border-border-token p-4 space-y-2">
                <Bone className="h-9 w-9 rounded-lg" />
                <Bone className="h-6 w-16" />
              </div>
            ))}
          </div>
          <div className="h-7 w-64 rounded bg-surface-2 animate-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`card-${i}`} bodyLines={2} />
            ))}
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <ErrorState
          title="Couldn't load PTM sessions"
          error={error}
          onRetry={fetchData}
        />
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} icon={Users} color="gray" headingLevel="h2" />
          <StatCard label="Scheduled" value={stats.scheduled} icon={Activity} color="blue" headingLevel="h2" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="green" headingLevel="h2" />
          <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="red" headingLevel="h2" />
        </div>

        <div className="seg" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={statusFilter === status}
              className={`seg__btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]/40 focus-visible:ring-offset-2${statusFilter === status ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={statusFilter === 'all' ? 'No PTM sessions yet' : `No ${statusFilter} sessions`}
            description={
              statusFilter === 'all'
                ? 'Schedule your first parent-teacher meeting to get started.'
                : 'Try a different status filter or schedule a new session.'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setCreateOpen(true)}
              >
                Create First Session
              </Button>
            }
          />
        ) : (
          renderSessionCards()
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs
          size="sm"
          items={[
            { icon: <Home size={14} />, label: t('pages.home', 'Home'), onClick: () => navigate('/') },
            { label: t('ptm.pageTitle', 'Parent-Teacher Meetings') },
          ]}
        />
      </div>

      <PageLayout header={header} actions={actions} noPadding>
        <div className="min-h-[500px] p-6">{renderBody()}</div>
      </PageLayout>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        size="2xl"
        scrollBehavior="inside"
        title="New PTM Session"
        description="Schedule a parent-teacher meeting"
      >
        <CreatePTMSessionModal
          classes={classes}
          staff={staff}
          existingSessions={sessions}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            fetchData();
          }}
        />
      </Modal>

      <PTMSessionDetailModal
        sessionId={detailId}
        onClose={() => setDetailId(null)}
        onDataChanged={fetchData}
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
        onConfirm={handleConfirmDelete}
        title="Cancel PTM Session"
        message={
          deleteModal.title
            ? `Cancel "${deleteModal.title}"? Booked slots will be affected. This action cannot be undone.`
            : 'Cancel this PTM session?'
        }
        confirmText="Cancel Session"
        cancelText="Keep"
        variant="danger"
        isLoading={deleteLoading}
      >
        <p className="text-xs text-fg-muted flex items-center gap-1.5">
          <AlertCircle size={14} aria-hidden="true" /> Slots already booked will be cancelled.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default PTMPage;
