import { useState, useEffect, useMemo } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Chip, Input, Card, CardBody
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { UserCheck, Calendar, Clock, Plus, Search, Filter, X, UserPlus, RefreshCw, UserMinus } from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { DEFAULT_PERIODS } from '../../utils/constants';
import { useTranslation } from 'react-i18next';
import { toTodayDateString } from '../../utils/dateFormatter';

export default function Substitution() {
  const { t } = useTranslation();
  const { teachers, classes, schoolSettings } = useApp();
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toTodayDateString());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, assigned, not_assigned

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    date: toTodayDateString(),
    classId: '',
    period: '',
    absentTeacherId: '',
    substituteTeacherId: '',
    reason: '',
    type: 'auto'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Additional modals for assign/change teacher
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isChangeOpen, onOpen: onChangeOpen, onClose: onChangeClose } = useDisclosure();
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
      // Fallback to default periods — extract string indices (same shape as timetable branch)
      const periodNumbers = DEFAULT_PERIODS
        .filter(p => !p.isBreak)
        .map((p, index) => String(index + 1));
      setPeriods(periodNumbers);
    }
  }, [schoolSettings]);

  useEffect(() => {
    loadSubstitutions();
  }, [selectedDate]);

  const loadSubstitutions = async () => {
    try {
      setLoading(true);
      const data = await request(`/substitutions?date=${selectedDate}`);
      setSubstitutions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading substitutions:', error);
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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    const newErrors = {};
    if (!formData.classId) newErrors.classId = t('toast.error.pleaseFillAllRequiredFields');
    if (!formData.absentTeacherId) newErrors.absentTeacherId = t('toast.error.pleaseFillAllRequiredFields');
    if (!formData.period) newErrors.period = t('toast.error.pleaseFillAllRequiredFields');
    if (!formData.substituteTeacherId) newErrors.substituteTeacherId = t('toast.error.pleaseFillAllRequiredFields');
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(t('toast.error.pleaseFillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      await request('/substitutions', { method: 'POST', body: JSON.stringify(formData) });
      toast.success(t('toast.success.substitutionAssignedSuccessfully'));
      onClose();
      resetForm();
      loadSubstitutions();
    } catch (error) {
      toast.error(error.message || t('toast.error.failedToAssignSubstitution', 'Failed to assign substitution'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await request(`/substitutions/${id}`, { method: 'DELETE' });
      toast.success(t('toast.success.substitutionRemoved'));
      loadSubstitutions();
    } catch (error) {
      toast.error(t('toast.error.failedToRemoveSubstitution'));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedSubstitution || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await request(`/substitutions/${selectedSubstitution._id}`, {
        method: 'PUT',
        body: JSON.stringify({ substituteTeacherId: selectedTeacher, status: 'assigned' })
      });
      toast.success(t('toast.success.teacherAssignedSuccessfully'));
      onAssignClose();
      setSelectedSubstitution(null);
      setSelectedTeacher("");
      loadSubstitutions();
    } catch (error) {
      toast.error(t('toast.error.failedToAssignTeacher'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeTeacher = async () => {
    if (!selectedTeacher || !selectedSubstitution || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await request(`/substitutions/${selectedSubstitution._id}`, {
        method: 'PUT',
        body: JSON.stringify({ substituteTeacherId: selectedTeacher })
      });
      toast.success(t('toast.success.teacherChangedSuccessfully'));
      onChangeClose();
      setSelectedSubstitution(null);
      setSelectedTeacher("");
      loadSubstitutions();
    } catch (error) {
      toast.error(t('toast.error.failedToChangeTeacher'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: toTodayDateString(),
      classId: '',
      period: '',
      absentTeacherId: '',
      substituteTeacherId: '',
      reason: '',
      type: 'auto'
    });
    setFormErrors({});
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return t('common.unknown', 'Unknown');
    const tid = String(teacherId);
    const teacher = teachers.find(tc => String(tc.id) === tid || String(tc._id) === tid);
    return teacher ? teacher.name : t('common.unknown', 'Unknown');
  };

  // FIXED: Use String() comparison for ObjectId matching
  const getClassName = (classId) => {
    const cls = classes.find(c => String(c.id) === String(classId) || String(c._id) === String(classId));
    return cls ? `${cls.name}-${cls.section}` : 'Unknown';
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'assigned':
        return <Chip size="sm" color="success" variant="flat">{t('pages.assigned1')}</Chip>;
      case 'not_assigned':
        return <Chip size="sm" color="warning" variant="flat">{t('pages.notAssigned1')}</Chip>;
      case 'pending':
        return <Chip size="sm" color="warning" variant="flat">{t('classes.pending', 'Pending')}</Chip>;
      case 'completed':
        return <Chip size="sm" color="default" variant="flat">{t('pages.completed')}</Chip>;
      case 'cancelled':
        return <Chip size="sm" color="danger" variant="flat">{t('classes.cancelled', 'Cancelled')}</Chip>;
      default:
        return <Chip size="sm" color="default" variant="flat">{status || t('classes.pending', 'Pending')}</Chip>;
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
            placeholder={t('pages.searchSubstitutions')}
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
              placeholder={t('pages.status2')}
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
              size="sm"
              variant="flat"
              classNames={{
                trigger: "bg-default-100 data-[hover=true]:bg-default-200",
              }}
            >
              <SelectItem key="all">{t('pages.allStatus1')}</SelectItem>
              <SelectItem key="assigned">{t('pages.assigned1')}</SelectItem>
              <SelectItem key="not_assigned">{t('pages.notAssigned1')}</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="completed">{t('pages.completed')}</SelectItem>
              <SelectItem key="cancelled">Cancelled</SelectItem>
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
            {t('classes.newSubstitution', 'New Substitution')}
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
            {filteredSubstitutions.length} {t('classes.substitutionsFound', 'substitution(s) found')}
          </Chip>
        )}
        {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length > 0 && (
          <Chip size="sm" color="success" variant="flat" className="h-6">
            {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length} {t('classes.assigned', 'assigned')}
          </Chip>
        )}
        {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length > 0 && (
          <Chip size="sm" color="warning" variant="flat" className="h-6">
            {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length} {t('classes.pending', 'pending')}
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
            {t('common.clearFilters', 'Clear Filters')}
          </Button>
        )}
      </div>

      {/* Substitutions Table */}
      {loading ? (
        <TablePageSkeleton />
      ) : filteredSubstitutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50/50 rounded-lg border border-dashed border-default-200">
          <Calendar size={48} className="text-default-300 mb-4" />
          <p className="text-default-500 font-medium">{t('pages.noSubstitutionsFound')}</p>
          <p className="text-default-400 text-sm mt-1">{t('pages.tryChangingTheDateOrFilters')}</p>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="mt-4"
            onPress={onOpen}
          >
            {t('classes.createSubstitution', 'Create Substitution')}
          </Button>
        </div>
      ) : (
        <Table
          aria-label={t('aria.tables.substitutions')}
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
            <TableColumn scope="col">{t('pages.cLASS')}</TableColumn>
            <TableColumn scope="col">{t('classes.periodSubject', 'PERIOD / SUBJECT')}</TableColumn>
            <TableColumn scope="col">{t('pages.tEACHERAbsent')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn scope="col">{t('pages.rEASON')}</TableColumn>
            <TableColumn align="center" scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody items={filteredSubstitutions} emptyContent={
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-default-600 mb-1">{t('classes.noSubstitutionsScheduled', 'No substitutions scheduled')}</p>
              <p className="text-xs text-default-400">{t('classes.createSubstitutionWhenAbsent', 'Create a substitution when a teacher is absent')}</p>
            </div>
          }>
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
                    <span className="font-medium text-sm">{t('classes.periodN', 'Period {{n}}', { n: sub.period })}</span>
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
                        {t('classes.assign', 'Assign')}
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
                          {t('classes.change', 'Change')}
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => setDeleteConfirmId(sub._id)}
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

      <Modal isOpen={isOpen} onClose={() => { onClose(); setFormErrors({}); }} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.createSubstitution')}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label={t('pages.date2')}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                isRequired
              />
              <Select
                label={t('pages.class1')}
                placeholder={t('pages.selectClass2')}
                selectedKeys={formData.classId ? [formData.classId] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0];
                  setFormData({ ...formData, classId: selectedId || '' });
                  setFormErrors(prev => ({ ...prev, classId: '' }));
                }}
                isRequired
                isInvalid={!!formErrors.classId}
                errorMessage={formErrors.classId}
              >
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}-{cls.section}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label={t('pages.period2')}
                placeholder={t('pages.selectPeriod')}
                selectedKeys={formData.period ? [formData.period] : []}
                onSelectionChange={(keys) => {
                  const selectedPeriod = Array.from(keys)[0];
                  setFormData({ ...formData, period: selectedPeriod || '' });
                  setFormErrors(prev => ({ ...prev, period: '' }));
                }}
                isRequired
                isInvalid={!!formErrors.period}
                errorMessage={formErrors.period}
              >
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t('classes.periodN', 'Period {{n}}', { n: p })}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label={t('pages.absentTeacherOptional')}
                placeholder={t('pages.selectTeacher')}
                selectedKeys={formData.absentTeacherId ? [formData.absentTeacherId] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0];
                  setFormData({ ...formData, absentTeacherId: selectedId || '' });
                }}
              >
                {teachers.filter(t => {
                  const roles = Array.isArray(t.role) ? t.role : (t.role ? [t.role] : []);
                  return roles.includes('Teacher');
                }).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </SelectItem>
                ))}
              </Select>
              <Select
                label={t('pages.substituteTeacher')}
                placeholder={t('pages.selectSubstitute')}
                selectedKeys={formData.substituteTeacherId ? [formData.substituteTeacherId] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0];
                  setFormData({ ...formData, substituteTeacherId: selectedId || '' });
                  setFormErrors(prev => ({ ...prev, substituteTeacherId: '' }));
                }}
                isRequired
                className="col-span-2"
                isInvalid={!!formErrors.substituteTeacherId}
                errorMessage={formErrors.substituteTeacherId}
              >
                {teachers.filter(t => {
                  const roles = Array.isArray(t.role) ? t.role : (t.role ? [t.role] : []);
                  return roles.includes('Teacher');
                }).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </SelectItem>
                ))}
              </Select>
              <Input
                label={t('pages.reason')}
                placeholder={t('pages.enterReasonForSubstitution')}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
              {t('classes.createSubstitution', 'Create Substitution')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose}>
        <ModalContent>
          <ModalHeader>{t('pages.assignSubstituteTeacher1')}</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedSubstitution && (
              <>
                <div className="bg-default-50 rounded-lg p-4 space-y-2">
                  <p><strong>{t('pages.class2')}</strong> {getClassName(selectedSubstitution.classId)}</p>
                  <p><strong>{t('pages.period3')}</strong> {selectedSubstitution.period}</p>
                  <p><strong>{t('pages.absentTeacher1')}</strong> {getTeacherName(selectedSubstitution.absentTeacherId)}</p>
                </div>

                <Select
                  label={t('pages.selectSubstituteTeacher')}
                  placeholder={t('pages.chooseATeacher')}
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
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleAssignTeacher}
              isDisabled={!selectedTeacher}
            >
              {t('classes.assignTeacher', 'Assign Teacher')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Teacher Modal */}
      <Modal isOpen={isChangeOpen} onClose={onChangeClose}>
        <ModalContent>
          <ModalHeader>{t('pages.changeSubstituteTeacher')}</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedSubstitution && (
              <>
                <div className="bg-default-50 rounded-lg p-4 space-y-2">
                  <p><strong>{t('pages.class2')}</strong> {getClassName(selectedSubstitution.classId)}</p>
                  <p><strong>{t('pages.currentSubstitute')}</strong> {getTeacherName(selectedSubstitution.substituteTeacherId)}</p>
                  <p><strong>{t('pages.absentTeacher1')}</strong> {getTeacherName(selectedSubstitution.absentTeacherId)}</p>
                </div>

                <Select
                  label={t('pages.selectNewTeacher')}
                  placeholder={t('pages.chooseANewTeacher')}
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
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleChangeTeacher}
              isDisabled={!selectedTeacher}
            >
              {t('classes.changeTeacher', 'Change Teacher')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} size="sm">
        <ModalContent>
          <ModalHeader>{t('confirm.removeSubstitutionTitle', 'Remove Substitution')}</ModalHeader>
          <ModalBody>
            <p className="text-default-600">{t('confirm.removeSubstitution', 'Are you sure you want to remove this substitution?')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setDeleteConfirmId(null)}>{t('common.cancel', 'Cancel')}</Button>
            <Button color="danger" onPress={() => handleDelete(deleteConfirmId)}>{t('common.remove', 'Remove')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
