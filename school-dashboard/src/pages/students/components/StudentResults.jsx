import { Card, CardBody, CardHeader, Chip, Progress, Spinner } from "@heroui/react";
import { Award, TrendingUp, Users, User, BookOpen, FileText } from "lucide-react";

export default function StudentResults({
  results,
  resultsLoading,
  classTeacher,
  onExamSelect
}) {
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
                <p className="text-lg font-bold text-gray-900">A+</p>
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
                <p className="text-lg font-bold text-gray-900">88.5%</p>
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
                <p className="text-xs text-gray-600">Class Rank</p>
                <p className="text-lg font-bold text-gray-900">#5</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { subject: "Mathematics", score: 88, grade: "A", color: "blue", icon: "📐" },
              { subject: "Science", score: 92, grade: "A+", color: "green", icon: "🔬" },
              { subject: "English", score: 85, grade: "A", color: "purple", icon: "📚" },
              { subject: "Social Studies", score: 90, grade: "A+", color: "orange", icon: "🌍" },
              { subject: "Computer Science", score: 95, grade: "A+", color: "cyan", icon: "💻" },
              { subject: "Physical Education", score: 87, grade: "A", color: "red", icon: "⚽" }
            ].map((subject, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                      <p className="text-xs text-gray-500">Current Term</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold text-gray-900`}>{subject.score}%</div>
                    <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 mt-1">
                      Grade {subject.grade}
                    </Chip>
                  </div>
                </div>
                <Progress
                  aria-label={`${subject.name} score`}
                  value={subject.score}
                  color={subject.score >= 90 ? "success" : subject.score >= 75 ? "primary" : "warning"}
                  size="sm"
                  radius="full"
                  className="mt-2"
                />
              </div>
            ))}
          </div>
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
          {/* Real exam results when available */}
          {results.length > 0 ? results.map((result, i) => {
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
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{exam?.name || 'Exam'}</h4>
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
          }) : resultsLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : !resultsLoading && (
            /* Fallback mock data when no results exist */
            [
              { name: "Unit Test 1", date: "Aug 2024", status: "Published", score: "88%", percentage: 88 },
              { name: "Half Yearly", date: "Sept 2024", status: "Published", score: "92%", percentage: 92 },
              { name: "Unit Test 2", date: "Nov 2024", status: "Published", score: "85%", percentage: 85 },
              { name: "Annual Exam", date: "Dec 2024", status: "Scheduled", score: "-", percentage: 0 }
            ].map((exam, i) => (
              <Card
                key={i}
                isPressable
                onPress={() => onExamSelect(exam)}
                shadow="none"
                className="border border-gray-200 hover:border-gray-300 transition-all"
              >
                <CardBody className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-lg bg-gray-100 text-gray-600`}>
                      <FileText size={18} />
                    </div>
                    <Chip
                      size="sm"
                      className="bg-gray-100 text-gray-600"
                      variant="flat"
                    >
                      {exam.status}
                    </Chip>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{exam.name}</h4>
                  <p className="text-xs text-gray-500 mb-4">{exam.date}</p>
                  {exam.percentage > 0 && (
                    <Progress
                      aria-label={`Overall percentage for ${exam.name}`}
                      value={exam.percentage}
                      color={exam.percentage >= 90 ? "success" : exam.percentage >= 75 ? "primary" : "warning"}
                      size="sm"
                      radius="full"
                      className="mb-3"
                    />
                  )}
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                    <span className="text-gray-500">Score</span>
                    <span className={`font-bold ${exam.percentage >= 90 ? "text-success" : exam.percentage >= 75 ? "text-primary" : "text-default-900"}`}>
                      {exam.score}
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Best Student Award", date: "Dec 2024", icon: "🏆" },
              { title: "Science Fair Winner", date: "Nov 2024", icon: "🔬" },
              { title: "Perfect Attendance", date: "Oct 2024", icon: "📅" },
              { title: "Math Olympiad Bronze", date: "Sept 2024", icon: "🥉" }
            ].map((achievement, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-default-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                <span className="text-3xl">{achievement.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-default-900">{achievement.title}</h4>
                  <p className="text-xs text-default-500">{achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
