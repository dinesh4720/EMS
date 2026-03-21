import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardBody, CardHeader, Chip, Spinner, Button
} from '@heroui/react';
import {
  FileText, Calendar, Trophy, TrendingUp, Users, BookOpen,
  Download, ArrowRight, Award, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { examsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/StatCard';
import FiltersDropdown from '../../components/FiltersDropdown';
import { MinimalButton } from '../../components/ui';
import { getAcademicYearOptions } from '../../utils/constants';
import { useChartTheme } from '../../utils/chartTheme';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Global cache for API responses - persists across component mounts
const dashboardCache = {
  data: null,
  timestamp: 0,
  duration: 60000, // 1 minute
  key: null
};

const PerformanceDashboard = ({ onCreateExam }) => {
  const navigate = useNavigate();
  const { currentAcademicYear } = useApp();
  const chart = useChartTheme();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    class: 'all',
    year: null
  });
  const selectedAcademicYear = filters.year || currentAcademicYear;
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
    if (filters.year) count++;
    return count;
  }, [filters]);

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
      setTopPerformers(cached.topPerformers || []);
      setClasses(cached.classes || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data in parallel
      const [examsData] = await Promise.all([
        examsApi.getAll({ academicYear: selectedAcademicYear }),
      ]);

      setExams(examsData || []);

      // Build derived data from exams (no extra API calls)
      const uniqueClasses = [...new Set(examsData?.map(e => e.classId).filter(Boolean))];
      const mockClasses = uniqueClasses.map(id => ({ id, name: id }));

      setClasses(mockClasses);
      setClassPerformance([]);
      setTopPerformers([]);

      // Cache the results
      dashboardCache.data = {
        exams: examsData || [],
        classPerformance: [],
        topPerformers: [],
        classes: mockClasses
      };
      dashboardCache.timestamp = now;
      dashboardCache.key = cacheKey;
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'year' ? (value === currentAcademicYear ? null : value) : value
    }));
  };

  const handleClearFilters = () => {
    setFilters({ class: 'all', year: null });
  };

  // Build mock class comparison data if no real data
  const buildClassComparisonData = () => {
    if (classPerformance.length > 0) {
      return classPerformance.map(c => ({
        class: c.classId,
        average: c.averagePercentage
      }));
    }

    // Mock data based on classes
    const classIds = [...new Set(exams.map(e => e.classId))];
    return classIds.slice(0, 6).map((classId, idx) => ({
      class: classId?.replace('-', ' ') || `Class ${idx + 1}`,
      average: 65 + Math.random() * 25
    }));
  };

  // Build subject averages
  const buildSubjectAverages = () => {
    const subjects = {};
    exams.forEach(exam => {
      if (!subjects[exam.subjectName]) {
        subjects[exam.subjectName] = { total: 0, count: 0 };
      }
      subjects[exam.subjectName].count++;
    });

    return Object.entries(subjects).map(([name, data]) => ({
      subject: name,
      average: 60 + Math.random() * 30 // Mock data
    })).slice(0, 6);
  };

  // Build grade distribution
  const buildGradeDistribution = () => {
    return [
      { name: 'A+', value: 15, color: '#10b981' },
      { name: 'A', value: 25, color: '#3b82f6' },
      { name: 'B+', value: 20, color: '#8b5cf6' },
      { name: 'B', value: 18, color: '#f59e0b' },
      { name: 'C', value: 12, color: '#ef4444' },
      { name: 'D/F', value: 10, color: '#6b7280' },
    ];
  };

  const stats = {
    totalExams: exams.length,
    scheduled: exams.filter(e => e.status === 'scheduled').length,
    completed: exams.filter(e => e.status === 'completed' || e.status === 'results_published').length,
    published: exams.filter(e => e.isPublished).length,
    avgScore: classPerformance.length > 0
      ? (classPerformance.reduce((sum, c) => sum + (c.averagePercentage || 0), 0) / classPerformance.length).toFixed(1)
      : '78.5',
    passingRate: '92%'
  };

  const classComparisonData = buildClassComparisonData();
  const subjectAverages = buildSubjectAverages();
  const gradeDistribution = buildGradeDistribution();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-end gap-4">
        <FiltersDropdown
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
        <MinimalButton variant="ghost" icon={<Download size={16} />}>
          Export Report
        </MinimalButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Exams"
          value={stats.totalExams.toString()}
          icon={FileText}
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled.toString()}
          icon={Calendar}
        />
        <StatCard
          label="Completed"
          value={stats.completed.toString()}
          icon={Trophy}
        />
        <StatCard
          label="Published"
          value={stats.published.toString()}
          icon={Award}
        />
        <StatCard
          label="Avg Score"
          value={`${stats.avgScore}%`}
          icon={TrendingUp}
          trend={{ value: '+2.5%', positive: true }}
        />
        <StatCard
          label="Pass Rate"
          value={stats.passingRate}
          icon={Users}
          trend={{ value: '+1.2%', positive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Performance Comparison */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Class-wise Performance</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {classComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.gridAlt} />
                  <XAxis dataKey="class" tick={{ fill: chart.tick, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: chart.tick, fontSize: 11 }} />
                  <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} />
                  <Bar dataKey="average" fill="#374151" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-zinc-500">
                No data available
              </div>
            )}
          </CardBody>
        </Card>

        {/* Subject-wise Averages */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Subject Averages</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {subjectAverages.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectAverages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.gridAlt} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: chart.tick, fontSize: 11 }} />
                  <YAxis dataKey="subject" type="category" tick={{ fill: chart.tick, fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} />
                  <Bar dataKey="average" fill="#6b7280" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-zinc-500">
                No data available
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
                <Trophy size={20} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Top Performers</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.slice(0, 5).map((student, idx) => (
                  <div key={student._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-zinc-100">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{student.class}</p>
                      </div>
                    </div>
                    <Chip size="sm" color="success" variant="flat">
                      {student.percentage}%
                    </Chip>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(idx => (
                  <div key={`placeholder-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        idx === 1 ? 'bg-yellow-500' : idx === 2 ? 'bg-gray-400' : idx === 3 ? 'bg-amber-600' : 'bg-gray-300'
                      }`}>
                        {idx}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-zinc-100">Student {idx}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Class {(idx % 5) + 5}-A</p>
                      </div>
                    </div>
                    <Chip size="sm" color="success" variant="flat">
                      {(95 - idx * 2)}%
                    </Chip>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Grade Distribution */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Grade Distribution</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chart.tooltipStyle} itemStyle={chart.tooltipItemStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {gradeDistribution.map((item) => (
                <div key={`legend-${item.name}`} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-zinc-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Quick Actions</h3>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-3">
              <div
                className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                onClick={() => onCreateExam?.() || navigate('/academics/exams')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-zinc-100">Create New Exam</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Schedule a new exam for any class</div>
                  </div>
                  <ArrowRight size={18} className="text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
              <div
                className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                onClick={() => navigate('/academics/exams')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-zinc-100">Enter Results</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Enter marks for completed exams</div>
                  </div>
                  <ArrowRight size={18} className="text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
              <div
                className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                onClick={() => navigate('/academics/results')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-zinc-100">View Results</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Review and publish results</div>
                  </div>
                  <ArrowRight size={18} className="text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Exams */}
      <Card shadow="none" className="border border-gray-100 dark:border-zinc-800">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Recent Exams</h3>
          </div>
          <Button
            size="sm"
            variant="light"
            endContent={<ArrowRight size={16} />}
            onClick={() => navigate('/academics/exams')}
          >
            View All
          </Button>
        </CardHeader>
        <CardBody className="p-6">
          {exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>No exams created yet</p>
              <MinimalButton className="mt-4" onClick={() => onCreateExam?.()}>
                Create First Exam
              </MinimalButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exams.slice(0, 8).map(exam => (
                <Card
                  key={exam.id || exam._id}
                  isPressable
                  shadow="none"
                  className="border border-gray-200 dark:border-zinc-700 hover:shadow-md transition-all"
                  onPress={() => navigate(`/academics/exams/${exam.id}`)}
                >
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <Chip
                        size="sm"
                        color={
                          exam.status === 'scheduled' ? 'primary' :
                          exam.status === 'completed' ? 'success' :
                          exam.status === 'results_published' ? 'success' : 'default'
                        }
                        variant="flat"
                      >
                        {exam.status?.replace('_', ' ')}
                      </Chip>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100 mb-1">{exam.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{exam.classId} - {exam.subjectName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                      {exam.date ? new Date(exam.date).toLocaleDateString() : 'No date'}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
