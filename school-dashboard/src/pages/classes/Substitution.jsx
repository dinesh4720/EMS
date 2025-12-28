import { useState, useEffect } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Chip, Input, Spinner
} from '@heroui/react';
import { UserCheck, Calendar, Clock, Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';

export default function Substitution() {
  const { teachers, classes } = useApp();
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    classId: '',
    period: '',
    absentTeacherId: '',
    substituteTeacherId: '',
    reason: '',
    type: 'auto' // auto or manual
  });

  const periods = ['1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => {
    loadSubstitutions();
  }, [selectedDate]);

  const loadSubstitutions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/substitutions?date=${selectedDate}`);
      setSubstitutions(response.data);
    } catch (error) {
      console.error('Error loading substitutions:', error);
      toast.error('Failed to load substitutions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.classId || !formData.period || !formData.substituteTeacherId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.post('/substitutions', formData);
      toast.success('Substitution assigned successfully');
      onClose();
      resetForm();
      loadSubstitutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign substitution');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this substitution?')) return;
    try {
      await api.delete(`/substitutions/${id}`);
      toast.success('Substitution removed');
      loadSubstitutions();
    } catch (error) {
      toast.error('Failed to remove substitution');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      classId: '',
      period: '',
      absentTeacherId: '',
      substituteTeacherId: '',
      reason: '',
      type: 'manual'
    });
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}-${cls.section}` : 'Unknown';
  };

  return (
    <>
      {/* Date Selector and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
            startContent={<Calendar size={16} className="text-default-400" />}
          />
          <Button
            size="sm"
            variant="flat"
            onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </Button>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => {
            resetForm();
            onOpen();
          }}
        >
          Manual Substitution
        </Button>
      </div>

      {/* Substitutions Table */}
      <Table
        aria-label="Substitutions table"
        removeWrapper
        classNames={{
          th: "bg-default-100 text-default-600 font-semibold",
        }}
      >
        <TableHeader>
          <TableColumn>CLASS</TableColumn>
          <TableColumn>PERIOD</TableColumn>
          <TableColumn>ABSENT TEACHER</TableColumn>
          <TableColumn>SUBSTITUTE TEACHER</TableColumn>
          <TableColumn>REASON</TableColumn>
          <TableColumn>TYPE</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          items={substitutions}
          isLoading={loading}
          loadingContent={<Spinner />}
          emptyContent="No substitutions for this date"
        >
          {(sub) => (
            <TableRow key={sub._id}>
              <TableCell>{getClassName(sub.classId)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-default-400" />
                  <span>Period {sub.period}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-danger-600">{getTeacherName(sub.absentTeacherId)}</span>
              </TableCell>
              <TableCell>
                <span className="text-success-600 font-medium">{getTeacherName(sub.substituteTeacherId)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-500">{sub.reason || '-'}</span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={sub.type === 'auto' ? 'primary' : 'secondary'}
                >
                  {sub.type === 'auto' ? 'Auto' : 'Manual'}
                </Chip>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleDelete(sub._id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Manual Substitution Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Assign Manual Substitution</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                isRequired
              />
              <Select
                label="Class"
                placeholder="Select class"
                selectedKeys={formData.classId ? [formData.classId] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0];
                  setFormData({ ...formData, classId: selectedId || '' });
                }}
                isRequired
              >
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}-{cls.section}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Period"
                placeholder="Select period"
                selectedKeys={formData.period ? [formData.period] : []}
                onSelectionChange={(keys) => {
                  const selectedPeriod = Array.from(keys)[0];
                  setFormData({ ...formData, period: selectedPeriod || '' });
                }}
                isRequired
              >
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    Period {p}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Absent Teacher (Optional)"
                placeholder="Select teacher"
                selectedKeys={formData.absentTeacherId ? [formData.absentTeacherId] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0];
                  setFormData({ ...formData, absentTeacherId: selectedId || '' });
                }}
              >
                {teachers.filter(t => t.role === 'Teacher').map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Substitute Teacher"
                placeholder="Select substitute"
                selectedKeys={formData.substituteTeacherId ? [formData.substituteTeacherId] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0];
                  setFormData({ ...formData, substituteTeacherId: selectedId || '' });
                }}
                isRequired
                className="col-span-2"
              >
                {teachers.filter(t => t.role === 'Teacher').map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </SelectItem>
                ))}
              </Select>
              <Input
                label="Reason"
                placeholder="Enter reason for substitution"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              Assign Substitution
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
