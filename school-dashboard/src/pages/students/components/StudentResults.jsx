import { useMemo } from "react";
import { Card, CardBody, CardHeader, Chip, Progress, Spinner } from "@heroui/react";
import { Award, TrendingUp, Users, User, BookOpen, FileText } from "lucide-react";
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../../components/skeletons/PageSkeletons';
import { getGradeFromPercentage, getPercentageColor } from '../../../utils/grading';

// Helper to get subject icon
const getSubjectIcon = (name) => {
  const lower = name?.toLowerCase() || '';
  if (lower.includes('math')) return '📐';
  if (lower.includes('science')) return '🔬';
  if (lower.includes('english')) return '📚';
  if (lower.includes('social') || lower.includes('history') || lower.includes('civics')) return '🌍';
  if (lower.includes('computer') || lower.includes('it')) return '💻';
  if (lower.includes('physical') || lower.includes('pe') || lower.includes('sports')) return '⚽';
  if (lower.includes('hindi') || lower.includes('sanskrit')) return '🔤';
  if (lower.includes('physics')) return '⚛️';
  if (lower.includes('chemistry')) return '🧪';
  if (lower.includes('biology')) return '🧬';
  return '📖';
};

export default function StudentResults({
  results = [],
  resultsLoading,
  classTeacher,
  onExamSelect
}) {
  const { t } = useTranslation();
  // Calculate metrics from actual results
  const metrics = useMemo(() => {
    if (!results || results.length === 0) {
      return {
        overallGrade: 'N/A',
        averageScore: 0,
        classRank: 'N/A',
        totalSubjects: 0
      };
    }

    // Filter published results with valid percentage
    const validResults = results.filter(r => r.isPublished && r.percentage !== null && r.percentage !== undefined);
    
    if (validResults.length === 0) {
      return {
        overallGrade: 'N/A',
        averageScore: 0,
        classRank: 'N/A',
        totalSubjects: 0
      };
    }

    // Calculate average percentage
    const avgScore = validResults.reduce((sum, r) => sum + r.percentage, 0) / validResults.length;
    const overallGrade = getGradeFromPercentage(avgScore);

    return {
      overallGrade,
      averageScore: avgScore,
      classRank: 'N/A', // Rank requires additional data from backend
      totalSubjects: validResults.length
    };
  }, [results]);

  // Calculate subject-wise performance from results
  const subjectPerformance = useMemo(() => {
    if (!results || results.length === 0) return [];

    // Filter published results
    const publishedResults = results.filter(r => r.isPublished);
    
    // Group by subject
    const subjectMap = {};
    publishedResults.forEach(result => {
      const subjectId = result.subjectId || result.subjectName || 'Unknown';
      const subjectName = result.subjectName || 'Unknown Subject';
      
      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = {
          subjectId,
          subjectName,
          scores: [],
          grades: [],
          results: []
        };
      }
      
      if (result.percentage !== null && result.percentage !== undefined) {
        subjectMap[subjectId].scores.push(result.percentage);
        subjectMap[subjectId].grades.push(result.grade || getGradeFromPercentage(result.percentage));
        subjectMap[subjectId].results.push(result);
      }
    });

    // Calculate average per subject
    return Object.values(subjectMap).map(s => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      score: s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0,
      grade: s.grades[s.grades.length - 1] || 'N/A',
      icon: getSubjectIcon(s.subjectName),
      examCount: s.results.length
    })).sort((a, b) => b.score - a.score);
  }, [results]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Academic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.overallGrade1')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{metrics.overallGrade}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.averageScore')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                  {metrics.averageScore > 0 ? `${metrics.averageScore.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.subjects1')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{metrics.totalSubjects}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.classTeacher2')}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">{classTeacher?.name || "Not Assigned"}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      <Card shadow="none" className="border border-gray-200 dark:border-zinc-800">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subjectWisePerformance1')}</h3>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {subjectPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjectPerformance.map((subject) => (
                <div key={subject.subjectId} className="p-4 rounded-lg border border-gray-200 bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{subject.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-zinc-100">{subject.subjectName}</h4>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {subject.examCount > 1 ? `${subject.examCount} exams` : 'Current Term'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{subject.score}%</div>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color={
                          subject.score >= 90 ? 'success' :
                          subject.score >= 75 ? 'primary' :
                          subject.score >= 50 ? 'warning' : 'danger'
                        }
                        className="mt-1"
                      >
                        Grade {subject.grade}
                      </Chip>
                    </div>
                  </div>
                  <Progress
                    aria-label={`${subject.subjectName} score`}
                    value={subject.score}
                    color={subject.score >= 90 ? "success" : subject.score >= 75 ? "primary" : "warning"}
                    size="sm"
                    radius="full"
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>{t('pages.noSubjectDataAvailableYet')}</p>
              <p className="text-sm">{t('pages.resultsWillAppearHereOnceExamsAreCompletedAndPublished')}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Exam Performance - Cards Grid with Responsive Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.examOverview')}</h3>
          </div>
          {resultsLoading && <Spinner size="sm" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resultsLoading ? (
            <div className="col-span-full">
              <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />
            </div>
          ) : results.length > 0 ? (
            results.map((result) => {
              const exam = result.examId;
              const scoreDisplay = result.isPublished ? `${Math.round(result.percentage)}%` : 'Not Published';
              const status = result.isPublished ? 'Published' : 'Pending';

              return (
                <Card
                  key={result._id}
                  isPressable
                  onPress={() => onExamSelect(result)}
                  shadow="none"
                  className="border border-gray-200 hover:border-gray-300 transition-all dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                  <CardBody className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-lg ${
                        result.isPublished ? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" :
                        "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        <FileText size={18} />
                      </div>
                      <Chip
                        size="sm"
                        className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                        variant="flat"
                      >
                        {status}
                      </Chip>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">{exam?.name || result.subjectName || 'Exam'}</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">{exam?.startDate ? new Date(exam.startDate).toLocaleDateString(getDateLocale(), { month: 'short', year: 'numeric' }) : 'No date'}</p>
                    {result.isPublished && result.percentage > 0 && (
                      <Progress
                        aria-label={`Overall percentage for ${exam?.name || 'exam'}`}
                        value={result.percentage}
                        color={result.percentage >= 90 ? "success" : result.percentage >= 75 ? "primary" : "warning"}
                        size="sm"
                        radius="full"
                        className="mb-3"
                      />
                    )}
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-500 dark:text-zinc-400">{t('pages.score')}</span>
                      <span className={`font-bold ${result.percentage >= 90 ? "text-success" : result.percentage >= 75 ? "text-primary" : "text-default-900"}`}>
                        {scoreDisplay}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-zinc-400">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>{t('pages.noExamResultsAvailableYet')}</p>
              <p className="text-sm">{t('pages.resultsWillAppearHereOnceExamsAreCompletedAndPublished')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Academic Achievements */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
              <Award size={20} />
            </div>
            <h3 className="text-lg font-semibold text-default-900">{t('pages.achievementsAwards')}</h3>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <p className="text-sm text-default-500">{t('pages.noAchievementsRecorded')}</p>
        </CardBody>
      </Card>
    </div>
  );
}
