import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  FileText, Download, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { examsApi, academicPerformanceApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import FiltersDropdown from '../../components/FiltersDropdown';
import { MinimalButton, PageShell } from '../../components/ui';
import { getAcademicYearOptions } from '../../utils/constants';
import { useChartTheme, CHART_COLORS } from '../../utils/chartTheme';
import { useTranslation } from 'react-i18next';
import { formatShortDate, toTodayDateString } from '../../utils/dateFormatter';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';


// Global cache for API responses - persists across component mounts
// [AUDIT-539] Clear on logout to prevent tenant data leaking across sessions
const dashboardCache = {
  data: null,
  timestamp: 0,
  duration: 60000, // 1 minute
  key: null
};

// PAG-10: backend caps /exams at 200/page; the dashboard KPIs must see
// every exam in the academic year so the "scheduled/completed/published"
// counts don't silently exclude older entries.
const DASHBOARD_PAGE_LIMIT = 200;
// Hard ceiling on pagination rounds so a misbehaving backend can never spin
// the dashboard into a request storm.
const DASHBOARD_MAX_PAGES = 25;

if (typeof window !== 'undefined') {
  window.addEventListener('auth-session-cleared', () => {
    dashboardCache.data = null;
    dashboardCache.timestamp = 0;
    dashboardCache.key = null;
  });
}

const PerformanceDashboard = ({ onCreateExam }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useApp();
  const chart = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [subjectAverages, setSubjectAverages] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [filters, setFilters] = useState({ class: 'all' });
  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 }),
    [currentAcademicYear]
  );

  const initialFetchDone = useRef(false);

  const filterConfig = {
    class: {
      label: 'Class',
      value: filters.class,
      options: ['all', ...classes.map(c => c.id || c.name)],
      displayLabels: { all: 'All Classes' },
      counts: {}
    },
    year: {
      label: 'Academic Year',
      value: selectedAcademicYear,
      options: academicYearOptions,
      counts: {}
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.class !== 'all') count++;
    if (selectedAcademicYear !== currentAcademicYear) count++;
    return count;
  }, [filters, selectedAcademicYear, currentAcademicYear]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchData();
      initialFetchDone.current = true;
    }
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (initialFetchDone.current) {
      fetchData(true);
    }
  }, [selectedAcademicYear]);

  const fetchData = async (skipCache = false) => {
    const cacheKey = `perf-${selectedAcademicYear}-${filters.class}`;
    const now = Date.now();

    // Check cache first
    if (!skipCache && dashboardCache.key === cacheKey && dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.duration) {
      const cached = dashboardCache.data;
      setExams(cached.exams || []);
      setClassPerformance(cached.classPerformance || []);
      setSubjectAverages(cached.subjectAverages || []);
      setGradeDistribution(cached.gradeDistribution || []);
      setTopPerformers(cached.topPerformers || []);
      setDashboardStats(cached.dashboardStats || null);
      setClasses(cached.classes || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch performance dashboard aggregation and the first page of exams
      // in parallel. Then paginate the exams list to gather every exam in
      // the year (PAG-10) so the KPI counts aren't capped at 50.
      const [perfData, firstPage] = await Promise.all([
        academicPerformanceApi.getDashboard({ academicYear: selectedAcademicYear }).catch(() => null),
        examsApi.getAll({ academicYear: selectedAcademicYear, skip: 0, limit: DASHBOARD_PAGE_LIMIT }),
      ]);

      // PAG-10: response is { data, pagination }. Pre-PAG-10 callers passed
      // the bare array; tolerate both shapes so an old backend doesn't crash
      // the dashboard during a staggered rollout.
      const firstPageItems = Array.isArray(firstPage)
        ? firstPage
        : Array.isArray(firstPage?.data)
          ? firstPage.data
          : [];
      const firstPageHasMore = Array.isArray(firstPage)
        ? false
        : !!firstPage?.pagination?.hasMore;

      const collected = [...firstPageItems];
      let hasMore = firstPageHasMore;
      let skip = firstPageItems.length;
      let pageCount = 1;
      // Keep paging until the backend reports hasMore=false. Bounded by the
      // backend's own 200-per-page cap, so this is at most a handful of
      // round-trips for typical schools. The hard cap protects against a
      // broken backend that never flips hasMore to false.
      while (hasMore && pageCount < DASHBOARD_MAX_PAGES) {
        const next = await examsApi.getAll({
          academicYear: selectedAcademicYear,
          skip,
          limit: DASHBOARD_PAGE_LIMIT,
        });
        const items = Array.isArray(next) ? next : Array.isArray(next?.data) ? next.data : [];
        if (items.length === 0) {
          hasMore = false;
          break;
        }
        collected.push(...items);
        hasMore = Array.isArray(next) ? false : !!next?.pagination?.hasMore;
        skip += items.length;
        pageCount += 1;
      }

      const examsData = collected;

      setExams(examsData);

      // Use backend performance data when available
      if (perfData) {
        setClassPerformance(perfData.classPerformance || []);
        setSubjectAverages(perfData.subjectAverages || []);
        setGradeDistribution(perfData.gradeDistribution || []);
        setTopPerformers(perfData.topPerformers || []);
        setDashboardStats(perfData);
      } else {
        setClassPerformance([]);
        setSubjectAverages([]);
        setGradeDistribution([]);
        setTopPerformers([]);
        setDashboardStats(null);
      }

      // Build class list from performance data or exams
      const classesFromPerf = (perfData?.classPerformance || []).map(c => ({ id: c.classId, name: c.className }));
      const uniqueClasses = classesFromPerf.length > 0
        ? classesFromPerf
        : [...new Set(examsData?.map(e => e.classId).filter(Boolean))].map(id => ({ id, name: id }));
      setClasses(uniqueClasses);

      // Cache the results
      dashboardCache.data = {
        exams: examsData,
        classPerformance: perfData?.classPerformance || [],
        subjectAverages: perfData?.subjectAverages || [],
        gradeDistribution: perfData?.gradeDistribution || [],
        topPerformers: perfData?.topPerformers || [],
        dashboardStats: perfData || null,
        classes: uniqueClasses
      };
      dashboardCache.timestamp = now;
      dashboardCache.key = cacheKey;
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'year') {
      setSelectedAcademicYear(value === currentAcademicYear ? null : value);
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleClearFilters = () => {
    setFilters({ class: 'all' });
    setSelectedAcademicYear(null);
  };

  const handleExportReport = () => {
    const sections = [];

    // Summary stats
    sections.push('Performance Dashboard Report');
    sections.push(`Academic Year: ${selectedAcademicYear}`);
    sections.push(`Generated: ${new Date().toLocaleDateString()}`);
    sections.push('');

    sections.push('Summary');
    sections.push('Metric,Value');
    sections.push(`Total Exams,${stats.totalExams}`);
    sections.push(`Scheduled,${stats.scheduled}`);
    sections.push(`Completed,${stats.completed}`);
    sections.push(`Published,${stats.published}`);
    sections.push(`Average Score,${stats.avgScore}`);
    sections.push(`Pass Rate,${stats.passingRate}`);
    sections.push('');

    // Class performance
    if (classPerformance.length > 0) {
      sections.push('Class-wise Performance');
      sections.push('Class,Average %');
      classPerformance.forEach(c => {
        sections.push(`"${c.className || c.classId}",${c.averagePercentage}`);
      });
      sections.push('');
    }

    // Subject averages
    if (subjectAverages.length > 0) {
      sections.push('Subject Averages');
      sections.push('Subject,Average');
      subjectAverages.forEach(s => {
        sections.push(`"${s.subject}",${s.average}`);
      });
      sections.push('');
    }

    // Grade distribution
    if (gradeDistribution.length > 0) {
      sections.push('Grade Distribution');
      sections.push('Grade,Count');
      gradeDistribution.forEach(g => {
        sections.push(`${g.name},${g.value}`);
      });
      sections.push('');
    }

    // Top performers
    if (topPerformers.length > 0) {
      sections.push('Top Performers');
      sections.push('Name,Class,Percentage');
      topPerformers.forEach(s => {
        sections.push(`"${s.name}","${s.class}",${s.percentage}`);
      });
    }

    const csvContent = sections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${selectedAcademicYear}-${toTodayDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  // Build class comparison chart data from backend performance data
  const buildClassComparisonData = () => {
    if (classPerformance.length > 0) {
      return classPerformance.map(c => ({
        class: c.className || c.classId,
        average: c.averagePercentage
      }));
    }
    return [];
  };

  // Build subject averages chart data from backend performance data
  const buildSubjectAveragesData = () => {
    return subjectAverages.slice(0, 6);
  };

  // Build grade distribution pie chart data — uses --chart-c* + status tokens
  const buildGradeDistributionData = () => {
    const gradeColors = {
      'A+': 'var(--ok)',
      'A':  'var(--chart-c2)',
      'B+': 'var(--chart-c1)',
      'B':  'var(--chart-c5)',
      'C':  'var(--warn)',
      'D':  'var(--chart-c4)',
      'F':  'var(--danger)',
    };
    return gradeDistribution.map(g => ({
      ...g,
      color: gradeColors[g.name] || 'var(--fg-faint)'
    }));
  };

  const stats = {
    totalExams: exams.length,
    scheduled: exams.filter(e => e.status === 'scheduled').length,
    completed: exams.filter(e => e.status === 'completed' || e.status === 'results_published').length,
    published: exams.filter(e => e.isPublished).length,
    avgScore: dashboardStats?.averageScore != null ? dashboardStats.averageScore : '—',
    passingRate: dashboardStats?.passingRate != null ? `${dashboardStats.passingRate}%` : '—'
  };

  // Apply class filter client-side
  const filteredClassPerformance = filters.class !== 'all'
    ? classPerformance.filter(c => c.classId === filters.class)
    : classPerformance;
  const filteredTopPerformers = filters.class !== 'all'
    ? topPerformers.filter(s => {
        const matchClass = classPerformance.find(c => c.classId === filters.class);
        return matchClass ? s.class === matchClass.className : false;
      })
    : topPerformers;

  const classComparisonData = filteredClassPerformance.length > 0
    ? filteredClassPerformance.map(c => ({ class: c.className || c.classId, average: c.averagePercentage }))
    : buildClassComparisonData();
  const subjectAveragesData = buildSubjectAveragesData();
  const gradeDistributionData = buildGradeDistributionData();

  if (loading) {
    return (
      <PageShell title="Performance Dashboard">
        <TablePageSkeleton />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Performance Dashboard"
      actions={
        <div className="flex items-center gap-3">
          <FiltersDropdown
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />
          <MinimalButton variant="ghost" icon={<Download size={16} />} onClick={handleExportReport}>
            Export Report
          </MinimalButton>
        </div>
      }
    >
      <div className="space-y-6">
      {/* KPI strip — dp-metric */}
      <div className="perf-metrics perf-metrics--6" role="group" aria-label="Performance overview">
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.totalExams')}</span>
          <span className="dp-metric__value tnum">{stats.totalExams}</span>
          <span className="dp-metric__sub">this year</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.scheduled')}</span>
          <span className="dp-metric__value tnum">{stats.scheduled}</span>
          <span className="dp-metric__sub">upcoming</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.completed')}</span>
          <span className="dp-metric__value tnum">{stats.completed}</span>
          <span className="dp-metric__sub">done</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.published1')}</span>
          <span className="dp-metric__value tnum dp-metric__value--ok">{stats.published}</span>
          <span className="dp-metric__sub">results live</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.avgScore1')}</span>
          <span className="dp-metric__value tnum">
            {stats.avgScore !== '—' ? `${stats.avgScore}%` : '—'}
          </span>
          <span className="dp-metric__sub">all classes</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.passRate')}</span>
          <span className="dp-metric__value tnum">{stats.passingRate}</span>
          <span className="dp-metric__sub">across exams</span>
        </div>
      </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.classWisePerformance')}</h3>
          </div>
          <div className="chart-card__body">
            {classComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="class" tick={{ fill: chart.tick, fontSize: 11 }} stroke={chart.axis} />
                  <YAxis domain={[0, 100]} tick={{ fill: chart.tick, fontSize: 11 }} stroke={chart.axis} />
                  <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} labelStyle={chart.tooltipLabelStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="average" fill={CHART_COLORS.chart1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-card__empty">No data available</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.subjectAverages')}</h3>
          </div>
          <div className="chart-card__body">
            {subjectAveragesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectAveragesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: chart.tick, fontSize: 11 }} stroke={chart.axis} />
                  <YAxis dataKey="subject" type="category" tick={{ fill: chart.tick, fontSize: 11 }} width={80} stroke={chart.axis} />
                  <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} labelStyle={chart.tooltipLabelStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="average" fill={CHART_COLORS.chart3} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-card__empty">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.topPerformers')}</h3>
          </div>
          <div className="chart-card__body">
            {filteredTopPerformers.length > 0 ? (
              <div className="space-y-3">
                {filteredTopPerformers.slice(0, 5).map((student, idx) => (
                  <div key={student.studentId || idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs tnum"
                        style={{
                          background: idx === 0 ? 'var(--warn-bg)' : idx === 1 ? 'var(--surface-2)' : idx === 2 ? 'var(--ok-bg)' : 'var(--surface)',
                          color: idx === 0 ? 'var(--warn)' : idx === 1 ? 'var(--fg-muted)' : idx === 2 ? 'var(--ok)' : 'var(--fg-faint)',
                          border: '1px solid var(--border-token)'
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-fg text-sm">{student.name}</p>
                        <p className="text-xs text-fg-muted">{student.class}</p>
                      </div>
                    </div>
                    <span className="grade-pill grade-pill--ok tnum">{student.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-card__empty">{t('pages.noPerformanceDataYet')}</div>
            )}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.gradeDistribution')}</h3>
          </div>
          <div className="chart-card__body">
            {gradeDistributionData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={gradeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {gradeDistributionData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} labelStyle={chart.tooltipLabelStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {gradeDistributionData.map((item) => (
                    <div key={`legend-${item.name}`} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-fg-muted tnum">{item.name} · {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-card__empty">No data available</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="chart-card">
          <div className="chart-card__head">
            <h3 className="chart-card__title">{t('pages.quickActions1')}</h3>
          </div>
          <div className="chart-card__body">
            <div className="space-y-3">
              <button
                type="button"
                className="w-full p-4 border border-border-token rounded-lg hover:bg-surface-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                onClick={() => onCreateExam?.() || navigate('/academics/exams')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-fg">{t('pages.createNewExam')}</div>
                    <div className="text-sm text-fg-muted">{t('pages.scheduleANewExamForAnyClass')}</div>
                  </div>
                  <ArrowRight size={18} className="text-fg-faint" />
                </div>
              </button>
              <button
                type="button"
                className="w-full p-4 border border-border-token rounded-lg hover:bg-surface-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                onClick={() => navigate('/academics/exams')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-fg">{t('pages.enterResults')}</div>
                    <div className="text-sm text-fg-muted">{t('pages.enterMarksForCompletedExams')}</div>
                  </div>
                  <ArrowRight size={18} className="text-fg-faint" />
                </div>
              </button>
              <button
                type="button"
                className="w-full p-4 border border-border-token rounded-lg hover:bg-surface-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                onClick={() => navigate('/academics/exams')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-fg">{t('pages.viewResults')}</div>
                    <div className="text-sm text-fg-muted">{t('pages.reviewAndPublishResults')}</div>
                  </div>
                  <ArrowRight size={18} className="text-fg-faint" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Exams */}
      <div className="chart-card">
        <div className="chart-card__head">
          <h3 className="chart-card__title">{t('pages.recentExams')}</h3>
          <Button
            size="sm"
            variant="light"
            endContent={<ArrowRight size={16} />}
            onClick={() => navigate('/academics/exams')}
          >
            View All
          </Button>
        </div>
        <div className="chart-card__body">
          {exams.length === 0 ? (
            <div className="chart-card__empty">
              <p>{t('pages.noExamsCreatedYet')}</p>
              <MinimalButton className="mt-3" onClick={() => onCreateExam?.()}>
                Create First Exam
              </MinimalButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exams.slice(0, 8).map(exam => {
                const tone =
                  exam.status === 'scheduled' ? 'grade-pill--info' :
                  exam.isPublished || exam.status === 'results_published' ? 'grade-pill--ok' :
                  exam.status === 'completed' ? 'grade-pill--info' : 'grade-pill--muted';
                return (
                  <button
                    key={exam.id || exam._id}
                    type="button"
                    onClick={() => navigate(`/academics/exams/${exam._id || exam.id}`)}
                    className="text-left p-4 rounded-lg border border-border-token bg-surface hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FileText size={18} className="text-fg-faint" />
                      <span className={`grade-pill ${tone}`}>
                        {exam.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="font-medium text-fg mb-0.5 text-sm truncate">{exam.name}</h4>
                    <p className="text-xs text-fg-muted truncate">{exam.classId} · {exam.subjectName}</p>
                    <p className="text-xs text-fg-faint mt-1 tnum">
                      {exam.date ? formatShortDate(exam.date) : 'No date'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default PerformanceDashboard;
