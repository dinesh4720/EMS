import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Edit, Eye, Inbox, LayoutGrid, List as ListIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ToolbarSearch from '../../components/ui/ToolbarSearch';
import { ConfirmDialog, EmptyState, ErrorState, PageShell, SkeletonTable } from '../../components/ui';
import Pagination from '../../components/common/Pagination';
import { classesApi, frontDeskApi, staffApi } from '../../services/api';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import logger from '../../utils/logger';
import AdmissionDetailModal from './AdmissionDetailModal';
import AdmissionFormModal from './AdmissionFormModal';
import AdmissionTracker from './AdmissionTracker';
import {
  STAGE_OPTIONS,
  defaultStatusForStage,
  getStatusMeta,
  stageOfStatus,
} from './admissionsConstants';

// Page size for the list view. The board view loads the full filtered set
// (limit=0) because a kanban needs every card to group it by stage.
const PAGE_SIZE = 25;

const extractList = (response) =>
  Array.isArray(response) ? response : response?.data || [];

const FILTERS = [
  { key: 'all', label: 'All' },
  ...STAGE_OPTIONS.map((s) => ({ key: s.key, label: s.label, tone: s.tone })),
];

const TONE_CLASS = {
  ok: 'status--ok',
  warn: 'status--warn',
  danger: 'status--danger',
  info: 'status--info',
  neutral: '',
};

const COLOR_TO_TONE = {
  success: 'ok',
  warning: 'warn',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

const formatApplicationId = (a) => {
  if (a.applicationId) return a.applicationId;
  const tail = String(a._id || '').slice(-6).toUpperCase();
  return tail ? `ADM-${tail}` : 'ADM-—';
};

const AdmissionsList = forwardRef(function AdmissionsList({ onSave }, ref) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const [admissions, setAdmissions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [statusCounts, setStatusCounts] = useState(null);
  const [staff, setStaff] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [selectedForDetail, setSelectedForDetail] = useState(null);

  const [view, setView] = useState('list'); // 'list' | 'board'
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // Debounced so typing doesn't fire a request (and a page reset) per keystroke.
  const debouncedSearch = useDebounce(search, 300);

  // Search / stage filtering and pagination are all done server-side now, so
  // the page only ever holds the records it needs to render.
  const buildParams = useCallback(() => {
    const params = {};
    const term = debouncedSearch.trim();
    if (term) params.search = term;
    if (stageFilter !== 'all') params.stage = stageFilter;
    if (view === 'list') {
      params.page = page;
      params.limit = PAGE_SIZE;
    } else {
      params.limit = 0; // board view: every matching card
    }
    return params;
  }, [debouncedSearch, stageFilter, view, page]);

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await frontDeskApi.getAdmissions(buildParams());
      const envelope = response && !Array.isArray(response) ? response : null;
      setAdmissions(extractList(response));
      setPagination(envelope?.pagination ?? null);
      setStatusCounts(envelope?.statusCounts ?? null);
    } catch (err) {
      logger.error('Failed to load admissions:', err);
      setError(err);
      toast.error(t('toast.error.failedToLoadAdmissions'));
    } finally {
      setLoading(false);
    }
  }, [buildParams, t]);

  const loadSupportingData = useCallback(async () => {
    try {
      const [staffResponse, classesResponse] = await Promise.all([
        staffApi.getAll(),
        classesApi.getAll(),
      ]);
      const staffList = extractList(staffResponse);
      setStaff(staffList.filter((s) => s.role === 'Teacher'));

      if (Array.isArray(classesResponse)) {
        const uniqueNames = [
          ...new Set(classesResponse.map((c) => c.name?.replace('Class ', ''))),
        ]
          .filter(Boolean)
          .sort();
        setAvailableClasses(uniqueNames);
      }
    } catch (err) {
      logger.error('Failed to load supporting admission data:', err);
    }
  }, []);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  useEffect(() => {
    loadSupportingData();
  }, [loadSupportingData]);

  // If a delete empties the current page, fall back onto the new last page.
  useEffect(() => {
    if (view === 'list' && pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [view, pagination, page]);

  const openCreateModal = useCallback(() => {
    setEditingAdmission(null);
    setFormModalOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openModal: openCreateModal }), [openCreateModal]);

  const handleEdit = (row) => {
    setEditingAdmission(row);
    setFormModalOpen(true);
  };

  const handleView = (row) => {
    setSelectedForDetail(row);
    setDetailModalOpen(true);
  };

  const handleDelete = (row) => {
    showConfirm({
      title: 'Delete Admission',
      message: t('confirm.deleteAdmission'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteAdmission(row._id);
          toast.success(t('toast.success.admissionInquiryDeleted'));
          loadAdmissions();
          onSave?.();
        } catch (err) {
          logger.error('Failed to delete admission:', err);
          toast.error(t('toast.error.failedToDeleteAdmissionInquiry'));
        }
      },
    });
  };

  const handleSaved = () => {
    loadAdmissions();
    onSave?.();
  };

  // Reset to the first page whenever the active filter set changes so the user
  // never lands on an out-of-range page.
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStageFilter = useCallback((key) => {
    setStageFilter(key);
    setPage(1);
  }, []);

  const handleViewChange = useCallback((nextView) => {
    setView(nextView);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setStageFilter('all');
    setSearch('');
    setPage(1);
  }, []);

  // Drag-to-stage handler — validates the destination stage and calls the
  // existing update endpoint. The optimistic update keeps the board snappy.
  const handleStageChange = useCallback(
    async (admissionId, nextStageKey) => {
      const target = admissions.find((a) => a._id === admissionId);
      if (!target) return;
      const currentStage = stageOfStatus(target.status);
      if (currentStage === nextStageKey) return;

      const nextStatus = defaultStatusForStage(nextStageKey);
      // Optimistic update
      setAdmissions((prev) =>
        prev.map((a) => (a._id === admissionId ? { ...a, status: nextStatus } : a))
      );
      try {
        await frontDeskApi.updateAdmission(admissionId, {
          ...target,
          assignedTeacher:
            target.assignedTeacher?._id || target.assignedTeacher || null,
          status: nextStatus,
        });
        toast.success(`Moved to ${STAGE_OPTIONS.find((s) => s.key === nextStageKey)?.label}`);
        onSave?.();
      } catch (err) {
        logger.error('Failed to update admission stage:', err);
        toast.error('Could not move admission. Reverted.');
        // Revert
        setAdmissions((prev) =>
          prev.map((a) =>
            a._id === admissionId ? { ...a, status: target.status } : a
          )
        );
      }
    },
    [admissions, onSave]
  );

  // The server has already applied the search + stage filters for this page.
  const visible = admissions;

  // Stage chip counts come from the server's whole-school status breakdown so
  // they stay accurate regardless of the current page or active search. Fall
  // back to the loaded rows if the envelope is unavailable (e.g. legacy shape).
  const stageCounts = useMemo(() => {
    const counts = { all: 0 };
    STAGE_OPTIONS.forEach((s) => { counts[s.key] = 0; });
    if (statusCounts) {
      counts.all = statusCounts.all || 0;
      Object.entries(statusCounts).forEach(([status, n]) => {
        if (status === 'all') return;
        const key = stageOfStatus(status);
        counts[key] = (counts[key] || 0) + n;
      });
    } else {
      counts.all = admissions.length;
      admissions.forEach((a) => {
        const key = stageOfStatus(a.status);
        counts[key] = (counts[key] || 0) + 1;
      });
    }
    return counts;
  }, [statusCounts, admissions]);

  const totalCount = pagination?.totalItems ?? visible.length;
  const stageLabel = STAGE_OPTIONS.find((s) => s.key === stageFilter)?.label;

  const toolbar = (
    <div className="toolbar">
      <ToolbarSearch
        value={search}
        onChange={handleSearchChange}
        urlParam="q"
        placeholder="Search by name, parent, phone, class…"
        ariaLabel="Search admissions"
        style={{ flex: 1, maxWidth: 360 }}
      />

      <div className="seg" role="tablist" aria-label="Filter by stage">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={stageFilter === f.key}
            className={`seg__btn ${stageFilter === f.key ? 'is-active' : ''}`}
            onClick={() => handleStageFilter(f.key)}
          >
            {f.label}
            <span className="mono tnum" style={{ marginLeft: 6, color: 'var(--fg-faint)' }}>
              {stageCounts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {(stageFilter !== 'all' || search) && (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={clearFilters}
          style={{ color: 'var(--fg-muted)' }}
          aria-label="Clear filters"
        >
          Clear
        </button>
      )}
    </div>
  );

  return (
    <PageShell
      title="Admissions"
      description={`${totalCount} ${totalCount === 1 ? 'enquiry' : 'enquiries'}${stageFilter !== 'all' ? ` · ${stageLabel}` : ''}`}
      actions={
        <div className="row gap-2">
          <div className="seg" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'list'}
              className={`seg__btn ${view === 'list' ? 'is-active' : ''}`}
              onClick={() => handleViewChange('list')}
            >
              <ListIcon size={11} aria-hidden /> List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'board'}
              className={`seg__btn ${view === 'board' ? 'is-active' : ''}`}
              onClick={() => handleViewChange('board')}
            >
              <LayoutGrid size={11} aria-hidden /> Board
            </button>
          </div>
          <button type="button" className="btn btn--accent" onClick={openCreateModal}>
            <Plus size={13} aria-hidden /> New enquiry
          </button>
        </div>
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Front desk", href: "/front-desk" },
        { label: "Admissions" },
      ]}
      bodyPadding="none"
    >
      <div className="adm-page">
      {loading && admissions.length === 0 && (
        <div className="adm-list" aria-busy="true">
          <SkeletonTable columns={7} rows={6} />
        </div>
      )}

      {!loading && error && admissions.length === 0 && (
        <ErrorState
          title="Failed to load admissions"
          description="We couldn't load the admission enquiries. Try again in a moment."
          onRetry={loadAdmissions}
          size="md"
        />
      )}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={`No admission enquiries${stageFilter !== 'all' || search ? ' match your filters' : ''}`}
          description={
            stageFilter !== 'all' || search
              ? 'Try a different search or stage filter.'
              : 'Get started by creating a new admission enquiry.'
          }
          action={
            <button type="button" className="btn btn--accent" onClick={openCreateModal}>
              <Plus size={13} aria-hidden /> New enquiry
            </button>
          }
          size="md"
        />
      )}

      {visible.length > 0 && view === 'list' && (
        <>
        <div className="adm-list" role="list" aria-busy={loading}>
          {visible.map((row) => {
            const meta = getStatusMeta(row.status);
            const toneKey = COLOR_TO_TONE[meta.color] || 'neutral';
            const toneCls = TONE_CLASS[toneKey] || '';
            return (
              <button
                key={row._id}
                type="button"
                className="adm-row"
                role="listitem"
                onClick={() => handleView(row)}
              >
                <span className="adm-row__id">{formatApplicationId(row)}</span>
                <span>
                  <div className="adm-row__name">{row.studentName || '—'}</div>
                  <div className="adm-row__sub">
                    {row.parentName || '—'} · {row.phoneNumber || '—'}
                  </div>
                </span>
                <span className="adm-row__class">
                  {row.classApplyingFor
                    ? (Number.isNaN(Number(row.classApplyingFor))
                        ? row.classApplyingFor
                        : `Class ${row.classApplyingFor}`)
                    : '—'}
                </span>
                <span className={`status ${toneCls}`}>{row.source || '—'}</span>
                <span className={`status ${toneCls}`}>{meta.label}</span>
                <span className={`status ${row.paymentStatus === 'paid' ? 'status--ok' : 'status--warn'}`}>
                  {row.paymentStatus === 'paid'
                    ? `Paid${row.paymentMode ? ` (${row.paymentMode})` : ''}`
                    : 'Unpaid'}
                </span>
                <span
                  className="adm-row__actions"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="View admission"
                    onClick={() => handleView(row)}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Edit admission"
                    onClick={() => handleEdit(row)}
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Delete admission"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </button>
            );
          })}
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-end px-4 py-2 border-t"
            style={{ borderColor: 'var(--divider)' }}
          >
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              disabled={loading}
              totalItems={pagination.totalItems}
              itemLabel="enquiries"
            />
          </div>
        )}
        </>
      )}

      {visible.length > 0 && view === 'board' && (
        <AdmissionTracker
          admissions={visible}
          onCardClick={handleView}
          onStageChange={handleStageChange}
        />
      )}

      <AdmissionFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        admission={editingAdmission}
        staff={staff}
        availableClasses={availableClasses}
        onSaved={handleSaved}
      />

      <AdmissionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        admission={selectedForDetail}
        onEdit={(row) => {
          setDetailModalOpen(false);
          handleEdit(row);
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
      </div>
    </PageShell>
  );
});

AdmissionsList.propTypes = {
  onSave: PropTypes.func,
};

export default AdmissionsList;
