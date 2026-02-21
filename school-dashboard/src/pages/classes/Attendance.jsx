import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Select, SelectItem, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea, Spinner } from "@heroui/react";
import { Download, Check, X, Lock, Bell, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { attendanceApi } from "../../services/api";

const ITEMS_PER_LOAD = 10;

export default function Attendance({ classId }) {
  const navigate = useNavigate();
  const { students, classesWithTeachers } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(classId || "6-A");
  const [attendance, setAttendance] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editReason, setEditReason] = useState("");

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.class === selectedClass);
  }, [students, selectedClass]);

  // Initialize attendance for class students
  useMemo(() => {
    const newAttendance = {};
    classStudents.forEach(s => {
      if (!(s.id in attendance)) {
        newAttendance[s.id] = "present";
      }
    });
    if (Object.keys(newAttendance).length > 0) {
      setAttendance(prev => ({ ...prev, ...newAttendance }));
    }
  }, [classStudents]);

  const totalPages = Math.ceil(classStudents.length / ITEMS_PER_LOAD);
  const visibleStudents = useMemo(() => {
    return classStudents.slice(0, visibleCount);
  }, [classStudents, visibleCount]);

  const hasMore = visibleCount < classStudents.length;

  // Reset visible count when class changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [selectedClass]);

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const markAttendance = (studentId, status) => {
    if (!isLocked) setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    if (!isLocked) {
      const newAttendance = {};
      classStudents.forEach(s => { newAttendance[s.id] = "present"; });
      setAttendance(prev => ({ ...prev, ...newAttendance }));
    }
  };

  const handleSaveAttendance = async () => {
    if (isLocked || isSaving) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Convert attendance state to API format
      const attendanceData = classStudents.map(student => ({
        studentId: student.id,
        status: attendance[student.id] || "present"
      }));

      // Call the bulk attendance API
      const response = await attendanceApi.markBulk({
        classId: selectedClass,
        date: date,
        attendance: attendanceData
      });

      // Show success message
      setSaveMessage({
        type: 'success',
        text: `Attendance saved for ${response.results?.length || classStudents.length} students`
      });

      // Auto-hide message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSaveMessage({
        type: 'error',
        text: error.message || 'Failed to save attendance'
      });

      // Auto-hide error message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = classStudents.filter(s => attendance[s.id] === "present").length;
  const absentCount = classStudents.filter(s => attendance[s.id] === "absent").length;
  const attendancePercent = classStudents.length > 0 ? Math.round((presentCount / classStudents.length) * 100) : 0;
  const defaulters = classStudents.filter(s => attendance[s.id] === "absent");

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-4">
        {/* Left Side - Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {!classId && (
            <Select
              size="sm"
              selectedKeys={[selectedClass]}
              onChange={(e) => { setSelectedClass(e.target.value); }}
              className="w-[180px]"
              aria-label="Class"
              variant="flat"
              classNames={{
                trigger: "bg-default-100 data-[hover=true]:bg-default-200",
              }}
            >
              {classesWithTeachers.map(c => <SelectItem key={`${c.name}-${c.section}`} textValue={`Class ${c.name} - ${c.section}`}>Class {c.name} - {c.section}</SelectItem>)}
            </Select>
          )}
          <Input
            type="date"
            size="sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[150px]"
            variant="flat"
            classNames={{
              inputWrapper: "bg-default-100 data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default-100",
            }}
          />
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button size="sm" color="success" variant="flat" startContent={<Check size={14} />} onPress={markAllPresent} isDisabled={isLocked}>Mark All Present</Button>
          {absentCount > 0 && <Button size="sm" color="warning" variant="flat" startContent={<Bell size={14} />}>Notify Parents ({absentCount})</Button>}
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 p-3 bg-warning-50 text-warning-700 rounded-lg mb-4 mx-1">
          <Lock size={16} />
          <span className="text-sm font-medium">Attendance is locked. Unlock in settings to make changes.</span>
        </div>
      )}

      {/* Main Table */}
      <Table
        aria-label="Student attendance"
        radius="none"
        removeWrapper
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
          <TableColumn>ROLL</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {visibleStudents.map((student) => (
            <TableRow key={student.id} className="hover:bg-default-50">
              <TableCell>
                <div className="py-4 text-default-600 text-sm">
                  {student.rollNo}
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4">
                  <span
                    className="font-medium text-default-900 hover:text-primary cursor-pointer transition-colors"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    {student.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4">
                  <Chip
                    size="sm"
                    color={attendance[student.id] === "present" ? "success" : "danger"}
                    variant="flat"
                    className="capitalize"
                  >
                    {attendance[student.id] || "present"}
                  </Chip>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4 flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    className={attendance[student.id] === "present" ? "bg-success text-white" : "bg-transparent text-default-400 hover:text-success"}
                    variant={attendance[student.id] === "present" ? "solid" : "light"}
                    onPress={() => markAttendance(student.id, "present")}
                    isDisabled={isLocked}
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    className={attendance[student.id] === "absent" ? "bg-danger text-white" : "bg-transparent text-default-400 hover:text-danger"}
                    variant={attendance[student.id] === "absent" ? "solid" : "light"}
                    onPress={() => markAttendance(student.id, "absent")}
                    isDisabled={isLocked}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Lazy loading indicator */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoadingMore && <Spinner size="sm" color="primary" />}
        {!hasMore && classStudents.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">All {classStudents.length} students loaded</span>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flexflex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-default-200 gap-4">
        <div className="flex gap-6 text-sm">
          <div className="flex flex-col">
            <span className="text-default-500 text-xs uppercase tracking-wider">Total</span>
            <span className="font-semibold text-default-900 text-lg">{classStudents.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-default-500 text-xs uppercase tracking-wider">Present</span>
            <span className="font-semibold text-success-600 text-lg">{presentCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-default-500 text-xs uppercase tracking-wider">Absent</span>
            <span className="font-semibold text-danger-600 text-lg">{absentCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-default-500 text-xs uppercase tracking-wider">Rate</span>
            <span className={`font-semibold text-lg ${attendancePercent >= 75 ? "text-success-600" : "text-danger-600"}`}>
              {attendancePercent}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-success-600' : 'text-danger-600'}`}>
              {saveMessage.text}
            </span>
          )}
          <Button
            size="md"
            color="primary"
            onPress={handleSaveAttendance}
            isDisabled={isLocked || isSaving}
            isLoading={isSaving}
            className="font-medium px-8"
          >
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {defaulters.length > 0 && (
        <Card className="mt-6 shadow-sm border border-danger-200 bg-danger-50/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-danger-100 rounded-md">
                <AlertTriangle size={16} className="text-danger-600" />
              </div>
              <span className="text-sm font-semibold text-danger-700">Absentees Today</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {defaulters.map(s => (
                <Chip
                  key={s.id}
                  size="sm"
                  variant="flat"
                  color="danger"
                  className="cursor-pointer hover:bg-danger-200/50 transition-colors border border-danger-100"
                  onClick={() => navigate(`/students/${s.id}`)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
