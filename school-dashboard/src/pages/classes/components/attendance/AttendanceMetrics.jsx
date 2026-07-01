import { useTranslation } from "react-i18next";

/** KPI strip: total / present / absent / late+half / unmarked / rate. */
export default function AttendanceMetrics({
  totalCount,
  presentCount,
  absentCount,
  lateCount,
  halfdayCount,
  unmarkedCount,
  markedCount,
  attendancePercent,
  pctClass,
}) {
  const { t } = useTranslation();
  return (
    <div className="attn-metrics">
      <div className="dp-metric">
        <span className="dp-metric__label">{t('pages.total2')}</span>
        <span className="dp-metric__value mono tnum">{totalCount}</span>
      </div>
      <div className="dp-metric">
        <span className="dp-metric__label">{t('pages.present2')}</span>
        <span className="dp-metric__value mono tnum dp-metric__value--ok">{presentCount}</span>
      </div>
      <div className="dp-metric">
        <span className="dp-metric__label">{t('pages.absent2')}</span>
        <span className="dp-metric__value mono tnum dp-metric__value--danger">{absentCount}</span>
      </div>
      <div className="dp-metric">
        <span className="dp-metric__label">{t('attendance.late', 'Late')} / {t('attendance.halfDay', 'Half')}</span>
        <span className="dp-metric__value mono tnum dp-metric__value--warn">{lateCount + halfdayCount}</span>
      </div>
      <div className="dp-metric">
        <span className="dp-metric__label">{t('pages.unmarked')}</span>
        <span className="dp-metric__value mono tnum">{unmarkedCount}</span>
      </div>
      <div className="dp-metric">
        <span className="dp-metric__label">{t('pages.attendanceRate')}</span>
        <span className={`dp-metric__value mono tnum ${pctClass}`}>
          {markedCount === 0 ? '—' : `${attendancePercent}%`}
        </span>
      </div>
    </div>
  );
}
