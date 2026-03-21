import { Button, Chip } from "@heroui/react";
import { Calendar, Clock, Edit2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

// Data display field component
const DataField = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
    <p className="font-medium text-default-900">{value || "—"}</p>
  </div>
);

export default function ScheduleTab({ localSettings, onEditClick, instructionalHours, instructionalMins, getSchoolHours }) {
  const { t } = useTranslation();

  return (
    <div className="pt-6 space-y-8 animate-fade-in">

      {/* Academic Session Card */}
      <div className="rounded-xl border border-default-200 bg-white hover:border-default-300 transition-colors">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">{t('settings.academics.sessionTitle', 'Academic Session')}</h3>
                <p className="text-xs text-default-500">{t('settings.academics.sessionDesc', 'Current academic year configuration')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              color="primary"
              startContent={<Edit2 size={16} />}
              onPress={() => onEditClick('academicYear')}
            >
              {t('common.edit', 'Edit')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataField label={t('settings.academics.sessionTitle', 'Session Name')} value={localSettings.academicYear} />
            <DataField label={t('settings.academics.startDate', 'Start Date')} value={localSettings.academicYearStart} />
            <DataField label={t('settings.academics.endDate', 'End Date')} value={localSettings.academicYearEnd} />
          </div>
        </div>
      </div>

      {/* School Timings Card */}
      <div className="rounded-xl border border-default-200 bg-white hover:border-default-300 transition-colors">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">{t('settings.academics.timingsTitle', 'School Timings')}</h3>
                <p className="text-xs text-default-500">{t('settings.academics.timingsDesc', 'Daily school start and end times')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              color="primary"
              startContent={<Edit2 size={16} />}
              onPress={() => onEditClick('schoolTimings')}
            >
              {t('common.edit', 'Edit')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataField label={t('settings.academics.schoolStartTime', 'School Start Time')} value={localSettings.schoolStartTime} />
            <DataField label={t('settings.academics.schoolEndTime', 'School End Time')} value={localSettings.schoolEndTime} />
            <DataField label="Total School Hours" value={getSchoolHours()} />
          </div>
        </div>
      </div>

      {/* Period Configuration Card */}
      <div className="rounded-xl border border-default-200 bg-white hover:border-default-300 transition-colors">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">{t('settings.academics.periodTitle', 'Period Configuration')}</h3>
                <p className="text-xs text-default-500">{t('settings.academics.periodDesc', 'Period duration and count per day')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              color="primary"
              startContent={<Edit2 size={16} />}
              onPress={() => onEditClick('periodConfig')}
            >
              {t('common.edit', 'Edit')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataField label={t('settings.academics.periodDuration', 'Period Duration (minutes)')} value={localSettings.periodDuration ? `${localSettings.periodDuration} minutes` : null} />
            <DataField label={t('settings.academics.periodsPerDay', 'Periods Per Day')} value={localSettings.periodsPerDay} />
            <DataField label="Instructional Time" value={`${instructionalHours}h ${instructionalMins}m`} />
          </div>

          <div className="mt-4 p-4 bg-default-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-default-500 mt-0.5 shrink-0" />
              <p className="text-xs text-default-500 leading-relaxed">
                Total instructional time: <span className="font-bold text-default-700">{instructionalHours}h {instructionalMins}m</span>.
                Ensure this fits within school hours, including breaks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Working Days Card */}
      <div className="rounded-xl border border-default-200 bg-white hover:border-default-300 transition-colors">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">{t('settings.academics.workingDaysTitle', 'Working Days')}</h3>
                <p className="text-xs text-default-500">{t('settings.academics.workingDaysDesc', 'Days the school operates')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              color="primary"
              startContent={<Edit2 size={16} />}
              onPress={() => onEditClick('workingDays')}
            >
              {t('common.edit', 'Edit')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
              const isActive = localSettings.workingDays?.includes(day);
              const fullDay = day === "Mon" ? "Monday" : day === "Tue" ? "Tuesday" : day === "Wed" ? "Wednesday" : day === "Thu" ? "Thursday" : day === "Fri" ? "Friday" : day === "Sat" ? "Saturday" : "Sunday";
              return (
                <Chip
                  key={day}
                  color={isActive ? "primary" : "default"}
                  variant={isActive ? "solid" : "flat"}
                  size="lg"
                >
                  {fullDay}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
