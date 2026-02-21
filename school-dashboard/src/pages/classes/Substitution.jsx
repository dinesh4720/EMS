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
import { DEFAULT_PERIODS } from '../../utils/constants';

export default function Substitution() {
  const { teachers, classes, schoolSettings } = useApp();
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

  // Fetch periods from school settings or use default
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    // Try to get periods from school settings first
    if (schoolSettings?.timetable?.periods && schoolSettings.timetable.periods.length > 0) {
      // Extract period numbers from timetable settings
      const periodNumbers = schoolSettings.timetable.periods
        .filter(p => !p.isBreak)
        .map((p, index) => String(index + 1));
      setPeriods(periodNumbers);
    } else if (schoolSettings?.periods && schoolSettings.periods.length > 0) {
      setPeriods(schoolSettings.periods);
    } else {
      // Fallback to default periods
      setPeriods(DEFAULT_PERIODS);
    }
  }, [schoolSettings]);

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

  // FIXED: Use String() comparison for ObjectId matching
  const getClassName = (classId) => {
    const cls = classes.find(c => String(c.id) === String(classId) || String(c._id) === String(classId));
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
    return teachers.filter(t => {
      const roles = Array.isArray(t.role) ? t.role : (t.role ? [t.role] : []);
      const staffTypes = Array.isArray(t.staffType) ? t.staffType : (t.staffType ? [t.staffType] : []);
      return t.status === 'active' &&
        t._id !== absentTeacherId &&
        t.id !== absentTeacherId &&
        (roles.includes('Teacher') || staffTypes.includes('Teacher') || t.isClassTeacher);
    });
  };

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-4">
        {/* Left Side - Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-background">
          <Input
            placeholder="Search substitutions..."
            size="sm"
            startContent={<Search size={16} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="w-full sm:w-64"
            variant="flat"
            isClearable
            onClear={() => setSearchQuery("")}
            classNames={{
              inputWrapper: "bg-default-100 data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default-100",
            }}
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              placeholder="Status"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
              size="sm"
              variant="flat"
              classNames={{
                trigger: "bg-default-100 data-[hover=true]:bg-default-200",
              }}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="assigned">Assigned</SelectItem>
              <SelectItem key="not_assigned">Not Assigned</SelectItem>
            </Select>

            <Input
              type="date"
              size="sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-36"
              variant="flat"
              classNames={{
                inputWrapper: "bg-default-100 data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default-100",
              }}
            />
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            color="primary"
            startContent={<Plus size={16} />}
            onPress={onOpen}
          >
            New Substitution
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={loadSubstitutions}
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex gap-2 flex-wrap mb-4 px-1">
        {filteredSubstitutions.length > 0 && (
          <Chip size="sm" variant="flat" className="h-6">
            {filteredSubstitutions.length} substitution{filteredSubstitutions.length !== 1 ? 's' : ''} found
          </Chip>
        )}
        {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length > 0 && (
          <Chip size="sm" color="success" variant="flat" className="h-6">
            {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length} assigned
          </Chip>
        )}
        {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length > 0 && (
          <Chip size="sm" color="warning" variant="flat" className="h-6">
            {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length} pending
          </Chip>
        )}
        {(searchQuery || statusFilter !== 'all') && (
          <Button
            size="sm"
            color="danger"
            variant="light"
            onPress={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="h-6 min-w-0 px-2 text-xs"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Substitutions Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : filteredSubstitutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50/50 rounded-lg border border-dashed border-default-200">
          <Calendar size={48} className="text-default-300 mb-4" />
          <p className="text-default-500 font-medium">No substitutions found</p>
          <p className="text-default-400 text-sm mt-1">Try changing the date or filters</p>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="mt-4"
            onPress={onOpen}
          >
            Create Substitution
          </Button>
        </div>
      ) : (
        <Table
          aria-label="Substitutions table"
          removeWrapper
          radius="none"
          classNames={{
            base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
            thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-24",
            th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
            td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
            tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-24 [&>tr:first-child>td]:pt-0",
            tr: "hover:bg-default-50/50 transition-colors",
          }}
        >
          <TableHeader>
            <TableColumn>CLASS</TableColumn>
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
                  <div className="py-4">
                    <p className="font-semibold text-default-800">{getClassName(sub.classId)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 flex items-center gap-2">
                    <Clock size={14} className="text-default-400" />
                    <span className="font-medium text-sm">Period {sub.period}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    <p className="font-medium text-default-800 text-sm">{getTeacherName(sub.absentTeacherId)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 space-y-1">
                    {getStatusChip(sub.status || (sub.substituteTeacherId ? 'assigned' : 'not_assigned'))}
                    {sub.substituteTeacherId && (
                      <p className="text-xs text-default-500 flex items-center gap-1 mt-1">
                        <span>→</span>
                        <span className="font-medium text-default-700">{getTeacherName(sub.substituteTeacherId)}</span>
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    <p className="text-sm text-default-600 truncate max-w-[200px]" title={sub.reason}>{sub.reason || '-'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 flex justify-center gap-2">
                    {!sub.substituteTeacherId || sub.status === 'not_assigned' ? (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => {
                          setSelectedSubstitution(sub);
                          onAssignOpen();
                        }}
                        className="font-medium"
                      >
                        Assign
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setSelectedSubstitution(sub);
                            onChangeOpen();
                          }}
                        >
                          Change
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => handleDelete(sub._id)}
                        >
                          <UserMinus size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

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
    </div>
  );
}
