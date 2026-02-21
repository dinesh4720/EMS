import { useState, useMemo, useCallback } from "react";
import {
  Card, Input, Select, SelectItem, Chip,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure
} from "@heroui/react";
import { Search, ArrowLeftRight, X } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";

/**
 * BulkClassTeacherAssignment - Page for assigning class teachers to all classes at once
 * Enforces the constraint: one teacher can only be class teacher to ONE class
 * Dropdown organized by classes with exchange/swap functionality
 */
export default function BulkClassTeacherAssignment() {
  const { staff, classesWithTeachers, classesApi, updateClassLocal, refetch } = useApp();
  const { hasPermission } = usePermissions();
  const { isOpen: isSwapOpen, onOpen: onSwapOpen, onClose: onSwapClose } = useDisclosure();

  // Permission check
  const canEdit = hasPermission('classes', 'edit');

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSwap, setPendingSwap] = useState(null);

  // Extract unique grades from classes
  const grades = useMemo(() => {
    const gradeSet = new Set();
    classesWithTeachers.forEach(c => {
      if (c.name) gradeSet.add(c.name);
    });
    return Array.from(gradeSet).sort((a, b) => parseInt(a) - parseInt(b));
  }, [classesWithTeachers]);

  // Get all teachers (filter for teachers only)
  const teachers = useMemo(() => {
    return staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      const staffTypes = Array.isArray(s.staffType) ? s.staffType : [s.staffType];
      return roles.includes('Teacher') || staffTypes.includes('Teacher') || s.isClassTeacher;
    });
  }, [staff]);

  // Get assigned teachers map
  const assignedTeachersMap = useMemo(() => {
    const map = {};
    teachers.forEach(teacher => {
      const teacherId = String(teacher.id || teacher._id);
      const assignment = classesWithTeachers.find(c =>
        String(c.classTeacherId) === teacherId
      );
      if (assignment) {
        map[teacherId] = {
          ...teacher,
          currentAssignment: assignment
        };
      }
    });
    return map;
  }, [teachers, classesWithTeachers]);

  // Group classes by grade for dropdown
  const classesByGrade = useMemo(() => {
    const grouped = {};
    classesWithTeachers.forEach(cls => {
      const grade = cls.name || 'Unknown';
      if (!grouped[grade]) {
        grouped[grade] = [];
      }
      grouped[grade].push(cls);
    });

    // Sort sections within each grade
    Object.keys(grouped).forEach(grade => {
      grouped[grade].sort((a, b) => (a.section || '').localeCompare(b.section || ''));
    });

    return grouped;
  }, [classesWithTeachers]);

  // Filter classes by search and grade
  const filteredClasses = useMemo(() => {
    return classesWithTeachers.filter(cls => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          `${cls.name}-${cls.section}`.toLowerCase().includes(searchLower) ||
          cls.teacher?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (gradeFilter !== 'all' && cls.name !== gradeFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const nameCompare = parseInt(a.name) - parseInt(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (a.section || '').localeCompare(b.section || '');
    });
  }, [classesWithTeachers, searchQuery, gradeFilter]);

  // Handle teacher assignment with swap support
  const handleQuickAssign = useCallback(async (cls, teacher, performSwap = false) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit class assignments');
      return;
    }

    // Handle removing teacher assignment
    if (!teacher || !teacher.id) {
      try {
        setIsProcessing(true);
        await classesApi.updateClassTeacher(cls.id, null);

        updateClassLocal(cls.id, {
          classTeacherId: null,
          teacher: null,
          teacherPhoto: null
        });

        toast.success('Class teacher removed');
        if (refetch) await refetch();
      } catch (error) {
        console.error('Error removing teacher:', error);
        toast.error(error.message || 'Failed to remove teacher');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const teacherId = String(teacher.id || teacher._id);

    // Check if teacher is assigned to another class
    const existingAssignment = assignedTeachersMap[teacherId];
    const isAssignedElsewhere = existingAssignment && String(existingAssignment.currentAssignment?.id) !== String(cls.id);

    // If assigned elsewhere and not performing swap, show swap modal
    if (isAssignedElsewhere && !performSwap) {
      setPendingSwap({
        targetClass: cls,
        targetTeacher: teacher,
        sourceClass: existingAssignment.currentAssignment,
        sourceTeacher: existingAssignment
      });
      onSwapOpen();
      return;
    }

    try {
      setIsProcessing(true);

      // If this teacher was previously assigned to another class, remove them from there first
      if (isAssignedElsewhere && performSwap) {
        const sourceClass = existingAssignment.currentAssignment;
        await classesApi.updateClassTeacher(sourceClass.id, null);
        updateClassLocal(sourceClass.id, {
          classTeacherId: null,
          teacher: null,
          teacherPhoto: null
        });
      }

      await classesApi.updateClassTeacher(cls.id, teacherId);

      updateClassLocal(cls.id, {
        classTeacherId: teacherId,
        teacher: teacher.name,
        teacherPhoto: teacher.picture
      });

      if (performSwap) {
        toast.success(`Exchanged: ${teacher.name} is now class teacher of Class ${cls.name}${cls.section ? `-${cls.section}` : ''}`);
      } else {
        toast.success(`${teacher.name} assigned as class teacher`);
      }

      if (refetch) await refetch();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      toast.error(error.message || 'Failed to assign teacher');
    } finally {
      setIsProcessing(false);
    }
  }, [canEdit, assignedTeachersMap, classesApi, updateClassLocal, refetch, onSwapOpen]);

  // Handle the swap confirmation
  const confirmSwap = useCallback(async () => {
    if (pendingSwap) {
      await handleQuickAssign(pendingSwap.targetClass, pendingSwap.targetTeacher, true);
      setPendingSwap(null);
      onSwapClose();
    }
  }, [pendingSwap, handleQuickAssign, onSwapClose]);

  // Cancel swap
  const cancelSwap = useCallback(() => {
    setPendingSwap(null);
    onSwapClose();
  }, [onSwapClose]);

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
        {/* Left Side - Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[350px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <Search size={16} className="text-default-400" />
            <input
              type="search"
              name="class-search-query"
              placeholder="Search classes..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                <X size={14} className="text-default-400" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side - Filters */}
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Select
            placeholder="Filter by grade"
            selectedKeys={gradeFilter !== 'all' ? [gradeFilter] : []}
            onSelectionChange={(keys) => setGradeFilter(Array.from(keys)[0] || 'all')}
            size="sm"
            variant="flat"
            classNames={{
              trigger: "bg-transparent border border-default-200 hover:bg-default-100 min-h-10 rounded-lg",
              value: "text-default-700 font-medium"
            }}
            className="w-full sm:w-48"
            aria-label="Filter by grade"
          >
            <SelectItem key="all">All Grades</SelectItem>
            {grades.map(grade => (
              <SelectItem key={grade}>{`Class ${grade}`}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table with Inline Teacher Selection */}
      <Table
        aria-label="Class Teachers Assignment"
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0",
          tr: "",
        }}
      >
        <TableHeader>
          <TableColumn>CLASS</TableColumn>
          <TableColumn>SECTION</TableColumn>
          <TableColumn>STUDENTS</TableColumn>
          <TableColumn>CLASS TEACHER</TableColumn>
          <TableColumn>STATUS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No classes found">
          {filteredClasses.map(cls => {
            const hasTeacher = cls.classTeacherId && cls.teacher;
            const assignedTeacher = assignedTeachersMap[String(cls.classTeacherId)];

            return (
              <TableRow key={cls.id} className="hover:bg-default-50">
                <TableCell>
                  <div className="py-5">
                    <span className="font-semibold text-default-900">Class {cls.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-5">
                    <Chip size="sm" variant="flat" color="secondary">{cls.section || '-'}</Chip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-5">
                    <span className="text-default-600">{cls.studentCount || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-5">
                    {canEdit ? (
                      <Select
                        placeholder="Select teacher"
                        selectedKeys={cls.classTeacherId ? [String(cls.classTeacherId)] : []}
                        onSelectionChange={async (keys) => {
                          const teacherId = Array.from(keys)[0];
                          if (!teacherId) {
                            await handleQuickAssign(cls, { id: null, name: null });
                          } else {
                            const teacher = teachers.find(s => String(s.id || s._id) === String(teacherId));
                            if (teacher) {
                              await handleQuickAssign(cls, teacher);
                            }
                          }
                        }}
                        size="sm"
                        variant="bordered"
                        className="w-64"
                        aria-label="Select class teacher"
                        isDisabled={isProcessing}
                        items={teachers}
                      >
                        {(teacher) => {
                          const existingAssignment = assignedTeachersMap[String(teacher.id || teacher._id)];
                          const isCurrentClass = String(existingAssignment?.currentAssignment?.id) === String(cls.id);
                          const isAssignedElsewhere = existingAssignment && !isCurrentClass;

                          return (
                            <SelectItem
                              key={String(teacher.id || teacher._id)}
                              textValue={teacher.name}
                            >
                              <div className="flex items-center justify-between">
                                <span>{teacher.name}</span>
                                {isCurrentClass && (
                                  <Chip size="sm" color="success" variant="flat" className="ml-2">Current</Chip>
                                )}
                                {isAssignedElsewhere && (
                                  <Chip size="sm" color="warning" variant="flat" className="ml-2">
                                    <ArrowLeftRight size={10} className="mr-1" />
                                    Class {existingAssignment.currentAssignment.name}{existingAssignment.currentAssignment.section ? `-${existingAssignment.currentAssignment.section}` : ''}
                                  </Chip>
                                )}
                              </div>
                            </SelectItem>
                          );
                        }}
                      </Select>
                    ) : (
                      hasTeacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center overflow-hidden">
                            {assignedTeacher?.picture ? (
                              <img src={assignedTeacher.picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-success-600 font-medium">{cls.teacher?.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-success-700">{cls.teacher}</span>
                        </div>
                      ) : (
                        <span className="text-default-400 italic">No teacher</span>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-5">
                    {hasTeacher ? (
                      <Chip size="sm" color="success" variant="flat">Assigned</Chip>
                    ) : (
                      <Chip size="sm" color="warning" variant="flat">Unassigned</Chip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Swap Confirmation Modal */}
      <Modal isOpen={isSwapOpen} onClose={cancelSwap} size="sm">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={20} className="text-warning-500" />
              Exchange Teachers?
            </div>
          </ModalHeader>
          <ModalBody>
            {pendingSwap && (
              <div className="space-y-4 py-2">
                <p className="text-default-600">
                  <strong>{pendingSwap.targetTeacher.name}</strong> is currently assigned to{' '}
                  <strong>Class {pendingSwap.sourceClass.name}{pendingSwap.sourceClass.section ? `-${pendingSwap.sourceClass.section}` : ''}</strong>.
                </p>
                <p className="text-default-600">
                  Would you like to exchange teachers between these two classes?
                </p>
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="text-center">
                    <div className="font-medium text-default-900">
                      Class {pendingSwap.targetClass.name}{pendingSwap.targetClass.section ? `-${pendingSwap.targetClass.section}` : ''}
                    </div>
                    <div className="text-sm text-default-500">← Exchange →</div>
                    <div className="font-medium text-default-900">
                      Class {pendingSwap.sourceClass.name}{pendingSwap.sourceClass.section ? `-${pendingSwap.sourceClass.section}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={cancelSwap}>
              Cancel
            </Button>
            <Button color="warning" onPress={confirmSwap}>
              <ArrowLeftRight size={16} className="mr-1" />
              Exchange
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
