import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, useDisclosure, Button,
  Select, SelectItem, Checkbox
} from '@heroui/react';
import { Edit, Trash2, Eye, Plus, Phone } from 'lucide-react';
import { frontDeskApi } from '../../services/api';
import { validatePhone, validateFutureDate } from '../../utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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

const CallLogsList = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
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

  const loadCallLogs = async () => {
    try {
      const response = await frontDeskApi.getCallLogs();
      setCallLogs(response);
    } catch (error) {
      console.error('Failed to load call logs:', error);
      toast.error(t('toast.error.failedToLoadCallLogs'));
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      return;
    }
    try {
      const submitData = {
        ...formData,
        purpose: formData.purpose === 'OTHER' ? formData.otherPurpose : formData.purpose,
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
    } catch (error) {
      toast.error(t('toast.error.failedToSaveCallLog'));
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

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteCallLog'))) return;
    try {
      await frontDeskApi.deleteCallLog(id);
      toast.success(t('toast.success.callLogDeleted'));
      loadCallLogs();
    } catch (error) {
      toast.error(t('toast.error.failedToDeleteCallLog'));
    }
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

  const getPurposeLabel = (purpose) => {
    const found = CALL_PURPOSES.find(p => p.key === purpose);
    return found?.label || purpose || '-';
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          Log New Call
        </Button>
      </div>
      <Table aria-label={t('aria.tables.callLogs')} removeWrapper>
        <TableHeader>
          <TableColumn scope="col">{t('pages.cALLERName')}</TableColumn>
          <TableColumn scope="col">{t('pages.pHONE')}</TableColumn>
          <TableColumn scope="col">{t('pages.pURPOSE')}</TableColumn>
          <TableColumn scope="col">{t('pages.dATETime')}</TableColumn>
          <TableColumn scope="col">{t('pages.cALLBACK')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody
          items={callLogs}
          isLoading={loading}
          emptyContent="No call logs"
        >
          {(log) => (
            <TableRow key={log._id}>
              <TableCell className="font-medium">{log.callerName || '-'}</TableCell>
              <TableCell>{log.phoneNumber || '-'}</TableCell>
              <TableCell>
                <span className="text-sm">{getPurposeLabel(log.purpose)}</span>
              </TableCell>
              <TableCell>{new Date(log.dateTime).toLocaleString()}</TableCell>
              <TableCell>
                {log.callbackRequired ? (
                  <span className="text-sm text-warning">
                    {log.callbackDate ? new Date(log.callbackDate).toLocaleDateString() : 'Required'}
                    {log.callbackTime && ` ${log.callbackTime}`}
                  </span>
                ) : (
                  <span className="text-sm text-default-400">No</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    isIconOnly
                    onPress={() => handleView(log)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="warning"
                    variant="light"
                    isIconOnly
                    onPress={() => handleEdit(log)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDelete(log._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Call Log' : 'Log New Call'}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('pages.callerName')}
                placeholder={t('pages.enterCallerName')}
                value={formData.callerName}
                onChange={(e) => {
                  setFormData({ ...formData, callerName: e.target.value });
                  if (errors.callerName) setErrors({ ...errors, callerName: '' });
                }}
                isRequired
                isInvalid={!!errors.callerName}
                errorMessage={errors.callerName}
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
                isRequired
                isInvalid={!!errors.phoneNumber}
                errorMessage={errors.phoneNumber}
              />
              <Select
                label={t('pages.purpose1')}
                placeholder={t('pages.selectPurpose')}
                selectedKeys={formData.purpose ? [formData.purpose] : []}
                onChange={(e) => {
                  setFormData({ ...formData, purpose: e.target.value });
                  if (errors.purpose) setErrors({ ...errors, purpose: '' });
                }}
                isRequired
                isInvalid={!!errors.purpose}
                errorMessage={errors.purpose}
              >
                {CALL_PURPOSES.map((purpose) => (
                  <SelectItem key={purpose.key} value={purpose.key}>
                    {purpose.label}
                  </SelectItem>
                ))}
              </Select>
              {formData.purpose === 'OTHER' && (
                <Input
                  label={t('pages.pleaseSpecifyPurpose')}
                  placeholder={t('pages.enterPurpose')}
                  value={formData.otherPurpose}
                  onChange={(e) => setFormData({ ...formData, otherPurpose: e.target.value })}
                  isRequired
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
                isRequired
                isInvalid={!!errors.dateTime}
                errorMessage={errors.dateTime}
                className="col-span-2"
              />
              <Input
                label={t('pages.titleOptional')}
                placeholder={t('pages.briefTitleForTheCall')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-2"
              />
              <Input
                label={t('pages.intent')}
                placeholder={t('pages.whatWasTheCallerSIntent')}
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                className="col-span-2"
              />
              <Textarea
                label={t('pages.keyNotes')}
                placeholder={t('pages.enterKeyPointsFromTheConversation')}
                value={formData.keyNotes}
                onChange={(e) => setFormData({ ...formData, keyNotes: e.target.value })}
                className="col-span-2"
                rows={3}
              />
              <Textarea
                label={t('pages.summary1')}
                placeholder={t('pages.enterCallSummary')}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="col-span-2"
                rows={3}
              />
              <div className="col-span-2 border-t border-default-200 pt-4 mt-2">
                <Checkbox size="sm"
                  isSelected={formData.callbackRequired}
                  onValueChange={(value) => setFormData({ ...formData, callbackRequired: value })}
                >
                  Callback / Follow-up Required
                </Checkbox>
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
                    isRequired={formData.callbackRequired}
                    isInvalid={!!errors.callbackDate}
                    errorMessage={errors.callbackDate}
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
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Detail View Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.callLogDetails')}</ModalHeader>
          <ModalBody>
            {selectedLog && (
              <div className="space-y-4">
                {selectedLog.title && (
                  <div>
                    <p className="text-sm text-default-500">{t('pages.title1')}</p>
                    <p className="font-medium">{selectedLog.title}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">{t('pages.callerName')}</p>
                    <p className="font-medium">{selectedLog.callerName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{t('pages.phoneNumber')}</p>
                    <p className="font-medium">{selectedLog.phoneNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{t('pages.dateTime')}</p>
                    <p className="font-medium">{new Date(selectedLog.dateTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{t('pages.purpose1')}</p>
                    <p className="font-medium">{getPurposeLabel(selectedLog.purpose)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-default-500">{t('pages.intent')}</p>
                  <p className="font-medium">{selectedLog.intent || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">{t('pages.keyNotes')}</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedLog.keyNotes || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">{t('pages.summary1')}</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedLog.summary || '-'}</p>
                </div>
                {selectedLog.callbackRequired && (
                  <div className="bg-warning-50 border border-warning-200 p-3 rounded-lg">
                    <p className="text-sm text-warning-700">📞 Callback Required</p>
                    <p className="text-sm font-medium">
                      {selectedLog.callbackDate ? new Date(selectedLog.callbackDate).toLocaleDateString() : 'Date not set'}
                      {selectedLog.callbackTime && ` at ${selectedLog.callbackTime}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDetailClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

CallLogsList.displayName = 'CallLogsList';

export default CallLogsList;
