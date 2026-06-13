import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer, Button, Checkbox, Select
} from "../../../../components/ui";
import { AlertTriangle, CalendarCheck, Loader2 } from "lucide-react";
import { request } from "../../../../services/api";
import { formatShortDate, toTodayDateString } from "../../../../utils/dateFormatter";
import toast from "react-hot-toast";

const REASON_OPTIONS = [
  { value: "sick", label: 'Sick Leave' },
  { value: "personal", label: 'Personal' },
  { value: "official", label: 'Official Duty' },
  { value: "family_emergency", label: 'Family Emergency' },
  { value: "holiday_error", label: 'Holiday / Error' },
];

export default function RegularizeAttendanceDrawer({ isOpen, onOpenChange, studentId }) {
  const { t } = useTranslation();
  const [absentDates, setAbsentDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [reasons, setReasons] = useState({});

  // Fetch absent/unaccounted dates when drawer opens
  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      setSelectedDates(new Set());
      setReasons({});

      // Try to get absent dates from the last 30 days
      const endDate = toTodayDateString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      request(`/attendance/student/${encodeURIComponent(studentId)}?startDate=${startDate}&endDate=${endDate}`)
        .then((data) => {
          const records = Array.isArray(data) ? data : data?.attendance || [];
          // Filter absent/unaccounted records
          const absent = records
            .filter(r => r.status === 'absent' || r.status === 'unmarked')
            .map(r => ({
              date: r.date,
              status: r.status,
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setAbsentDates(absent);
        })
        .catch(() => {
          setAbsentDates([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, studentId]);

  const toggleDate = (date) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleReasonChange = (date, reason) => {
    setReasons(prev => ({ ...prev, [date]: reason }));
  };

  const handleSubmit = async (onClose) => {
    if (selectedDates.size === 0) {
      toast.error('Please select at least one date to regularize');
      return;
    }

    // Validate all selected dates have reasons
    const missingReasons = [...selectedDates].filter(d => !reasons[d]);
    if (missingReasons.length > 0) {
      toast.error('Please select a reason for all selected dates');
      return;
    }

    setSubmitting(true);
    try {
      const updates = [...selectedDates].map(date => ({
        date,
        status: 'present',
        reason: reasons[date],
      }));

      await request(`/attendance/student/${encodeURIComponent(studentId)}/regularize`, {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });

      toast.success(t('toast.success.attendanceRegularizedSuccessfully', 'Attendance regularized successfully'));
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Failed to regularize attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      size="md"
      title={t('students.profile.overview.regularizeAttendance', 'Regularize Attendance')}
    >
      {(onClose) => (
        <>
          <div className="p-6 bg-[var(--warn-bg)]/50 border-b border-[var(--warn)]/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-[var(--warn)]" size={24} aria-hidden />
              <div>
                <h4 className="font-semibold text-fg">
                  {t('students.profile.overview.unaccountedAbsences', 'Unaccounted Absences')}
                </h4>
                <p className="text-sm text-[var(--warn)]">
                  {t('students.profile.overview.selectDaysInstruction', 'Select days to mark as present or add reason.')}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skel-${i}`} className="flex items-center justify-between p-4 border border-divider rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 animate-shimmer rounded" />
                      <div className="flex items-center gap-3">
                        <div className="p-2 animate-shimmer rounded-lg w-9 h-9" />
                        <div className="h-4 w-28 animate-shimmer rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-36 animate-shimmer rounded" />
                  </div>
                ))}
              </div>
            ) : absentDates.length === 0 ? (
              <div className="text-center py-8">
                <CalendarCheck size={40} className="mx-auto mb-3 text-fg-faint" aria-hidden />
                <p className="text-sm text-fg-muted">
                  No unaccounted absences found in the last 30 days.
                </p>
              </div>
            ) : (
              absentDates.map((item) => (
                <div key={item.date} className="flex items-center justify-between p-4 border border-divider rounded-xl">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      size="sm"
                      checked={selectedDates.has(item.date)}
                      onChange={() => toggleDate(item.date)}
                    />
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-2 rounded-lg text-fg-muted">
                        <CalendarCheck size={20} aria-hidden />
                      </div>
                      <div>
                        <span className="font-medium text-fg">{formatShortDate(item.date)}</span>
                        <p className="text-xs text-fg-faint capitalize">{item.status}</p>
                      </div>
                    </div>
                  </div>
                  <Select
                    aria-label={t('students.profile.overview.absenceReason', 'Absence reason')}
                    size="sm"
                    placeholder={t('students.profile.overview.selectReason', 'Select Reason')}
                    className="w-40"
                    value={reasons[item.date] || ''}
                    onChange={(e) => handleReasonChange(item.date, e.target.value)}
                    options={REASON_OPTIONS}
                  />
                </div>
              ))
            )}
          </div>
          <div className="ds-drawer__foot">
            <Button variant="ghost" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit(onClose)}
              loading={submitting}
              disabled={selectedDates.size === 0 || loading}
            >
              {t('students.profile.overview.updateAttendance', 'Update Attendance')}
              {selectedDates.size > 0 && ` (${selectedDates.size})`}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
