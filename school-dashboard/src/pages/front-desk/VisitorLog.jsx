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
import { Calendar, Edit, LogOut, Plus, Trash2 } from 'lucide-react';
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
import { formatTime } from '../../utils/dateFormatter';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';
import VisitorFormModal from './VisitorFormModal';
import { getVisitorReasonLabel } from './frontDeskConstants';

const todayIso = () => new Date().toISOString().split('T')[0];

const getName = (visitor) => visitor?.name || visitor?.visitorName || '';
const getPhone = (visitor) => visitor?.phone || visitor?.phoneNumber || '';
const getPurpose = (visitor) => visitor?.purpose || visitor?.reasonForVisit || '';
const getWhomToMeet = (visitor) => visitor?.whomToMeet || visitor?.concernedPerson || '';

const VisitorLog = forwardRef(function VisitorLog({ onSave }, ref) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);

  const loadVisitors = useCallback(
    async (date) => {
      setLoading(true);
      setError(null);
      try {
        const isToday = date === todayIso();
        const response = isToday
          ? await frontDeskApi.getVisitorsToday()
          : await frontDeskApi.getVisitorsByDate(date);
        setVisitors(Array.isArray(response) ? response : []);
      } catch (err) {
        logger.error('Failed to load visitors:', err);
        setError(err);
        toast.error(t('toast.error.failedToLoadVisitors'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadVisitors(selectedDate);
  }, [selectedDate, loadVisitors]);

  const openCreateModal = useCallback(() => {
    setEditingVisitor(null);
    setModalOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openModal: openCreateModal }), [openCreateModal]);

  const handleEdit = (visitor) => {
    setEditingVisitor(visitor);
    setModalOpen(true);
  };

  const handleCheckout = async (id) => {
    try {
      await frontDeskApi.checkoutVisitor(id);
      toast.success(t('toast.success.visitorCheckedOutSuccessfully'));
      loadVisitors(selectedDate);
      onSave?.();
    } catch (err) {
      logger.error('Failed to check out visitor:', err);
      toast.error(t('toast.error.failedToCheckOutVisitor'));
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Visitor',
      message: t('confirm.deleteVisitor'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteVisitor(id);
          toast.success(t('toast.success.visitorRecordDeleted'));
          loadVisitors(selectedDate);
          onSave?.();
        } catch (err) {
          logger.error('Failed to delete visitor:', err);
          toast.error(t('toast.error.failedToDeleteVisitorRecord'));
        }
      },
    });
  };

  const handleSaved = () => {
    loadVisitors(selectedDate);
    onSave?.();
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Visitor',
        accessor: getName,
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-fg">{getName(row)}</span>
            {getPhone(row) ? (
              <span className="text-xs text-fg-muted">{getPhone(row)}</span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'purpose',
        label: 'Reason',
        accessor: (row) => getVisitorReasonLabel(getPurpose(row)),
        render: (row) => (
          <Chip size="sm" color="neutral">
            {getVisitorReasonLabel(getPurpose(row))}
          </Chip>
        ),
      },
      {
        key: 'whomToMeet',
        label: 'Whom to Meet',
        accessor: getWhomToMeet,
      },
      {
        key: 'studentName',
        label: 'Student',
        accessor: (row) => row.studentName || '',
      },
      {
        key: 'checkInTime',
        label: 'Check In',
        render: (row) => formatTime(row.checkInTime),
      },
      {
        key: 'checkOutTime',
        label: 'Check Out',
        render: (row) => formatTime(row.checkOutTime, '—'),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        render: (row) => (
          <Chip size="sm" color={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {row.status === 'ACTIVE' ? 'In' : 'Out'}
          </Chip>
        ),
      },
    ],
    []
  );

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      {row.status === 'ACTIVE' && (
        <Button
          size="sm"
          variant="outline"
          icon={<LogOut size={14} />}
          onClick={() => handleCheckout(row._id)}
        >
          Check Out
        </Button>
      )}
      <IconButton
        aria-label="Edit visitor"
        icon={<Edit size={14} />}
        onClick={() => handleEdit(row)}
        size="sm"
      />
      <IconButton
        aria-label="Delete visitor"
        icon={<Trash2 size={14} />}
        onClick={() => handleDelete(row._id)}
        size="sm"
        variant="danger"
      />
    </div>
  );

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
          aria-label="Filter visitors by date"
          wrapperClassName="sm:max-w-[220px]"
        />
        <Button icon={<Plus size={16} />} onClick={openCreateModal}>
          New Visitor
        </Button>
      </div>

      <DataTable
        ariaLabel={t('aria.tables.visitorLog')}
        columns={columns}
        data={visitors}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={() => loadVisitors(selectedDate)}
        searchable
        searchKeys={['name', 'whomToMeet', 'studentName']}
        searchPlaceholder="Search visitors…"
        emptyState={{
          title: `No visitors on ${dateLabel}`,
          description: 'Check-in a visitor to see their record here.',
          action: (
            <Button icon={<Plus size={16} />} size="sm" onClick={openCreateModal}>
              New Visitor
            </Button>
          ),
        }}
        rowActions={rowActions}
        pagination
        defaultPageSize={10}
      />

      <VisitorFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        visitor={editingVisitor}
        onSaved={handleSaved}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

VisitorLog.propTypes = {
  onSave: PropTypes.func,
};

export default VisitorLog;
