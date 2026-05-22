import {
  Button, Chip, Select, SelectItem, ScrollShadow, Avatar, Spinner
} from "@heroui/react";
import {
  ChevronLeft, ChevronRight, Clock, Users,
  User, BookOpen
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDateTime } from "../../../utils/dateFormatter";

export default function StaffSidebar({
  selectedStaff,
  teachers = [],
  todaySchedule = [],
  upcomingAppointments = [],
  loadingTimetable,
  loadingAppointments,
  onStaffChange,
  onEventClick,
  defaultPeriods = [],
  getClassName,
  sidebarExpanded,
  onToggleSidebar,
  formatDateKey
}) {
  const { t } = useTranslation();

  // Parse ISO datetime string to local date key and time, respecting browser timezone
  const parseLocalDateTime = (isoString) => {
    if (!isoString) return { date: '', time: '' };
    const d = new Date(isoString);
    const date = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { date, time };
  };

  return (
    <div className={`border-l border-border-token bg-surface transition-all duration-300 ${sidebarExpanded ? 'w-80' : 'w-12'}`}>
      {sidebarExpanded ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b border-divider">
            <h3 className="text-sm font-semibold text-fg">{t('calendar.sidebar.title', 'Staff Schedule')}</h3>
            <Button isIconOnly size="sm" variant="light" aria-label="Collapse sidebar" className="text-fg-faint" onPress={() => onToggleSidebar(false)}>
              <ChevronRight size={16} />
            </Button>
          </div>

          <div className="p-3 border-b border-divider">
            <Select
              size="sm"
              placeholder={t('calendar.sidebar.selectStaff', 'Select staff member')}
              selectedKeys={selectedStaff ? [String(selectedStaff.id)] : []}
              onChange={(e) => {
                const staffId = e.target.value;
                const member = teachers.find(t => String(t.id) === staffId);
                onStaffChange(member || null);
              }}
              variant="bordered"
              classNames={{ trigger: "h-9" }}
              startContent={<User size={14} className="text-fg-faint" />}
              isClearable
              onClear={() => onStaffChange(null)}
            >
              {teachers.map((teacher) => (
                <SelectItem key={String(teacher.id)} textValue={teacher.name}>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" name={teacher.name} className="w-6 h-6 text-2xs" />
                    <span>{teacher.name}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          <ScrollShadow className="flex-1">
            {selectedStaff ? (
              <div className="p-3 space-y-4">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-2">
                  <Avatar name={selectedStaff.name} className="w-10 h-10" />
                  <div>
                    <div className="font-medium text-sm text-fg">{selectedStaff.name}</div>
                    <div className="text-xs text-fg-faint">{Array.isArray(selectedStaff.role) ? selectedStaff.role.join(', ') : selectedStaff.role}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-fg-muted uppercase mb-2 flex items-center gap-1.5">
                    <BookOpen size={12} /> {t('calendar.sidebar.todaysClasses', "Today's Classes")}
                  </h4>
                  {loadingTimetable ? (
                    <div className="space-y-1.5">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-shimmer rounded-lg" />)}
                    </div>
                  ) : todaySchedule.filter(s => s.classId && s.subject).length > 0 ? (
                    <div className="space-y-1.5">
                      {todaySchedule.map((slot, idx) => {
                        if (!slot.classId || !slot.subject) return null;
                        const period = defaultPeriods[idx];
                        return (
                          <div
                            key={`slot-${idx}`}
                            onClick={() => {
                              const event = {
                                id: `tt-today-${idx}`,
                                type: 'class',
                                subject: slot.subject,
                                classId: slot.classId,
                                periodIndex: idx,
                                date: formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
                                title: slot.subject
                              };
                              onEventClick(event);
                            }}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border-token bg-surface hover:bg-surface-2 cursor-pointer"
                          >
                            <div className="text-2xs text-fg-faint w-14 flex-shrink-0">{period?.startTime}</div>
                            <div className="w-1 h-8 rounded-full bg-border-token" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate text-fg">{slot.subject}</div>
                              <div className="text-2xs text-fg-faint">{getClassName(slot.classId)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-fg-faint py-3 text-center border border-dashed border-border-token rounded-lg">{t('calendar.sidebar.noClassesToday', 'No classes today')}</div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-fg-muted uppercase mb-2 flex items-center gap-1.5">
                    <Users size={12} /> {t('calendar.sidebar.upcomingAppointments', 'Upcoming Appointments')}
                  </h4>
                  {loadingAppointments ? (
                    <div className="space-y-1.5">
                      {[...Array(2)].map((_, i) => <div key={i} className="h-10 animate-shimmer rounded-lg" />)}
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-1.5">
                      {upcomingAppointments.map((apt) => (
                        <div
                          key={apt._id}
                          onClick={() => {
                            const from = parseLocalDateTime(apt.fromDateTime);
                            const to = parseLocalDateTime(apt.toDateTime);
                            const event = {
                              id: `apt-${apt._id}`,
                              type: 'appointment',
                              title: apt.visitorName,
                              date: from.date,
                              startTime: from.time,
                              endTime: to.time,
                              rawAppointment: apt,
                              visitorName: apt.visitorName,
                              purpose: apt.purpose,
                              status: apt.status,
                              phone: apt.phoneNumber,
                              notes: apt.notes,
                              meetingWith: apt.meetingWith
                            };
                            onEventClick(event);
                          }}
                          className="p-2 rounded-lg border border-[color:var(--ok)]/30 bg-ok-bg hover:opacity-90 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-ok">{apt.visitorName}</div>
                            <Chip size="sm" variant="flat" className="h-4 text-3xs">{apt.status}</Chip>
                          </div>
                          <div className="text-2xs text-ok mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {formatDateTime(apt.fromDateTime)}
                          </div>
                          {apt.purpose && <div className="text-2xs text-ok/80 mt-0.5 truncate">{apt.purpose}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-fg-faint py-3 text-center border border-dashed border-border-token rounded-lg">{t('calendar.sidebar.noUpcomingAppointments', 'No upcoming appointments')}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                  <User size={20} className="text-fg-faint" />
                </div>
                <p className="text-sm text-fg-muted font-medium">{t('calendar.sidebar.noStaffSelected', 'No Staff Selected')}</p>
                <p className="text-xs text-fg-faint mt-1">{t('calendar.sidebar.selectStaffPrompt', 'Select a staff member to view their schedule')}</p>
              </div>
            )}
          </ScrollShadow>
        </div>
      ) : (
        <div className="flex flex-col items-center py-3">
          <Button isIconOnly size="sm" variant="light" aria-label="Expand sidebar" className="text-fg-faint" onPress={() => onToggleSidebar(true)}>
            <ChevronLeft size={16} />
          </Button>
          <div className="mt-2 writing-mode-vertical text-2xs text-fg-faint font-medium">{t('calendar.sidebar.staff', 'Staff')}</div>
        </div>
      )}
    </div>
  );
}
