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
import { Edit, Eye, History, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Chip,
  ConfirmDialog,
  DataTable,
  IconButton,
} from '../../components/ui';
import { classesApi, frontDeskApi, staffApi } from '../../services/api';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';
import AdmissionDetailModal from './AdmissionDetailModal';
import AdmissionFormModal from './AdmissionFormModal';
import AdmissionTracker from './AdmissionTracker';
import { getStatusMeta } from './admissionsConstants';

const extractList = (response) =>
  Array.isArray(response) ? response : response?.data || [];

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
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [selectedForDetail, setSelectedForDetail] = useState(null);
  const [selectedForTracker, setSelectedForTracker] = useState(null);

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

  const handleTracker = (row) => {
    setSelectedForTracker(row);
    setTrackerOpen(true);
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

  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: t('pages.sTUDENTName'),
        accessor: (row) => row.studentName,
      },
      {
        key: 'parentName',
        label: t('pages.pARENTName'),
        accessor: (row) => row.parentName || '',
      },
      {
        key: 'phoneNumber',
        label: t('pages.pHONE'),
        accessor: (row) => row.phoneNumber || '',
      },
      {
        key: 'classApplyingFor',
        label: t('pages.cLASS'),
        accessor: (row) => row.classApplyingFor || '',
      },
      {
        key: 'source',
        label: t('pages.sOURCE'),
        render: (row) => (
          <Chip size="sm" color="neutral">
            {row.source || '—'}
          </Chip>
        ),
      },
      {
        key: 'status',
        label: t('pages.sTATUS'),
        render: (row) => {
          const meta = getStatusMeta(row.status);
          return (
            <Chip size="sm" color={meta.color}>
              {meta.label}
            </Chip>
          );
        },
      },
      {
        key: 'paymentStatus',
        label: t('pages.pAYMENT'),
        render: (row) =>
          row.paymentStatus === 'paid' ? (
            <Chip size="sm" color="success">
              Paid {row.paymentMode ? `(${row.paymentMode})` : ''}
            </Chip>
          ) : (
            <Chip size="sm" color="warning">
              Unpaid
            </Chip>
          ),
      },
    ],
    [t]
  );

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        aria-label="View admission history"
        icon={<History size={14} />}
        size="sm"
        onClick={() => handleTracker(row)}
      />
      <IconButton
        aria-label="View admission"
        icon={<Eye size={14} />}
        size="sm"
        onClick={() => handleView(row)}
      />
      <IconButton
        aria-label="Edit admission"
        icon={<Edit size={14} />}
        size="sm"
        onClick={() => handleEdit(row)}
      />
      <IconButton
        aria-label="Delete admission"
        icon={<Trash2 size={14} />}
        size="sm"
        variant="danger"
        onClick={() => handleDelete(row)}
      />
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mb-4">
        <Button icon={<Plus size={16} />} onClick={openCreateModal}>
          New Admission Enquiry
        </Button>
      </div>

      <DataTable
        ariaLabel={t('aria.tables.admissions')}
        columns={columns}
        data={admissions}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={loadAdmissions}
        searchable
        searchKeys={['studentName', 'parentName', 'phoneNumber', 'classApplyingFor']}
        searchPlaceholder="Search admissions…"
        emptyState={{
          title: 'No admission enquiries yet',
          description: 'Log a new enquiry to start tracking its admission status.',
          action: (
            <Button icon={<Plus size={16} />} size="sm" onClick={openCreateModal}>
              New Admission Enquiry
            </Button>
          ),
        }}
        rowActions={rowActions}
        pagination
        defaultPageSize={10}
      />

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
      />

      <AdmissionTracker
        admission={selectedForTracker}
        isOpen={trackerOpen}
        onClose={() => setTrackerOpen(false)}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

AdmissionsList.propTypes = {
  onSave: PropTypes.func,
};

export default AdmissionsList;
