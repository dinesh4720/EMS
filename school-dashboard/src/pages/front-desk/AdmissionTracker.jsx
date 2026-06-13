import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { STAGE_OPTIONS, getStatusMeta, stageOfStatus } from './admissionsConstants';

const formatApplicationId = (a) => {
  if (a.applicationId) return a.applicationId;
  const tail = String(a._id || '').slice(-6).toUpperCase();
  return tail ? `ADM-${tail}` : 'ADM-—';
};

/**
 * Kanban-style stage tracker for admissions. One .glass column per stage.
 * Cards are draggable between columns; drop fires onStageChange which is
 * expected to validate the transition and persist via the backend.
 */
export default function AdmissionTracker({ admissions, onCardClick, onStageChange }) {
  const [dragId, setDragId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [liveMessage, setLiveMessage] = useState('');

  const grouped = useMemo(() => {
    const byStage = Object.fromEntries(STAGE_OPTIONS.map((s) => [s.key, []]));
    (admissions || []).forEach((a) => {
      const key = stageOfStatus(a.status);
      if (byStage[key]) byStage[key].push(a);
    });
    return byStage;
  }, [admissions]);

  const handleDragStart = (e, admission) => {
    setDragId(admission._id);
    try {
      e.dataTransfer.setData('text/plain', admission._id);
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      /* some browsers throw on setData under restrictive contexts */
    }
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageKey) => {
    if (!dragId) return;
    e.preventDefault();
    if (dragOverStage !== stageKey) setDragOverStage(stageKey);
  };

  const handleDragLeave = (stageKey) => {
    if (dragOverStage === stageKey) setDragOverStage(null);
  };

  const handleDrop = (e, stageKey) => {
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData('text/plain');
    setDragId(null);
    setDragOverStage(null);
    if (!id || !onStageChange) return;
    const stageLabel = STAGE_OPTIONS.find((s) => s.key === stageKey)?.label || stageKey;
    const admission = admissions.find((a) => a._id === id);
    setLiveMessage(`Moved ${admission?.studentName || 'admission'} to ${stageLabel}`);
    onStageChange(id, stageKey);
  };

  const handleCardKeyMove = (admission, direction) => {
    if (!onStageChange) return;
    const currentIndex = STAGE_OPTIONS.findIndex((s) => s.key === stageOfStatus(admission.status));
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= STAGE_OPTIONS.length) return;
    const stageLabel = STAGE_OPTIONS[nextIndex].label;
    setLiveMessage(`Moved ${admission.studentName || 'admission'} to ${stageLabel}`);
    onStageChange(admission._id, STAGE_OPTIONS[nextIndex].key);
  };

  return (
    <>
      <div className="adm-board" role="list" aria-label="Admissions board">
        {STAGE_OPTIONS.map((stage) => {
        const items = grouped[stage.key] || [];
        const isOver = dragOverStage === stage.key;
        return (
          <div
            key={stage.key}
            className={`adm-col glass ${isOver ? 'is-drag-over' : ''}`}
            role="listitem"
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={() => handleDragLeave(stage.key)}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            <div className="adm-col__head">
              <span>
                <span
                  className={`status status--${stage.tone}`}
                  style={{ height: 18, padding: '0 6px', fontSize: 10.5 }}
                >
                  {stage.label}
                </span>
              </span>
              <span className="adm-col__count mono tnum">{items.length}</span>
            </div>
            <div className="adm-col__list">
              {items.length === 0 ? (
                <div
                  className="subtle"
                  style={{ fontSize: 11.5, padding: '20px 6px', textAlign: 'center' }}
                >
                  No admissions
                </div>
              ) : (
                items.map((a) => {
                  const meta = getStatusMeta(a.status);
                  return (
                    <button
                      key={a._id}
                      type="button"
                      className={`adm-card ${dragId === a._id ? 'is-dragging' : ''}`}
                      draggable={!!onStageChange}
                      onDragStart={(e) => handleDragStart(e, a)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCardClick?.(a)}
                      onKeyDown={(e) => {
                        if (!onStageChange) return;
                        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleCardKeyMove(a, 'next');
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleCardKeyMove(a, 'prev');
                        }
                      }}
                      aria-label={`${a.studentName} — ${meta.label}. Use arrow keys to move between stages.`}
                    >
                      <span className="adm-card__id mono tnum">
                        {formatApplicationId(a)}
                      </span>
                      <span className="adm-card__name">{a.studentName || '—'}</span>
                      <span className="adm-card__meta">
                        <span>
                          {a.classApplyingFor
                            ? (Number.isNaN(Number(a.classApplyingFor))
                                ? a.classApplyingFor
                                : `Class ${a.classApplyingFor}`)
                            : '—'}
                        </span>
                        <span>·</span>
                        <span>{meta.label}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          );
        })}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
    </>
  );
}

AdmissionTracker.propTypes = {
  admissions: PropTypes.array,
  onCardClick: PropTypes.func,
  onStageChange: PropTypes.func,
};
