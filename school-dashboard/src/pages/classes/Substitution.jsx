import { useState, useEffect, useMemo } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Chip, Input, Spinner, Card, CardBody
} from '@heroui/react';
import { UserCheck, Calendar, Clock, Plus, Search, Filter, X, UserPlus, RefreshCw, UserMinus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';

export default function Substitution() {
  const { teachers, classes } = useApp();
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, assigned, not_assigned

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    classId: '',
    period: '',
    absentTeacherId: '',
    substituteTeacherId: '',
    reason: '',
    type: 'auto'
  });

  // Additional modals for assign/change teacher
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isChangeOpen, onOpen: onChangeOpen, onClose: onChangeClose } = useDisclosure();
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const periods = ['1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => {
    loadSubstitutions();
  }, [selectedDate]);

  const loadSubstitutions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/substitutions?date=${selectedDate}`);
      setSubstitutions(response.data || []);
    } catch (error) {
      console.error('Error loading substitutions:', error);
      // Fallback to mock data for development
      setSubstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter substitutions
  const filteredSubstitutions = useMemo(() => {
    return substitutions.filter(sub => {
      const searchLower = searchQuery.toLowerCase();
      const keywords = searchLower.split(' ').filter(k => k.length > 0);

      const matchesSearch = keywords.length === 0 || keywords.every(keyword => {
        const searchableText = [
          getClassName(sub.classId),
          sub.period,
          getTeacherName(sub.absentTeacherId),
          getTeacherName(sub.substituteTeacherId),
          sub.reason || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(keyword);
      });

      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [substitutions, searchQuery, statusFilter]);

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

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedSubstitution) return;

    try {
      await api.put(`/substitutions/${selectedSubstitution._id}`, {
        substituteTeacherId: selectedTeacher,
        status: 'assigned'
      });
      toast.success('Teacher assigned successfully');
      onAssignClose();
      setSelectedSubstitution(null);
      setSelectedTeacher("");
      loadSubstitutions();
    } catch (error) {
      toast.error('Failed to assign teacher');
    }
  };

  const handleChangeTeacher = async () => {
    if (!selectedTeacher || !selectedSubstitution) return;

    try {
      await api.put(`/substitutions/${selectedSubstitution._id}`, {
        substituteTeacherId: selectedTeacher
      });
      toast.success('Teacher changed successfully');
      onChangeClose();
      setSelectedSubstitution(null);
      setSelectedTeacher("");
      loadSubstitutions();
    } catch (error) {
      toast.error('Failed to change teacher');
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
    const teacher = teachers.find(t => t.id === teacherId || t._id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId || c._id === classId);
    return cls ? `${cls.name}-${cls.section}` : 'Unknown';
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'assigned':
        return <Chip size="sm" color="success" variant="flat">Assigned</Chip>;
      case 'not_assigned':
        return <Chip size="sm" color="warning" variant="flat">Not Assigned</Chip>;
      case 'completed':
        return <Chip size="sm" color="default" variant="flat">Completed</Chip>;
      default:
        return <Chip size="sm" color="default" variant="flat">{status || 'Pending'}</Chip>;
    }
  };

  const getAvailableTeachers = (absentTeacherId) => {
    return teachers.filter(t =>
      t.status === 'active' &&
      t._id !== absentTeacherId &&
      t.id !== absentTeacherId &&
      (t.role === 'Teacher' || t.isClassTeacher)
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-default-800">Substitution Management</h2>
            <p className="text-default-500 mt-1">Manage teacher substitutions and assignments</p>
          </div>
          <Button
            color="primary"
            startContent={<RefreshCw size={16} />}
            onPress={loadSubstitutions}
          >
            Refresh
          </Button>
        </div>

        {/* Filters Card */}
        <Card className="border-default-200">
          <CardBody className="gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search by class, teacher, subject..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<Search size={16} className="text-default-400" />}
                  endContent={
                    searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="p-1 hover:bg-default-200 rounded"
                      >
                        <X size={14} className="text-default-400" />
                      </button>
                    )
                  }
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                />
              </div>

              {/* Status Filter */}
              <Select
                placeholder="Filter by Status"
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
                className="lg:w-48"
                startContent={<Filter size={16} className="text-default-400" />}
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="assigned">Assigned</SelectItem>
                <SelectItem key="not_assigned">Not Assigned</SelectItem>
              </Select>

              {/* Date Selector */}
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="lg:w-56"
                startContent={<Calendar size={16} className="text-default-400" />}
              />
            </div>

            {/* Filter Summary */}
            <div className="flex gap-2 flex-wrap">
              {filteredSubstitutions.length > 0 && (
                <Chip size="sm" variant="flat">
                  {filteredSubstitutions.length} substitution{filteredSubstitutions.length !== 1 ? 's' : ''} found
                </Chip>
              )}
              {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length > 0 && (
                <Chip size="sm" color="success" variant="flat">
                  {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length} assigned
                </Chip>
              )}
              {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length > 0 && (
                <Chip size="sm" color="warning" variant="flat">
                  {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length} need assignment
                </Chip>
              )}
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Substitutions Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" color="primary" />
          </div>
        ) : filteredSubstitutions.length === 0 ? (
          <Card className="border-default-200">
            <CardBody className="py-12 text-center">
              <Calendar size={48} className="mx-auto text-default-300 mb-4" />
              <p className="text-default-500">No substitutions found for this date</p>
              <Button
                color="primary"
                variant="flat"
                className="mt-4"
                onPress={onOpen}
              >
                Create Substitution
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-default-200">
            <CardBody className="p-0">
              <Table
                aria-label="Substitutions table"
                removeWrapper
                classNames={{
                  th: "bg-default-100 text-default-600 font-semibold text-xs uppercase tracking-wider h-12",
                  td: "py-4 border-b border-default-100",
                }}
              >
                <TableHeader>
                  <TableColumn>CLASS DETAILS</TableColumn>
                  <TableColumn>PERIOD / SUBJECT</TableColumn>
                  <TableColumn>TEACHER ABSENT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>REASON</TableColumn>
                  <TableColumn align="center">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={filteredSubstitutions}>
                  {(sub) => (
                    <TableRow key={sub._id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-default-800">{getClassName(sub.classId)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-default-400" />
                          <span className="font-medium">Period {sub.period}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-default-800">{getTeacherName(sub.absentTeacherId)}</p>
                          <p className="text-sm text-default-500">Absent Teacher</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusChip(sub.status || (sub.substituteTeacherId ? 'assigned' : 'not_assigned'))}
                          {sub.substituteTeacherId && (
                            <p className="text-sm text-default-600">
                              → {getTeacherName(sub.substituteTeacherId)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-default-600">{sub.reason || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {!sub.substituteTeacherId || sub.status === 'not_assigned' ? (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              startContent={<UserPlus size={14} />}
                              onPress={() => {
                                setSelectedSubstitution(sub);
                                onAssignOpen();
                              }}
                            >
                              Assign
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                color="secondary"
                                variant="flat"
                                onPress={() => {
                                  setSelectedSubstitution(sub);
                                  onChangeOpen();
                                }}
                              >
                                Change
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={() => handleDelete(sub._id)}
                              >
                                <UserMinus size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Create Manual Substitution Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create Substitution</ModalHeader>
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
              Create Substitution
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose}>
        <ModalContent>
          <ModalHeader>Assign Substitute Teacher</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedSubstitution && (
              <>
                <div className="bg-default-50 rounded-lg p-4 space-y-2">
                  <p><strong>Class:</strong> {getClassName(selectedSubstitution.classId)}</p>
                  <p><strong>Period:</strong> {selectedSubstitution.period}</p>
                  <p><strong>Absent Teacher:</strong> {getTeacherName(selectedSubstitution.absentTeacherId)}</p>
                </div>

                <Select
                  label="Select Substitute Teacher"
                  placeholder="Choose a teacher"
                  selectedKeys={selectedTeacher ? [selectedTeacher] : []}
                  onSelectionChange={(keys) => setSelectedTeacher(Array.from(keys)[0])}
                  isRequired
                >
                  {getAvailableTeachers(selectedSubstitution.absentTeacherId).map(teacher => (
                    <SelectItem key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                      {teacher.name} ({teacher.department || 'Teacher'})
                    </SelectItem>
                  ))}
                </Select>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onAssignClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignTeacher}
              isDisabled={!selectedTeacher}
            >
              Assign Teacher
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Teacher Modal */}
      <Modal isOpen={isChangeOpen} onClose={onChangeClose}>
        <ModalContent>
          <ModalHeader>Change Substitute Teacher</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedSubstitution && (
              <>
                <div className="bg-default-50 rounded-lg p-4 space-y-2">
                  <p><strong>Class:</strong> {getClassName(selectedSubstitution.classId)}</p>
                  <p><strong>Current Substitute:</strong> {getTeacherName(selectedSubstitution.substituteTeacherId)}</p>
                  <p><strong>Absent Teacher:</strong> {getTeacherName(selectedSubstitution.absentTeacherId)}</p>
                </div>

                <Select
                  label="Select New Teacher"
                  placeholder="Choose a new teacher"
                  selectedKeys={selectedTeacher ? [selectedTeacher] : []}
                  onSelectionChange={(keys) => setSelectedTeacher(Array.from(keys)[0])}
                  isRequired
                >
                  {getAvailableTeachers(selectedSubstitution.absentTeacherId).map(teacher => (
                    <SelectItem key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                      {teacher.name} ({teacher.department || 'Teacher'})
                    </SelectItem>
                  ))}
                </Select>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onChangeClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleChangeTeacher}
              isDisabled={!selectedTeacher}
            >
              Change Teacher
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
