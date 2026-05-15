import { useState, useMemo } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Avatar, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Select, SelectItem, User
} from "@heroui/react";
import { Users, X } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';
import SearchInput from "../../components/ui/SearchInput";
import Alert from "../../components/ui/Alert";
import EmptyState from "../../components/ui/EmptyState";


export default function BulkClassTeacherAssignment() {
  const { t } = useTranslation();
  const { staff, classesWithTeachers, classesApi, updateClassLocal, updateStaffLocal, refetch } = useApp();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('classes', 'edit');

  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    targetClass: null,
    selectedTeacherId: "",
  });

  const teachers = useMemo(() => {
    return staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      const staffTypes = Array.isArray(s.staffType) ? s.staffType : [s.staffType];
      return roles.includes('Teacher') || staffTypes.includes('Teacher') || s.isClassTeacher;
    });
  }, [staff]);

  // Find assignments for warnings
  const teacherAssignments = useMemo(() => {
    const map = {};
    classesWithTeachers.forEach(c => {
      if (c.classTeacherId) {
        if (!map[c.classTeacherId]) map[c.classTeacherId] = [];
        map[c.classTeacherId].push(c);
      }
    });
    return map;
  }, [classesWithTeachers]);

  const filteredClasses = useMemo(() => {
    let filtered = classesWithTeachers;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        `${c.name}-${c.section}`.toLowerCase().includes(search) ||
        (c.teacher && c.teacher.toLowerCase().includes(search))
      );
    }
    // Sort by class name then section
    return filtered.sort((a, b) => {
      const nameCompare = parseInt(a.name) - parseInt(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (a.section || '').localeCompare(b.section || '');
    });
  }, [classesWithTeachers, searchQuery]);

  const stats = useMemo(() => {
    const assigned = classesWithTeachers.filter(c => c.classTeacherId).length;
    const unassigned = classesWithTeachers.length - assigned;
    return { total: classesWithTeachers.length, assigned, unassigned };
  }, [classesWithTeachers]);

  const handleOpenAssign = (cls) => {
    if (!canEdit) {
      toast.error(t('toast.error.youDoNotHavePermissionToEditClassAssignments'));
      return;
    }
    setModal({
      isOpen: true,
      targetClass: cls,
      selectedTeacherId: cls.classTeacherId || "",
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      setModal({ isOpen: false, targetClass: null, selectedTeacherId: "" });
    }
  };

  const handleSaveAssignment = async () => {
    const { targetClass, selectedTeacherId } = modal;
    const teacherIdToSet = selectedTeacherId || null;

    // Prepare teacher info for optimistic update
    let teacherInfo = { name: null, picture: null };
    if (teacherIdToSet) {
      const teacher = teachers.find(tc => String(tc.id || tc._id) === String(teacherIdToSet));
      if (teacher) teacherInfo = { name: teacher.name, picture: teacher.picture };
    }

    // Save previous state for rollback
    const prevState = {
      classTeacherId: targetClass.classTeacherId,
      teacher: targetClass.teacher,
      teacherPhoto: targetClass.teacherPhoto
    };

    // Optimistic update — close modal and update UI immediately
    updateClassLocal(targetClass.id, {
      classTeacherId: teacherIdToSet,
      teacher: teacherInfo.name,
      teacherPhoto: teacherInfo.picture
    });

    // Update staff records to reflect the assignment
    if (prevState.classTeacherId && String(prevState.classTeacherId) !== String(teacherIdToSet)) {
      updateStaffLocal(prevState.classTeacherId, { classTeacherOf: null, isClassTeacher: false });
    }
    if (teacherIdToSet) {
      updateStaffLocal(teacherIdToSet, { classTeacherOf: `${targetClass.name}-${targetClass.section}`, isClassTeacher: true });
    }

    handleClose();

    try {
      setIsProcessing(true);
      await classesApi.updateClassTeacher(targetClass.id, teacherIdToSet);
      toast.success(t('toast.success.classTeacherUpdated', 'Class teacher updated for {{class}}', { class: `${targetClass.name}-${targetClass.section}` }));
      if (refetch) await refetch();
    } catch (error) {
      // Rollback on failure
      updateClassLocal(targetClass.id, prevState);
      logger.error('Error executing assignment:', error);
      toast.error(error.message || t('toast.error.failedToUpdateAssignment', 'Failed to update assignment'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassign = async (cls) => {
    if (!canEdit) {
      toast.error(t('toast.error.youDoNotHavePermissionToEditClassAssignments'));
      return;
    }

    // Save previous state for rollback
    const prevState = {
      classTeacherId: cls.classTeacherId,
      teacher: cls.teacher,
      teacherPhoto: cls.teacherPhoto
    };

    // Optimistic update
    updateClassLocal(cls.id, {
      classTeacherId: null,
      teacher: null,
      teacherPhoto: null
    });

    try {
      setIsProcessing(true);
      await classesApi.updateClassTeacher(cls.id, null);
      toast.success(t('toast.success.classTeacherRemoved', 'Removed class teacher from {{class}}', { class: `${cls.name}-${cls.section}` }));
      if (refetch) await refetch();
    } catch (error) {
      // Rollback on failure
      updateClassLocal(cls.id, prevState);
      logger.error('Error unassigning teacher:', error);
      toast.error(error.message || t('toast.error.failedToUnassignTeacher', 'Failed to unassign teacher'));
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTeacherCurrentClasses = useMemo(() => {
    if (!modal.selectedTeacherId) return [];
    return teacherAssignments[modal.selectedTeacherId] || [];
  }, [modal.selectedTeacherId, teacherAssignments]);

  return (
    <div className="w-full flex flex-col pt-0 gap-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-bg border-b border-divider py-4 -mx-6 -mt-6 px-6 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-fg">{t('pages.classTeachers1')}</h2>
          <Chip size="sm" variant="flat" color={stats.unassigned > 0 ? "warning" : "success"}>
            {stats.assigned} {t('classes.assigned', 'Assigned')} • {stats.unassigned} {t('classes.unassigned', 'Unassigned')}
          </Chip>
        </div>

        <SearchInput
          placeholder={t('pages.searchClassesOrTeachers')}
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full sm:max-w-[350px] px-3 py-2 bg-surface rounded-lg border border-border-token hover:border-border-strong focus-within:border-fg-faint transition-all"
        />
      </div>

      <Table
        aria-label={t('aria.tables.classTeachers')}
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 hover:bg-surface-2 transition-colors cursor-pointer [&_svg]:text-fg-faint [&:hover_svg]:text-fg-muted [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-divider group-data-[last=true]:border-none last:pr-6 select-text",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0",
          tr: "hover:bg-surface-2 transition-colors",
        }}
      >
        <TableHeader>
          <TableColumn scope="col">{t('pages.cLASS')}</TableColumn>
          <TableColumn scope="col">{t('pages.cLASSTeacher')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTUDENTS')}</TableColumn>
          <TableColumn align="center" scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody items={filteredClasses} emptyContent={
          <EmptyState
            icon={Users}
            title={t('classes.noClassesFound', 'No classes found')}
            description={t('classes.createClassesFirst', 'Create classes first before assigning teachers')}
            size="lg"
          />
        }>
          {(cls) => (
            <TableRow key={cls.id}>
              <TableCell>
                <div className="py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="font-semibold text-sm">{cls.name}</span>
                  </div>
                  <span className="font-medium text-fg">
                    {t('classes.classLabel', 'Class')} {cls.name}-{cls.section}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4">
                  {cls.classTeacherId ? (
                    <User
                      name={cls.teacher || 'Unknown'}
                      description={t('classes.classTeacher', 'Class Teacher')}
                      avatarProps={{
                        src: cls.teacherPhoto,
                        size: "sm",
                        className: "bg-surface-2"
                      }}
                    />
                  ) : (
                    <Chip size="sm" color="warning" variant="flat">{t('pages.unassigned1')}</Chip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4 text-sm text-fg-muted">
                  {cls.studentCount || 0} {t('classes.students', 'students')}
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => handleOpenAssign(cls)}
                    isDisabled={!canEdit}
                  >
                    {cls.classTeacherId ? t('classes.change', 'Change') : t('classes.assign', 'Assign')}
                  </Button>
                  {cls.classTeacherId && (
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      onPress={() => handleUnassign(cls)}
                      isDisabled={!canEdit}
                      title={t('pages.removeTeacher')}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={modal.isOpen} onClose={handleClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {t('classes.assignClassTeacher', 'Assign Class Teacher')}
            {modal.targetClass && (
              <span className="text-sm font-normal text-fg-muted">
                {t('classes.classLabel', 'Class')} {modal.targetClass.name}-{modal.targetClass.section}
              </span>
            )}
          </ModalHeader>
          <ModalBody>
            <Select
              label={t('pages.selectTeacher1')}
              placeholder={t('pages.chooseATeacher')}
              selectedKeys={modal.selectedTeacherId ? [modal.selectedTeacherId] : []}
              onSelectionChange={(keys) => {
                const arr = Array.from(keys);
                setModal(prev => ({ ...prev, selectedTeacherId: arr[0] || "" }));
              }}
              variant="bordered"
              classNames={{ popoverContent: "max-h-[300px]" }}
            >
              {teachers.map(t => (
                <SelectItem key={String(t.id || t._id)} value={String(t.id || t._id)} textValue={t.name}>
                  <div className="flex items-center gap-2">
                    <Avatar alt={t.name} className="flex-shrink-0" size="sm" src={t.picture} />
                    <div className="flex flex-col">
                      <span className="text-small">{t.name}</span>
                      <span className="text-tiny text-fg-faint">{t.department || 'Teacher'}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>

            {modal.selectedTeacherId && selectedTeacherCurrentClasses.length > 0 && (
              <Alert
                variant="warning"
                title={t('pages.alreadyAssignedToOtherClasses')}
                className="mt-4"
              >
                {t('classes.teacherAlreadyAssignedWarning', 'This teacher is currently the class teacher for: {{classes}}. They will manage multiple classes.', { classes: selectedTeacherCurrentClasses.map(c => `${c.name}-${c.section}`).join(', ') })}
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose} isDisabled={isProcessing}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button color="primary" onPress={handleSaveAssignment} isLoading={isProcessing}>
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
