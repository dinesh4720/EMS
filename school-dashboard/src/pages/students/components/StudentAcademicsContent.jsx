import { memo } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../utils/dateFormatter";
import {
  Award, TrendingUp, FileText, User, BookOpen,
} from "lucide-react";

/**
 * StudentAcademicsContent - Renders the "Academics" tab content for the student dashboard.
 *
 * Shows academic summary cards, subject performance bars, exam results list,
 * and an achievements section.
 */
const StudentAcademicsContent = memo(function StudentAcademicsContent({
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
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t("students.academics.overallGrade", "Overall Grade")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{"\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t("students.academics.avgScore", "Avg Score")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{avgPercentage ? `${avgPercentage}%` : "\u2014"}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t("students.academics.exams", "Exams")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{results?.length || 0}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-gray-400 dark:text-zinc-500" />
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t("students.academics.classTeacher", "Class Teacher")}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{classTeacher?.name || "\u2014"}</p>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t("students.academics.subjectPerformance", "Subject Performance")}</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t("students.academics.basedOnExamResults", "Based on exam results")}</p>
        </div>
        {resultsLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-700">
            {Object.values(
              results.reduce((acc, r) => {
                const subject = r.subjectName || t("students.academics.unknownSubject", "Unknown");
                if (!acc[subject] && r.percentage !== null && r.percentage !== undefined) {
                  acc[subject] = {
                    name: subject,
                    score: Math.round(r.percentage),
                    grade: r.grade || null,
                  };
                }
                return acc;
              }, {})
            )
              .slice(0, 6)
              .map((subject, i) => (
                <div key={subject.name} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
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
                    <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-8">{subject.grade || "\u2014"}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <BookOpen size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t("students.academics.noSubjectResults", "No subject results available")}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t("students.academics.resultsWillAppear", "Results will appear once exams are completed")}</p>
          </div>
        )}
      </div>

      {/* Exam Results */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t("students.academics.examResults", "Exam Results")}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t("students.academics.assessmentHistory", "Assessment history")}</p>
          </div>
          {resultsLoading && <div className="w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full animate-spin" />}
        </div>
        {results?.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-700">
            {results.map((result, i) => (
              <div key={result._id || `result-${i}`} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileText size={14} className="text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{result.examId?.name || t("students.academics.exam", "Exam")}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {result.examId?.startDate
                        ? formatDate(result.examId.startDate, '')
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-bold ${
                      result.percentage >= 90
                        ? "text-gray-900 dark:text-zinc-100"
                        : result.percentage >= 75
                        ? "text-gray-700 dark:text-zinc-300"
                        : "text-gray-500 dark:text-zinc-400"
                    }`}
                  >
                    {result.isPublished ? `${Math.round(result.percentage)}%` : "\u2014"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      result.isPublished ? "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400" : "bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500"
                    }`}
                  >
                    {result.isPublished ? t("students.academics.published", "Published") : t("students.academics.pending", "Pending")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <FileText size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t("students.academics.noExamResultsYet", "No exam results yet")}</p>
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t("students.academics.achievements", "Achievements")}</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Best Student Award", date: "Dec 2024" },
              { title: "Science Fair Winner", date: "Nov 2024" },
              { title: "Perfect Attendance", date: "Oct 2024" },
            ].map((a, i) => (
              <div key={a.title} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                <Award size={18} className="text-gray-400 dark:text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default StudentAcademicsContent;
