import { useState, useMemo } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Avatar, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Select, SelectItem, User
} from "@heroui/react";
import { Search, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";

export default function BulkClassTeacherAssignment() {
  const { staff, classesWithTeachers, classesApi, updateClassLocal, refetch } = useApp();
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
      toast.error('You do not have permission to edit class assignments');
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
    try {
      setIsProcessing(true);
      const { targetClass, selectedTeacherId } = modal;

      const teacherIdToSet = selectedTeacherId || null;

      await classesApi.updateClassTeacher(targetClass.id, teacherIdToSet);

      let teacherInfo = { name: null, picture: null };
      if (teacherIdToSet) {
        const t = teachers.find(t => String(t.id || t._id) === String(teacherIdToSet));
        if (t) {
          teacherInfo = { name: t.name, picture: t.picture };
        }
      }

      updateClassLocal(targetClass.id, {
        classTeacherId: teacherIdToSet,
        teacher: teacherInfo.name,
        teacherPhoto: teacherInfo.picture
      });

      toast.success(`Updated class teacher for Class ${targetClass.name}-${targetClass.section}`);
      if (refetch) await refetch();
      handleClose();
    } catch (error) {
      console.error('Error executing assignment:', error);
      toast.error(error.message || 'Failed to update assignment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassign = async (cls) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit class assignments');
      return;
    }
    try {
      setIsProcessing(true);
      await classesApi.updateClassTeacher(cls.id, null);
      updateClassLocal(cls.id, {
        classTeacherId: null,
        teacher: null,
        teacherPhoto: null
      });
      toast.success(`Removed class teacher from Class ${cls.name}-${cls.section}`);
      if (refetch) await refetch();
    } catch (error) {
      console.error('Error unassigning teacher:', error);
      toast.error(error.message || 'Failed to unassign teacher');
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
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-default-800">Class Teachers</h2>
          <Chip size="sm" variant="flat" color={stats.unassigned > 0 ? "warning" : "success"}>
            {stats.assigned} Assigned • {stats.unassigned} Unassigned
          </Chip>
        </div>

        <div className="flex items-center gap-2 w-full sm:max-w-[350px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 focus-within:border-primary transition-all">
          <Search size={16} className="text-default-400" />
          <input
            type="search"
            placeholder="Search classes or teachers..."
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded">
              <X size={14} className="text-default-400" />
            </button>
          )}
        </div>
      </div>

      <Table
        aria-label="Class Teachers table"
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0",
          tr: "hover:bg-default-50/50 transition-colors",
        }}
      >
        <TableHeader>
          <TableColumn>CLASS</TableColumn>
          <TableColumn>CLASS TEACHER</TableColumn>
          <TableColumn>STUDENTS</TableColumn>
          <TableColumn align="center">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody items={filteredClasses} emptyContent="No classes found">
          {(cls) => (
            <TableRow key={cls.id}>
              <TableCell>
                <div className="py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="font-semibold text-sm">{cls.name}</span>
                  </div>
                  <span className="font-medium text-default-900">
                    Class {cls.name}-{cls.section}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4">
                  {cls.classTeacherId ? (
                    <User
                      name={cls.teacher || 'Unknown'}
                      description="Class Teacher"
                      avatarProps={{
                        src: cls.teacherPhoto,
                        size: "sm",
                        className: "bg-default-100"
                      }}
                    />
                  ) : (
                    <Chip size="sm" color="warning" variant="flat">Unassigned</Chip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4 text-sm text-default-600">
                  {cls.studentCount || 0} students
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
                    {cls.classTeacherId ? 'Change' : 'Assign'}
                  </Button>
                  {cls.classTeacherId && (
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      onPress={() => handleUnassign(cls)}
                      isDisabled={!canEdit}
                      title="Remove Teacher"
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
            Assign Class Teacher
            {modal.targetClass && (
              <span className="text-sm font-normal text-default-500">
                Class {modal.targetClass.name}-{modal.targetClass.section}
              </span>
            )}
          </ModalHeader>
          <ModalBody>
            <Select
              label="Select Teacher"
              placeholder="Choose a teacher"
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
                      <span className="text-tiny text-default-400">{t.department || 'Teacher'}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>

            {modal.selectedTeacherId && selectedTeacherCurrentClasses.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-warning-50 border border-warning-200 flex gap-3">
                <AlertCircle size={20} className="text-warning-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-800">Already assigned to other classes</p>
                  <p className="text-xs text-warning-600 mt-1">
                    This teacher is currently the class teacher for: {selectedTeacherCurrentClasses.map(c => `Class ${c.name}-${c.section}`).join(', ')}.
                    They will manage multiple classes.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose} isDisabled={isProcessing}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveAssignment} isLoading={isProcessing}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
