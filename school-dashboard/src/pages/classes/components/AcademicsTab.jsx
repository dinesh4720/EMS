import { useState, useMemo, useEffect } from "react";
import logger from "../../../utils/logger";
import { Button, Chip } from "@heroui/react";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { examsApi } from "../../../services/api";
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../../utils/dateFormatter';
import { Bone } from './Bone';

export function AcademicsTab({ id, cls, classesEnhancedApi }) {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    examsApi.getByClass(id)
      .then(data => { if (!controller.signal.aborted) setExams(data || []); })
      .catch(error => { if (!controller.signal.aborted) { logger.error('Error fetching exams:', error); toast.error(t('toast.error.failedToLoadExams')); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, t]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'ongoing': return 'warning';
      case 'completed': case 'results_published': return 'success';
      default: return 'default';
    }
  };

  const examsByStatus = useMemo(() => ({
    scheduled: exams.filter(e => e.status === 'scheduled'),
    ongoing: exams.filter(e => e.status === 'ongoing'),
    completed: exams.filter(e => e.status === 'completed' || e.status === 'results_published'),
  }), [exams]);

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('pages.totalExams'), value: exams.length, color: 'text-fg' },
          { label: t('pages.scheduled'), value: examsByStatus.scheduled.length, color: 'text-[var(--info)]' },
          { label: t('pages.ongoing'), value: examsByStatus.ongoing.length, color: 'text-[var(--warn)]' },
          { label: t('pages.completed'), value: examsByStatus.completed.length, color: 'text-[var(--ok)]' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface rounded-lg p-4 border border-divider">
            <p className="text-xs text-fg-muted">{stat.label}</p>
            <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Exams List */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="p-4 border-b border-divider flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
              <FileText size={14} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="font-medium text-fg text-sm">{t('pages.classExams')}</h3>
              <p className="text-[11px] text-fg-muted">{t('pages.allScheduledAndCompletedExams')}</p>
            </div>
          </div>
          <Button size="sm" className="bg-accent text-accent-fg" startContent={<FileText size={14} />}
            onPress={() => navigate('/academics/exams')}>{t('classes.manageExams', 'Manage Exams')}</Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Bone key={`exam-skeleton-${i}`} className="h-14 w-full" />)}
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-fg-faint mb-4" />
            <p className="text-sm text-fg-muted">{t('pages.noExamsScheduledForThisClassYet')}</p>
            <Button className="mt-4 bg-accent text-accent-fg" startContent={<FileText size={16} />}
              onPress={() => navigate('/academics/exams')}>{t('classes.createExam', 'Create Exam')}</Button>
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {exams.map((exam) => (
              <div key={exam._id || exam.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-2 transition-colors cursor-pointer"
                onClick={() => navigate(`/academics/exams/${exam._id || exam.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                    <FileText size={18} className="text-fg-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">{exam.name}</p>
                    <p className="text-xs text-fg-muted">{exam.subjectName || t('classes.general', 'General')} · {exam.type?.replace(/_/g, ' ') || t('classes.exam', 'Exam')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-fg-muted">{exam.startDate ? formatShortDate(exam.startDate) : t('classes.notScheduled', 'Not scheduled')}</p>
                    <p className="text-xs text-fg-faint">{t('classes.max', 'Max')}: {exam.maxMarks || 100} | {t('classes.pass', 'Pass')}: {exam.passingMarks || 35}</p>
                  </div>
                  <Chip size="sm" color={getStatusColor(exam.status)} variant="flat">{t(`classes.examStatus.${exam.status || 'scheduled'}`, exam.status?.replace(/_/g, ' ') || 'scheduled')}</Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
