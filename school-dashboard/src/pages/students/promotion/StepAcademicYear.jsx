import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Input } from '../../../components/ui';
import { Calendar, CheckCircle, AlertTriangle, Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../../context/SettingsContext';
import { promotionApi } from '../../../services/api/extensions';
import { CURRENT_ACADEMIC_YEAR } from '../../../utils/constants';
import toast from 'react-hot-toast';

function computeNextYear(current) {
  if (!current || typeof current !== 'string') return '';
  const match = current.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) return '';
  const start = parseInt(match[1], 10);
  return `${start + 1}-${String((start + 2) % 100).padStart(2, '0')}`;
}

export default function StepAcademicYear({ onNext, wizardState, setWizardState }) {
  const navigate = useNavigate();
  const { currentAcademicYear } = useSettings();

  const defaults = useMemo(() => {
    const from = wizardState.fromYear || currentAcademicYear || CURRENT_ACADEMIC_YEAR;
    const to = wizardState.toYear || computeNextYear(from);
    return { from, to };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fromYear, setFromYear] = useState(defaults.from);
  const [toYear, setToYear] = useState(defaults.to);
  const [checking, setChecking] = useState(false);
  const [targetYearStatus, setTargetYearStatus] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [rules, setRules] = useState(null);

  useEffect(() => {
    if (toYear) checkTargetYear(toYear, true);
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkTargetYear = async (year, silent = false) => {
    const y = year || toYear;
    if (!y || !y.match(/^\d{4}-\d{2,4}$/)) return;
    setChecking(true);
    try {
      const res = await promotionApi.checkYear(y);
      setTargetYearStatus(res);
    } catch {
      if (!silent) toast.error('Failed to check target academic year');
    } finally {
      setChecking(false);
    }
  };

  const loadRules = async () => {
    try {
      const res = await promotionApi.getRules();
      setRules(res);
    } catch {
      setRules({ minAttendancePercent: 75, feeRequirement: 'none' });
    }
  };

  const handleFromYearChange = (v) => {
    setFromYear(v);
    const next = computeNextYear(v);
    if (next) {
      setToYear(next);
      setTargetYearStatus(null);
    }
  };

  const handleToYearChange = (v) => {
    setToYear(v);
    setTargetYearStatus(null);
  };

  const handlePrepareYear = async () => {
    setPreparing(true);
    try {
      const res = await promotionApi.newAcademicYear({
        fromAcademicYear: fromYear,
        toAcademicYear: toYear,
        copyClasses: true,
        copyFeeTemplates: true,
      });
      toast.success(`Created ${res.classesCreated} classes for ${toYear}`);
      setTargetYearStatus({ exists: true, classCount: res.classesCreated });
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('already exist')) {
        toast.success(`Classes for ${toYear} already exist. Ready to proceed.`);
        await checkTargetYear(toYear, true);
      } else {
        toast.error(msg || 'Failed to prepare academic year');
      }
    } finally {
      setPreparing(false);
    }
  };

  const handleNext = () => {
    if (!isValidFormat(fromYear)) {
      toast.error('From academic year must be in YYYY-YY format (e.g. 2025-26)');
      return;
    }
    if (!isValidFormat(toYear)) {
      toast.error('To academic year must be in YYYY-YY format (e.g. 2026-27)');
      return;
    }
    if (!targetYearStatus?.exists) {
      toast.error('Target year classes must be prepared first');
      return;
    }
    setWizardState((prev) => ({ ...prev, fromYear, toYear, rules }));
    onNext();
  };

  const isValidFormat = (y) => /^\d{4}-\d{2,4}$/.test(y);

  return (
    <div className="space-y-4">
      {/* Academic Year Selection */}
      <Card elevation="raised" className="bg-surface border border-border-token">
        <Card.Content className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-fg-muted" />
            <h3 className="text-sm font-semibold text-fg">Academic Year</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="From (current year)"
              placeholder="e.g. 2025-26"
              value={fromYear}
              onChange={(e) => handleFromYearChange(e.target.value)}
              className="font-mono"
              description={isValidFormat(fromYear) ? '' : 'Format: YYYY-YY'}
            />
            <div className="flex gap-2 items-start">
              <Input
                label="To (target year)"
                placeholder="e.g. 2026-27"
                value={toYear}
                onChange={(e) => handleToYearChange(e.target.value)}
                className="flex-1 font-mono"
                description={isValidFormat(toYear) ? '' : 'Format: YYYY-YY'}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => checkTargetYear(toYear, false)}
                className="mt-6 shrink-0"
                disabled={!isValidFormat(toYear) || checking}
                loading={checking}
              >
                {targetYearStatus ? 'Re-check' : 'Check'}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Target Year Status */}
      {checking && (
        <Card elevation="raised" className="bg-surface-2 border border-border-token">
          <Card.Content className="p-4 flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-fg-faint" aria-hidden />
            <p className="text-sm text-fg-muted">Checking target year classes…</p>
          </Card.Content>
        </Card>
      )}

      {targetYearStatus && !checking && (
        <Card
          elevation="raised"
          className={`border ${
            targetYearStatus.exists
              ? 'bg-ok-bg border-ok'
              : 'bg-warn-bg border-warn'
          }`}
        >
          <Card.Content className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {targetYearStatus.exists ? (
                  <CheckCircle size={18} className="text-ok mt-0.5" aria-hidden />
                ) : (
                  <AlertTriangle size={18} className="text-warn mt-0.5" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-medium text-fg">
                    {targetYearStatus.exists
                      ? <><span className="mono tnum">{targetYearStatus.classCount}</span> classes ready for <span className="mono tnum">{toYear}</span></>
                      : <>No classes found for <span className="mono tnum">{toYear}</span></>}
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {targetYearStatus.exists
                      ? 'Target year is prepared. You can proceed with promotion.'
                      : 'Classes must be created for the target year before promoting students.'}
                  </p>
                </div>
              </div>
              {!targetYearStatus.exists && (
                <Button
                  size="sm"
                  variant="primary"
                  className="shrink-0"
                  onClick={handlePrepareYear}
                  loading={preparing}
                >
                  Prepare {toYear}
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Promotion Rules Summary */}
      {rules && (
        <Card elevation="raised" className="bg-surface border border-border-token">
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-fg-muted" />
                <span className="text-sm font-medium text-fg">Promotion rules</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-info-token"
                onClick={() => navigate('/settings/promotion-rules')}
              >
                Edit rules
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="chip">
                Min attendance: <span className="mono tnum ml-1">{rules.minAttendancePercent}%</span>
              </span>
              <span className="chip">
                Fee: {rules.feeRequirement === 'none' ? 'Not required' : rules.feeRequirement === 'partial' ? 'Partial' : 'Full'}
              </span>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Sticky foot */}
      <div className="promo-foot">
        <div style={{ flex: 1 }} />
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!targetYearStatus?.exists || !isValidFormat(fromYear) || !isValidFormat(toYear)}
        >
          Next: Map classes
        </Button>
      </div>
    </div>
  );
}
