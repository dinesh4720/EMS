import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import {
  Button,
  ConfirmDialog,
  DataTable,
  IconButton,
  Input,
  Modal,
  Select,
  Textarea,
  Checkbox,
} from '../../components/ui';
import { Edit, Trash2, Eye, Plus, Phone, Download } from 'lucide-react';
import { frontDeskApi } from '../../services/api';
import { validatePhone, validateFutureDate } from '../../utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatShortDate, formatDateTime} from '../../utils/dateFormatter';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';


const CALL_PURPOSES = [
  { key: 'ADMISSION_INQUIRY', label: 'Admission Inquiry' },
  { key: 'FEE_PAYMENT', label: 'Fee Payment' },
  { key: 'PARENT_MEETING', label: 'Parent Meeting Request' },
  { key: 'STUDENT_ATTENDANCE', label: 'Student Attendance' },
  { key: 'ACADEMIC_QUERY', label: 'Academic Query' },
  { key: 'COMPLAINT', label: 'Complaint' },
  { key: 'GENERAL_INFO', label: 'General Information' },
  { key: 'OTHER', label: 'Other' },
];

const CallLogsList = forwardRef(({ onSave, ...props }, ref) => {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const onDetailOpen = () => setIsDetailOpen(true);
  const onDetailClose = () => setIsDetailOpen(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filteredCallLogs, setFilteredCallLogs] = useState([]);
  const [formData, setFormData] = useState({
    callerName: '',
    phoneNumber: '',
    dateTime: new Date().toISOString().slice(0, 16),
    purpose: '',
    otherPurpose: '',
    intent: '',
    keyNotes: '',
    summary: '',
    title: '',
    callbackRequired: false,
    callbackDate: '',
    callbackTime: '',
  });

  useEffect(() => {
    loadCallLogs();
  }, []);

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  const loadCallLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await frontDeskApi.getCallLogs();
      setCallLogs(Array.isArray(response) ? response : []);
    } catch (err) {
      logger.error('Failed to load call logs:', err);
      setError(err);
      toast.error(t('toast.error.failedToLoadCallLogs'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.callerName?.trim()) {
      newErrors.callerName = 'Caller name is required';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time are required';
    }
    if (!formData.purpose) {
      newErrors.purpose = 'Purpose is required';
    }
    if (formData.callbackRequired && !formData.callbackDate) {
      newErrors.callbackDate = 'Callback date is required';
    } else if (formData.callbackRequired && formData.callbackDate && !validateFutureDate(formData.callbackDate)) {
      newErrors.callbackDate = 'Callback date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      return;
    }
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        otherPurpose: formData.purpose === 'OTHER' ? formData.otherPurpose : '',
      };

      if (editingId) {
        await frontDeskApi.updateCallLog(editingId, submitData);
        toast.success(t('toast.success.callLogUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createCallLog(submitData);
        toast.success(t('toast.success.callLogCreatedSuccessfully'));
      }
      onClose();
      resetForm();
      loadCallLogs();
      onSave?.();
    } catch (error) {
      toast.error(t('toast.error.failedToSaveCallLog'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log._id);
    setFormData({
      callerName: log.callerName || '',
      phoneNumber: log.phoneNumber || '',
      dateTime: log.dateTime || '',
      purpose: log.purpose || '',
      otherPurpose: log.otherPurpose || '',
      intent: log.intent || '',
      keyNotes: log.keyNotes || '',
      summary: log.summary || '',
      title: log.title || '',
      callbackRequired: log.callbackRequired || false,
      callbackDate: log.callbackDate || '',
      callbackTime: log.callbackTime || '',
    });
    onOpen();
  };

  const handleView = (log) => {
    setSelectedLog(log);
    onDetailOpen();
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Call Log',
      message: t('confirm.deleteCallLog'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteCallLog(id);
          toast.success(t('toast.success.callLogDeleted'));
          loadCallLogs();
          onSave?.();
        } catch (error) {
          toast.error(t('toast.error.failedToDeleteCallLog'));
        }
      },
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      callerName: '',
      phoneNumber: '',
      dateTime: new Date().toISOString().slice(0, 16),
      purpose: '',
      otherPurpose: '',
      intent: '',
      keyNotes: '',
      summary: '',
      title: '',
      callbackRequired: false,
      callbackDate: '',
      callbackTime: '',
    });
  };

  const getPurposeLabel = (log) => {
    if (typeof log === 'string') {
      // Backward compat: called with just a purpose string
      const found = CALL_PURPOSES.find(p => p.key === log);
      return found?.label || log || '-';
    }
    const found = CALL_PURPOSES.find(p => p.key === log?.purpose);
    if (found) {
      if (log.purpose === 'OTHER' && log.otherPurpose) {
        return `Other: ${log.otherPurpose}`;
      }
      return found.label;
    }
    return log?.purpose || '-';
  };

  const escapeCsv = (val) => {
    if (val == null) return '';
    const str = String(val).replace(/\r?\n/g, ' ').trim();
    if (str.includes(',') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCsv = () => {
    if (!filteredCallLogs.length) {
      toast.error('No call logs to export');
      return;
    }
    const header = [
      'Caller Name', 'Phone', 'Purpose', 'Date/Time',
      'Title', 'Intent', 'Key Notes', 'Summary',
      'Callback Required', 'Callback Date', 'Callback Time',
    ];
    const rows = filteredCallLogs.map((log) => [
      log.callerName,
      log.phoneNumber,
      getPurposeLabel(log),
      log.dateTime ? formatDateTime(log.dateTime) : '',
      log.title,
      log.intent,
      log.keyNotes,
      log.summary,
      log.callbackRequired ? 'Yes' : 'No',
      log.callbackDate ? formatShortDate(log.callbackDate) : '',
      log.callbackTime || '',
    ].map(escapeCsv).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    // U+FEFF BOM ensures Excel detects UTF-8 encoding.
    const BOM = String.fromCharCode(0xFEFF);
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredCallLogs.length} call log${filteredCallLogs.length === 1 ? '' : 's'}`);
  };

  const columns = useMemo(() => [
    {
      key: 'callerName',
      label: t('pages.cALLERName'),
      accessor: (row) => row.callerName || '-',
    },
    {
      key: 'phoneNumber',
      label: t('pages.pHONE'),
      accessor: (row) => row.phoneNumber || '-',
    },
    {
      key: 'purpose',
      label: t('pages.pURPOSE'),
      accessor: (row) => getPurposeLabel(row),
    },
    {
      key: 'dateTime',
      label: t('pages.dATETime'),
      render: (row) => formatDateTime(row.dateTime),
    },
    {
      key: 'callbackRequired',
      label: t('pages.cALLBACK'),
      render: (row) => (
        row.callbackRequired ? (
          <span className="text-sm text-[var(--warn)]">
            {row.callbackDate ? formatShortDate(row.callbackDate) : 'Required'}
            {row.callbackTime && ` ${row.callbackTime}`}
          </span>
        ) : (
          <span className="text-sm text-fg-subtle">No</span>
        )
      ),
    },
  ], [t]);

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        aria-label="View call log"
        icon={<Eye size={14} />}
        onClick={() => handleView(row)}
        size="sm"
        variant="outline"
      />
      <IconButton
        aria-label="Edit call log"
        icon={<Edit size={14} />}
        onClick={() => handleEdit(row)}
        size="sm"
      />
      <IconButton
        aria-label="Delete call log"
        icon={<Trash2 size={14} />}
        onClick={() => handleDelete(row._id)}
        size="sm"
        variant="danger"
      />
    </div>
  );

  return (
    <>
      <DataTable
        ariaLabel={t('aria.tables.callLogs')}
        columns={columns}
        data={callLogs}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={loadCallLogs}
        searchable
        searchKeys={['callerName', 'phoneNumber', 'purpose', 'title']}
        searchPlaceholder="Search call logs…"
        emptyState={{
          title: 'No call logs',
          description: 'Log a call to keep track of incoming inquiries.',
          action: (
            <Button icon={<Plus size={16} />} size="sm" onClick={onOpen}>
              Log New Call
            </Button>
          ),
        }}
        rowActions={rowActions}
        toolbarActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExportCsv} disabled={!filteredCallLogs.length}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onOpen}>
              Log New Call
            </Button>
          </div>
        }
        pagination
        defaultPageSize={10}
        onFilteredDataChange={setFilteredCallLogs}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingId ? 'Edit Call Log' : 'Log New Call'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('pages.callerName')}
            placeholder={t('pages.enterCallerName')}
            value={formData.callerName}
            onChange={(e) => {
              setFormData({ ...formData, callerName: e.target.value });
              if (errors.callerName) setErrors({ ...errors, callerName: '' });
            }}
            required
            error={errors.callerName}
            startContent={<Phone size={14} />}
          />
          <Input
            label={t('pages.phoneNumber')}
            placeholder={t('pages.enter10DigitPhoneNumber')}
            value={formData.phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, phoneNumber: val });
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
            }}
            maxLength={10}
            required
            error={errors.phoneNumber}
          />
          <Select
            label={t('pages.purpose1')}
            placeholder={t('pages.selectPurpose')}
            value={formData.purpose}
            onChange={(e) => {
              setFormData({ ...formData, purpose: e.target.value });
              if (errors.purpose) setErrors({ ...errors, purpose: '' });
            }}
            required
            error={errors.purpose}
          >
            {CALL_PURPOSES.map((purpose) => (
              <option key={purpose.key} value={purpose.key}>
                {purpose.label}
              </option>
            ))}
          </Select>
          {formData.purpose === 'OTHER' && (
            <Input
              label={t('pages.pleaseSpecifyPurpose')}
              placeholder={t('pages.enterPurpose')}
              value={formData.otherPurpose}
              onChange={(e) => setFormData({ ...formData, otherPurpose: e.target.value })}
              required
            />
          )}
          <Input
            label={t('pages.dateTime')}
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => {
              setFormData({ ...formData, dateTime: e.target.value });
              if (errors.dateTime) setErrors({ ...errors, dateTime: '' });
            }}
            required
            error={errors.dateTime}
            wrapperClassName="col-span-2"
          />
          <Input
            label={t('pages.titleOptional')}
            placeholder={t('pages.briefTitleForTheCall')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            wrapperClassName="col-span-2"
          />
          <Input
            label={t('pages.intent')}
            placeholder={t('pages.whatWasTheCallerSIntent')}
            value={formData.intent}
            onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
            wrapperClassName="col-span-2"
          />
          <Textarea
            label={t('pages.keyNotes')}
            placeholder={t('pages.enterKeyPointsFromTheConversation')}
            value={formData.keyNotes}
            onChange={(e) => setFormData({ ...formData, keyNotes: e.target.value })}
            wrapperClassName="col-span-2"
            rows={3}
          />
          <Textarea
            label={t('pages.summary1')}
            placeholder={t('pages.enterCallSummary')}
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            wrapperClassName="col-span-2"
            rows={3}
          />
          <div className="col-span-2 border-t border-divider pt-4 mt-2">
            <Checkbox
              size="sm"
              label="Callback / Follow-up Required"
              checked={formData.callbackRequired}
              onChange={(e) => setFormData({ ...formData, callbackRequired: e.target.checked })}
            />
          </div>
          {formData.callbackRequired && (
            <>
              <Input
                label={t('pages.callbackDate')}
                type="date"
                value={formData.callbackDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, callbackDate: val });
                  // Real-time validation
                  if (formData.callbackRequired && val && !validateFutureDate(val)) {
                    setErrors({ ...errors, callbackDate: 'Callback date must be in the future' });
                  } else if (errors.callbackDate) {
                    setErrors({ ...errors, callbackDate: '' });
                  }
                }}
                required={formData.callbackRequired}
                error={errors.callbackDate}
              />
              <Input
                label={t('pages.callbackTime')}
                type="time"
                value={formData.callbackTime}
                onChange={(e) => setFormData({ ...formData, callbackTime: e.target.value })}
              />
            </>
          )}
        </div>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        title={t('pages.callLogDetails')}
        size="lg"
        footer={
          <Button variant="ghost" onClick={onDetailClose}>
            Close
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4">
            {selectedLog.title && (
              <div>
                <p className="text-sm text-fg-muted">{t('pages.title1')}</p>
                <p className="font-medium">{selectedLog.title}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-fg-muted">{t('pages.callerName')}</p>
                <p className="font-medium">{selectedLog.callerName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-fg-muted">{t('pages.phoneNumber')}</p>
                <p className="font-medium">{selectedLog.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-fg-muted">{t('pages.dateTime')}</p>
                <p className="font-medium">{formatDateTime(selectedLog.dateTime)}</p>
              </div>
              <div>
                <p className="text-sm text-fg-muted">{t('pages.purpose1')}</p>
                <p className="font-medium">{getPurposeLabel(selectedLog)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-fg-muted">{t('pages.intent')}</p>
              <p className="font-medium">{selectedLog.intent || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-fg-muted">{t('pages.keyNotes')}</p>
              <p className="font-medium whitespace-pre-wrap">{selectedLog.keyNotes || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-fg-muted">{t('pages.summary1')}</p>
              <p className="font-medium whitespace-pre-wrap">{selectedLog.summary || '-'}</p>
            </div>
            {selectedLog.callbackRequired && (
              <div className="bg-[var(--warn-bg)] border border-[var(--warn)]/20 p-3 rounded-lg">
                <p className="text-sm text-[var(--warn)]">📞 Callback Required</p>
                <p className="text-sm font-medium">
                  {selectedLog.callbackDate ? formatShortDate(selectedLog.callbackDate) : 'Date not set'}
                  {selectedLog.callbackTime && ` at ${selectedLog.callbackTime}`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

CallLogsList.displayName = 'CallLogsList';

export default CallLogsList;
