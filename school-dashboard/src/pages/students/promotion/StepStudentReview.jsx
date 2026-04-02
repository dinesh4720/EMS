import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Button, Checkbox, Select, SelectItem, Chip,
  Accordion, AccordionItem,
} from '@heroui/react';
import {
  CheckCircle, XCircle, Users, ArrowUpCircle, GraduationCap, Minus,
} from 'lucide-react';
import { promotionApi } from '../../../services/api/extensions';
import { TablePageSkeleton } from '../../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';

const DECISION_OPTIONS = [
  { key: 'promoted', label: 'Promote', color: 'text-green-600' },
  { key: 'detained', label: 'Detain', color: 'text-yellow-600' },
  { key: 'graduated', label: 'Graduate', color: 'text-purple-600' },
  { key: 'transferred', label: 'Transfer', color: 'text-blue-600' },
];

export default function StepStudentReview({ onNext, onBack, wizardState, setWizardState }) {
  const [loading, setLoading] = useState(true);
  // classStudents: { [fromClassId]: { students: [...], decisions: { [studentId]: decision } } }
  const [classStudents, setClassStudents] = useState({});

  // AUDIT-111: Nav guard -- warn on browser close/refresh when student decisions are loaded
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

  // Compute totals
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

  const handleNext = () => {
    // Build final decisions per class
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
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400">Promoting</p>
          <p className="text-xl font-semibold text-green-700 dark:text-green-300">{totalPromoting}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900 rounded-lg p-3">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Detained</p>
          <p className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">{totalDetained}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-lg p-3">
          <p className="text-xs text-purple-600 dark:text-purple-400">Graduating</p>
          <p className="text-xl font-semibold text-purple-700 dark:text-purple-300">{totalGraduating}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">Transferred</p>
          <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{totalTransferred}</p>
        </div>
      </div>

      {/* Per-class accordion */}
      <Accordion variant="splitted" selectionMode="multiple" defaultExpandedKeys={
        wizardState.classMappings.length <= 5
          ? wizardState.classMappings.map((m) => m.fromClassId)
          : []
      }>
        {wizardState.classMappings.map((mapping) => {
          const data = classStudents[mapping.fromClassId];
          if (!data) return null;

          const students = data.students;
          const decisions = data.decisions;

          const classPromoting = Object.values(decisions).filter((d) => d === 'promoted').length;
          const classDetained = Object.values(decisions).filter((d) => d === 'detained').length;
          const classGraduating = Object.values(decisions).filter((d) => d === 'graduated').length;

          return (
            <AccordionItem
              key={mapping.fromClassId}
              title={
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {mapping.fromClassName}{mapping.fromSection ? ` (${mapping.fromSection})` : ''}
                  </span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-sm text-gray-600 dark:text-zinc-400">
                    {mapping.graduate ? 'Graduate' : mapping.toClassName}
                  </span>
                  <div className="flex gap-1.5 ml-auto">
                    {classPromoting > 0 && (
                      <Chip size="sm" variant="flat" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {classPromoting} promote
                      </Chip>
                    )}
                    {classDetained > 0 && (
                      <Chip size="sm" variant="flat" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                        {classDetained} detain
                      </Chip>
                    )}
                    {classGraduating > 0 && (
                      <Chip size="sm" variant="flat" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {classGraduating} graduate
                      </Chip>
                    )}
                  </div>
                </div>
              }
              classNames={{
                base: 'border border-gray-200 dark:border-zinc-800',
                content: 'pt-0',
              }}
            >
              {/* Bulk actions */}
              <div className="flex gap-2 mb-3 px-1">
                <button
                  onClick={() => selectAllEligible(mapping.fromClassId, mapping)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {mapping.graduate ? 'Graduate all eligible' : 'Promote all eligible'}
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  onClick={() => detainAll(mapping.fromClassId)}
                  className="text-xs text-yellow-600 hover:underline"
                >
                  Detain all
                </button>
              </div>

              {/* Student list */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No active students</p>
                ) : (
                  students.map((s) => {
                    const sid = String(s.studentId || s._id);
                    const decision = decisions[sid] || 'promoted';
                    const isBlocked = s.blocked;

                    return (
                      <div
                        key={sid}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                          decision === 'promoted'
                            ? 'bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50'
                            : decision === 'detained'
                              ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/50'
                              : decision === 'graduated'
                                ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50'
                                : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
                        }`}
                      >
                        {/* Status icon */}
                        {decision === 'promoted' && <ArrowUpCircle size={15} className="text-green-500 shrink-0" />}
                        {decision === 'detained' && <Minus size={15} className="text-yellow-500 shrink-0" />}
                        {decision === 'graduated' && <GraduationCap size={15} className="text-purple-500 shrink-0" />}
                        {decision === 'transferred' && <ArrowUpCircle size={15} className="text-blue-500 shrink-0" />}

                        {/* Student info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Roll: {s.rollNo || '—'} · Adm: {s.admissionId || '—'}
                            {s.attendancePercent != null && ` · Att: ${s.attendancePercent}%`}
                            {s.feeStatus && ` · Fee: ${s.feeStatus}`}
                          </p>
                        </div>

                        {/* Blocked reason */}
                        {isBlocked && (
                          <Chip size="sm" variant="flat" color="danger" className="shrink-0 text-xs">
                            {s.blockedReason || 'Blocked'}
                          </Chip>
                        )}

                        {/* Decision selector */}
                        <Select
                          size="sm"
                          selectedKeys={[decision]}
                          onSelectionChange={(keys) => {
                            const val = [...keys][0];
                            if (val) setDecision(mapping.fromClassId, sid, val);
                          }}
                          variant="bordered"
                          className="w-32 shrink-0"
                          classNames={{ trigger: 'h-8 min-h-8 dark:border-zinc-700' }}
                        >
                          {DECISION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    );
                  })
                )}
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          onPress={handleNext}
        >
          Next: Review Summary
        </Button>
      </div>
    </div>
  );
}
