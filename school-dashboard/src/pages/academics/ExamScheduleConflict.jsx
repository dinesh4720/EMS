import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { CalendarRange, AlertTriangle, CheckCircle, Clock, Trash2, Zap, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { examScheduleApi } from '../../services/api';
import { useAppMeta } from '../../context/AppContext';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';
import { formatShortDate } from '../../utils/dateFormatter';

/**
 * Detects overlapping exam schedules for the same class within the same date range.
 * Uses flatMap to produce one {scheduleId, classId, date range} record per class per schedule,
 * then groups by classId and flags overlaps.
 *
 * FIX (AUDIT-765): `examSchedules` can be undefined or an empty object `{}` when the
 * API returns an error envelope instead of an array. Always guard with Array.isArray()
 * before calling flatMap() to prevent an unhandled TypeError crash.
 */
function detectConflicts(examSchedules) {
  // Guard: API may return {} or undefined on error — flatMap on non-array crashes
  const schedules = Array.isArray(examSchedules) ? examSchedules : [];

  // Expand each schedule into one record per classId (line 67 — formerly crash site)
  const classSlots = schedules.flatMap((schedule) => {
    const classIds = Array.isArray(schedule.classIds) ? schedule.classIds : [];
    return classIds.map((cls) => ({
      scheduleId: schedule._id,
      scheduleName: schedule.name,
      classId: typeof cls === 'object' ? cls._id : cls,
      className: typeof cls === 'object' ? (cls.section ? `${cls.name} - ${cls.section}` : cls.name) : cls,
      startDate: new Date(schedule.startDate),
      endDate: new Date(schedule.endDate),
      status: schedule.status,
    }));
  });

  // Group by classId and detect date-range overlaps within each group
  const byClass = {};
  for (const slot of classSlots) {
    const key = String(slot.classId);
    if (!byClass[key]) byClass[key] = [];
    byClass[key].push(slot);
  }

  const conflicts = [];
  for (const slots of Object.values(byClass)) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];
        // Two schedules overlap when neither ends before the other starts
        if (a.startDate <= b.endDate && a.endDate >= b.startDate) {
          conflicts.push({ a, b });
        }
      }
    }
  }
  return conflicts;
}

const STATUS_COLOR = {
  draft: 'default',
  scheduled: 'primary',
  sent: 'success',
};

const ExamScheduleConflict = ({ onCreateSchedule }) => {
  const { t } = useTranslation();
  const { selectedAcademicYear } = useAppMeta();
  const statusLabel = {
    draft: t('academics.scheduleConflict.statusDraft'),
    scheduled: t('academics.scheduleConflict.statusScheduled'),
    sent: t('academics.scheduleConflict.statusSent'),
  };
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [selectedAcademicYear]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = selectedAcademicYear ? { academicYear: selectedAcademicYear } : {};
      const data = await examScheduleApi.getAll(params);
      // Defensive: API may return {} or undefined on network/parse errors
      setSchedules(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('academics.scheduleConflict.toastLoadFailed'));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const conflicts = useMemo(() => detectConflicts(schedules), [schedules]);

  const conflictingIds = useMemo(() => {
    const ids = new Set();
    for (const { a, b } of conflicts) {
      ids.add(a.scheduleId);
      ids.add(b.scheduleId);
    }
    return ids;
  }, [conflicts]);

  const handleGenerate = async (id) => {
    try {
      await examScheduleApi.generate(id);
      toast.success(t('academics.scheduleConflict.toastGenerated'));
      fetchSchedules();
    } catch (err) {
      toast.error(err.message || t('academics.scheduleConflict.toastGenerateFailed'));
    }
  };

  const handleConfirm = async (id) => {
    try {
      await examScheduleApi.confirm(id);
      toast.success(t('academics.scheduleConflict.toastConfirmed'));
      fetchSchedules();
    } catch (err) {
      if (err.type === 'ConflictError') {
        toast.error(t('academics.scheduleConflict.toastConfirmConflict'));
      } else {
        toast.error(err.message || t('academics.scheduleConflict.toastConfirmFailed'));
      }
    }
  };

  const handleSend = async (id) => {
    try {
      await examScheduleApi.send(id);
      toast.success(t('academics.scheduleConflict.toastSent'));
      fetchSchedules();
    } catch (err) {
      toast.error(err.message || t('academics.scheduleConflict.toastSendFailed'));
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await examScheduleApi.delete(deleteModal.id);
      toast.success(t('academics.scheduleConflict.toastDeleted'));
      fetchSchedules();
    } catch {
      toast.error(t('academics.scheduleConflict.toastDeleteFailed'));
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  if (loading) {
    return <TablePageSkeleton kpiCards={0} columns={5} rows={4} />;
  }

  return (
    <div className="space-y-4">
      {/* Conflict banner */}
      {conflicts.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-4 py-3">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('academics.scheduleConflict.conflictsDetected', { count: conflicts.length })}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {t('academics.scheduleConflict.conflictsHint')}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {schedules.length === 0 ? (
        <div className="text-center py-16">
          <CalendarRange size={40} className="mx-auto mb-3 text-fg-faint" />
          <p className="text-fg-muted mb-4">{t('academics.scheduleConflict.emptyTitle')}</p>
          <Button color="primary" size="sm" onPress={onCreateSchedule}>
            {t('academics.scheduleConflict.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const hasConflict = conflictingIds.has(schedule._id);
            const classNames = Array.isArray(schedule.classIds)
              ? schedule.classIds
                  .map((c) => (typeof c === 'object' ? (c.section ? `${c.name} - ${c.section}` : c.name) : c))
                  .join(', ')
              : '—';

            return (
              <Card
                key={schedule._id}
                shadow="none"
                className={`border ${
                  hasConflict
                    ? 'border-amber-300 dark:border-amber-700'
                    : 'border-divider'
                }`}
              >
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          hasConflict
                            ? 'bg-amber-100 dark:bg-amber-900'
                            : 'bg-surface-2'
                        }`}
                      >
                        {hasConflict ? (
                          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                          <CalendarRange size={16} className="text-fg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-fg text-sm">
                            {schedule.name}
                          </span>
                          <Chip
                            size="sm"
                            color={STATUS_COLOR[schedule.status] || 'default'}
                            variant="flat"
                          >
                            {statusLabel[schedule.status] || schedule.status}
                          </Chip>
                          {hasConflict && (
                            <Chip size="sm" color="warning" variant="flat">
                              {t('academics.scheduleConflict.conflictChip')}
                            </Chip>
                          )}
                        </div>
                        <p className="text-xs text-fg-muted mt-1">{classNames}</p>
                        <div className="flex items-center gap-1.5 text-xs text-fg-faint mt-1">
                          <Clock size={12} />
                          {formatShortDate(schedule.startDate)} – {formatShortDate(schedule.endDate)}
                          {schedule.type && (
                            <span className="capitalize ml-1 text-fg-faint">
                              · {schedule.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {schedule.status === 'draft' && !schedule.entries?.length && (
                        <button
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                          onClick={() => handleGenerate(schedule._id)}
                          title={t('academics.scheduleConflict.actionGenerate')}
                        >
                          <Zap size={15} className="text-blue-500" />
                        </button>
                      )}
                      {schedule.status === 'draft' && schedule.entries?.length > 0 && (
                        <button
                          className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                          onClick={() => handleConfirm(schedule._id)}
                          title={t('academics.scheduleConflict.actionConfirm')}
                        >
                          <CheckCircle size={15} className="text-green-500" />
                        </button>
                      )}
                      {schedule.status === 'scheduled' && (
                        <button
                          className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
                          onClick={() => handleSend(schedule._id)}
                          title={t('academics.scheduleConflict.actionSend')}
                        >
                          <Send size={15} className="text-purple-500" />
                        </button>
                      )}
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        onClick={() => handleDeleteClick(schedule._id, schedule.name)}
                        title={t('academics.scheduleConflict.actionDelete')}
                      >
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => !deleting && setDeleteModal({ isOpen: false, id: null, name: '' })}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-surface' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-medium">{t('academics.scheduleConflict.deleteTitle')}</h3>
                <p className="text-sm text-fg-muted font-normal">
                  {t('academics.scheduleConflict.deleteSubtitle')}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-fg-muted">
              {t('academics.scheduleConflict.deleteConfirm', { name: deleteModal.name })}
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button
              variant="light"
              onPress={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
              isDisabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button color="danger" onPress={handleConfirmDelete} isLoading={deleting}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ExamScheduleConflict;
