import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, FileCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Send, ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, getDay
} from "date-fns";
import toast from "react-hot-toast";
import {
  Button, Popover, PopoverTrigger, PopoverContent,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Textarea, Select, SelectItem, Chip
} from "@heroui/react";
import { useApp } from "../../../context/AppContext";
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';
import StaffLeaveBalance from "./StaffLeaveBalance";


export default function StaffAttendanceTab({ staffId }) {
  const { t } = useTranslation();
  const {
    staffAttendance,
    markStaffAttendance,
    requestRegularization,
    getMonthlyAttendance,
    fetchStaffAttendanceByStaff
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateForReg, setSelectedDateForReg] = useState(null);
  const [regularizationReason, setRegularizationReason] = useState("");
  const [targetStatus, setTargetStatus] = useState(new Set(["present"]));
  const [isMarking, setIsMarking] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const {
    isOpen: isRegOpen,
    onOpen: onRegOpen,
    onClose: onRegClose
  } = useDisclosure();

  // Fetch data when month changes
  useEffect(() => {
    const start = startOfMonth(currentDate).toISOString().split('T')[0];
    const end = endOfMonth(currentDate).toISOString().split('T')[0];
    fetchStaffAttendanceByStaff(staffId, start, end);
  }, [currentDate, staffId, fetchStaffAttendanceByStaff]);

  // Derived state
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthlyStats = useMemo(() => {
    return getMonthlyAttendance(staffId, currentDate.getFullYear(), currentDate.getMonth());
  }, [staffId, currentDate, staffAttendance, getMonthlyAttendance]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleQuickMark = async (status) => {
    if (isMarking) return;
    setIsMarking(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await markStaffAttendance(
        staffId,
        todayStr,
        status,
        status === 'present' ? new Date().toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit', hour12: false }) : '-',
        '-',
        status === 'present' ? '' : 'Marked from Quick Actions'
      );
    } catch (error) {
      // Error handled in context
    } finally {
      setIsMarking(false);
    }
  };

  const handleRegularizeClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = staffAttendance[staffId]?.[dateStr];

    setSelectedDateForReg(date);
    // Default target: cycle to the most logical correction
    const currentStatus = record?.status;
    let defaultTarget = 'present';
    if (currentStatus === 'present') defaultTarget = 'absent';
    else if (currentStatus === 'absent' || currentStatus === 'leave' || currentStatus === 'halfday') defaultTarget = 'present';
    setTargetStatus(new Set([defaultTarget]));
    setRegularizationReason("");
    onRegOpen();
  };

  const submitRegularization = async () => {
    if (!selectedDateForReg || isSubmittingReg) return;
    if (!regularizationReason.trim()) {
      toast.error(t('toast.error.pleaseProvideAReason') || 'Please provide a reason for regularization');
      return;
    }
    setIsSubmittingReg(true);
    try {
      const dateStr = selectedDateForReg.toISOString().split('T')[0];
      const statusValue = Array.from(targetStatus)[0];
      await requestRegularization(staffId, dateStr, statusValue, regularizationReason);
      onRegClose();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Helper to get today's attendance status
  const getTodayStatus = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return staffAttendance[staffId]?.[todayStr]?.status || '';
  };

  // Helper to get day content
  const getDayContent = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = staffAttendance[staffId]?.[dateStr];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayClient = isSameDay(day, new Date());

    if (!isCurrentMonth) return null;

    let bgClass = "bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500"; // Unmarked/Default
    let statusText = "";

    if (record) {
      switch (record.status) {
        case 'present':
          bgClass = "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
          break;
        case 'absent':
          bgClass = "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
          break;
        case 'leave':
          bgClass = "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
          break;
        case 'halfday':
          bgClass = "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
          break;
      }
      statusText = record.status;
    }

    // Render empty cells for layout if needed, but handled by parent grid

    return (
      <Popover key={dateStr}>
        <PopoverTrigger>
          <div
            className={`
              relative h-20 rounded-xl border p-2 cursor-pointer transition-all hover:scale-[1.02]
              ${bgClass} ${isTodayClient ? 'ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'}
            `}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold">{format(day, 'd')}</span>
              {record?.regularization?.requested && (
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title={t('pages.regularizationRequested')} />
              )}
            </div>

            <div className="mt-2 text-xs font-medium capitalize truncate">
              {statusText || "Unmarked"}
            </div>

            {record?.inTime && record.inTime !== '-' && (
              <div className="text-[10px] opacity-75 mt-1">
                {record.inTime}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 ring-1 ring-gray-100 dark:ring-zinc-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{format(day, 'EEE, MMM d')}</span>
              <Chip size="sm" variant="flat" color={
                record?.status === 'present' ? 'success' :
                  record?.status === 'absent' ? 'danger' :
                    record?.status === 'leave' ? 'warning' : 'default'
              }>
                {record?.status || 'Unmarked'}
              </Chip>
            </div>

            {record?.reason && (
              <div className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 p-2 rounded">
                {record.reason}
              </div>
            )}

            {record?.regularization && (
              <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100">
                <p className="font-semibold">Regularization {record.regularization.approvalStatus}</p>
                <p>Req: {record.regularization.requestedStatus}</p>
                <p>Note: {record.regularization.requestReason}</p>
              </div>
            )}

            <Button
              size="sm"
              className="w-full bg-gray-900 text-white"
              startContent={<Send size={14} />}
              onPress={() => handleRegularizeClick(day)}
            >
              Regularize Attendance
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Total grid cells need to account for start day offset
  const startDayOffset = getDay(startOfMonth(currentDate));

  const todayStatus = getTodayStatus();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">{t('pages.workingDays')}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{monthlyStats.total}</h3>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg"><CalendarDays size={18} className="text-gray-600 dark:text-zinc-400" /></div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">{t('pages.present2')}</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{monthlyStats.present}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 size={18} className="text-green-600" /></div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">{t('pages.absent2')}</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{monthlyStats.absent}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg"><XCircle size={18} className="text-red-600" /></div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Leaves/Half</p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-1">{monthlyStats.leave + monthlyStats.halfday}</h3>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg"><AlertCircle size={18} className="text-yellow-600" /></div>
          </div>
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
              <CalendarIcon size={20} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{t('pages.attendanceCalendar')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.viewAndManageDailyAttendanceRecords')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-1 rounded-lg">
            <Button isIconOnly size="sm" variant="light" onPress={handlePrevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-semibold w-32 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button isIconOnly size="sm" variant="light" onPress={handleNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-5">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty start slots */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}

            {daysInMonth.map(day => getDayContent(day))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 pt-4 border-t border-gray-50 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.present2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.absent2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
              <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.leave')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
              <span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.halfDay')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Quick Action */}
      {isSameMonth(new Date(), currentDate) && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Clock size={16} className="text-blue-600" /></div>
              <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{t('pages.quickMarkToday')}</h3>
            </div>
            <Chip size="sm" variant="flat">{format(new Date(), 'dd MMMM yyyy')}</Chip>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              className={`${
                todayStatus === 'present'
                  ? 'bg-green-500 text-white hover:bg-green-600 border-green-600 ring-2 ring-green-200 ring-offset-2 shadow-md'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
              }`}
              startContent={<CheckCircle2 size={16} />}
              onPress={() => handleQuickMark('present')}
            >
              {todayStatus === 'present' ? '✓ Present' : 'Present'}
            </Button>
            <Button
              className={`${
                todayStatus === 'absent'
                  ? 'bg-red-500 text-white hover:bg-red-600 border-red-600 ring-2 ring-red-200 ring-offset-2 shadow-md'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
              }`}
              startContent={<XCircle size={16} />}
              onPress={() => handleQuickMark('absent')}
            >
              {todayStatus === 'absent' ? '✓ Absent' : 'Absent'}
            </Button>
            <Button
              className={`${
                todayStatus === 'halfday'
                  ? 'bg-orange-500 text-white hover:bg-orange-600 border-orange-600 ring-2 ring-orange-200 ring-offset-2 shadow-md'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100'
              }`}
              startContent={<Clock size={16} />}
              onPress={() => handleQuickMark('halfday')}
            >
              {todayStatus === 'halfday' ? '✓ Half Day' : 'Half Day'}
            </Button>
            <Button
              className={`${
                todayStatus === 'leave'
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600 ring-2 ring-yellow-200 ring-offset-2 shadow-md'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100'
              }`}
              startContent={<FileCheck size={16} />}
              onPress={() => handleQuickMark('leave')}
            >
              {todayStatus === 'leave' ? '✓ Leave' : 'Leave'}
            </Button>
          </div>
        </div>
      )}

      {/* Leave Balance */}
      <StaffLeaveBalance staffId={staffId} />

      {/* Regularization Modal */}
      <Modal isOpen={isRegOpen} onClose={onRegClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Regularize Attendance
                <span className="text-xs font-normal text-gray-500 dark:text-zinc-400">
                  Requesting change for {selectedDateForReg && format(selectedDateForReg, 'PPPP')}
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                    <p className="font-semibold mb-1">{t('pages.currentStatus')}</p>
                    {(() => {
                      const dateStr = selectedDateForReg?.toISOString().split('T')[0];
                      const status = staffAttendance[staffId]?.[dateStr]?.status;
                      return <Chip size="sm" variant="flat" className="capitalize">{status || "Unmarked"}</Chip>
                    })()}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">{t('pages.newStatus')}</label>
                    <Select
                      label={t('pages.selectStatus')}
                      selectedKeys={targetStatus}
                      onSelectionChange={setTargetStatus}
                      variant="bordered"
                    >
                      <SelectItem key="present" value="present">{t('pages.present2')}</SelectItem>
                      <SelectItem key="absent" value="absent">{t('pages.absent2')}</SelectItem>
                      <SelectItem key="halfday" value="halfday">{t('pages.halfDay')}</SelectItem>
                      <SelectItem key="leave" value="leave">{t('pages.onLeave1')}</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">{t('pages.reasonForCorrection')}</label>
                    <Textarea
                      placeholder={t('staff.form.regularizationReasonPlaceholder')}
                      value={regularizationReason}
                      onValueChange={setRegularizationReason}
                      minRows={3}
                      variant="bordered"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
                <Button className="bg-gray-900 text-white" onPress={submitRegularization} isDisabled={isSubmittingReg || !regularizationReason.trim()}>
                  {isSubmittingReg ? 'Submitting...' : 'Submit Request'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}