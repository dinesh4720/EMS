import { request } from '../../services/api.js';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidatedParams } from '../../hooks/useValidatedParams';
import {
  Select, SelectItem,
  Button, Progress, Table, TableHeader, TableColumn,
  TableBody, TableRow, TableCell, Input
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { PageShell } from '../../components/ui';
import {
  Download, Search, FileText,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { toTodayDateString } from '../../utils/dateFormatter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { getAcademicYearOptions } from '../../utils/constants';
import { CHART_COLORS, useChartTheme } from '../../utils/chartTheme';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';

const gradeToneClass = (grade) => {
  if (!grade) return 'grade-pill--muted';
  if (grade.startsWith('A')) return 'grade-pill--ok';
  if (grade.startsWith('B')) return 'grade-pill--info';
  if (grade.startsWith('C')) return 'grade-pill--warn';
  return 'grade-pill--danger';
};


const ClassPerformance = () => {
  const { t } = useTranslation();
  const { params: { classId }, isValid } = useValidatedParams({ classId: 'objectId' }, { redirectTo: '/academics' });
  const navigate = useNavigate();
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useApp();
  const chart = useChartTheme();
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
        sections.push(`${s.rank ?? ''},"${s.name}",${s.rollNo},${s.percentage != null ? s.percentage.toFixed(1) : ''},${s.grade || ''},${s.trend || ''}`);
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
      case 'improving': return <ArrowUpRight className="text-[var(--ok)]" size={14} />;
      case 'declining': return <ArrowDownRight className="text-[var(--danger)]" size={14} />;
      default: return <Minus className="text-fg-faint" size={14} />;
    }
  };

  const avgScoreTone = perfStats?.averageScore != null
    ? (perfStats.averageScore >= 75 ? 'dp-metric__value--ok' : perfStats.averageScore >= 50 ? '' : 'dp-metric__value--warn')
    : '';
  const passRateTone = perfStats?.passingRate != null
    ? (perfStats.passingRate >= 90 ? 'dp-metric__value--ok' : perfStats.passingRate >= 70 ? '' : 'dp-metric__value--warn')
    : '';

  if (!isValid) return null;

  if (loading) {
    return (
      <PageShell title="Class Performance">
        <TablePageSkeleton />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Class Performance">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center">
            <FileText size={24} className="text-[var(--danger)]" />
          </div>
          <p className="text-sm font-medium text-fg">Failed to load performance data</p>
          <p className="text-xs text-fg-muted max-w-xs text-center">{error}</p>
          <Button size="sm" variant="flat" onPress={() => fetchData()}>Retry</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={classInfo?.name ? `${classInfo.name} - Performance` : 'Class Performance'}
      description={`Academic Year ${selectedYear}`}
      actions={
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
      }
    >
      <div className="space-y-6">

      {/* KPI strip — dp-metric pattern */}
      <div className="perf-metrics" role="group" aria-label="Class performance overview">
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.totalStudents1')}</span>
          <span className="dp-metric__value tnum">{classStats.totalStudents}</span>
          <span className="dp-metric__sub">enrolled</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.averageScore')}</span>
          <span className={`dp-metric__value tnum ${avgScoreTone}`}>
            {classStats.averageScore !== '—' ? `${classStats.averageScore}%` : '—'}
          </span>
          <span className="dp-metric__sub">across published exams</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.topScore')}</span>
          <span className="dp-metric__value tnum dp-metric__value--ok">
            {classStats.topScore !== '—' ? `${classStats.topScore}%` : '—'}
          </span>
          <span className="dp-metric__sub">highest %</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.passRate')}</span>
          <span className={`dp-metric__value tnum ${passRateTone}`}>{classStats.passingRate}</span>
          <span className="dp-metric__sub">≥33% threshold</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score distribution */}
        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.scoreDistribution')}</h3>
          </div>
          <div className="chart-card__body">
            {filteredStudents.length === 0 ? (
              <div className="chart-card__empty">
                <p>No performance data available</p>
                <p className="text-fg-faint">Publish exam results to see score distribution</p>
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
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="range" tick={{ fill: chart.tick, fontSize: 11 }} stroke={chart.axis} />
                  <YAxis tick={{ fill: chart.tick, fontSize: 11 }} stroke={chart.axis} allowDecimals={false} />
                  <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} labelStyle={chart.tooltipLabelStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="count" fill={CHART_COLORS.chart1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject-wise averages */}
        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.subjectAverages')}</h3>
          </div>
          <div className="chart-card__body">
            {subjectBreakdown.length === 0 ? (
              <div className="chart-card__empty">
                <p>No subject data available</p>
                <p className="text-fg-faint">Subject averages appear once results are published</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectBreakdown.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: chart.tick, fontSize: 11 }} stroke={chart.axis} />
                  <YAxis dataKey="subjectName" type="category" tick={{ fill: chart.tick, fontSize: 10 }} width={80} stroke={chart.axis} />
                  <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} labelStyle={chart.tooltipLabelStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="average" fill={CHART_COLORS.chart3} radius={[0, 4, 4, 0]} name="Average" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Student Ranking Table */}
      <div className="chart-card">
        <div className="chart-card__head">
          <h3 className="chart-card__title">{t('pages.studentRankings1')}</h3>
          <Input
            size="sm"
            placeholder={t('pages.searchStudents')}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search size={16} className="text-fg-faint" />}
            className="w-64"
          />
        </div>
        <div>
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
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: student.rank === 1 ? 'var(--warn-bg)' :
                                    student.rank === 2 ? 'var(--surface-2)' :
                                    student.rank === 3 ? 'var(--ok-bg)' : 'var(--surface-2)',
                        color: student.rank === 1 ? 'var(--warn)' :
                               student.rank === 2 ? 'var(--fg)' :
                               student.rank === 3 ? 'var(--ok)' : 'var(--fg-muted)'
                      }}
                    >
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
                      <span className="font-medium tnum">{Math.max(0, Math.min(100, student.percentage ?? 0)).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`grade-pill ${gradeToneClass(student.grade)}`}>
                      {student.grade || '—'}
                    </span>
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
        </div>
      </div>

      {/* Subject Details Table */}
      <div className="chart-card">
        <div className="chart-card__head">
          <h3 className="chart-card__title">{t('pages.subjectWiseDetails')}</h3>
        </div>
        <div>
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
                    <span
                      className="font-medium tnum"
                      style={{
                        color:
                          subject.average >= 75 ? 'var(--ok)' :
                          subject.average >= 50 ? 'var(--warn)' : 'var(--danger)'
                      }}
                    >
                      {subject.average != null ? `${subject.average.toFixed(1)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium tnum" style={{ color: 'var(--ok)' }}>
                      {subject.highest != null ? `${subject.highest.toFixed(1)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium tnum" style={{ color: 'var(--warn)' }}>
                      {subject.lowest != null ? `${subject.lowest.toFixed(1)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-fg-muted tnum">
                      {subject.passRate != null ? `${subject.passRate}%` : '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    </PageShell>
  );
};

export default ClassPerformance;
