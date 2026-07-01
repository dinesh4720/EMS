import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip, Spinner } from '@heroui/react';
import { User, BookOpen, GraduationCap, Clock, Edit, BarChart3, Calendar, MapPin } from 'lucide-react';
import { examsApi, homeworkApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../i18n/index';

// Color mapping for subjects (matches Timetable.jsx)
const colorMap = {
  Mathematics: 'blue', Math: 'blue',
  Science: 'green', Physics: 'green', Chemistry: 'green', Biology: 'green',
  English: 'yellow',
  Hindi: 'red',
  History: 'purple', Geography: 'purple', 'Social Studies': 'purple',
  Computer: 'purple', 'Computer Science': 'purple',
  Art: 'yellow', Music: 'green', Library: 'gray',
  PT: 'red', 'Physical Education': 'red',
};

const getColor = (subject) => colorMap[subject] || 'gray';

const colorStyles = {
  blue:   { header: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800', accent: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  green:  { header: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800', accent: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  yellow: { header: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800', accent: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  red:    { header: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800', accent: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  purple: { header: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800', accent: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  gray:   { header: 'bg-surface-2 border-border-token', accent: 'text-fg', dot: 'bg-gray-500' },
};

export default function SlotInfoModal({
  isOpen,
  onClose,
  slot,
  day,
  periodIndex,
  period,
  classId,
  schedule,
  periods,
  staff,
  onEdit,
}) {
  const { t } = useTranslation();
  const [homework, setHomework] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const subject = slot?.subject;
  const teacherId = slot?.teacherId;
  const room = slot?.room;

  const teacher = staff?.find(s => s.id === teacherId || s.id === String(teacherId));
  const color = getColor(subject);
  const styles = colorStyles[color] || colorStyles.gray;

  // Compute teacher's weekly schedule for this subject
  const teacherSchedule = [];
  const subjectPeriodsPerWeek = [];

  if (schedule && periods) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(d => {
      (schedule[d] || []).forEach((s, idx) => {
        if (s.subject === subject) {
          subjectPeriodsPerWeek.push({ day: d, period: periods[idx]?.name, time: periods[idx]?.startTime });
        }
        if (s.teacherId && String(s.teacherId) === String(teacherId) && !(d === day && idx === periodIndex)) {
          teacherSchedule.push({
            day: d,
            periodName: periods[idx]?.name,
            startTime: periods[idx]?.startTime,
            subject: s.subject,
          });
        }
      });
    });
  }

  // Find teacher's next class (after current slot)
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayIdx = dayOrder.indexOf(day);
  let nextClass = null;

  for (let offset = 0; offset < dayOrder.length && !nextClass; offset++) {
    const checkDay = dayOrder[(currentDayIdx + offset) % dayOrder.length];
    const daySlots = schedule?.[checkDay] || [];
    const startIdx = offset === 0 ? periodIndex + 1 : 0;
    for (let pi = startIdx; pi < daySlots.length; pi++) {
      const s = daySlots[pi];
      if (s.teacherId && String(s.teacherId) === String(teacherId)) {
        nextClass = { day: checkDay, period: periods?.[pi]?.name, time: periods?.[pi]?.startTime, subject: s.subject };
        break;
      }
    }
  }

  // Fetch homework & exams when modal opens
  useEffect(() => {
    if (!isOpen || !classId || !subject) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [hwData, examData] = await Promise.all([
          homeworkApi.getAll({ classId }).catch(() => []),
          examsApi.getByClass(classId).catch(() => []),
        ]);

        if (cancelled) return;

        // Filter to this subject
        const hwArray = Array.isArray(hwData) ? hwData : hwData?.data || hwData?.homework || [];
        setHomework(hwArray.filter(h => h.subject === subject || h.subjectName === subject).slice(0, 3));

        const examArray = Array.isArray(examData) ? examData : examData?.data || examData?.exams || [];
        setExams(examArray.filter(e => e.subjectName === subject || e.subject === subject).slice(0, 3));
      } catch {
        // Non-critical — just show empty sections
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [isOpen, classId, subject]);

  if (!slot || !subject) return null;

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        {/* Colored header */}
        <div className={`${styles.header} border-b px-6 py-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
              <h2 className={`text-xl font-bold ${styles.accent}`}>{subject}</h2>
            </div>
            {room && (
              <Chip size="sm" variant="flat" startContent={<MapPin size={12} />} className="text-xs">
                {room}
              </Chip>
            )}
          </div>
          <p className="text-sm text-fg-muted mt-1.5 ml-6">
            {day} &bull; {period?.name} ({period?.startTime} &ndash; {period?.endTime})
          </p>
        </div>

        <ModalBody className="px-6 py-5 space-y-5">

          {/* Teacher */}
          <div className="flex items-start gap-4 p-4 bg-surface-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-fg">
                {teacher?.name || 'No teacher assigned'}
              </p>
              {nextClass && (
                <p className="text-xs text-fg-muted mt-1">
                  Next class: <span className="font-medium text-fg">{nextClass.day} {nextClass.period}</span> ({nextClass.subject})
                </p>
              )}
              {teacherSchedule.length > 0 && (
                <p className="text-xs text-fg-muted mt-0.5">
                  {teacherSchedule.length + 1} total periods this week
                </p>
              )}
            </div>
          </div>

          {/* Subject quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-2 rounded-xl text-center">
              <p className="text-2xl font-bold text-fg">{subjectPeriodsPerWeek.length}</p>
              <p className="text-xs text-fg-muted">Periods / week</p>
            </div>
            <div className="p-3 bg-surface-2 rounded-xl text-center">
              <p className="text-2xl font-bold text-fg">{exams.length}</p>
              <p className="text-xs text-fg-muted">Exams</p>
            </div>
          </div>

          {/* Homework */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-fg-faint" />
              <h4 className="text-sm font-semibold text-fg">Recent Homework</h4>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : homework.length > 0 ? (
              <div className="space-y-2">
                {homework.map((hw, i) => (
                  <div key={hw._id || i} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg truncate">{hw.title}</p>
                      {hw.dueDate && (
                        <p className="text-xs text-fg-muted">
                          Due: {formatDate(hw.dueDate)}
                        </p>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={hw.status === 'completed' ? 'success' : hw.status === 'overdue' ? 'danger' : 'default'}
                      className="text-2xs capitalize shrink-0"
                    >
                      {hw.status || 'assigned'}
                    </Chip>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-faint py-2">No recent homework for {subject}</p>
            )}
          </div>

          {/* Exams */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={16} className="text-fg-faint" />
              <h4 className="text-sm font-semibold text-fg">Exams</h4>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : exams.length > 0 ? (
              <div className="space-y-2">
                {exams.map((exam, i) => (
                  <div key={exam._id || i} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg truncate">{exam.name}</p>
                      {exam.startDate && (
                        <p className="text-xs text-fg-muted">
                          {formatDate(exam.startDate)}
                        </p>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={exam.status === 'results_published' ? 'success' : exam.status === 'scheduled' ? 'primary' : 'default'}
                      className="text-2xs capitalize shrink-0"
                    >
                      {exam.status?.replace(/_/g, ' ') || 'draft'}
                    </Chip>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-faint py-2">No exams for {subject}</p>
            )}
          </div>

          {/* Weekly schedule for this subject */}
          {subjectPeriodsPerWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-fg-faint" />
                <h4 className="text-sm font-semibold text-fg">Weekly Schedule</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjectPeriodsPerWeek.map((sp, i) => (
                  <Chip
                    key={`${sp.day}-${sp.period}-${i}`}
                    size="sm"
                    variant={sp.day === day ? 'solid' : 'flat'}
                    color={sp.day === day ? 'primary' : 'default'}
                    className="text-xs"
                  >
                    {sp.day.slice(0, 3)} &bull; {sp.period}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-divider">
          <Button variant="light" onPress={onClose}>Close</Button>
          <Button
            color="primary"
            variant="flat"
            startContent={<Edit size={16} />}
            onPress={() => {
              onClose();
              onEdit();
            }}
          >
            Edit Slot
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
