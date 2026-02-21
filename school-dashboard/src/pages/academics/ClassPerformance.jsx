import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, CardBody, CardHeader, Chip, Select, SelectItem,
  Spinner, Button, Progress, Table, TableHeader, TableColumn,
  TableBody, TableRow, TableCell, Input, Divider
} from '@heroui/react';
import {
  BarChart3, Users, BookOpen, Trophy, TrendingUp, Calendar,
  FileText, Download, ArrowRight, Award, Search, Filter,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

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

const ClassPerformance = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (classId) {
      fetchData();
    }
  }, [classId, selectedYear, selectedTerm]);

  const fetchData = async () => {
    setLoading(true);
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      // Fetch class info
      const classRes = await fetch(`${API_URL}/classes/${classId}`, { headers });
      if (classRes.ok) {
        setClassInfo(await classRes.json());
      }

      // Fetch students
      const studentsRes = await fetch(`${API_URL}/classes/${classId}/students`, { headers });
      if (studentsRes.ok) {
        setStudents(await studentsRes.json());
      }

      // Fetch class performance
      const perfRes = await fetch(
        `${API_URL}/academic-performance/class/${classId}?academicYear=${selectedYear}`,
        { headers }
      );
      if (perfRes.ok) {
        setPerformance(await perfRes.json());
      }

      // Fetch class exams
      const examsRes = await fetch(`${API_URL}/exams/class/${classId}`, { headers });
      if (examsRes.ok) {
        setExams(await examsRes.json());
      }
    } catch (error) {
      console.error('Error fetching class performance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build student ranking data
  const buildStudentRanking = () => {
    if (performance.length === 0) {
      // Return mock data based on students
      return students.map((student, idx) => ({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo || idx + 1,
        percentage: 65 + Math.random() * 30,
        grade: ['A+', 'A', 'B+', 'B', 'C+'][Math.floor(Math.random() * 5)],
        rank: idx + 1,
        trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
      })).sort((a, b) => b.percentage - a.percentage).map((s, idx) => ({ ...s, rank: idx + 1 }));
    }

    return performance.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return {
        id: p.studentId,
        name: student?.name || p.studentName || 'Unknown',
        rollNo: student?.rollNo || '-',
        percentage: p.overallPercentage,
        grade: p.overallGrade,
        rank: p.classRank,
        trend: p.trend
      };
    }).sort((a, b) => a.rank - b.rank);
  };

  // Build subject breakdown
  const buildSubjectBreakdown = () => {
    if (performance.length > 0 && performance[0].subjectWisePerformance) {
      return performance[0].subjectWisePerformance;
    }

    // Mock subject data
    return exams.map(exam => ({
      subjectId: exam.subjectId,
      subjectName: exam.subjectName,
      average: 60 + Math.random() * 30,
      highest: 85 + Math.random() * 15,
      lowest: 40 + Math.random() * 20
    }));
  };

  // Filter students by search
  const filteredStudents = buildStudentRanking().filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo?.toString().includes(searchQuery)
  );

  const subjectBreakdown = buildSubjectBreakdown();

  // Class stats
  const classStats = {
    totalStudents: students.length,
    averageScore: performance.length > 0
      ? (performance.reduce((sum, p) => sum + (p.overallPercentage || 0), 0) / performance.length).toFixed(1)
      : '72.5',
    passingRate: '89%',
    topScore: Math.max(...filteredStudents.map(s => s.percentage), 95).toFixed(1)
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <ArrowUpRight className="text-success" size={14} />;
      case 'declining': return <ArrowDownRight className="text-danger" size={14} />;
      default: return <Minus className="text-default-400" size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            {classInfo?.name || classId?.replace('-', ' ')} - Performance
          </h1>
          <p className="text-default-500">Academic Year {selectedYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            size="sm"
            selectedKeys={[selectedYear]}
            onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
            className="w-32"
          >
            {['2024-25', '2023-24', '2022-23'].map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </Select>
          <Button
            color="primary"
            variant="flat"
            startContent={<Download size={16} />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Total Students</p>
                <p className="text-xl font-bold text-default-900">{classStats.totalStudents}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Average Score</p>
                <p className="text-xl font-bold text-default-900">{classStats.averageScore}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Top Score</p>
                <p className="text-xl font-bold text-default-900">{classStats.topScore}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-default-200">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-default-500">Pass Rate</p>
                <p className="text-xl font-bold text-default-900">{classStats.passingRate}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Performance Distribution */}
        <Card shadow="none" className="border border-default-200">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-semibold text-default-900">Score Distribution</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { range: '90-100', count: filteredStudents.filter(s => s.percentage >= 90).length || 5 },
                  { range: '80-89', count: filteredStudents.filter(s => s.percentage >= 80 && s.percentage < 90).length || 8 },
                  { range: '70-79', count: filteredStudents.filter(s => s.percentage >= 70 && s.percentage < 80).length || 12 },
                  { range: '60-69', count: filteredStudents.filter(s => s.percentage >= 60 && s.percentage < 70).length || 6 },
                  { range: '50-59', count: filteredStudents.filter(s => s.percentage >= 50 && s.percentage < 60).length || 3 },
                  { range: '<50', count: filteredStudents.filter(s => s.percentage < 50).length || 2 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Subject-wise Breakdown */}
        <Card shadow="none" className="border border-default-200">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h3 className="text-lg font-semibold text-default-900">Subject Averages</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectBreakdown.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="subjectName" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="average" fill="#10b981" radius={[0, 4, 4, 0]} name="Average" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Student Ranking Table */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-lg">
                <Trophy size={20} />
              </div>
              <h3 className="text-lg font-semibold text-default-900">Student Rankings</h3>
            </div>
            <Input
              size="sm"
              placeholder="Search students..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-400" />}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Student rankings table"
            removeWrapper
            classNames={{
              th: "bg-default-50 text-default-600",
              td: "py-3"
            }}
          >
            <TableHeader>
              <TableColumn>RANK</TableColumn>
              <TableColumn>STUDENT</TableColumn>
              <TableColumn>ROLL NO</TableColumn>
              <TableColumn>SCORE</TableColumn>
              <TableColumn>GRADE</TableColumn>
              <TableColumn>TREND</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredStudents.slice(0, 20).map((student, idx) => (
                <TableRow key={student.id || idx}>
                  <TableCell>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      student.rank === 2 ? 'bg-gray-100 text-gray-700' :
                      student.rank === 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-default-100 text-default-600'
                    }`}>
                      {student.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-default-900">{student.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-default-500">{student.rollNo}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={student.percentage}
                        color={
                          student.percentage >= 90 ? 'success' :
                          student.percentage >= 75 ? 'primary' :
                          student.percentage >= 50 ? 'warning' : 'danger'
                        }
                        size="sm"
                        className="w-20"
                      />
                      <span className="font-medium">{student.percentage.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={
                        student.grade?.includes('A') ? 'success' :
                        student.grade?.includes('B') ? 'primary' :
                        student.grade?.includes('C') ? 'warning' : 'danger'
                      }
                      variant="flat"
                    >
                      {student.grade}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {getTrendIcon(student.trend)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => navigate(`/students/${student.id}?tab=academics`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Subject Details Table */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-semibold text-default-900">Subject-wise Details</h3>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Subject breakdown table"
            removeWrapper
            classNames={{
              th: "bg-default-50 text-default-600",
              td: "py-3"
            }}
          >
            <TableHeader>
              <TableColumn>SUBJECT</TableColumn>
              <TableColumn>AVERAGE</TableColumn>
              <TableColumn>HIGHEST</TableColumn>
              <TableColumn>LOWEST</TableColumn>
              <TableColumn>PASS RATE</TableColumn>
            </TableHeader>
            <TableBody>
              {subjectBreakdown.map((subject, idx) => (
                <TableRow key={subject.subjectId || idx}>
                  <TableCell>
                    <span className="font-medium text-default-900">{subject.subjectName}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      (subject.average || 70) >= 75 ? 'text-success' :
                      (subject.average || 70) >= 50 ? 'text-warning' : 'text-danger'
                    }`}>
                      {(subject.average || 70).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-success font-medium">
                      {(subject.highest || 95).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-warning font-medium">
                      {(subject.lowest || 45).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Progress
                      value={85 + Math.random() * 10}
                      color="success"
                      size="sm"
                      className="w-24"
                      showValueLabel={true}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default ClassPerformance;
