import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';
import {
  Card, CardHeader, CardBody, Button, Select, SelectItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Chip, Avatar, Badge, Spinner, Divider, useDisclosure,
  Progress
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, UserCheck, Clock, RefreshCw, ChevronRight,
  CheckCircle, XCircle, UserPlus, Bell, BellOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { request } from '../../services/api';
import socketService from '../../services/socketServiceEnhanced';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { toTodayDateString } from '../../utils/dateFormatter';

/**
 * SubstitutionAlertPanel - Shows real-time substitution alerts on dashboard
 *
 * Features:
 * - Displays pending substitutions needing coverage
 * - Priority-based sorting (urgent first)
 * - Quick assign functionality
 * - Real-time updates
 */
export default function SubstitutionAlertPanel({ className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { staff, classes, schoolSettings } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const today = toTodayDateString();
      const response = await request(`/substitution-alerts?date=${today}`);

      if (response.success) {
        setAlerts(Array.isArray(response.alerts) ? response.alerts : []);

        // Play alert sound for new urgent alerts
        if (soundEnabled && response.summary.urgentAlerts > 0) {
          // Could play a sound here
        }
      }
    } catch (error) {
      logger.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchAlerts();

    // Refresh every 2 minutes (reduced from 30s to avoid rate-limit issues —
    // real-time updates come via socket, polling is just a fallback)
    const interval = setInterval(fetchAlerts, 120000);

    // Listen for real-time substitution alerts via socket
    const handleSubstitutionAlert = (data) => {
      if (data.type === 'new_alerts') {
        // Show notification toast
        toast.custom((toastInstance) => (
          <div className={`flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-lg shadow-lg border-l-4 border-danger-500 ${toastInstance.visible ? 'animate-enter' : 'animate-leave'}`}>
            <div className="p-2 bg-danger-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100">{t('components.teacherAbsent')}</p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                {data.teacherName} - {data.count} class{data.count > 1 ? 'es' : ''} need{data.count === 1 ? 's' : ''} substitute
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="ml-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        ), { duration: 5000 });

        // Refresh alerts list
        fetchAlerts();
      }
    };

    // Subscribe to socket events
    socketService.on('substitution_alert', handleSubstitutionAlert);

    return () => {
      clearInterval(interval);
      socketService.off('substitution_alert', handleSubstitutionAlert);
    };
  }, [fetchAlerts]);

  // Fetch available teachers for an alert
  const fetchAvailableTeachers = async (alert) => {
    setLoadingTeachers(true);
    try {
      const dayOfWeek = getDayOfWeek(alert.date);
      const response = await request(
        `/substitution-alerts/available-teachers?classId=${alert.classId}&subject=${alert.subject}&day=${dayOfWeek}&period=${alert.period}&date=${alert.date}`
      );

      if (response.success) {
        setAvailableTeachers(response.available || []);
      }
    } catch (error) {
      logger.error('Error fetching available teachers:', error);
      setAvailableTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Handle alert click
  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setSelectedTeacher('');
    fetchAvailableTeachers(alert);
    onOpen();
  };

  // Handle assign substitute
  const handleAssignSubstitute = async () => {
    if (!selectedTeacher || !selectedAlert) return;

    setAssigning(true);
    try {
      const response = await request(`/substitution-alerts/${selectedAlert._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substituteTeacherId: selectedTeacher })
      });

      if (response.success) {
        toast.success(`Assigned ${response.substitution.substituteTeacherId?.name || 'teacher'} as substitute`);
        onClose();
        fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      toast.error('Failed to assign substitute');
      logger.error('Error assigning substitute:', error);
    } finally {
      setAssigning(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  // Get priority color
  const getPriorityColor = (alert) => {
    if (alert.priority >= 20) return 'danger';
    if (alert.priority >= 10) return 'warning';
    return 'primary';
  };

  // Get priority label
  const getPriorityLabel = (alert) => {
    if (alert.priority >= 20) return 'URGENT';
    if (alert.priority >= 10) return 'Soon';
    return 'Scheduled';
  };

  // Get day of week
  const getDayOfWeek = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateString).getDay()];
  };

  // Format time until class
  const getTimeUntil = (date, period) => {
    const now = new Date();
    const classDate = new Date(date);
    const diffMs = classDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Past';
    if (diffHours < 1) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h ${diffMins}m`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  // Get recommendation badge
  const getRecommendationBadge = (teacher) => {
    switch (teacher.recommendation) {
      case 'highly_recommended':
        return <Chip size="sm" color="success" variant="flat">{t('components.bestMatch')}</Chip>;
      case 'recommended':
        return <Chip size="sm" color="primary" variant="flat">{t('components.goodMatch')}</Chip>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center h-32">
          <Spinner color="primary" />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className={`border border-danger-200 bg-danger-50/30 ${className}`}>
        <CardHeader className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-danger-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
            </div>
            <div>
              <h3 className="font-semibold text-danger-700">{t('components.substitutionAlerts')}</h3>
              <p className="text-xs text-danger-500">
                {alerts.length} pending assignment{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4 text-default-500" />
              ) : (
                <BellOff className="w-4 h-4 text-default-400" />
              )}
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleRefresh}
              isLoading={refreshing}
            >
              <RefreshCw className="w-4 h-4 text-default-500" />
            </Button>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="p-0 max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-success-400 mb-2" />
              <p className="text-default-500 font-medium">{t('components.noPendingSubstitutions')}</p>
              <p className="text-xs text-default-400">{t('components.allClassesAreCovered')}</p>
            </div>
          ) : (
            <AnimatePresence>
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    className="w-full p-3 hover:bg-default-100 transition-colors text-left border-b border-default-100 last:border-b-0"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Chip
                            size="sm"
                            color={getPriorityColor(alert)}
                            variant="flat"
                            className="text-xs"
                          >
                            {getPriorityLabel(alert)}
                          </Chip>
                          <span className="text-xs text-default-400">
                            Period {alert.period}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-default-800 truncate">
                          {alert.className}
                        </p>
                        <p className="text-xs text-default-500">
                          {alert.subject} • {alert.absentTeacher?.name || 'Teacher absent'}
                        </p>
                        {alert.timeSlot && (
                          <p className="text-xs text-default-400 mt-1">
                            {alert.timeSlot}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium text-default-500">
                          {getTimeUntil(alert.date, alert.period)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-default-400" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </CardBody>

        {alerts.length > 3 && (
          <>
            <Divider />
            <CardBody className="p-2">
              <Button
                size="sm"
                variant="flat"
                color="danger"
                className="w-full"
                onPress={() => navigate('/classes')}
              >
                View All ({alerts.length})
              </Button>
            </CardBody>
          </>
        )}
      </Card>

      {/* Assign Substitute Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>{t('components.assignSubstituteTeacher')}</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedAlert && (
              <>
                {/* Alert Details */}
                <div className="bg-default-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{selectedAlert.className}</p>
                      <p className="text-sm text-default-500">{selectedAlert.subject}</p>
                    </div>
                    <Chip color={getPriorityColor(selectedAlert)} variant="flat">
                      {getPriorityLabel(selectedAlert)}
                    </Chip>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-default-400">{t('components.absentTeacher')}</p>
                      <p className="font-medium">{selectedAlert.absentTeacher?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-default-400">{t('components.period1')}</p>
                      <p className="font-medium">
                        {selectedAlert.periodName} ({selectedAlert.timeSlot || `Period ${selectedAlert.period}`})
                      </p>
                    </div>
                    <div>
                      <p className="text-default-400">{t('components.date1')}</p>
                      <p className="font-medium">{selectedAlert.date ? new Date(selectedAlert.date).toLocaleDateString('en-IN') : '—'}</p>
                    </div>
                    <div>
                      <p className="text-default-400">{t('components.day1')}</p>
                      <p className="font-medium">{getDayOfWeek(selectedAlert.date)}</p>
                    </div>
                  </div>
                </div>

                {/* Available Teachers */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">{t('components.availableTeachers')}</h4>
                  <p className="text-xs text-default-500">
                    Teachers on free period during this slot
                  </p>

                  {loadingTeachers ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner color="primary" />
                      <span className="ml-2 text-default-500">{t('components.findingAvailableTeachers')}</span>
                    </div>
                  ) : availableTeachers.length === 0 ? (
                    <div className="bg-warning-50 rounded-lg p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-warning-500 mx-auto mb-2" />
                      <p className="text-warning-700 font-medium">{t('components.noTeachersAvailable')}</p>
                      <p className="text-xs text-warning-600">
                        All qualified teachers are assigned to other classes at this time.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableTeachers.map((teacher) => (
                        <button
                          key={teacher.id}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            selectedTeacher === String(teacher.id)
                              ? 'border-primary bg-primary-50'
                              : 'border-default-200 hover:border-primary-200 hover:bg-default-50'
                          }`}
                          onClick={() => setSelectedTeacher(String(teacher.id))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={teacher.name}
                                size="sm"
                                className="bg-primary-100 text-primary-700"
                              />
                              <div>
                                <p className="font-medium text-sm">{teacher.name}</p>
                                <p className="text-xs text-default-500">
                                  {teacher.department || 'Teacher'} • {teacher.workload} periods today
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getRecommendationBadge(teacher)}
                              {selectedTeacher === String(teacher.id) && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignSubstitute}
              isDisabled={!selectedTeacher}
              isLoading={assigning}
            >
              Assign Substitute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
