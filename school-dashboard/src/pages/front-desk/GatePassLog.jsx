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
import { Calendar, Check, Download, Edit, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Chip,
  ConfirmDialog,
  DataTable,
  IconButton,
  Input,
} from '../../components/ui';
import { frontDeskApi } from '../../services/api';
import { formatShortDate } from '../../utils/dateFormatter';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';
import GatePassFormModal from './GatePassFormModal';
import GatePassPrint from './GatePassPrint.jsx';
import {
  getApprovedByLabel,
  getGatePassReasonLabel,
} from './frontDeskConstants';

const todayIso = () => new Date().toISOString().split('T')[0];

const APPROVAL_CHIP_COLOR = {
  APPROVED: 'success',
  REJECTED: 'danger',
  PENDING: 'warning',
};

const GatePassLog = forwardRef(function GatePassLog({ onSave }, ref) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGatePass, setEditingGatePass] = useState(null);

  const [printOpen, setPrintOpen] = useState(false);
  const [printGatePass, setPrintGatePass] = useState(null);

  const loadGatePasses = useCallback(
    async (date) => {
      setLoading(true);
      setError(null);
      try {
        const isToday = date === todayIso();
        const response = isToday
          ? await frontDeskApi.getGatePassesToday()
          : await frontDeskApi.getGatePassesByDate(date);
        setGatePasses(Array.isArray(response) ? response : []);
      } catch (err) {
        logger.error('Failed to load gate passes:', err);
        setError(err);
        toast.error(t('toast.error.failedToLoadGatePasses'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadGatePasses(selectedDate);
  }, [selectedDate, loadGatePasses]);

  const openCreateModal = useCallback(() => {
    setEditingGatePass(null);
    setModalOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openModal: openCreateModal }), [openCreateModal]);

  const handleEdit = (gp) => {
    setEditingGatePass(gp);
    setModalOpen(true);
  };

  const handleApproval = async (id, status) => {
    try {
      await frontDeskApi.updateGatePass(id, { approvalStatus: status });
      toast.success(
        status === 'APPROVED'
          ? t('toast.success.gatePassApproved') || 'Gate pass approved'
          : t('toast.success.gatePassRejected') || 'Gate pass rejected'
      );
      loadGatePasses(selectedDate);
      onSave?.();
    } catch (err) {
      logger.error('Failed to update gate pass status:', err);
      toast.error('Failed to update gate pass status');
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Gate Pass',
      message: t('confirm.deleteGatePass'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteGatePass(id);
          toast.success(t('toast.success.gatePassDeleted'));
          loadGatePasses(selectedDate);
          onSave?.();
        } catch (err) {
          logger.error('Failed to delete gate pass:', err);
          toast.error(t('toast.error.failedToDeleteGatePass'));
        }
      },
    });
  };

  const handleSaved = () => {
    loadGatePasses(selectedDate);
    onSave?.();
  };

  const handleDownload = (gp) => {
    setPrintGatePass(gp);
    setPrintOpen(true);
  };

  const renderLeftWith = (gp) => {
    if (gp.leavingWith === 'PARENTS') return 'Parents';
    if (gp.escortName) {
      return `${gp.escortName}${gp.escortRelation ? ` (${gp.escortRelation})` : ''}`;
    }
    return gp.leavingWith || '—';
  };

  const renderApprovedBy = (gp) => {
    const role = getApprovedByLabel(gp.approvedBy);
    if (gp.approvedByName) return `${gp.approvedByName}${role ? ` · ${role}` : ''}`;
    return role || '—';
  };

  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student',
        accessor: (row) => row.studentName || row.personName || '',
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-fg">
              {row.studentName || row.personName || '—'}
            </span>
            {row.class ? (
              <span className="text-xs text-fg-muted">
                {row.class}
                {row.section ? ` · ${row.section}` : ''}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'reason',
        label: 'Reason',
        accessor: (row) => getGatePassReasonLabel(row.reason),
        render: (row) => (
          <Chip size="sm" color="neutral">
            {getGatePassReasonLabel(row.reason)}
          </Chip>
        ),
      },
      {
        key: 'leftWith',
        label: 'Left With',
        accessor: (row) => renderLeftWith(row),
      },
      {
        key: 'approvedBy',
        label: 'Approved By',
        accessor: (row) => renderApprovedBy(row),
      },
      {
        key: 'leavingDateTime',
        label: 'Leaving',
        accessor: (row) =>
          row.leavingDate ? `${formatShortDate(row.leavingDate)} ${row.leavingTime || ''}`.trim() : '',
      },
      {
        key: 'approvalStatus',
        label: 'Status',
        align: 'center',
        render: (row) => (
          <Chip
            size="sm"
            color={APPROVAL_CHIP_COLOR[row.approvalStatus] || 'neutral'}
          >
            {row.approvalStatus || 'PENDING'}
          </Chip>
        ),
      },
    ],
    []
  );

  const rowActions = (row) => {
    const status = row.approvalStatus || 'PENDING';
    const isPending = status === 'PENDING';
    return (
      <div className="flex items-center justify-end gap-1">
        {isPending && (
          <>
            <IconButton
              aria-label="Approve gate pass"
              icon={<Check size={14} />}
              onClick={() => handleApproval(row._id, 'APPROVED')}
              size="sm"
              variant="outline"
            />
            <IconButton
              aria-label="Reject gate pass"
              icon={<X size={14} />}
              onClick={() => handleApproval(row._id, 'REJECTED')}
              size="sm"
              variant="danger"
            />
          </>
        )}
        <IconButton
          aria-label="Edit gate pass"
          icon={<Edit size={14} />}
          onClick={() => handleEdit(row)}
          size="sm"
        />
        <IconButton
          aria-label="Download gate pass"
          icon={<Download size={14} />}
          onClick={() => handleDownload(row)}
          size="sm"
        />
        <IconButton
          aria-label="Delete gate pass"
          icon={<Trash2 size={14} />}
          onClick={() => handleDelete(row._id)}
          size="sm"
          variant="danger"
        />
      </div>
    );
  };

  const isToday = selectedDate === todayIso();
  const dateLabel = isToday ? 'today' : selectedDate;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value || todayIso())}
          startContent={<Calendar size={16} aria-hidden="true" />}
          aria-label="Filter gate passes by date"
          wrapperClassName="sm:max-w-[220px]"
        />
        <Button icon={<Plus size={16} />} onClick={openCreateModal}>
          Issue Gate Pass
        </Button>
      </div>

      <DataTable
        ariaLabel={t('aria.tables.gatePassLog')}
        columns={columns}
        data={gatePasses}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={() => loadGatePasses(selectedDate)}
        searchable
        searchKeys={['studentName', 'class', 'approvedByName']}
        searchPlaceholder="Search gate passes…"
        emptyState={{
          title: `No gate passes on ${dateLabel}`,
          description: 'Issue a gate pass to authorise a student leaving school.',
          action: (
            <Button icon={<Plus size={16} />} size="sm" onClick={openCreateModal}>
              Issue Gate Pass
            </Button>
          ),
        }}
        rowActions={rowActions}
        pagination
        defaultPageSize={10}
      />

      <GatePassFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        gatePass={editingGatePass}
        onSaved={handleSaved}
      />

      <GatePassPrint
        gatePass={printGatePass}
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

GatePassLog.propTypes = {
  onSave: PropTypes.func,
};

export default GatePassLog;
