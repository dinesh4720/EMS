import { useState, useEffect, useCallback } from 'react';
import {
  Button, Select,
} from '../../../components/ui';
import {
  ArrowUpCircle, GraduationCap, Minus,
} from 'lucide-react';
import { promotionApi } from '../../../services/api/extensions';
import { TablePageSkeleton } from '../../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';

const DECISION_OPTIONS = [
  { key: 'promoted', label: 'Promote' },
  { key: 'detained', label: 'Detain' },
  { key: 'graduated', label: 'Graduate' },
  { key: 'transferred', label: 'Transfer' },
];

export default function StepStudentReview({ onNext, onBack, wizardState, setWizardState }) {
  const [loading, setLoading] = useState(true);
  const [classStudents, setClassStudents] = useState({});

  useEffect(() => {
    const hasDecisions = Object.keys(classStudents).length > 0;
    const handleBeforeUnload = (e) => {
      if (hasDecisions) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [classStudents]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const result = {};

    for (const mapping of wizardState.classMappings) {
      try {
        const res = await promotionApi.preview(mapping.fromClassId, wizardState.fromYear);
        const students = res?.students || [];

        const decisions = {};
        for (const s of students) {
          const sid = String(s.studentId || s._id);
          if (mapping.graduate) {
            decisions[sid] = 'graduated';
          } else if (s.blocked) {
            decisions[sid] = 'detained';
          } else {
            decisions[sid] = 'promoted';
          }
        }

        result[mapping.fromClassId] = { students, decisions };
      } catch {
        result[mapping.fromClassId] = { students: [], decisions: {} };
        toast.error(`Failed to load students for ${mapping.fromClassName}`);
      }
    }

    setClassStudents(result);
    setLoading(false);
  }, [wizardState.classMappings, wizardState.fromYear]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const setDecision = (classId, studentId, decision) => {
    setClassStudents((prev) => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        decisions: {
          ...prev[classId].decisions,
          [studentId]: decision,
        },
      },
    }));
  };

  const selectAllEligible = (classId, mapping) => {
    setClassStudents((prev) => {
      const data = prev[classId];
      if (!data) return prev;
      const newDecisions = { ...data.decisions };
      const defaultDecision = mapping.graduate ? 'graduated' : 'promoted';
      for (const s of data.students) {
        const sid = String(s.studentId || s._id);
        if (!s.blocked) {
          newDecisions[sid] = defaultDecision;
        }
      }
      return { ...prev, [classId]: { ...data, decisions: newDecisions } };
    });
  };

  const detainAll = (classId) => {
    setClassStudents((prev) => {
      const data = prev[classId];
      if (!data) return prev;
      const newDecisions = {};
      for (const s of data.students) {
        newDecisions[String(s.studentId || s._id)] = 'detained';
      }
      return { ...prev, [classId]: { ...data, decisions: newDecisions } };
    });
  };

  let totalPromoting = 0;
  let totalDetained = 0;
  let totalGraduating = 0;
  let totalTransferred = 0;

  for (const classId of Object.keys(classStudents)) {
    const decisions = classStudents[classId]?.decisions || {};
    for (const d of Object.values(decisions)) {
      if (d === 'promoted') totalPromoting++;
      else if (d === 'detained') totalDetained++;
      else if (d === 'graduated') totalGraduating++;
      else if (d === 'transferred') totalTransferred++;
    }
  }

  const total = totalPromoting + totalDetained + totalGraduating + totalTransferred;

  const handleNext = () => {
    const finalMappings = wizardState.classMappings.map((mapping) => {
      const data = classStudents[mapping.fromClassId];
      if (!data) return { ...mapping, studentDecisions: [] };

      const studentDecisions = data.students.map((s) => {
        const sid = String(s.studentId || s._id);
        return {
          studentId: sid,
          decision: data.decisions[sid] || 'promoted',
          name: s.name,
          rollNo: s.rollNo,
          admissionId: s.admissionId,
        };
      });

      return { ...mapping, studentDecisions };
    });

    setWizardState((prev) => ({
      ...prev,
      classMappings: finalMappings,
      summary: { totalPromoting, totalDetained, totalGraduating, totalTransferred },
    }));
    onNext();
  };

  if (loading) return <TablePageSkeleton />;

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="promo-metrics">
        <div className="promo-metric promo-metric--ok">
          <span className="promo-metric__label">Promoting</span>
          <span className="promo-metric__value">{totalPromoting}</span>
        </div>
        <div className="promo-metric promo-metric--warn">
          <span className="promo-metric__label">Detained</span>
          <span className="promo-metric__value">{totalDetained}</span>
        </div>
        <div className="promo-metric promo-metric--accent">
          <span className="promo-metric__label">Graduating</span>
          <span className="promo-metric__value">{totalGraduating}</span>
        </div>
        <div className="promo-metric promo-metric--info">
          <span className="promo-metric__label">Transferred</span>
          <span className="promo-metric__value">{totalTransferred}</span>
        </div>
      </div>

      {/* Using native details/summary for accordion — no design-system Accordion yet */}
      <div className="space-y-2">
        {wizardState.classMappings.map((mapping) => {
          const data = classStudents[mapping.fromClassId];
          if (!data) return null;

          const students = data.students;
          const decisions = data.decisions;

          const classPromoting = Object.values(decisions).filter((d) => d === 'promoted').length;
          const classDetained = Object.values(decisions).filter((d) => d === 'detained').length;
          const classGraduating = Object.values(decisions).filter((d) => d === 'graduated').length;

          return (
            <details
              key={mapping.fromClassId}
              className="border border-border-token rounded-lg bg-surface overflow-hidden"
              open={wizardState.classMappings.length <= 5}
            >
              <summary className="px-4 py-3 cursor-pointer list-none flex items-center gap-3 select-none hover:bg-surface-2/50">
                <span className="font-medium">
                  {mapping.fromClassName}{mapping.fromSection ? ` (${mapping.fromSection})` : ''}
                </span>
                <span className="text-xs text-fg-faint">→</span>
                <span className="text-sm text-fg-muted">
                  {mapping.graduate ? 'Graduate' : mapping.toClassName}
                </span>
                <div className="flex gap-1.5 ml-auto">
                  {classPromoting > 0 && (
                    <span className="chip chip--ok mono tnum">{classPromoting} promote</span>
                  )}
                  {classDetained > 0 && (
                    <span className="chip chip--warn mono tnum">{classDetained} detain</span>
                  )}
                  {classGraduating > 0 && (
                    <span className="chip chip--accent mono tnum">{classGraduating} graduate</span>
                  )}
                </div>
              </summary>
              <div className="px-4 pb-4">
                <div className="flex gap-2 mb-3 px-1">
                  <button
                    onClick={() => selectAllEligible(mapping.fromClassId, mapping)}
                    className="text-xs text-info-token hover:underline"
                  >
                    {mapping.graduate ? 'Graduate all eligible' : 'Promote all eligible'}
                  </button>
                  <span className="text-xs text-fg-faint">|</span>
                  <button
                    onClick={() => detainAll(mapping.fromClassId)}
                    className="text-xs text-warn hover:underline"
                  >
                    Detain all
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto pr-1">
                  {students.length === 0 ? (
                    <p className="text-sm text-fg-faint text-center py-4">No active students</p>
                  ) : (
                    students.map((s) => {
                      const sid = String(s.studentId || s._id);
                      const decision = decisions[sid] || 'promoted';
                      const isBlocked = s.blocked;

                      return (
                        <div key={sid} className={`sdec-row sdec-row--${decision}`}>
                          {decision === 'promoted' && <ArrowUpCircle size={14} className="text-ok shrink-0" />}
                          {decision === 'detained' && <Minus size={14} className="text-warn shrink-0" />}
                          {decision === 'graduated' && <GraduationCap size={14} className="text-accent shrink-0" />}
                          {decision === 'transferred' && <ArrowUpCircle size={14} className="text-info-token shrink-0" />}

                          <div className="flex-1 min-w-0">
                            <p className="sdec-row__name truncate">{s.name}</p>
                            <p className="sdec-row__meta">
                              Roll: {s.rollNo || '—'} · Adm: {s.admissionId || '—'}
                              {s.attendancePercent != null && ` · Att: ${s.attendancePercent}%`}
                              {s.feeStatus && ` · Fee: ${s.feeStatus}`}
                            </p>
                          </div>

                          {isBlocked && (
                            <span className="chip chip--danger shrink-0">
                              {s.blockedReason || 'Blocked'}
                            </span>
                          )}

                          <Select
                            size="sm"
                            value={decision}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) setDecision(mapping.fromClassId, sid, val);
                            }}
                            className="w-32 shrink-0"
                            aria-label="Decision"
                            options={DECISION_OPTIONS.map((opt) => ({
                              value: opt.key,
                              label: opt.label,
                            }))}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {/* Sticky foot */}
      <div className="promo-foot">
        <div className="promo-foot__progress">
          <span className="num">{total}</span>
          <span>students decided</span>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
        >
          Next: Review Summary
        </Button>
      </div>
    </div>
  );
}
