import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Progress, Badge, Button, Tabs, Tab, Select, SelectItem } from '@heroui/react';
import api from '../../services/api';
import { CURRENT_ACADEMIC_YEAR } from '../../utils/constants';

/**
 * TimetableValidationDashboard Component
 * Comprehensive dashboard for viewing timetable validation across all classes and teachers
 */
const TimetableValidationDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [classReport, setClassReport] = useState(null);
  const [teacherReport, setTeacherReport] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [academicYear] = useState(CURRENT_ACADEMIC_YEAR);

  useEffect(() => {
    fetchReports();
  }, [academicYear]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const [classResponse, teacherResponse] = await Promise.all([
        api.get('/api/validation/classes/comprehensive', { params: { academicYear } }),
        api.get('/api/validation/teachers/comprehensive', { params: { academicYear } })
      ]);

      if (classResponse.data.success) {
        setClassReport(classResponse.data.report);
      }

      if (teacherResponse.data.success) {
        setTeacherReport(teacherResponse.data.report);
      }
    } catch (err) {
      console.error('Error fetching validation reports:', err);
      setError(err.response?.data?.message || 'Failed to fetch validation reports');
    } finally {
      setLoading(false);
    }
  };

  const getCompletenessColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  const renderClassesTab = () => {
    if (!classReport) return null;

    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Overall Class Timetable Statistics</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{classReport.totalClasses}</div>
                <div className="text-sm text-gray-600">Total Classes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{classReport.completeClasses}</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{classReport.incompleteClasses}</div>
                <div className="text-sm text-gray-600">Incomplete</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{classReport.averageCompleteness}%</div>
                <div className="text-sm text-gray-600">Avg Completeness</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Average Completeness</span>
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
            <h3 className="text-lg font-semibold">Class-wise Breakdown</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {classReport.classReports
                .sort((a, b) => a.completenessPercentage - b.completenessPercentage)
                .map((report, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                      <div className="text-sm text-gray-600">
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
                ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderTeachersTab = () => {
    if (!teacherReport) return null;

    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Overall Teacher Utilization Statistics</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{teacherReport.totalTeachers}</div>
                <div className="text-sm text-gray-600">Total Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{teacherReport.fullyUtilizedTeachers}</div>
                <div className="text-sm text-gray-600">Fully Utilized</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{teacherReport.underutilizedTeachers}</div>
                <div className="text-sm text-gray-600">Underutilized</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{teacherReport.averageUtilization}%</div>
                <div className="text-sm text-gray-600">Avg Utilization</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Average Utilization</span>
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
            <h3 className="text-lg font-semibold">Teacher-wise Breakdown</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {teacherReport.teacherReports
                .sort((a, b) => a.utilizationPercentage - b.utilizationPercentage)
                .map((report, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                      <div className="text-sm text-gray-600">
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
                ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600 text-lg">Loading validation reports...</div>
            </div>
          </CardBody>
        </Card>
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
              <div className="text-red-600 font-medium text-xl mb-2">Error</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <Button 
                color="primary" 
                onClick={fetchReports}
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
        <h1 className="text-2xl font-bold mb-2">Timetable Validation Dashboard</h1>
        <p className="text-gray-600">
          Monitor timetable completeness and teacher utilization across the school
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
          <Tab key="classes" title="Classes" />
          <Tab key="teachers" title="Teachers" />
        </Tabs>

        <Button 
          color="primary" 
          variant="flat" 
          onClick={fetchReports}
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

