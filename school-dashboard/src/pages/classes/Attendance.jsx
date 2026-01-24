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
    <div className="w-full space-y-3">
      <Card className="shadow-sm border border-default-200 rounded-2xl">
        <CardBody className="p-4">
          <div className="flex gap-2 mb-3 flex-wrap shrink-0">
            {!classId && (
              <Select size="sm" selectedKeys={[selectedClass]} onChange={(e) => { setSelectedClass(e.target.value); }} className="max-w-[150px]" label="Class" aria-label="Class">
                {classesWithTeachers.map(c => <SelectItem key={`${c.name}-${c.section}`} textValue={`Class ${c.name} - ${c.section}`}>Class {c.name} - {c.section}</SelectItem>)}
              </Select>
            )}
            <Input type="date" size="sm" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[180px]" />
            <Button size="sm" color="success" startContent={<Check size={14} />} onPress={markAllPresent} isDisabled={isLocked}>Mark All Present</Button>
            {absentCount > 0 && <Button size="sm" color="warning" startContent={<Bell size={14} />}>Notify Parents ({absentCount})</Button>}
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 p-2 bg-warning-50 rounded-md mb-3">
              <Lock size={14} className="text-warning" />
              <span className="text-xs text-warning">Attendance is locked. Unlock to make changes.</span>
            </div>
          )}

          <Table
            aria-label="Student attendance"
            shadow="none"
            radius="none"
            isStriped={false}
            removeWrapper
            classNames={{
              table: "w-full",
              th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-4 border-b border-default-100",
              tr: "transition-opacity hover:bg-default-50/30",
              wrapper: "p-0"
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
                <TableRow key={student.id}>
                  <TableCell className="text-xs">{student.rollNo}</TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      {student.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={attendance[student.id] === "present" ? "success" : "danger"} variant="flat">{attendance[student.id]}</Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button isIconOnly size="sm" color="success" variant={attendance[student.id] === "present" ? "solid" : "flat"} onPress={() => markAttendance(student.id, "present")} isDisabled={isLocked}><Check size={12} /></Button>
                      <Button isIconOnly size="sm" color="danger" variant={attendance[student.id] === "absent" ? "solid" : "flat"} onPress={() => markAttendance(student.id, "absent")} isDisabled={isLocked}><X size={12} /></Button>
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

          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <div className="flex gap-4 text-xs">
              <span>Total: <strong>{classStudents.length}</strong></span>
              <span>Present: <strong className="text-success">{presentCount}</strong></span>
              <span>Absent: <strong className="text-danger">{absentCount}</strong></span>
              <span>Attendance: <strong className={attendancePercent >= 75 ? "text-success" : "text-danger"}>{attendancePercent}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              {saveMessage && (
                <span className={`text-xs ${saveMessage.type === 'success' ? 'text-success' : 'text-danger'}`}>
                  {saveMessage.text}
                </span>
              )}
              <Button
                size="sm"
                color="primary"
                onPress={handleSaveAttendance}
                isDisabled={isLocked || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {defaulters.length > 0 && (
        <Card className="shadow-none border-danger-200 border">
          <CardBody className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-danger" />
              <span className="text-sm font-semibold text-danger">Absentees Today</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {defaulters.map(s => (
                <Chip
                  key={s.id}
                  size="sm"
                  variant="flat"
                  color="danger"
                  className="cursor-pointer hover:opacity-80"
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
