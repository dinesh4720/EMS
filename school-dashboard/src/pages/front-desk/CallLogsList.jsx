import { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, useDisclosure
} from '@heroui/react';
import { Plus, Edit, Trash2, Phone, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CallLogsList() {
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [formData, setFormData] = useState({
    callerName: '',
    phoneNumber: '',
    dateTime: new Date().toISOString().slice(0, 16),
    purpose: '',
    intent: '',
    keyNotes: '',
    summary: '',
    title: '',
  });

  useEffect(() => {
    loadCallLogs();
  }, []);

  const loadCallLogs = async () => {
    try {
      const response = await api.get('/front-desk/call-logs');
      setCallLogs(response.data);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/front-desk/call-logs/${editingId}`, formData);
        toast.success('Call log updated successfully');
      } else {
        await api.post('/front-desk/call-logs', formData);
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
      intent: log.intent || '',
      keyNotes: log.keyNotes || '',
      summary: log.summary || '',
      title: log.title || '',
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
      await api.delete(`/front-desk/call-logs/${id}`);
      toast.success('Call log deleted');
      loadCallLogs();
    } catch (error) {
      toast.error('Failed to delete call log');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      callerName: '',
      phoneNumber: '',
      dateTime: new Date().toISOString().slice(0, 16),
      purpose: '',
      intent: '',
      keyNotes: '',
      summary: '',
      title: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Phone size={24} />
            Call Logs
          </h1>
          <p className="text-sm text-default-500 mt-1">Track and manage call records</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={onOpen}>
          Log Call
        </Button>
      </div>

      <Card>
        <CardBody>
          <Table aria-label="Call logs table">
            <TableHeader>
              <TableColumn>TITLE</TableColumn>
              <TableColumn>CALLER NAME</TableColumn>
              <TableColumn>PHONE</TableColumn>
              <TableColumn>DATE & TIME</TableColumn>
              <TableColumn>PURPOSE</TableColumn>
              <TableColumn>INTENT</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={callLogs}
              isLoading={loading}
              emptyContent="No call logs"
            >
              {(log) => (
                <TableRow key={log._id}>
                  <TableCell>{log.title || '-'}</TableCell>
                  <TableCell>{log.callerName || '-'}</TableCell>
                  <TableCell>{log.phoneNumber || '-'}</TableCell>
                  <TableCell>{new Date(log.dateTime).toLocaleString()}</TableCell>
                  <TableCell>{log.purpose || '-'}</TableCell>
                  <TableCell>{log.intent || '-'}</TableCell>
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
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Call Log' : 'Log New Call'}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Title"
                placeholder="Enter call title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-2"
              />
              <Input
                label="Caller Name"
                placeholder="Enter caller name"
                value={formData.callerName}
                onChange={(e) => setFormData({ ...formData, callerName: e.target.value })}
              />
              <Input
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
              <Input
                label="Date & Time"
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                isRequired
                className="col-span-2"
              />
              <Input
                label="Purpose"
                placeholder="Enter purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="col-span-2"
              />
              <Input
                label="Intent"
                placeholder="Enter intent"
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                className="col-span-2"
              />
              <Textarea
                label="Key Notes"
                placeholder="Enter key points"
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
                <div>
                  <p className="text-sm text-default-500">Title</p>
                  <p className="font-medium">{selectedLog.title || '-'}</p>
                </div>
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
                    <p className="text-sm text-default-500">Intent</p>
                    <p className="font-medium">{selectedLog.intent || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-default-500">Purpose</p>
                  <p className="font-medium">{selectedLog.purpose || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Key Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedLog.keyNotes || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Summary</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedLog.summary || '-'}</p>
                </div>
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
    </div>
  );
}
