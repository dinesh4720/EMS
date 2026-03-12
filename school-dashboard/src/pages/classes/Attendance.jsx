import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Select, SelectItem, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea, Spinner } from "@heroui/react";
import { Download, Check, X, Lock, Bell, AlertTriangle, Users, Clock, TrendingUp } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { attendanceApi } from "../../services/api";

const ITEMS_PER_LOAD = 10;

export default function Attendance({ classId }) {
  const navigate = useNavigate();
  const { students, classesWithTeachers } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(classId || "");
  const [attendance, setAttendance] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editReason, setEditReason] = useState("");

  // Determine if we're embedded inside ClassDashboard (classId prop is an ObjectId)
  const isEmbedded = !!classId;

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Set default selected class when classesWithTeachers loads (for standalone mode)
  useEffect(() => {
    if (!classId && !selectedClass && classesWithTeachers.length > 0) {
      const first = classesWithTeachers[0];
      setSelectedClass(`${first.name}-${first.section}`);
    }
  }, [classId, selectedClass, classesWithTeachers]);

  // Resolve the actual class ID for API calls
  const resolvedClassId = useMemo(() => {
    if (classId) return classId; // ObjectId from ClassDashboard
    // Find the class object matching the selected "name-section" string
    const parts = selectedClass.split('-');
    if (parts.length >= 2) {
      const cls = classesWithTeachers.find(c => c.name === parts[0] && c.section === parts[1]);
      return cls?.id || null;
    }
    return null;
  }, [classId, selectedClass, classesWithTeachers]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    if (classId) {
      // When classId is an ObjectId (embedded in ClassDashboard), filter by classId
      return students.filter(s =>
        String(s.classId) === String(classId) &&
        (s.status || 'active') === 'active' &&
        s.isDeleted !== true
      );
    }
    // When in standalone mode, filter by class name-section string
    return students.filter(s => s.class === selectedClass);
  }, [students, selectedClass, classId]);

  // Fetch existing attendance from API when date or class changes
  const fetchAttendance = useCallback(async () => {
    if (!resolvedClassId || !date) return;

    try {
      setIsLoadingAttendance(true);
      const data = await attendanceApi.getByClassDate(resolvedClassId, date);

      if (data && Array.isArray(data) && data.length > 0) {
        const existingAttendance = {};
        data.forEach(record => {
          const studentId = record.studentId?._id || record.studentId;
          existingAttendance[studentId] = record.status || "present";
        });
        // Merge: set fetched data, default remaining students to "unmarked"
        const merged = {};
        classStudents.forEach(s => {
          merged[s.id] = existingAttendance[s.id] || "unmarked";
        });
        setAttendance(prev => ({ ...prev, ...merged }));
      } else {
        // No existing data - initialize all as unmarked
        const newAttendance = {};
        classStudents.forEach(s => {
          newAttendance[s.id] = "unmarked";
        });
        setAttendance(prev => ({ ...prev, ...newAttendance }));
      }
    } catch (error) {
      // If 404 or no data, initialize all as unmarked
      console.warn('No existing attendance found, initializing defaults:', error.message);
      const newAttendance = {};
      classStudents.forEach(s => {
        newAttendance[s.id] = "unmarked";
      });
      setAttendance(prev => ({ ...prev, ...newAttendance }));
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [resolvedClassId, date, classStudents]);

  useEffect(() => {
    if (classStudents.length > 0) {
      fetchAttendance();
    }
  }, [fetchAttendance]);

  const visibleStudents = useMemo(() => {
    return classStudents.slice(0, visibleCount);
  }, [classStudents, visibleCount]);

  const hasMore = visibleCount < classStudents.length;

  // Reset visible count when class changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [selectedClass, classId]);

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

    // Only send students who have been explicitly marked (present or absent)
    const markedStudents = classStudents.filter(s =>
      attendance[s.id] === "present" || attendance[s.id] === "absent"
    );

    if (markedStudents.length === 0) {
      setSaveMessage({
        type: 'error',
        text: 'Please mark attendance for at least one student before saving'
      });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (!resolvedClassId) {
      setSaveMessage({ type: 'error', text: 'Please select a valid class' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Convert attendance state to API format - only marked students
      const attendanceData = markedStudents.map(student => ({
        studentId: student.id,
        status: attendance[student.id]
      }));

      // Use the resolved class ID (ObjectId) for the API call
      const response = await attendanceApi.markBulk({
        classId: resolvedClassId,
        date: date,
        attendance: attendanceData
      });

      // Show success message with unmarked warning if applicable
      const unmarkedWarning = unmarkedCount > 0 ? ` (${unmarkedCount} still unmarked)` : '';
      setSaveMessage({
        type: 'success',
        text: `Attendance saved for ${response.results?.length || markedStudents.length} students${unmarkedWarning}`
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
  const unmarkedCount = classStudents.filter(s => !attendance[s.id] || attendance[s.id] === "unmarked").length;
  const markedCount = presentCount + absentCount;
  const attendancePercent = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;
  const defaulters = classStudents.filter(s => attendance[s.id] === "absent");

  return (
    <div className={`w-full flex flex-col ${isEmbedded ? 'bg-white rounded-lg border border-gray-100 p-5' : ''}`}>
      {/* Toolbar */}
      <div className={`flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-default-200 py-4 ${isEmbedded ? 'mb-0' : '-mx-6 -mt-6 px-6 mb-0'}`}>
        {/* Left Side - Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {!classId && (
            <Select
              size="sm"
              selectedKeys={selectedClass ? [selectedClass] : []}
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
          {isLoadingAttendance && <Spinner size="sm" color="primary" />}
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

      {/* KPI Stats - Card Grid Style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {/* Total */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users size={16} className="text-gray-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{classStudents.length}</h3>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Total</p>
        </div>

        {/* Present */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Check size={16} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{presentCount}</h3>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Present</p>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <X size={16} className="text-red-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{absentCount}</h3>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Absent</p>
        </div>

        {/* Unmarked */}
        {unmarkedCount > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock size={16} className="text-gray-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{unmarkedCount}</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Unmarked</p>
          </div>
        )}

        {/* Attendance Rate */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${markedCount === 0 ? 'bg-gray-100' : attendancePercent >= 75 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp size={16} className={markedCount === 0 ? 'text-gray-600' : attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'} />
            </div>
          </div>
          <h3 className={`text-xl font-semibold ${markedCount === 0 ? "text-gray-400" : attendancePercent >= 75 ? "text-green-600" : "text-red-600"}`}>
            {markedCount === 0 ? "—" : `${attendancePercent}%`}
          </h3>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Attendance Rate</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 mb-4 pb-4 border-b border-default-200">
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

      {/* Main Table */}
      <Table
        aria-label="Student attendance"
        radius="none"
        removeWrapper
        classNames={{
          base: `${isEmbedded ? '' : '-mx-6'} overflow-visible [&_table]:border-spacing-0 [&_table]:select-text ${isEmbedded ? '' : '[&_table]:w-[calc(100%+3rem)]'}`,
          thead: `[&>tr]:first:shadow-none [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 ${isEmbedded ? '' : '[&_tr>th:first-child]:pl-6'}`,
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
          tbody: `[&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0 ${isEmbedded ? '' : '[&>tr>td:first-child]:pl-6'}`,
          tr: "",
        }}
      >
        <TableHeader>
          <TableColumn>ROLL</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent={
          isLoadingAttendance
            ? "Loading attendance..."
            : classStudents.length === 0
              ? "No students found in this class"
              : "No data"
        }>
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
                    color={attendance[student.id] === "present" ? "success" : attendance[student.id] === "absent" ? "danger" : "default"}
                    variant="flat"
                    className="capitalize"
                  >
                    {attendance[student.id] === "present" ? "Present" : attendance[student.id] === "absent" ? "Absent" : "Not Marked"}
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
