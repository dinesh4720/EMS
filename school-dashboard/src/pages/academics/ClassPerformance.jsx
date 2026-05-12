import { request } from '../../services/api.js';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidatedParams } from '../../hooks/useValidatedParams';
import {
  Card, CardBody, CardHeader, Chip, Select, SelectItem,
  Button, Progress, Table, TableHeader, TableColumn,
  TableBody, TableRow, TableCell, Input
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  BarChart3, Users, BookOpen, Trophy, TrendingUp,
  FileText, Download, Award, Search,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { toTodayDateString } from '../../utils/dateFormatter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { getAcademicYearOptions } from '../../utils/constants';
import { CHART_COLORS } from '../../utils/chartTheme';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';


const ClassPerformance = () => {
  const { t } = useTranslation();
  const { params: { classId }, isValid } = useValidatedParams({ classId: 'objectId' }, { redirectTo: '/academics' });
  const navigate = useNavigate();
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [perfStats, setPerfStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedTerm] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedYear = selectedAcademicYear;
  const academicYearOptions = getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 });


  useEffect(() => {
    if (!classId) return;
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [classId, selectedYear, selectedTerm]);

  const fetchData = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const [classData, studentsData, perfData, examsData] = await Promise.allSettled([
        request(`/classes/${classId}`, { signal }),
        request(`/classes/${classId}/students`, { signal }),
        request(`/academic-performance/class/${classId}?academicYear=${selectedYear}`, { signal }),
        request(`/exams/class/${classId}`, { signal })
      ]);

      if (signal?.aborted) return;
      if (classData.status === 'fulfilled') setClassInfo(classData.value);
      else setError(classData.reason?.message || 'Failed to load class data');
      if (studentsData.status === 'fulfilled') setStudents(studentsData.value);
      if (perfData.status === 'fulfilled') {
        const pd = perfData.value;
        setPerformance(pd.students || []);
        setSubjectData(pd.subjectBreakdown || []);
        setPerfStats(pd.stats || null);
      }
      if (examsData.status === 'fulfilled') setExams(examsData.value);
    } catch (err) {
      if (err.name === 'AbortError') return;
      logger.error('Error fetching class performance:', err);
      setError(err.message || 'Failed to load performance data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  // Build student ranking data — only from real performance records
  const buildStudentRanking = () => {
    if (performance.length === 0) return [];

    return performance.map(p => ({
      id: p.studentId,
      name: p.name || 'Unknown',
      rollNo: p.rollNo || '-',
      percentage: p.overallPercentage,
      grade: p.overallGrade,
      rank: p.classRank,
      trend: p.trend
    })).sort((a, b) => a.rank - b.rank);
  };

  // Build subject breakdown — from API response
  const buildSubjectBreakdown = () => subjectData;

  // Filter students by search
  const filteredStudents = buildStudentRanking().filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo?.toString().includes(searchQuery)
  );

  const subjectBreakdown = buildSubjectBreakdown();

  // Class stats — prefer backend-computed stats, fall back to local computation
  const classStats = {
    totalStudents: perfStats?.totalStudents ?? students.length,
    averageScore: perfStats?.averageScore != null
      ? Number(perfStats.averageScore).toFixed(1)
      : performance.length > 0
        ? (performance.reduce((sum, p) => sum + (p.overallPercentage || 0), 0) / performance.length).toFixed(1)
        : '—',
    passingRate: perfStats?.passingRate != null
      ? `${perfStats.passingRate}%`
      : performance.length > 0
        ? `${Math.round((performance.filter(p => (p.overallPercentage || 0) >= 33).length / performance.length) * 100)}%`
        : '—',
    topScore: perfStats?.topScore != null
      ? Number(perfStats.topScore).toFixed(1)
      : filteredStudents.length > 0
        ? Math.max(...filteredStudents.map(s => s.percentage)).toFixed(1)
        : '—'
  };

  const handleExport = () => {
    const sections = [];
    const className = classInfo?.name || classId;

    sections.push(`Class Performance Report - ${className}`);
    sections.push(`Academic Year: ${selectedYear}`);
    sections.push(`Generated: ${new Date().toLocaleDateString()}`);
    sections.push('');

    sections.push('Summary');
    sections.push('Metric,Value');
    sections.push(`Total Students,${classStats.totalStudents}`);
    sections.push(`Average Score,${classStats.averageScore}%`);
    sections.push(`Top Score,${classStats.topScore}%`);
    sections.push(`Pass Rate,${classStats.passingRate}`);
    sections.push('');

    // Student rankings
    const ranked = buildStudentRanking();
    if (ranked.length > 0) {
      sections.push('Student Rankings');
      sections.push('Rank,Name,Roll No,Score %,Grade,Trend');
      ranked.forEach(s => {
        sections.push(`${s.rank ?? ''},\"${s.name}\",${s.rollNo},${s.percentage != null ? s.percentage.toFixed(1) : ''},${s.grade || ''},${s.trend || ''}`);
      });
      sections.push('');
    }

    // Subject breakdown
    if (subjectBreakdown.length > 0) {
      sections.push('Subject-wise Details');
      sections.push('Subject,Average,Highest,Lowest,Pass Rate');
      subjectBreakdown.forEach(s => {
        sections.push(`"${s.subjectName}",${s.average != null ? s.average.toFixed(1) : ''},${s.highest != null ? s.highest.toFixed(1) : ''},${s.lowest != null ? s.lowest.toFixed(1) : ''},${s.passRate != null ? s.passRate + '%' : ''}`);
      });
    }

    const csvContent = sections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}-performance-${selectedYear}-${toTodayDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <ArrowUpRight className="text-success" size={14} />;
      case 'declining': return <ArrowDownRight className="text-danger" size={14} />;
      default: return <Minus className="text-fg-faint" size={14} />;
    }
  };

  if (!isValid) return null;

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
          <FileText size={24} className="text-red-500" />
        </div>
        <p className="text-sm font-medium text-fg">Failed to load performance data</p>
        <p className="text-xs text-fg-muted max-w-xs text-center">{error}</p>
        <Button size="sm" variant="flat" onPress={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">
            {classInfo?.name || classId?.replace('-', ' ')} - Performance
          </h1>
          <p className="text-fg-muted">Academic Year {selectedYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            size="sm"
            selectedKeys={[selectedYear]}
            onSelectionChange={(keys) => {
              const nextYear = Array.from(keys)[0];
              setSelectedAcademicYear(nextYear === currentAcademicYear ? null : nextYear);
            }}
            className="w-32"
          >
            {academicYearOptions.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </Select>
          <Button
            color="primary"
            variant="flat"
            startContent={<Download size={16} />}
            onPress={handleExport}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border-token">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-fg-muted">{t('pages.totalStudents1')}</p>
                <p className="text-xl font-bold text-fg">{classStats.totalStudents}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-border-token">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-fg-muted">{t('pages.averageScore')}</p>
                <p className="text-xl font-bold text-fg">{classStats.averageScore}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-border-token">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-xs text-fg-muted">{t('pages.topScore')}</p>
                <p className="text-xl font-bold text-fg">{classStats.topScore}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-border-token">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs text-fg-muted">{t('pages.passRate')}</p>
                <p className="text-xl font-bold text-fg">{classStats.passingRate}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Performance Distribution */}
        <Card shadow="none" className="border border-border-token">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-divider">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-semibold text-fg">{t('pages.scoreDistribution')}</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] gap-2 text-center">
                <BarChart3 size={32} className="text-fg-faint" />
                <p className="text-sm text-fg-muted">No performance data available</p>
                <p className="text-xs text-fg-faint">Publish exam results to see score distribution</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { range: '90-100', count: filteredStudents.filter(s => s.percentage >= 90).length },
                    { range: '80-89', count: filteredStudents.filter(s => s.percentage >= 80 && s.percentage < 90).length },
                    { range: '70-79', count: filteredStudents.filter(s => s.percentage >= 70 && s.percentage < 80).length },
                    { range: '60-69', count: filteredStudents.filter(s => s.percentage >= 60 && s.percentage < 70).length },
                    { range: '50-59', count: filteredStudents.filter(s => s.percentage >= 50 && s.percentage < 60).length },
                    { range: '<50', count: filteredStudents.filter(s => s.percentage < 50).length },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Subject-wise Breakdown */}
        <Card shadow="none" className="border border-border-token">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-divider">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h3 className="text-lg font-semibold text-fg">{t('pages.subjectAverages')}</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {subjectBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] gap-2 text-center">
                <BookOpen size={32} className="text-fg-faint" />
                <p className="text-sm text-fg-muted">No subject data available</p>
                <p className="text-xs text-fg-faint">Subject averages appear once results are published</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectBreakdown.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="subjectName" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="average" fill={CHART_COLORS.chart3} radius={[0, 4, 4, 0]} name="Average" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Student Ranking Table */}
      <Card shadow="none" className="border border-border-token">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-divider">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-lg">
                <Trophy size={20} />
              </div>
              <h3 className="text-lg font-semibold text-fg">{t('pages.studentRankings1')}</h3>
            </div>
            <Input
              size="sm"
              placeholder={t('pages.searchStudents')}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-fg-faint" />}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.studentRankings')}
            removeWrapper
            classNames={{
              th: "bg-surface-2 text-fg-muted",
              td: "py-3"
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.rANK')}</TableColumn>
              <TableColumn scope="col">{t('pages.sTUDENT')}</TableColumn>
              <TableColumn scope="col">{t('pages.rOLLNo')}</TableColumn>
              <TableColumn scope="col">{t('pages.sCORE')}</TableColumn>
              <TableColumn scope="col">{t('pages.gRADE')}</TableColumn>
              <TableColumn scope="col">{t('pages.tREND')}</TableColumn>
              <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
            </TableHeader>
            <TableBody emptyContent={
              performance.length === 0
                ? "No performance data available. Publish exam results to see rankings."
                : "No students match your search."
            }>
              {filteredStudents.slice(0, 20).map((student, idx) => (
                <TableRow key={student.id || idx}>
                  <TableCell>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      student.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                      student.rank === 2 ? 'bg-surface-2 text-fg' :
                      student.rank === 3 ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                      'bg-surface-2 text-fg-muted'
                    }`}>
                      {student.rank != null ? student.rank : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-fg">{student.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-fg-muted">{student.rollNo}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.max(0, Math.min(100, student.percentage ?? 0))}
                        color={
                          student.percentage >= 90 ? 'success' :
                          student.percentage >= 75 ? 'primary' :
                          student.percentage >= 50 ? 'warning' : 'danger'
                        }
                        size="sm"
                        className="w-20"
                      />
                      <span className="font-medium">{Math.max(0, Math.min(100, student.percentage ?? 0)).toFixed(1)}%</span>
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
      <Card shadow="none" className="border border-border-token">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-semibold text-fg">{t('pages.subjectWiseDetails')}</h3>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.subjectBreakdown')}
            removeWrapper
            classNames={{
              th: "bg-surface-2 text-fg-muted",
              td: "py-3"
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.sUBJECT')}</TableColumn>
              <TableColumn scope="col">{t('pages.aVERAGE')}</TableColumn>
              <TableColumn scope="col">{t('pages.hIGHEST')}</TableColumn>
              <TableColumn scope="col">{t('pages.lOWEST')}</TableColumn>
              <TableColumn scope="col">{t('pages.pASSRate')}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No subject data available. Subject breakdown appears once results are published.">
              {subjectBreakdown.map((subject, idx) => (
                <TableRow key={subject.subjectId || idx}>
                  <TableCell>
                    <span className="font-medium text-fg">{subject.subjectName}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      subject.average >= 75 ? 'text-success' :
                      subject.average >= 50 ? 'text-warning' : 'text-danger'
                    }`}>
                      {subject.average != null ? `${subject.average.toFixed(1)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-success font-medium">
                      {subject.highest != null ? `${subject.highest.toFixed(1)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-warning font-medium">
                      {subject.lowest != null ? `${subject.lowest.toFixed(1)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-fg-muted">
                      {subject.passRate != null ? `${subject.passRate}%` : '—'}
                    </span>
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
