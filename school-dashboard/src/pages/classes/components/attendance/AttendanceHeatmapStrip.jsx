import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

/** 30-day attendance-rate heatmap; clicking a cell jumps the active date. */
export default function AttendanceHeatmapStrip({
  heatmapDates,
  heatmap,
  heatmapLevel,
  isNonWorkingDate,
  date,
  setDate,
}) {
  const { t } = useTranslation();
  return (
    <div className="attn-heatmap">
      <div className="attn-heatmap__head">
        <span className="attn-heatmap__title">
          <TrendingUp size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
          {t('attendance.last30Days', 'Last 30 days')}
        </span>
        <span className="attn-heatmap__legend">
          <span>{t('attendance.low', 'Low')}</span>
          <span className="attn-heatmap__legend-sw lv-1" />
          <span className="attn-heatmap__legend-sw lv-2" />
          <span className="attn-heatmap__legend-sw lv-3" />
          <span className="attn-heatmap__legend-sw lv-4" />
          <span>{t('attendance.high', 'High')}</span>
        </span>
      </div>
      <div className="attn-heatmap__grid">
        {heatmapDates.map((d) => {
          const level = heatmapLevel(d);
          const cell = heatmap[d];
          const titleParts = [d];
          if (isNonWorkingDate(d)) titleParts.push(t('attendance.nonWorkingDayShort', 'Non-working'));
          else if (cell?.hasData) titleParts.push(`${cell.rate}% · ${cell.marked} ${t('attendance.marked', 'marked')}`);
          else titleParts.push(t('attendance.noData', 'No data'));
          return (
            <button
              key={d}
              type="button"
              className={`attn-heatmap__cell ${level} ${d === date ? 'is-selected' : ''}`}
              onClick={() => setDate(d)}
              title={titleParts.join(' · ')}
              aria-label={titleParts.join(', ')}
            />
          );
        })}
      </div>
    </div>
  );
}
