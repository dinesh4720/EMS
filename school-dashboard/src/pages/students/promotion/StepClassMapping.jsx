import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, Select, SelectItem, Button, Chip, Checkbox } from '@heroui/react';
import { ArrowRight, GraduationCap, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { promotionApi } from '../../../services/api/extensions';
import { TablePageSkeleton } from '../../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';

export default function StepClassMapping({ onNext, onBack, wizardState, setWizardState }) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [mappings, setMappings] = useState([]); // local editable copy

  // AUDIT-111: Nav guard -- warn on browser close/refresh when mappings have been edited
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (mappings.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mappings]);

  useEffect(() => {
    loadPreviewAll();
  }, []);

  const loadPreviewAll = async () => {
    setLoading(true);
    try {
      const res = await promotionApi.previewAll(wizardState.fromYear, wizardState.toYear);
      setPreviewData(res);

      // Build editable mappings from the server's auto-suggestions
      const initial = (res.classMappings || []).map((cm) => ({
        fromClassId: cm.fromClassId,
        fromClassName: cm.fromClassName,
        fromSection: cm.fromSection,
        studentCount: cm.studentCount,
        eligibleCount: cm.eligibleCount,
        blockedCount: cm.blockedCount,
        isGraduating: cm.isGraduating,
        toClassId: cm.isGraduating ? null : (cm.suggestedTargetClassId || ''),
        toClassName: cm.isGraduating ? 'Graduate' : (cm.suggestedTargetClassName || ''),
        graduate: cm.isGraduating,
        targetClassExists: cm.targetClassExists,
        targetCapacity: cm.targetCapacity,
        included: cm.studentCount > 0, // auto-include classes that have students
      }));
      setMappings(initial);
    } catch (e) {
      toast.error(e?.message || 'Failed to load class mappings');
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (idx, field, value) => {
    setMappings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      // If toClassId changed, update toClassName from options
      if (field === 'toClassId' && previewData?.targetClassOptions) {
        const opt = previewData.targetClassOptions.find((o) => o._id === value);
        next[idx].toClassName = opt?.label || '';
        next[idx].targetClassExists = !!opt;
        next[idx].graduate = false;
      }

      // If graduate toggled on, clear toClassId
      if (field === 'graduate' && value) {
        next[idx].toClassId = null;
        next[idx].toClassName = 'Graduate';
        next[idx].targetClassExists = true;
      } else if (field === 'graduate' && !value) {
        // Restore suggestion
        const original = previewData?.classMappings?.find(
          (cm) => cm.fromClassId === next[idx].fromClassId
        );
        next[idx].toClassId = original?.suggestedTargetClassId || '';
        next[idx].toClassName = original?.suggestedTargetClassName || '';
        next[idx].targetClassExists = original?.targetClassExists || false;
      }

      return next;
    });
  };

  const includedMappings = mappings.filter((m) => m.included);
  const totalStudents = includedMappings.reduce((sum, m) => sum + m.studentCount, 0);

  const handleNext = () => {
    if (includedMappings.length === 0) {
      toast.error('Select at least one class to promote');
      return;
    }

    // Validate all included mappings have a target
    const invalid = includedMappings.filter((m) => !m.graduate && !m.toClassId);
    if (invalid.length > 0) {
      toast.error(`${invalid.length} class(es) have no target class selected`);
      return;
    }

    setWizardState((prev) => ({
      ...prev,
      classMappings: includedMappings,
      targetClassOptions: previewData?.targetClassOptions || [],
    }));
    onNext();
  };

  if (loading) return <TablePageSkeleton />;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-zinc-400">Classes</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{mappings.length}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">Selected</p>
          <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{includedMappings.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400">Total Students</p>
          <p className="text-xl font-semibold text-green-700 dark:text-green-300">{totalStudents}</p>
        </div>
      </div>

      {/* Class mapping list */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
          Class Mappings — {wizardState.fromYear} to {wizardState.toYear}
        </p>

        {mappings.length === 0 && (
          <Card shadow="sm" className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
            <CardBody className="p-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No classes found for {wizardState.fromYear}. Make sure classes exist for the current academic year.
              </p>
            </CardBody>
          </Card>
        )}

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {mappings.map((m, idx) => (
            <Card
              key={m.fromClassId}
              shadow="sm"
              className={`border transition-colors ${
                !m.included
                  ? 'bg-gray-50 dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800 opacity-60'
                  : m.graduate
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                    : 'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800'
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  {/* Include checkbox */}
                  <Checkbox
                    isSelected={m.included}
                    onChange={(e) => updateMapping(idx, 'included', e.target.checked)}
                    size="sm"
                    isDisabled={m.studentCount === 0}
                  />

                  {/* Source class */}
                  <div className="min-w-[120px]">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {m.fromClassName}{m.fromSection ? ` (${m.fromSection})` : ''}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-zinc-400">
                        {m.studentCount} students
                        {m.blockedCount > 0 && (
                          <span className="text-red-500"> ({m.blockedCount} blocked)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight size={16} className="text-gray-400 shrink-0 mx-1" />

                  {/* Target class (dropdown or graduate) */}
                  <div className="flex-1 min-w-[180px]">
                    {m.graduate ? (
                      <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg px-3 py-2">
                        <GraduationCap size={16} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Graduate / Alumni</span>
                      </div>
                    ) : (
                      <Select
                        size="sm"
                        placeholder="Select target class"
                        selectedKeys={m.toClassId ? [m.toClassId] : []}
                        onSelectionChange={(keys) => updateMapping(idx, 'toClassId', [...keys][0] || '')}
                        variant="bordered"
                        className="max-w-xs"
                        classNames={{ trigger: 'dark:border-zinc-700 h-10' }}
                        isDisabled={!m.included}
                      >
                        {(previewData?.targetClassOptions || []).map((opt) => (
                          <SelectItem key={opt._id} value={opt._id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>

                  {/* Graduate toggle */}
                  <Button
                    size="sm"
                    variant={m.graduate ? 'solid' : 'flat'}
                    className={
                      m.graduate
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-500 dark:text-zinc-400'
                    }
                    onPress={() => updateMapping(idx, 'graduate', !m.graduate)}
                    isDisabled={!m.included}
                    startContent={<GraduationCap size={14} />}
                  >
                    {m.graduate ? 'Graduating' : 'Graduate'}
                  </Button>

                  {/* Status chips */}
                  {m.included && !m.graduate && !m.targetClassExists && m.toClassId && (
                    <Chip size="sm" color="warning" variant="flat">No target</Chip>
                  )}
                  {m.studentCount === 0 && (
                    <Chip size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-500">Empty</Chip>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          onPress={handleNext}
          isDisabled={includedMappings.length === 0}
        >
          Next: Review Students ({totalStudents})
        </Button>
      </div>
    </div>
  );
}
