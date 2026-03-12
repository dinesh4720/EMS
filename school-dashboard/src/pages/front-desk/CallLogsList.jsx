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
      toast.error('Failed to load call logs');
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
      toast.error('Please fix the errors before submitting');
      return;
    }
    try {
      const submitData = {
        ...formData,
        purpose: formData.purpose === 'OTHER' ? formData.otherPurpose : formData.purpose,
      };

      if (editingId) {
        await frontDeskApi.updateCallLog(editingId, submitData);
        toast.success('Call log updated successfully');
      } else {
        await frontDeskApi.createCallLog(submitData);
        toast.success('Call log created successfully');
      }
      onClose();
      resetForm();
      loadCallLogs();
    } catch (error) {
      toast.error('Failed to save call log');
    }
  };

  const handleEdit = (log) => {
    setEditingId(log._id);
    setFormData({
      callerName: log.callerName || '',
      phoneNumber: log.phoneNumber || '',
      dateTime: log.dateTime,
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
    if (!confirm('Are you sure you want to delete this call log?')) return;
    try {
      await frontDeskApi.deleteCallLog(id);
      toast.success('Call log deleted');
      loadCallLogs();
    } catch (error) {
      toast.error('Failed to delete call log');
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
      <Table aria-label="Call logs table" removeWrapper>
        <TableHeader>
          <TableColumn>CALLER NAME</TableColumn>
          <TableColumn>PHONE</TableColumn>
          <TableColumn>PURPOSE</TableColumn>
          <TableColumn>DATE & TIME</TableColumn>
          <TableColumn>CALLBACK</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
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
                label="Caller Name"
                placeholder="Enter caller name"
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
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
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
                label="Purpose"
                placeholder="Select purpose"
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
                  label="Please Specify Purpose"
                  placeholder="Enter purpose"
                  value={formData.otherPurpose}
                  onChange={(e) => setFormData({ ...formData, otherPurpose: e.target.value })}
                  isRequired
                />
              )}
              <Input
                label="Date & Time"
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
                label="Title (Optional)"
                placeholder="Brief title for the call"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-2"
              />
              <Input
                label="Intent"
                placeholder="What was the caller's intent?"
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                className="col-span-2"
              />
              <Textarea
                label="Key Notes"
                placeholder="Enter key points from the conversation"
                value={formData.keyNotes}
                onChange={(e) => setFormData({ ...formData, keyNotes: e.target.value })}
                className="col-span-2"
                rows={3}
              />
              <Textarea
                label="Summary"
                placeholder="Enter call summary"
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
                    label="Callback Date"
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
                    label="Callback Time"
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
          <ModalHeader>Call Log Details</ModalHeader>
          <ModalBody>
            {selectedLog && (
              <div className="space-y-4">
                {selectedLog.title && (
                  <div>
                    <p className="text-sm text-default-500">Title</p>
                    <p className="font-medium">{selectedLog.title}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">Caller Name</p>
                    <p className="font-medium">{selectedLog.callerName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Phone Number</p>
                    <p className="font-medium">{selectedLog.phoneNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Date & Time</p>
                    <p className="font-medium">{new Date(selectedLog.dateTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Purpose</p>
                    <p className="font-medium">{getPurposeLabel(selectedLog.purpose)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-default-500">Intent</p>
                  <p className="font-medium">{selectedLog.intent || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Key Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedLog.keyNotes || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Summary</p>
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
