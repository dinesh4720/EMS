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

    let bgClass = "bg-surface-2 text-fg-faint"; // Unmarked/Default
    let statusText = "";

    if (record) {
      switch (record.status) {
        case 'present':
          bgClass = "bg-ok-bg text-ok hover:bg-ok-bg/80 border-ok/20";
          break;
        case 'absent':
          bgClass = "bg-danger-bg text-danger-token hover:bg-danger-bg/80 border-danger-token/20";
          break;
        case 'leave':
          bgClass = "bg-warn-bg text-warn hover:bg-warn-bg/80 border-warn/20";
          break;
        case 'halfday':
          bgClass = "bg-info-bg text-info hover:bg-info-bg/80 border-info";
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
              ${bgClass} ${isTodayClient ? 'ring-2 ring-offset-2 ring-fg-subtle' : 'border-transparent'}
            `}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold">{format(day, 'd')}</span>
              {record?.regularization?.requested && (
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" title={t('pages.regularizationRequested')} />
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
        <PopoverContent className="w-64 p-3 ring-1 ring-border-token">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-fg">{format(day, 'EEE, MMM d')}</span>
              <Chip size="sm" variant="flat" color={
                record?.status === 'present' ? 'success' :
                  record?.status === 'absent' ? 'danger' :
                    record?.status === 'leave' ? 'warning' : 'default'
              }>
                {record?.status || 'Unmarked'}
              </Chip>
            </div>

            {record?.reason && (
              <div className="text-xs text-fg-muted bg-surface-2 p-2 rounded">
                {record.reason}
              </div>
            )}

            {record?.regularization && (
              <div className="text-xs bg-info-bg text-info p-2 rounded border border-info">
                <p className="font-semibold">Regularization {record.regularization.approvalStatus}</p>
                <p>Req: {record.regularization.requestedStatus}</p>
                <p>Note: {record.regularization.requestReason}</p>
              </div>
            )}

            <Button
              size="sm"
              className="w-full bg-fg text-surface"
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
        <div className="bg-surface p-4 rounded-xl border border-border-token">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-fg-muted uppercase tracking-wider font-semibold">{t('pages.workingDays')}</p>
              <h3 className="text-2xl font-bold text-fg mt-1">{monthlyStats.total}</h3>
            </div>
            <div className="p-2 bg-surface-2 rounded-lg"><CalendarDays size={18} className="text-fg-muted" /></div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border-token">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-fg-muted uppercase tracking-wider font-semibold">{t('pages.present2')}</p>
              <h3 className="text-2xl font-bold text-ok mt-1">{monthlyStats.present}</h3>
            </div>
            <div className="p-2 bg-ok-bg rounded-lg"><CheckCircle2 size={18} className="text-ok" /></div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border-token">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-fg-muted uppercase tracking-wider font-semibold">{t('pages.absent2')}</p>
              <h3 className="text-2xl font-bold text-danger-token mt-1">{monthlyStats.absent}</h3>
            </div>
            <div className="p-2 bg-danger-bg rounded-lg"><XCircle size={18} className="text-danger-token" /></div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border-token">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-fg-muted uppercase tracking-wider font-semibold">Leaves/Half</p>
              <h3 className="text-2xl font-bold text-warn mt-1">{monthlyStats.leave + monthlyStats.halfday}</h3>
            </div>
            <div className="p-2 bg-warn-bg rounded-lg"><AlertCircle size={18} className="text-warn" /></div>
          </div>
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="bg-surface rounded-xl border border-border-token overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-divider flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
              <CalendarIcon size={20} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="font-semibold text-fg">{t('pages.attendanceCalendar')}</h3>
              <p className="text-xs text-fg-muted">{t('pages.viewAndManageDailyAttendanceRecords')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-2 p-1 rounded-lg">
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
              <div key={day} className="text-center text-xs font-semibold text-fg-faint uppercase tracking-wider py-2">
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
          <div className="flex flex-wrap justify-center gap-6 mt-8 pt-4 border-t border-divider">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-ok-bg border border-ok/20" />
              <span className="text-xs text-fg-muted">{t('pages.present2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-danger-bg border border-danger-token/20" />
              <span className="text-xs text-fg-muted">{t('pages.absent2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-warn-bg border border-warn/20" />
              <span className="text-xs text-fg-muted">{t('pages.leave')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-info-bg border border-info/20" />
              <span className="text-xs text-fg-muted">{t('pages.halfDay')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Quick Action */}
      {isSameMonth(new Date(), currentDate) && (
        <div className="bg-surface rounded-xl border border-border-token p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-bg rounded-lg"><Clock size={16} className="text-info" /></div>
              <h3 className="font-semibold text-fg">{t('pages.quickMarkToday')}</h3>
            </div>
            <Chip size="sm" variant="flat">{format(new Date(), 'dd MMMM yyyy')}</Chip>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              className={`${
                todayStatus === 'present'
                  ? 'bg-ok text-surface hover:bg-ok/90 border-ok ring-2 ring-ok/30 ring-offset-2 shadow-md'
                  : 'bg-ok-bg text-ok hover:bg-ok-bg/80 border border-ok/20'
              }`}
              startContent={<CheckCircle2 size={16} />}
              onPress={() => handleQuickMark('present')}
            >
              {todayStatus === 'present' ? '✓ Present' : 'Present'}
            </Button>
            <Button
              className={`${
                todayStatus === 'absent'
                  ? 'bg-danger-token text-surface hover:bg-danger-token/90 border-danger-token ring-2 ring-danger-token/30 ring-offset-2 shadow-md'
                  : 'bg-danger-bg text-danger-token hover:bg-danger-bg/80 border border-danger-token/20'
              }`}
              startContent={<XCircle size={16} />}
              onPress={() => handleQuickMark('absent')}
            >
              {todayStatus === 'absent' ? '✓ Absent' : 'Absent'}
            </Button>
            <Button
              className={`${
                todayStatus === 'halfday'
                  ? 'bg-info text-surface hover:bg-info/90 border-info ring-2 ring-info/30 ring-offset-2 shadow-md'
                  : 'bg-info-bg text-info hover:bg-info-bg/80 border border-info/20'
              }`}
              startContent={<Clock size={16} />}
              onPress={() => handleQuickMark('halfday')}
            >
              {todayStatus === 'halfday' ? '✓ Half Day' : 'Half Day'}
            </Button>
            <Button
              className={`${
                todayStatus === 'leave'
                  ? 'bg-warn text-surface hover:bg-warn/90 border-warn ring-2 ring-warn/30 ring-offset-2 shadow-md'
                  : 'bg-warn-bg text-warn hover:bg-warn-bg/80 border border-warn/20'
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
                <span className="text-xs font-normal text-fg-muted">
                  Requesting change for {selectedDateForReg && format(selectedDateForReg, 'PPPP')}
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="p-3 bg-info-bg rounded-lg text-xs text-info border border-info/20">
                    <p className="font-semibold mb-1">{t('pages.currentStatus')}</p>
                    {(() => {
                      const dateStr = selectedDateForReg?.toISOString().split('T')[0];
                      const status = staffAttendance[staffId]?.[dateStr]?.status;
                      return <Chip size="sm" variant="flat" className="capitalize">{status || "Unmarked"}</Chip>
                    })()}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-fg-muted mb-1.5 block">{t('pages.newStatus')}</label>
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
                    <label className="text-xs font-semibold text-fg-muted mb-1.5 block">{t('pages.reasonForCorrection')}</label>
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
                <Button className="bg-fg text-surface" onPress={submitRegularization} isDisabled={isSubmittingReg || !regularizationReason.trim()}>
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