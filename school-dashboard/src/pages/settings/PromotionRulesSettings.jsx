import { useState, useEffect } from 'react';
import { Button, Select, SelectItem, Divider } from '@heroui/react';
import { ArrowUpCircle, Save } from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import HelpIcon from '../../components/ui/HelpIcon';

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

  useEffect(() => {
    request('/promotions/rules')
      .then(data => {
        setMinAttendance(data?.minAttendancePercent ?? 75);
        setFeeRequirement(data?.feeRequirement ?? 'none');
      })
      .catch(() => toast.error('Failed to load promotion rules'))
      .finally(() => setLoading(false));
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
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 dark:bg-zinc-800 rounded w-48" />
        <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded" />
        <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded" />
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Promotion Rules</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
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
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Minimum Attendance</p>
            <HelpIcon
              text="Students whose attendance percentage falls below this value will be flagged as ineligible during the year-end promotion process. Set to 0% to ignore attendance when promoting."
              size="sm"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
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
          <div className="w-16 text-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-sm font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
            {minAttendance}%
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
          Set to 0% to disable attendance-based blocking
        </p>
      </div>

      <Divider />

      {/* Fee requirement */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Fee Requirement</p>
            <HelpIcon
              text="Controls whether outstanding fees can block a student from being promoted to the next class. 'None' means fees are ignored; 'Partial' blocks students with zero payment; 'Full' requires complete payment."
              size="sm"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Determines which fee statuses block a student from being promoted
          </p>
        </div>
        <Select
          selectedKeys={[feeRequirement]}
          onSelectionChange={keys => setFeeRequirement([...keys][0] || 'none')}
          variant="bordered"
          size="sm"
          classNames={{ trigger: 'dark:border-zinc-700' }}
        >
          {FEE_OPTIONS.map(opt => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400 space-y-1">
          <p><span className="font-medium text-gray-700 dark:text-zinc-300">none</span> — All students eligible regardless of fee status</p>
          <p><span className="font-medium text-gray-700 dark:text-zinc-300">partial</span> — Students with status "pending" are blocked</p>
          <p><span className="font-medium text-gray-700 dark:text-zinc-300">full</span> — Only students with status "paid" are eligible</p>
        </div>
      </div>

      <Divider />

      <div className="flex justify-end">
        <Button
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
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
