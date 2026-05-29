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
import { Edit, Eye, LayoutGrid, List as ListIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ToolbarSearch from '../../components/ui/ToolbarSearch';
import { ConfirmDialog, PageShell } from '../../components/ui';
import { classesApi, frontDeskApi, staffApi } from '../../services/api';
import useConfirmDialog from '../../hooks/useConfirmDialog';
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

function searchMatch(a, q) {
  if (!q) return true;
  const t = q.toLowerCase();
  return (
    (a.studentName || '').toLowerCase().includes(t) ||
    (a.parentName || '').toLowerCase().includes(t) ||
    (a.phoneNumber || '').toLowerCase().includes(t) ||
    (a.classApplyingFor || '').toLowerCase().includes(t) ||
    (a.applicationId || a._id || '').toLowerCase().includes(t)
  );
}

const formatApplicationId = (a) => {
  if (a.applicationId) return a.applicationId;
  const tail = String(a._id || '').slice(-6).toUpperCase();
  return tail ? `ADM-${tail}` : 'ADM-—';
};

const AdmissionsList = forwardRef(function AdmissionsList({ onSave }, ref) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const [admissions, setAdmissions] = useState([]);
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

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await frontDeskApi.getAdmissions();
      setAdmissions(extractList(response));
    } catch (err) {
      logger.error('Failed to load admissions:', err);
      setError(err);
      toast.error(t('toast.error.failedToLoadAdmissions'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    loadSupportingData();
  }, [loadAdmissions, loadSupportingData]);

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

  const visible = useMemo(() => {
    return admissions.filter((a) => {
      if (!searchMatch(a, search)) return false;
      if (stageFilter !== 'all' && stageOfStatus(a.status) !== stageFilter) return false;
      return true;
    });
  }, [admissions, search, stageFilter]);

  const stageCounts = useMemo(() => {
    const counts = { all: admissions.length };
    STAGE_OPTIONS.forEach((s) => { counts[s.key] = 0; });
    admissions.forEach((a) => {
      const key = stageOfStatus(a.status);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [admissions]);

  const toolbar = (
    <div className="toolbar">
      <ToolbarSearch
        value={search}
        onChange={setSearch}
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
            onClick={() => setStageFilter(f.key)}
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
          onClick={() => { setStageFilter('all'); setSearch(''); }}
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
      description={`${visible.length} of ${admissions.length}${stageFilter !== 'all' ? ` · ${STAGE_OPTIONS.find((s) => s.key === stageFilter)?.label}` : ''}`}
      actions={
        <div className="row gap-2">
          <div className="seg" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'list'}
              className={`seg__btn ${view === 'list' ? 'is-active' : ''}`}
              onClick={() => setView('list')}
            >
              <ListIcon size={11} aria-hidden /> List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'board'}
              className={`seg__btn ${view === 'board' ? 'is-active' : ''}`}
              onClick={() => setView('board')}
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
      {loading && (
        <div className="adm-empty">Loading admissions…</div>
      )}

      {!loading && error && (
        <div className="adm-empty">
          Failed to load admissions.{' '}
          <button type="button" className="btn btn--sm" onClick={loadAdmissions}>Retry</button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="adm-empty">
          No admission enquiries{stageFilter !== 'all' ? ' in this stage' : ''}.{' '}
          <button type="button" className="btn btn--sm btn--accent" onClick={openCreateModal}>
            <Plus size={11} aria-hidden /> New enquiry
          </button>
        </div>
      )}

      {!loading && !error && visible.length > 0 && view === 'list' && (
        <div className="adm-list" role="list">
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
      )}

      {!loading && !error && visible.length > 0 && view === 'board' && (
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
