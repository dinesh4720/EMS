import { useMemo } from "react";
import { Card, CardBody, CardHeader, Chip, Progress, Spinner } from "@heroui/react";
import { Award, TrendingUp, Users, User, BookOpen, FileText } from "lucide-react";

// Helper function to determine grade from percentage
const getGradeFromPercentage = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

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
  results,
  resultsLoading,
  classTeacher,
  onExamSelect
}) {
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
        <Card className="border border-gray-200 bg-white">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Overall Grade</p>
                <p className="text-lg font-bold text-gray-900">{metrics.overallGrade}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Average Score</p>
                <p className="text-lg font-bold text-gray-900">
                  {metrics.averageScore > 0 ? `${metrics.averageScore.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Subjects</p>
                <p className="text-lg font-bold text-gray-900">{metrics.totalSubjects}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Class Teacher</p>
                <p className="text-sm font-bold text-gray-900 truncate">{classTeacher?.name || "Not Assigned"}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      <Card shadow="none" className="border border-gray-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {subjectPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjectPerformance.map((subject, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{subject.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{subject.subjectName}</h4>
                        <p className="text-xs text-gray-500">
                          {subject.examCount > 1 ? `${subject.examCount} exams` : 'Current Term'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{subject.score}%</div>
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
            <div className="text-center py-8 text-gray-500">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>No subject data available yet</p>
              <p className="text-sm">Results will appear here once exams are completed and published</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Exam Performance - Cards Grid with Responsive Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Exam Overview</h3>
          </div>
          {resultsLoading && <Spinner size="sm" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resultsLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : results.length > 0 ? (
            results.map((result, i) => {
              const exam = result.examId;
              const scoreDisplay = result.isPublished ? `${Math.round(result.percentage)}%` : 'Not Published';
              const status = result.isPublished ? 'Published' : 'Pending';

              return (
                <Card
                  key={i}
                  isPressable
                  onPress={() => onExamSelect(result)}
                  shadow="none"
                  className="border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <CardBody className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-lg ${
                        result.isPublished ? "bg-gray-100 text-gray-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        <FileText size={18} />
                      </div>
                      <Chip
                        size="sm"
                        className="bg-gray-100 text-gray-600"
                        variant="flat"
                      >
                        {status}
                      </Chip>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1">{exam?.name || result.subjectName || 'Exam'}</h4>
                    <p className="text-xs text-gray-500 mb-4">{exam?.startDate ? new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No date'}</p>
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
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="text-gray-500">Score</span>
                      <span className={`font-bold ${result.percentage >= 90 ? "text-success" : result.percentage >= 75 ? "text-primary" : "text-default-900"}`}>
                        {scoreDisplay}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>No exam results available yet</p>
              <p className="text-sm">Results will appear here once exams are completed and published</p>
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
            <h3 className="text-lg font-semibold text-default-900">Achievements & Awards</h3>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <p className="text-sm text-default-500">No achievements recorded</p>
        </CardBody>
      </Card>
    </div>
  );
}
