import { Award, TrendingUp, FileText, User, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatShortDate } from "../../../utils/dateFormatter";
import { getGradeFromPercentage } from "../../../utils/grading";
import AcademicProgressTimeline from "./AcademicProgressTimeline";

// ============================================================================
// STUDENT ACADEMICS TAB
// Summary cards, subject performance, exam results, timeline, achievements
// ============================================================================

export default function StudentAcademicsTab({
  studentId,
  results,
  resultsLoading,
  avgPercentage,
  classTeacher,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {/* Academic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.overallGrade1')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            {avgPercentage ? (avgPercentage >= 90 ? 'A+' : avgPercentage >= 80 ? 'A' : avgPercentage >= 70 ? 'B+' : 'B') : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.avgScore1')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{avgPercentage ? `${avgPercentage}%` : '—'}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.exams1')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{results?.length || 0}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.classTeacher2')}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{classTeacher?.name || '—'}</p>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subjectPerformance1')}</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.basedOnExamResults1')}</p>
        </div>
        {resultsLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />
          </div>
        ) : results && results.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {Object.values(results.reduce((acc, res) => {
              const subject = res.subjectName || res.examId?.subjectName || res.examId?.subject || res.examId?.name || 'Unknown';
              if (!acc[subject] && res.percentage !== null && res.percentage !== undefined) {
                acc[subject] = {
                  name: subject,
                  score: Math.round(res.percentage),
                  grade: res.grade || getGradeFromPercentage(res.percentage)
                };
              }
              return acc;
            }, {})).slice(0, 6).map((subject) => (
              <div key={`subject-${subject.name}`} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {subject.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{subject.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-800 dark:bg-zinc-300 rounded-full" style={{ width: `${subject.score}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 w-12 text-right">{subject.score}%</span>
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-8">{subject.grade}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <BookOpen size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noSubjectResultsAvailable')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t('pages.resultsWillAppearOnceExamsAreCompleted')}</p>
          </div>
        )}
      </div>

      {/* Exam Results */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.examResults1')}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.assessmentHistory1')}</p>
          </div>
          {resultsLoading && <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />}
        </div>
        {results?.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {results.map((result) => (
              <div key={result._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileText size={14} className="text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{result.examId?.name || 'Exam'}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{result.examId?.startDate ? formatShortDate(result.examId.startDate) : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${result.percentage >= 90 ? 'text-gray-900 dark:text-zinc-100' : result.percentage >= 75 ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                    {result.isPublished ? `${Math.round(result.percentage)}%` : '—'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${result.isPublished ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-zinc-500'}`}>
                    {result.isPublished ? 'Published' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <FileText size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noExamResultsYet1')}</p>
          </div>
        )}
      </div>

      {/* Academic Progress Timeline — multi-year view */}
      <AcademicProgressTimeline studentId={studentId} />

      {/* Achievements */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.achievements1')}</h3>
        </div>
        <div className="px-5 py-12 text-center">
          <Award size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noAchievementsRecordedYet', 'No achievements recorded yet')}</p>
        </div>
      </div>
    </div>
  );
}
