import { Card, Button } from '../../../components/ui';
import {
  CheckCircle, XCircle, ArrowUpCircle, GraduationCap, Minus, RotateCcw,
} from 'lucide-react';

export default function StepResults({ wizardState, onReset, onGoToHistory }) {
  const { result } = wizardState;
  const summary = result?.summary || {};
  const classMappings = result?.classMappings || [];
  const errors = result?.errors || [];
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <Card
        elevation="raised"
        className={`border ${
          hasErrors
            ? 'bg-warn-bg border-warn'
            : 'bg-ok-bg border-ok'
        }`}
      >
        <Card.Content className="p-4">
          <div className="flex items-start gap-3">
            {hasErrors ? (
              <XCircle size={22} className="text-warn mt-0.5" />
            ) : (
              <CheckCircle size={22} className="text-ok mt-0.5" />
            )}
            <div>
              <p className="text-base font-semibold text-fg">
                {hasErrors ? 'Promotion completed with some errors' : 'Promotion completed successfully'}
              </p>
              <p className="text-sm text-fg-muted mt-1">
                <span className="mono tnum">{wizardState.fromYear}</span> &rarr;{' '}
                <span className="mono tnum">{wizardState.toYear}</span> ·{' '}
                <span className="mono tnum">{summary.totalStudents || 0}</span> students processed across{' '}
                <span className="mono tnum">{classMappings.length}</span> classes
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Metrics */}
      <div className="promo-metrics promo-metrics--5">
        <div className="promo-metric">
          <span className="promo-metric__label">Total</span>
          <span className="promo-metric__value">{summary.totalStudents || 0}</span>
        </div>
        <div className="promo-metric promo-metric--ok">
          <span className="promo-metric__label">Promoted</span>
          <span className="promo-metric__value">{summary.promoted || 0}</span>
        </div>
        <div className="promo-metric promo-metric--warn">
          <span className="promo-metric__label">Detained</span>
          <span className="promo-metric__value">{summary.detained || 0}</span>
        </div>
        <div className="promo-metric promo-metric--accent">
          <span className="promo-metric__label">Graduated</span>
          <span className="promo-metric__value">{summary.graduated || 0}</span>
        </div>
        <div className="promo-metric promo-metric--danger">
          <span className="promo-metric__label">Errors</span>
          <span className="promo-metric__value">{summary.errors || 0}</span>
        </div>
      </div>

      {/* Class-wise results */}
      {classMappings.length > 0 && (
        <Card elevation="raised" className="bg-surface border border-border-token">
          <Card.Content className="p-4">
            <p className="text-sm font-semibold text-fg mb-3">Class-wise results</p>
            <div className="space-y-1.5">
              {classMappings.map((cm, idx) => (
                <div
                  key={cm.fromClassId || cm.fromClassName || idx}
                  className="cmap-row"
                >
                  <div className="cmap-row__from">
                    <p className="cmap-row__class-name">
                      {cm.fromClassName} &rarr; {cm.toClassName}
                    </p>
                    <p className="cmap-row__sub">
                      {cm.studentCount} students
                    </p>
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {cm.promotedCount > 0 && (
                      <span className="chip chip--ok mono tnum flex items-center gap-1">
                        <ArrowUpCircle size={10} />
                        {cm.promotedCount}
                      </span>
                    )}
                    {cm.detainedCount > 0 && (
                      <span className="chip chip--warn mono tnum flex items-center gap-1">
                        <Minus size={10} />
                        {cm.detainedCount}
                      </span>
                    )}
                    {cm.graduatedCount > 0 && (
                      <span className="chip chip--accent mono tnum flex items-center gap-1">
                        <GraduationCap size={10} />
                        {cm.graduatedCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Errors detail */}
      {errors.length > 0 && (
        <Card elevation="raised" className="bg-danger-bg border-danger-token">
          <Card.Content className="p-4">
            <p className="text-sm font-semibold text-danger-token mb-2">
              Errors (<span className="mono tnum">{errors.length}</span>)
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {errors.map((err, idx) => (
                <p key={err.studentId || idx} className="text-xs text-danger-token">
                  Student {err.studentId}: {err.error}
                </p>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Foot */}
      <div className="promo-foot">
        <div style={{ flex: 1 }} />
        <Button
          variant="ghost"
          icon={<RotateCcw size={14} />}
          onClick={onGoToHistory}
        >
          View history & rollback
        </Button>
        <Button
          variant="primary"
          onClick={onReset}
        >
          Start new promotion
        </Button>
      </div>
    </div>
  );
}
