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
  }, [id]);

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
          { label: t('pages.totalExams'), value: exams.length, color: 'text-gray-900 dark:text-zinc-100' },
          { label: t('pages.scheduled'), value: examsByStatus.scheduled.length, color: 'text-blue-600' },
          { label: t('pages.ongoing'), value: examsByStatus.ongoing.length, color: 'text-amber-600' },
          { label: t('pages.completed'), value: examsByStatus.completed.length, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{stat.label}</p>
            <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Exams List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <FileText size={14} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classExams')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('pages.allScheduledAndCompletedExams')}</p>
            </div>
          </div>
          <Button size="sm" className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" startContent={<FileText size={14} />}
            onPress={() => navigate('/academics/exams')}>{t('classes.manageExams', 'Manage Exams')}</Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Bone key={i} className="h-14 w-full" />)}
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-200 dark:text-zinc-700 mb-4" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noExamsScheduledForThisClassYet')}</p>
            <Button className="mt-4 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" startContent={<FileText size={16} />}
              onPress={() => navigate('/academics/exams')}>{t('classes.createExam', 'Create Exam')}</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {exams.map((exam) => (
              <div key={exam._id || exam.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                onClick={() => navigate(`/academics/exams/${exam._id || exam.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileText size={18} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{exam.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.subjectName || t('classes.general', 'General')} · {exam.type?.replace('_', ' ') || t('classes.exam', 'Exam')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{exam.startDate ? formatShortDate(exam.startDate) : t('classes.notScheduled', 'Not scheduled')}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{t('classes.max', 'Max')}: {exam.maxMarks || 100} | {t('classes.pass', 'Pass')}: {exam.passingMarks || 35}</p>
                  </div>
                  <Chip size="sm" color={getStatusColor(exam.status)} variant="flat">{t(`classes.examStatus.${exam.status || 'scheduled'}`, exam.status?.replace('_', ' ') || 'scheduled')}</Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
