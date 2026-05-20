import { useState, useEffect } from "react";
import logger from "../../../utils/logger";
import {
  AlertCircle, CheckCircle2, Star, Award,
  AlertTriangle, Activity,
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Bone } from './Bone';
import ActivityFeed from '../../../components/ui/ActivityFeed';

export function OverviewTab({ id, cls, classesEnhancedApi, todayStatus, classRating }) {
  const { t } = useTranslation();
  const [academicPerformance, setAcademicPerformance] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);
  const [chronicAbsenteesLoading, setChronicAbsenteesLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    if (!id || !classesEnhancedApi) return;
    const controller = new AbortController();
    const aborted = () => controller.signal.aborted;

    setAcademicLoading(true);
    setActivityLoading(true);

    classesEnhancedApi.getAcademicPerformance(id)
      .then(d => { if (!aborted()) setAcademicPerformance(d); })
      .catch(e => { if (!aborted()) logger.error('academic:', e); })
      .finally(() => { if (!aborted()) setAcademicLoading(false); });

    setChronicAbsenteesLoading(true);
    classesEnhancedApi.getChronicAbsentees(id)
      .then(d => { if (!aborted()) setChronicAbsentees(d || []); })
      .catch(e => { if (!aborted()) logger.error('chronic:', e); })
      .finally(() => { if (!aborted()) setChronicAbsenteesLoading(false); });

    classesEnhancedApi.getActivityLog(id, { limit: 5 })
      .then(d => { if (!aborted()) setActivityLog(d || []); })
      .catch(e => { if (!aborted()) logger.error('activity:', e); })
      .finally(() => { if (!aborted()) setActivityLoading(false); });

    return () => controller.abort();
  }, [id, classesEnhancedApi]);

  const attendancePercentage = todayStatus?.attendance?.percentage || cls?.attendanceToday || 0;
  const needsAttention = attendancePercentage < 75 || chronicAbsentees.length > 0;

  return (
    <div className="space-y-4">
      {/* Alerts Banner */}
      {needsAttention && (
        <div className="bg-[var(--warn-bg)] rounded-lg border border-[var(--warn-border)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-[var(--warn)] mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {attendancePercentage < 75 && (
                <p className="text-sm text-[var(--warn)]">
                  {t('classes.attendanceIsAt', 'Attendance is at')} <strong>{attendancePercentage}%</strong> {t('classes.belowTarget', 'today — below the 75% target')}
                </p>
              )}
              {chronicAbsentees.length > 0 && (
                <p className="text-sm text-[var(--warn)]">
                  <strong>{chronicAbsentees.length} {chronicAbsentees.length > 1 ? t('classes.students', 'Students') : t('classes.studentSingular', 'student')}</strong> {t('classes.attendanceBelow60', 'with attendance below 60% this month')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule Strip */}
      <div className="bg-surface rounded-lg border border-divider p-4">
        <h3 className="text-sm font-medium text-fg mb-3">{t('classes.todaysSchedule', "Today's Schedule")}</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {todayStatus?.currentClass && (
            <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-[var(--info-bg)] border border-[var(--info-border)]">
              <p className="text-xs font-semibold text-[var(--info)]">{t('classes.now', 'Now')}</p>
              <p className="text-sm font-medium text-[var(--info)]">{todayStatus.currentClass.subject}</p>
              {todayStatus.currentClass.teacher && <p className="text-[11px] text-[var(--info)]">{todayStatus.currentClass.teacher}</p>}
            </div>
          )}
          {todayStatus?.upcomingClass && (
            <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-surface-2 border border-divider">
              <p className="text-xs font-semibold text-fg-muted">{t('classes.next', 'Next')}{todayStatus.upcomingClass.time ? ` · ${todayStatus.upcomingClass.time}` : ''}</p>
              <p className="text-sm font-medium text-fg">{todayStatus.upcomingClass.subject}</p>
              {todayStatus.upcomingClass.teacher && <p className="text-[11px] text-fg-muted">{todayStatus.upcomingClass.teacher}</p>}
            </div>
          )}
          {!todayStatus?.currentClass && !todayStatus?.upcomingClass && (
            <p className="text-xs text-fg-faint py-2">{t('classes.noScheduleDataToday', 'No schedule data for today')}</p>
          )}
        </div>
      </div>

      {/* Academic Overview + Ratings Breakdown (2-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Overview */}
        <div className="bg-surface rounded-lg border border-divider overflow-hidden">
          <div className="p-4 border-b border-divider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
              <Award size={14} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="font-medium text-fg text-sm">{t('pages.academicOverview')}</h3>
              <p className="text-[11px] text-fg-muted">{t('pages.topPerformersImprovements')}</p>
            </div>
          </div>
          <div className="p-4">
            {academicLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Bone key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-fg-muted mb-2">{t('pages.topPerformers')}</p>
                  {academicPerformance?.topPerformers?.slice(0, 3).map((s) => (
                    <div key={s._id || s.name} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                      <span className="text-sm text-fg">{s.name}</span>
                      <span className="text-sm font-semibold text-[var(--ok)]">{s.percentage}%</span>
                    </div>
                  ))}
                  {(!academicPerformance?.topPerformers || academicPerformance.topPerformers.length === 0) && (
                    <p className="text-xs text-fg-faint">{t('pages.noDataAvailable')}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-fg-muted mb-2">{t('pages.needsImprovement')}</p>
                  {academicPerformance?.needsImprovement?.slice(0, 3).map((s) => (
                    <div key={s._id || s.name} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                      <span className="text-sm text-fg">{s.name}</span>
                      <span className="text-sm font-semibold text-[var(--danger)]">{s.percentage}%</span>
                    </div>
                  ))}
                  {(!academicPerformance?.needsImprovement || academicPerformance.needsImprovement.length === 0) && (
                    <p className="text-xs text-fg-faint">{t('pages.noDataAvailable')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ratings Breakdown */}
        <div className="bg-surface rounded-lg border border-divider overflow-hidden">
          <div className="p-4 border-b border-divider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
              <Star size={14} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="font-medium text-fg text-sm">{t('pages.classRatings')}</h3>
              <p className="text-[11px] text-fg-muted">{t('classes.overall', 'Overall')}: {(classRating?.overallRating || classRating?.rating || 0).toFixed(1)} / 5.0</p>
            </div>
          </div>
          <div className="p-4">
            {!classRating ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Bone key={i} className="h-6 w-full" />)}
              </div>
            ) : classRating?.breakdown && Object.keys(classRating.breakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(classRating.breakdown).map(([key, val]) => {
                  const pct = ((val || 0) / 5) * 100;
                  const colors = { attendance: 'bg-[var(--chart-c2)]', academic: 'bg-[var(--chart-c3)]', behavior: 'bg-[var(--chart-c5)]', fee: 'bg-[var(--chart-c4)]' };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize text-fg-muted">{key}</span>
                        <span className="font-medium text-fg">{(val || 0).toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colors[key] || 'bg-[var(--fg-faint)]'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-fg-faint text-center py-4">{t('pages.noRatingsAvailable')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chronic Absentees */}
      {chronicAbsentees.length > 0 && (
        <div className="bg-surface rounded-lg border border-divider overflow-hidden">
          <div className="p-4 border-b border-divider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--danger-bg)] flex items-center justify-center">
              <AlertCircle size={14} className="text-[var(--danger)]" />
            </div>
            <div>
              <h3 className="font-medium text-fg text-sm">{t('classes.chronicAbsentees', 'Chronic Absentees')}</h3>
              <p className="text-[11px] text-fg-muted">{t('classes.studentsBelow60', 'Students below 60% attendance this month')}</p>
            </div>
          </div>
          <div className="divide-y divide-divider">
            {chronicAbsentees.slice(0, 5).map((s, i) => (
              <div key={s.studentId || i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center text-xs font-medium text-fg-muted">
                    {s.studentName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">{s.studentName}</p>
                    <p className="text-xs text-fg-muted">{t('classes.roll', 'Roll')} {s.rollNo || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--danger)]">{s.percentage?.toFixed(0) || 0}%</p>
                    <p className="text-[11px] text-fg-faint">{t('classes.attendance', 'Attendance').toLowerCase()}</p>
                  </div>
                  {s.hasParentContact && (
                    <div className="w-6 h-6 rounded-full bg-[var(--ok-bg)] flex items-center justify-center" title={t('classes.parentContactAvailable', 'Parent contact available')}>
                      <CheckCircle2 size={12} className="text-[var(--ok)]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg border border-divider overflow-hidden">
        <div className="p-4 border-b border-divider flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <Activity size={14} className="text-fg-muted" />
          </div>
          <div>
            <h3 className="font-medium text-fg text-sm">{t('classes.recentActivity', 'Recent Activity')}</h3>
            <p className="text-[11px] text-fg-muted">{t('classes.latestActions', 'Latest actions on this class')}</p>
          </div>
        </div>
        <div className="p-4">
          <ActivityFeed
            isLoading={activityLoading}
            events={activityLog.slice(0, 5).map((entry, i) => ({
              id: entry._id || i,
              timestamp: entry.createdAt,
              title: entry.description || entry.activityType?.replace(/_/g, ' '),
              actor: entry.performedBy?.name || t('classes.system', 'System'),
            }))}
            emptyTitle={t('classes.noActivityYet', 'No activity recorded yet')}
            skeletonRows={3}
          />
        </div>
      </div>
    </div>
  );
}
