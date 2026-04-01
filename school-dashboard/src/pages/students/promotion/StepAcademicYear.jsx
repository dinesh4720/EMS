import { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, Button, Input, Chip } from '@heroui/react';
import { Calendar, CheckCircle, AlertTriangle, Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../../context/SettingsContext';
import { promotionApi } from '../../../services/api/extensions';
import toast from 'react-hot-toast';

function computeNextYear(current) {
  if (!current || typeof current !== 'string') return '';
  const match = current.match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const start = parseInt(match[1], 10);
  return `${start + 1}-${String((start + 2) % 100).padStart(2, '0')}`;
}

export default function StepAcademicYear({ onNext, wizardState, setWizardState }) {
  const navigate = useNavigate();
  const { currentAcademicYear } = useSettings();

  // Compute defaults once
  const defaults = useMemo(() => {
    const from = wizardState.fromYear || currentAcademicYear || '2025-26';
    const to = wizardState.toYear || computeNextYear(from);
    return { from, to };
  }, []);

  const [fromYear, setFromYear] = useState(defaults.from);
  const [toYear, setToYear] = useState(defaults.to);
  const [checking, setChecking] = useState(false);
  const [targetYearStatus, setTargetYearStatus] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [rules, setRules] = useState(null);

  // Check target year + load rules on mount
  useEffect(() => {
    if (toYear) {
      checkTargetYear(toYear, true); // silent on mount — no toast if server hasn't restarted
    }
    loadRules();
  }, []);

  const checkTargetYear = async (year, silent = false) => {
    const y = year || toYear;
    if (!y || !y.match(/^\d{4}-\d{2}$/)) return;
    setChecking(true);
    try {
      const res = await promotionApi.checkYear(y);
      setTargetYearStatus(res);
    } catch {
      // If silent (auto-check on mount), don't show error — just leave status null
      // so the user can manually click "Check" once the server is ready
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
      // Fallback to sensible defaults if API fails
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
      // 409 = classes already exist — that's actually fine, just re-check
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
    if (!fromYear.match(/^\d{4}-\d{2}$/)) {
      toast.error('From academic year must be in YYYY-YY format (e.g. 2025-26)');
      return;
    }
    if (!toYear.match(/^\d{4}-\d{2}$/)) {
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

  const isValidFormat = (y) => /^\d{4}-\d{2}$/.test(y);

  return (
    <div className="space-y-5">
      {/* Academic Year Selection */}
      <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
        <CardBody className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-gray-600 dark:text-zinc-400" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Academic Year</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="From (Current Year)"
              placeholder="e.g. 2025-26"
              value={fromYear}
              onChange={(e) => handleFromYearChange(e.target.value)}
              variant="bordered"
              classNames={{ inputWrapper: 'dark:border-zinc-700' }}
              description={isValidFormat(fromYear) ? '' : 'Format: YYYY-YY'}
            />
            <div className="flex gap-2 items-start">
              <Input
                label="To (Target Year)"
                placeholder="e.g. 2026-27"
                value={toYear}
                onChange={(e) => handleToYearChange(e.target.value)}
                variant="bordered"
                className="flex-1"
                classNames={{ inputWrapper: 'dark:border-zinc-700' }}
                description={isValidFormat(toYear) ? '' : 'Format: YYYY-YY'}
              />
              <Button
                size="sm"
                variant="bordered"
                onPress={() => checkTargetYear(toYear, false)}
                className="mt-6 shrink-0"
                isDisabled={!isValidFormat(toYear) || checking}
                isLoading={checking}
              >
                {targetYearStatus ? 'Re-check' : 'Check'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Target Year Status */}
      {checking && (
        <Card shadow="sm" className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
          <CardBody className="p-4 flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">Checking target year classes...</p>
          </CardBody>
        </Card>
      )}

      {targetYearStatus && !checking && (
        <Card
          shadow="sm"
          className={`border ${
            targetYearStatus.exists
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
          }`}
        >
          <CardBody className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {targetYearStatus.exists ? (
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                    {targetYearStatus.exists
                      ? `${targetYearStatus.classCount} classes ready for ${toYear}`
                      : `No classes found for ${toYear}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {targetYearStatus.exists
                      ? 'Target year is prepared. You can proceed with promotion.'
                      : 'Classes must be created for the target year before promoting students.'}
                  </p>
                </div>
              </div>
              {!targetYearStatus.exists && (
                <Button
                  size="sm"
                  className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shrink-0"
                  onPress={handlePrepareYear}
                  isLoading={preparing}
                >
                  Prepare {toYear}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Promotion Rules Summary */}
      {rules && (
        <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-gray-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Promotion Rules</span>
              </div>
              <Button
                size="sm"
                variant="light"
                className="text-xs text-blue-600 dark:text-blue-400"
                onPress={() => navigate('/settings/promotion-rules')}
              >
                Edit Rules
              </Button>
            </div>
            <div className="flex gap-3 mt-3">
              <Chip size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                Min Attendance: {rules.minAttendancePercent}%
              </Chip>
              <Chip size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                Fee: {rules.feeRequirement === 'none' ? 'Not required' : rules.feeRequirement === 'partial' ? 'Partial Payment' : 'Full Payment'}
              </Chip>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-2">
        <Button
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          onPress={handleNext}
          isDisabled={!targetYearStatus?.exists || !isValidFormat(fromYear) || !isValidFormat(toYear)}
        >
          Next: Map Classes
        </Button>
      </div>
    </div>
  );
}
