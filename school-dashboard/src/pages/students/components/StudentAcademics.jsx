import { useState, useEffect, useRef } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Spinner, Button,
  Select, SelectItem, Divider
} from "@heroui/react";
import {
  Award, TrendingUp, Users, User, BookOpen, FileText,
  Download, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { useReactToPrint } from "react-to-print";
import ReportCardTemplate from "../../../components/ReportCardTemplate";
import { useApp } from "../../../context/AppContext";
import { getAcademicYearOptions } from "../../../utils/constants";

// Helper function to get auth token
const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      return null;
    }
  }
  return null;
};

export default function StudentAcademics({
  studentId,
  student,
  classTeacher
}) {
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);
  const [results, setResults] = useState([]);
  const [trends, setTrends] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [selectedYearOverride, setSelectedYearOverride] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const selectedYear = selectedYearOverride || currentAcademicYear;
  const academicYearOptions = [...getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 }), 'all'];

  // Reference for the printable report card
  const reportCardRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchAcademicData();
  }, [studentId, selectedYear, selectedTerm]);

  const fetchAcademicData = async () => {
    setLoading(true);
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      // Fetch performance data
      const perfUrl = `${API_URL}/academic-performance/student/${studentId}?academicYear=${selectedYear}${selectedTerm !== 'all' ? `&term=${selectedTerm}` : ''}`;
      const perfRes = await fetch(perfUrl, { headers });
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        setPerformance(perfData[0] || null);
      }

      // Fetch results
      const resultsUrl = `${API_URL}/results/student/${studentId}`;
      const resultsRes = await fetch(resultsUrl, { headers });
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        // Filter by academic year if needed
        const filteredResults = selectedYear !== 'all'
          ? resultsData.filter(r => {
              // We'd need exam data to filter by year, for now show all
              return true;
            })
          : resultsData;
        setResults(filteredResults);
      }

      // Fetch trends
      const trendsUrl = `${API_URL}/academic-performance/trends/${studentId}`;
      const trendsRes = await fetch(trendsUrl, { headers });
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData);
      }

      // Fetch upcoming exams for student's class
      if (student?.class) {
        const classId = student.class.replace(' ', '-');
        const examsUrl = `${API_URL}/exams/class/${classId}`;
        const examsRes = await fetch(examsUrl, { headers });
        if (examsRes.ok) {
          const examsData = await examsRes.json();
          const upcoming = examsData.filter(e =>
            new Date(e.date) >= new Date() && e.status === 'scheduled'
          ).slice(0, 5);
          setUpcomingExams(upcoming);
        }
      }
    } catch (error) {
      console.error('Error fetching academic data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Print handler using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: reportCardRef,
    documentTitle: `report-card-${student?.name?.replace(/\s+/g, '-') || studentId}-${selectedYear}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .page-break-after {
          page-break-after: always;
          break-after: page;
        }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }
        .bg-purple-50 { background-color: #faf5ff !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
      }
    `,
    onBeforePrint: () => {
      setDownloadingPdf(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setDownloadingPdf(false);
      setShowPrintPreview(false);
      return Promise.resolve();
    }
  });

  const handleDownloadReportCard = async () => {
    // Show the print preview and trigger print
    setShowPrintPreview(true);
    // Use a small timeout to ensure the component is rendered before printing
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  // Calculate aggregate metrics from results
  const calculateMetrics = () => {
    if (!results || results.length === 0) {
      return {
        overallGrade: 'N/A',
        averageScore: 0,
        classRank: performance?.classRank || 'N/A',
        totalStudents: performance?.totalStudents || 0
      };
    }

    const publishedResults = results.filter(r => r.isPublished && r.percentage !== null);
    if (publishedResults.length === 0) {
      return {
        overallGrade: 'N/A',
        averageScore: 0,
        classRank: performance?.classRank || 'N/A',
        totalStudents: performance?.totalStudents || 0
      };
    }

    const avgScore = publishedResults.reduce((sum, r) => sum + r.percentage, 0) / publishedResults.length;
    const avgGpa = publishedResults.reduce((sum, r) => sum + (r.gpa || 0), 0) / publishedResults.length;

    // Determine overall grade from average
    let grade = 'F';
    if (avgScore >= 90) grade = 'A+';
    else if (avgScore >= 80) grade = 'A';
    else if (avgScore >= 70) grade = 'B+';
    else if (avgScore >= 60) grade = 'B';
    else if (avgScore >= 50) grade = 'C+';
    else if (avgScore >= 40) grade = 'C';
    else if (avgScore >= 35) grade = 'D';

    return {
      overallGrade: performance?.overallGrade || grade,
      averageScore: performance?.overallPercentage || avgScore,
      averageGPA: performance?.overallGPA || avgGpa,
      classRank: performance?.classRank || 'N/A',
      totalStudents: performance?.totalStudents || 0,
      trend: performance?.trend || 'stable'
    };
  };

  // Build subject-wise data from results
  const buildSubjectData = () => {
    if (performance?.subjectWisePerformance) {
      return performance.subjectWisePerformance;
    }

    if (!results || results.length === 0) return [];

    const subjectMap = {};
    results.filter(r => r.isPublished).forEach(r => {
      if (!subjectMap[r.subjectId]) {
        subjectMap[r.subjectId] = {
          subjectId: r.subjectId,
          subjectName: r.subjectName,
          scores: [],
          grades: []
        };
      }
      if (r.percentage !== null) {
        subjectMap[r.subjectId].scores.push(r.percentage);
        subjectMap[r.subjectId].grades.push(r.grade);
      }
    });

    return Object.values(subjectMap).map(s => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      percentage: s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0,
      grade: s.grades[s.grades.length - 1] || 'N/A'
    }));
  };

  // Build chart data for trends
  const buildTrendChartData = () => {
    if (trends.length === 0) {
      return [];
    }
    return trends.map(t => ({
      term: t.term || t.academicYear,
      percentage: t.overallPercentage
    }));
  };

  // Build radar chart data for subjects
  const buildRadarData = () => {
    const subjects = buildSubjectData();
    if (subjects.length === 0) {
      return [];
    }
    return subjects.slice(0, 6).map(s => ({
      subject: s.subjectName?.substring(0, 10) || 'Subject',
      score: Math.round(s.percentage || 0)
    }));
  };

  const metrics = calculateMetrics();
  const subjectData = buildSubjectData();
  const trendChartData = buildTrendChartData();
  const radarData = buildRadarData();

  const subjectIcons = {
    'math': '📐',
    'science': '🔬',
    'english': '📚',
    'social': '🌍',
    'computer': '💻',
    'physical': '⚽',
    'hindi': '🔤',
    'default': '📖'
  };

  const getSubjectIcon = (name) => {
    const lower = name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(subjectIcons)) {
      if (lower.includes(key)) return icon;
    }
    return subjectIcons.default;
  };

  const getTrendIcon = () => {
    switch (metrics.trend) {
      case 'improving': return <ArrowUpRight className="text-success" size={16} />;
      case 'declining': return <ArrowDownRight className="text-danger" size={16} />;
      default: return <Minus className="text-default-400" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select
            size="sm"
            selectedKeys={[selectedYear]}
            onSelectionChange={(keys) => {
              const nextYear = Array.from(keys)[0];
              setSelectedYearOverride(nextYear === currentAcademicYear ? null : nextYear);
            }}
            className="w-36"
            label="Academic Year"
          >
            {academicYearOptions.map(year => (
              <SelectItem key={year} value={year}>{year === 'all' ? 'All Years' : year}</SelectItem>
            ))}
          </Select>
          <Select
            size="sm"
            selectedKeys={[selectedTerm]}
            onSelectionChange={(keys) => setSelectedTerm(Array.from(keys)[0])}
            className="w-32"
            label="Term"
          >
            {['all', 'Term 1', 'Term 2', 'Term 3', 'Final'].map(term => (
              <SelectItem key={term} value={term}>{term === 'all' ? 'All Terms' : term}</SelectItem>
            ))}
          </Select>
        </div>
        <Button
          color="primary"
          variant="flat"
          startContent={<Download size={16} />}
          onPress={handleDownloadReportCard}
          isLoading={downloadingPdf}
        >
          Download Report Card
        </Button>
      </div>

      {/* Academic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-default-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-600 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-blue-600">Overall Grade</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.overallGrade}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/20 text-green-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-green-600">Average Score</p>
                  <p className="text-2xl font-bold text-green-900">
                    {metrics.averageScore > 0 ? `${metrics.averageScore.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                {getTrendIcon()}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-600 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-purple-600">Class Rank</p>
                <p className="text-2xl font-bold text-purple-900">
                  {typeof metrics.classRank === 'number' ? `#${metrics.classRank}` : metrics.classRank}
                  {metrics.totalStudents > 0 && (
                    <span className="text-sm font-normal text-purple-600">/{metrics.totalStudents}</span>
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-orange-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-orange-600">Class Teacher</p>
                <p className="text-sm font-bold text-orange-900 truncate">
                  {classTeacher?.name || "Not Assigned"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend Chart */}
        <Card shadow="none" className="border border-default-200">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-semibold text-default-900">Performance Trend</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="term" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Subject Radar Chart */}
        <Card shadow="none" className="border border-default-200">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h3 className="text-lg font-semibold text-default-900">Subject Analysis</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-semibold text-default-900">Subject-wise Performance</h3>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {subjectData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectData.map((subject) => (
                <div key={subject.subjectId || subject.subjectName} className="p-4 rounded-lg border border-default-200 bg-white dark:bg-zinc-900 hover:shadow-md dark:shadow-zinc-900/50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSubjectIcon(subject.subjectName)}</span>
                      <div>
                        <h4 className="font-semibold text-default-900">{subject.subjectName}</h4>
                        <p className="text-xs text-default-500">Current Term</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-default-900">
                        {subject.percentage ? `${subject.percentage.toFixed(1)}%` : 'N/A'}
                      </div>
                      <Chip size="sm" variant="flat" color={
                        subject.percentage >= 90 ? 'success' :
                        subject.percentage >= 75 ? 'primary' :
                        subject.percentage >= 50 ? 'warning' : 'danger'
                      }>
                        Grade {subject.grade}
                      </Chip>
                    </div>
                  </div>
                  <Progress
                    aria-label={`${subject.subjectName} score`}
                    value={subject.percentage || 0}
                    color={
                      subject.percentage >= 90 ? 'success' :
                      subject.percentage >= 75 ? 'primary' :
                      subject.percentage >= 50 ? 'warning' : 'danger'
                    }
                    size="sm"
                    radius="full"
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-default-500">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>No subject data available yet</p>
              <p className="text-sm">Results will appear here once exams are completed</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card shadow="none" className="border border-default-200">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-semibold text-default-900">Upcoming Exams</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between p-4 rounded-lg border border-default-200 bg-default-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-default-900">{exam.name}</h4>
                      <p className="text-sm text-default-500">{exam.subjectName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-default-900">
                      {new Date(exam.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-default-500">Max: {exam.maxMarks} marks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Exam Results History */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 text-primary-600 rounded-lg">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-semibold text-default-900">Exam Results</h3>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {results.filter(r => r.isPublished).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.filter(r => r.isPublished).map((result) => (
                <Card key={result._id} shadow="none" className="border border-default-200 hover:shadow-md dark:shadow-zinc-900/50 transition-all">
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-default-900">{result.subjectName}</h4>
                        <p className="text-xs text-default-500">{result.examId?.name || 'Exam'}</p>
                      </div>
                      <Chip
                        size="sm"
                        color={result.status === 'pass' ? 'success' : 'danger'}
                        variant="flat"
                      >
                        {result.status === 'pass' ? 'Pass' : 'Fail'}
                      </Chip>
                    </div>
                    <Divider className="my-3" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-default-500">Marks</p>
                        <p className="font-semibold">{result.marksObtained}/{result.maxMarks}</p>
                      </div>
                      <div>
                        <p className="text-default-500">Percentage</p>
                        <p className="font-semibold">{result.percentage?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-default-500">Grade</p>
                        <p className="font-semibold">{result.grade}</p>
                      </div>
                      <div>
                        <p className="text-default-500">GPA</p>
                        <p className="font-semibold">{result.gpa?.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-default-500">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>No published results yet</p>
              <p className="text-sm">Results will appear here once exams are graded and published</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Hidden Print Container for Report Card */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: showPrintPreview ? 'visible' : 'hidden' }}>
        <div ref={reportCardRef}>
          <ReportCardTemplate
            student={{
              name: student?.name,
              class: student?.class,
              rollNo: student?.rollNo,
              admissionNo: student?.admissionId,
              fatherName: student?.parentName || student?.fatherName,
              dob: student?.dateOfBirth || student?.dob
            }}
            performance={{
              ...performance,
              overallGrade: metrics.overallGrade,
              overallPercentage: metrics.averageScore,
              overallGPA: metrics.averageGPA,
              classRank: metrics.classRank,
              totalStudents: metrics.totalStudents,
              trend: metrics.trend,
              academicYear: selectedYear,
              term: selectedTerm
            }}
            results={results}
            schoolInfo={{
              name: 'School Management System',
              address: 'Academic Excellence Through Innovation'
            }}
            attendance={{
              totalDays: 0,
              present: 0,
              absent: 0
            }}
            forPrint={true}
          />
        </div>
      </div>
    </div>
  );
}
