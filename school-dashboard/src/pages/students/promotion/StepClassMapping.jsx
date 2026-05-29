import { useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem, Button, Checkbox } from '@heroui/react';
import { ArrowRight, GraduationCap, Users, AlertTriangle } from 'lucide-react';
import { promotionApi } from '../../../services/api/extensions';
import { TablePageSkeleton } from '../../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';

export default function StepClassMapping({ onNext, onBack, wizardState, setWizardState }) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [mappings, setMappings] = useState([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreviewAll = async () => {
    setLoading(true);
    try {
      const res = await promotionApi.previewAll(wizardState.fromYear, wizardState.toYear);
      setPreviewData(res);

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
        included: cm.studentCount > 0,
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

      if (field === 'toClassId' && previewData?.targetClassOptions) {
        const opt = previewData.targetClassOptions.find((o) => o._id === value);
        next[idx].toClassName = opt?.label || '';
        next[idx].targetClassExists = !!opt;
        next[idx].graduate = false;
      }

      if (field === 'graduate' && value) {
        next[idx].toClassId = null;
        next[idx].toClassName = 'Graduate';
        next[idx].targetClassExists = true;
      } else if (field === 'graduate' && !value) {
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
  const totalBlocked = includedMappings.reduce((sum, m) => sum + (m.blockedCount || 0), 0);

  const handleNext = () => {
    if (includedMappings.length === 0) {
      toast.error('Select at least one class to promote');
      return;
    }
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
    <div className="space-y-4">
      {/* Metrics */}
      <div className="promo-metrics">
        <div className="promo-metric">
          <span className="promo-metric__label">Classes</span>
          <span className="promo-metric__value">{mappings.length}</span>
        </div>
        <div className="promo-metric promo-metric--info">
          <span className="promo-metric__label">Selected</span>
          <span className="promo-metric__value">{includedMappings.length}</span>
        </div>
        <div className="promo-metric promo-metric--ok">
          <span className="promo-metric__label">Students</span>
          <span className="promo-metric__value">{totalStudents}</span>
        </div>
        <div className="promo-metric promo-metric--warn">
          <span className="promo-metric__label">Blocked</span>
          <span className="promo-metric__value">{totalBlocked}</span>
        </div>
      </div>

      <p className="text-sm text-fg-muted">
        Class mappings — <span className="mono tnum">{wizardState.fromYear}</span> to{' '}
        <span className="mono tnum">{wizardState.toYear}</span>
      </p>

      {mappings.length === 0 && (
        <Card shadow="sm" className="bg-warn-bg border-warn">
          <CardBody className="p-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warn" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              No classes found for {wizardState.fromYear}. Make sure classes exist for the current academic year.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
        {mappings.map((m, idx) => (
          <div
            key={m.fromClassId}
            className={`cmap-row ${!m.included ? 'is-disabled' : ''} ${m.graduate ? 'is-graduate' : ''}`}
          >
            <Checkbox
              isSelected={m.included}
              onChange={(e) => updateMapping(idx, 'included', e.target.checked)}
              size="sm"
              isDisabled={m.studentCount === 0}
            />

            <div className="cmap-row__from">
              <span className="cmap-row__class-name">
                {m.fromClassName}{m.fromSection ? ` (${m.fromSection})` : ''}
              </span>
              <span className="cmap-row__sub flex items-center gap-1">
                <Users size={11} />
                {m.studentCount} students
                {m.blockedCount > 0 && (
                  <span className="chip chip--danger" style={{ marginLeft: 4 }}>
                    {m.blockedCount} blocked
                  </span>
                )}
              </span>
            </div>

            <ArrowRight size={14} className="cmap-row__arrow" />

            <div className="cmap-row__to">
              {m.graduate ? (
                <div className="flex items-center gap-2">
                  <GraduationCap size={14} className="text-accent" />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    Graduate / Alumni
                  </span>
                </div>
              ) : (
                <Select
                  size="sm"
                  placeholder="Select target class"
                  selectedKeys={m.toClassId ? [m.toClassId] : []}
                  onSelectionChange={(keys) => updateMapping(idx, 'toClassId', [...keys][0] || '')}
                  variant="bordered"
                  className="max-w-xs"
                  classNames={{ trigger: 'h-9' }}
                  isDisabled={!m.included}
                  aria-label="Target class"
                >
                  {(previewData?.targetClassOptions || []).map((opt) => (
                    <SelectItem key={opt._id} value={opt._id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <Button
              size="sm"
              variant={m.graduate ? 'solid' : 'flat'}
              className={m.graduate ? 'bg-accent text-white' : ''}
              onPress={() => updateMapping(idx, 'graduate', !m.graduate)}
              isDisabled={!m.included}
              startContent={<GraduationCap size={13} />}
            >
              {m.graduate ? 'Graduating' : 'Graduate'}
            </Button>

            {m.included && !m.graduate && !m.targetClassExists && m.toClassId && (
              <span className="chip chip--warn">No target</span>
            )}
            {m.studentCount === 0 && (
              <span className="chip">Empty</span>
            )}
          </div>
        ))}
      </div>

      {/* Sticky foot */}
      <div className="promo-foot">
        <div className="promo-foot__progress">
          <span className="num">{includedMappings.length}</span>
          <span>of</span>
          <span className="num">{mappings.length}</span>
          <span>classes &middot;</span>
          <span className="num">{totalStudents}</span>
          <span>students</span>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button
          color="primary"
          onPress={handleNext}
          isDisabled={includedMappings.length === 0}
        >
          Next: Review Students
        </Button>
      </div>
    </div>
  );
}
