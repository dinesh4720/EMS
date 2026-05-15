import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Progress, Badge, Button, Tabs, Tab } from '@heroui/react';
import { request } from '../../services/api';
import { CURRENT_ACADEMIC_YEAR } from '../../utils/constants';
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


/**
 * TimetableValidationPanel Component
 * Displays validation results for timetable completeness
 * Shows empty slots for classes and unassigned periods for teachers
 */
const TimetableValidationPanel = ({ type = 'class', id, academicYear }) => {
  const { t } = useTranslation();
  const resolvedAcademicYear = academicYear || CURRENT_ACADEMIC_YEAR;
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (id) {
      fetchValidationReport();
    }
  }, [id, type, resolvedAcademicYear]);

  const fetchValidationReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = type === 'class'
        ? `/validation/class/${id}/report`
        : `/validation/teacher/${id}/report`;

      const query = `?academicYear=${encodeURIComponent(resolvedAcademicYear)}`;
      const response = await request(`${endpoint}${query}`);

      if (response.success) {
        setReport(response.report);
      } else {
        setError(response.message || 'Failed to fetch validation report');
      }
    } catch (err) {
      logger.error('Error fetching validation report:', err);
      setError(err.message || 'Failed to fetch validation report');
    } finally {
      setLoading(false);
    }
  };

  const getCompletenessColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  const renderClassReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-4">
        <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
          <Tab key="summary" title={t('components.summary')}>
            <Card>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.totalSlots}</div>
                    <div className="text-sm text-gray-600">{t('components.totalSlots')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{report.filledSlots}</div>
                    <div className="text-sm text-gray-600">{t('components.filledSlots')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.emptySlots}</div>
                    <div className="text-sm text-gray-600">{t('components.emptySlots')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{report.completenessPercentage}%</div>
                    <div className="text-sm text-gray-600">{t('components.completeness')}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t('components.timetableCompleteness')}</span>
                    <span className="text-sm font-medium">{report.completenessPercentage}%</span>
                  </div>
                  <Progress 
                    value={report.completenessPercentage} 
                    color={getCompletenessColor(report.completenessPercentage)}
                    className="h-3"
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="gaps" title={`Empty Slots (${report.emptySlots})`}>
            <Card>
              <CardBody>
                {report.emptySlotDetails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✓</div>
                    <div>{t('components.noEmptySlotsTimetableIsComplete')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.emptySlotDetails.map((slot) => (
                      <div
                        key={`${slot.day}-${slot.periodName}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge color="danger" variant="flat">{t('components.empty')}</Badge>
                          <div>
                            <div className="font-medium">{slot.day}</div>
                            <div className="text-sm text-gray-600">
                              {slot.periodName} ({slot.startTime} - {slot.endTime})
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Period {slot.periodIndex + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderTeacherReport = () => {
    if (!report) return null;

    return (
      <div className="space-y-4">
        <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
          <Tab key="summary" title={t('components.summary')}>
            <Card>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.totalPeriods}</div>
                    <div className="text-sm text-gray-600">{t('components.totalPeriods')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{report.assignedPeriods}</div>
                    <div className="text-sm text-gray-600">{t('components.assigned')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.unassignedPeriods}</div>
                    <div className="text-sm text-gray-600">{t('components.unassigned')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{report.utilizationPercentage}%</div>
                    <div className="text-sm text-gray-600">{t('components.utilization')}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t('components.teacherUtilization')}</span>
                    <span className="text-sm font-medium">{report.utilizationPercentage}%</span>
                  </div>
                  <Progress 
                    value={report.utilizationPercentage} 
                    color={getCompletenessColor(report.utilizationPercentage)}
                    className="h-3"
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="gaps" title={`Free Periods (${report.unassignedPeriods})`}>
            <Card>
              <CardBody>
                {report.gapDetails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✓</div>
                    <div>{t('components.noFreePeriodsTeacherIsFullyScheduled')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.gapDetails.map((gap) => (
                      <div
                        key={`${gap.day}-${gap.periodName}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge color="warning" variant="flat">{t('components.free1')}</Badge>
                          <div>
                            <div className="font-medium">{gap.day}</div>
                            <div className="text-sm text-gray-600">
                              {gap.periodName} ({gap.startTime} - {gap.endTime})
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Period {gap.periodIndex + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">{t('components.loadingValidationReport')}</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <div className="text-red-600 text-4xl mb-2">⚠</div>
            <div className="text-red-600 font-medium mb-2">{t('components.error')}</div>
            <div className="text-gray-600">{error}</div>
            <Button
              color="primary"
              variant="flat"
              className="mt-4"
              onPress={fetchValidationReport}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {type === 'class' ? 'Class Timetable Validation' : 'Teacher Schedule Validation'}
        </h3>
        <Button
          size="sm"
          variant="flat"
          onPress={fetchValidationReport}
        >
          Refresh
        </Button>
      </div>

      {type === 'class' ? renderClassReport() : renderTeacherReport()}
    </div>
  );
};

export default TimetableValidationPanel;

