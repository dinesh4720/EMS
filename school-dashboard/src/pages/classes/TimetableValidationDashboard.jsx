import { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Progress, Badge, Button, Tabs, Tab, Select, SelectItem, Input } from '@heroui/react';
import { request } from '../../services/api';
import { CURRENT_ACADEMIC_YEAR } from '../../utils/constants';
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import logger from '../../utils/logger';


const ITEMS_PER_PAGE = 20;

/**
 * TimetableValidationDashboard Component
 * Comprehensive dashboard for viewing timetable validation across all classes and teachers
 */
const TimetableValidationDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [classReport, setClassReport] = useState(null);
  const [teacherReport, setTeacherReport] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [academicYear] = useState(CURRENT_ACADEMIC_YEAR);

  // Filtering & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, activeTab]);

  // Reset filters when switching tabs (status options differ)
  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, [activeTab]);

  useEffect(() => {
    fetchReports();
  }, [academicYear]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const [classData, teacherData] = await Promise.all([
        request(`/validation/classes/comprehensive?academicYear=${encodeURIComponent(academicYear)}`),
        request(`/validation/teachers/comprehensive?academicYear=${encodeURIComponent(academicYear)}`)
      ]);

      if (classData?.success) {
        setClassReport(classData.report);
      }

      if (teacherData?.success) {
        setTeacherReport(teacherData.report);
      }
    } catch (err) {
      logger.error('Error fetching validation reports:', err);
      setError(err.message || 'Failed to fetch validation reports');
    } finally {
      setLoading(false);
    }
  };

  const getCompletenessColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  // Filtered & paginated class reports
  const filteredClassReports = useMemo(() => {
    if (!classReport?.classReports) return [];
    const query = searchQuery.toLowerCase().trim();
    return classReport.classReports
      .filter((r) => {
        if (query && !r.className?.toLowerCase().includes(query)) return false;
        if (statusFilter === 'complete' && r.completenessPercentage < 100) return false;
        if (statusFilter === 'incomplete' && r.completenessPercentage >= 100) return false;
        return true;
      })
      .sort((a, b) => (a.completenessPercentage ?? 0) - (b.completenessPercentage ?? 0));
  }, [classReport, searchQuery, statusFilter]);

  // Filtered & paginated teacher reports
  const filteredTeacherReports = useMemo(() => {
    if (!teacherReport?.teacherReports) return [];
    const query = searchQuery.toLowerCase().trim();
    return teacherReport.teacherReports
      .filter((r) => {
        if (query && !r.teacherName?.toLowerCase().includes(query)) return false;
        if (statusFilter === 'fullyUtilized' && r.utilizationPercentage < 100) return false;
        if (statusFilter === 'underutilized' && r.utilizationPercentage >= 100) return false;
        return true;
      })
      .sort((a, b) => (a.utilizationPercentage ?? 0) - (b.utilizationPercentage ?? 0));
  }, [teacherReport, searchQuery, statusFilter]);

  const currentItems = activeTab === 'classes' ? filteredClassReports : filteredTeacherReports;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE));
  const paginatedItems = currentItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const renderFilters = () => {
    const statusOptions = activeTab === 'classes'
      ? [{ key: 'all', label: 'All' }, { key: 'complete', label: 'Complete' }, { key: 'incomplete', label: 'Incomplete' }]
      : [{ key: 'all', label: 'All' }, { key: 'fullyUtilized', label: 'Fully Utilized' }, { key: 'underutilized', label: 'Underutilized' }];

    return (
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder={activeTab === 'classes' ? 'Search classes...' : 'Search teachers...'}
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
          onClear={() => setSearchQuery('')}
          className="w-full sm:max-w-xs"
          size="sm"
        />
        <Select
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] || 'all')}
          className="w-full sm:max-w-[180px]"
          size="sm"
          aria-label="Status filter"
        >
          {statusOptions.map((opt) => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-1 py-3 border-t border-default-200 mt-3">
        <div className="text-sm text-default-500">
          Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, currentItems.length)} of {currentItems.length}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            isDisabled={page === 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="flat"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const renderClassesTab = () => {
    if (!classReport) return (
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-medium text-lg mb-2">No Class Validation Data</div>
            <div className="text-default-500 mb-4">No timetable validation data is available for classes. Create timetables first, then check back.</div>
            <Button color="primary" variant="flat" onPress={fetchReports}>Refresh Data</Button>
          </div>
        </CardBody>
      </Card>
    );

    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{t('pages.overallClassTimetableStatistics')}</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{classReport.totalClasses}</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.totalClasses1')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{classReport.completeClasses}</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.complete')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{classReport.incompleteClasses}</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.incomplete')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{classReport.averageCompleteness}%</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.avgCompleteness')}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('pages.averageCompleteness')}</span>
                <span className="text-sm font-medium">{classReport.averageCompleteness}%</span>
              </div>
              <Progress
                value={classReport.averageCompleteness}
                color={getCompletenessColor(classReport.averageCompleteness)}
                className="h-3"
              />
            </div>
          </CardBody>
        </Card>

        {/* Individual Class Reports */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{t('pages.classWiseBreakdown')}</h3>
          </CardHeader>
          <CardBody>
            {renderFilters()}
            <div className="space-y-3">
              {paginatedItems.length === 0 ? (
                <div className="text-center py-8 text-default-500">No classes match the current filters.</div>
              ) : (
                paginatedItems.map((report) => (
                  <div
                    key={report.className}
                    className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-lg">{report.className}</div>
                        <Badge
                          color={getCompletenessColor(report.completenessPercentage)}
                          variant="flat"
                        >
                          {report.completenessPercentage}%
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        {report.filledSlots}/{report.totalSlots} slots filled
                      </div>
                    </div>
                    <Progress
                      value={report.completenessPercentage}
                      color={getCompletenessColor(report.completenessPercentage)}
                      className="h-2"
                    />
                    {report.emptySlots > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        {report.emptySlots} empty slot{report.emptySlots !== 1 ? 's' : ''} remaining
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {renderPagination()}
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderTeachersTab = () => {
    if (!teacherReport) return (
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👩‍🏫</div>
            <div className="font-medium text-lg mb-2">No Teacher Utilization Data</div>
            <div className="text-default-500 mb-4">No timetable validation data is available for teachers. Assign teachers to timetables first, then check back.</div>
            <Button color="primary" variant="flat" onPress={fetchReports}>Refresh Data</Button>
          </div>
        </CardBody>
      </Card>
    );

    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{t('pages.overallTeacherUtilizationStatistics')}</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{teacherReport.totalTeachers}</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.totalTeachers')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{teacherReport.fullyUtilizedTeachers}</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.fullyUtilized')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{teacherReport.underutilizedTeachers}</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.underutilized')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{teacherReport.averageUtilization}%</div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.avgUtilization')}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('pages.averageUtilization')}</span>
                <span className="text-sm font-medium">{teacherReport.averageUtilization}%</span>
              </div>
              <Progress
                value={teacherReport.averageUtilization}
                color={getCompletenessColor(teacherReport.averageUtilization)}
                className="h-3"
              />
            </div>
          </CardBody>
        </Card>

        {/* Individual Teacher Reports */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{t('pages.teacherWiseBreakdown')}</h3>
          </CardHeader>
          <CardBody>
            {renderFilters()}
            <div className="space-y-3">
              {paginatedItems.length === 0 ? (
                <div className="text-center py-8 text-default-500">No teachers match the current filters.</div>
              ) : (
                paginatedItems.map((report) => (
                  <div
                    key={report.teacherName}
                    className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-lg">{report.teacherName}</div>
                        <Badge
                          color={getCompletenessColor(report.utilizationPercentage)}
                          variant="flat"
                        >
                          {report.utilizationPercentage}%
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        {report.assignedPeriods}/{report.totalPeriods} periods assigned
                      </div>
                    </div>
                    <Progress
                      value={report.utilizationPercentage}
                      color={getCompletenessColor(report.utilizationPercentage)}
                      className="h-2"
                    />
                    {report.unassignedPeriods > 0 && (
                      <div className="mt-2 text-sm text-orange-600">
                        {report.unassignedPeriods} free period{report.unassignedPeriods !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {renderPagination()}
          </CardBody>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <CardGridPageSkeleton cards={4} columns="grid-cols-1 md:grid-cols-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="text-red-600 text-5xl mb-4">⚠</div>
              <div className="text-red-600 font-medium text-xl mb-2">{t('pages.error1')}</div>
              <div className="text-gray-600 dark:text-zinc-400 mb-4">{error}</div>
              <Button
                color="primary"
                onPress={fetchReports}
              >
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('pages.timetableValidationDashboard')}</h1>
        <p className="text-gray-600 dark:text-zinc-400">
          Monitor timetable completeness and teacher utilization across the school
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
          <Tab key="classes" title={t('pages.classes2')} />
          <Tab key="teachers" title={t('pages.teachers')} />
        </Tabs>

        <Button
          color="primary"
          variant="flat"
          onPress={fetchReports}
        >
          Refresh Data
        </Button>
      </div>

      {activeTab === 'classes' && renderClassesTab()}
      {activeTab === 'teachers' && renderTeachersTab()}
    </div>
  );
};

export default TimetableValidationDashboard;

