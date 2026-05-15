import { useState, useEffect } from 'react';
import { Button, Select, SelectItem, Divider } from '@heroui/react';
import { ArrowUpCircle, Save } from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import HelpIcon from '../../components/ui/HelpIcon';
import SkeletonForm from '../../components/skeletons/SkeletonForm';
import { useTranslation } from 'react-i18next';

const FEE_OPTIONS = [
  { key: 'none', label: 'No fee requirement' },
  { key: 'partial', label: 'Partial payment required (not pending)' },
  { key: 'full', label: 'Full payment required (fully paid)' },
];

export default function PromotionRulesSettings() {
  const [minAttendance, setMinAttendance] = useState(75);
  const [feeRequirement, setFeeRequirement] = useState('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    setLoadError(false);
    request('/promotions/rules')
      .then(data => {
        setMinAttendance(data?.minAttendancePercent ?? 75);
        setFeeRequirement(data?.feeRequirement ?? 'none');
      })
      .catch(() => {
        setLoadError(true);
        toast.error('Failed to load promotion rules');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await request('/promotions/rules', {
        method: 'PUT',
        body: JSON.stringify({ minAttendancePercent: minAttendance, feeRequirement }),
      });
      toast.success('Promotion rules saved');
    } catch (e) {
      toast.error(e?.message || 'Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <SkeletonForm fields={3} showSubmit />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-fg-muted mb-4">
          Could not load promotion rules. Please check your connection and try again.
        </p>
        <Button variant="bordered" size="sm" onPress={fetchRules}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <ArrowUpCircle size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-fg">Promotion Rules</h2>
            <p className="text-sm text-fg-muted">
              Configure eligibility criteria for student bulk promotion
            </p>
          </div>
        </div>
      </div>

      <Divider />

      {/* Attendance threshold */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-fg">Minimum Attendance</p>
            <HelpIcon
              text="Students whose attendance percentage falls below this value will be flagged as ineligible during the year-end promotion process. Set to 0% to ignore attendance when promoting."
              size="sm"
            />
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Students below this threshold will be flagged as ineligible for promotion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minAttendance}
            onChange={e => setMinAttendance(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <div className="w-16 text-center px-3 py-1.5 rounded-lg border border-border-token bg-surface-2 text-sm font-semibold text-fg tabular-nums">
            {minAttendance}%
          </div>
        </div>
        <p className="text-xs text-fg-faint">
          Set to 0% to disable attendance-based blocking
        </p>
      </div>

      <Divider />

      {/* Fee requirement */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-fg">Fee Requirement</p>
            <HelpIcon
              text="Controls whether outstanding fees can block a student from being promoted to the next class. 'None' means fees are ignored; 'Partial' blocks students with zero payment; 'Full' requires complete payment."
              size="sm"
            />
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Determines which fee statuses block a student from being promoted
          </p>
        </div>
        <Select
          selectedKeys={[feeRequirement]}
          onSelectionChange={keys => setFeeRequirement([...keys][0] || 'none')}
          variant="bordered"
          size="sm"
          classNames={{ trigger: '' }}
        >
          {FEE_OPTIONS.map(opt => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>
        <div className="p-3 rounded-lg bg-surface-2 border border-divider text-xs text-fg-muted space-y-1">
          <p><span className="font-medium text-fg">none</span> — All students eligible regardless of fee status</p>
          <p><span className="font-medium text-fg">partial</span> — Students with status "pending" are blocked</p>
          <p><span className="font-medium text-fg">full</span> — Only students with status "paid" are eligible</p>
        </div>
      </div>

      <Divider />

      <div className="flex justify-end">
        <Button
          className="bg-surface dark:bg-surface-2 text-white"
          startContent={<Save size={15} />}
          onPress={handleSave}
          isLoading={saving}
        >
          Save Rules
        </Button>
      </div>
    </div>
  );
}
