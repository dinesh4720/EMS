import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardBody, Button, Checkbox, Modal, ModalContent,
  ModalHeader, ModalBody, ModalFooter, Progress, Divider, Chip,
  Accordion, AccordionItem, useDisclosure
} from '@heroui/react';
import {
  Trash2, AlertTriangle, CheckCircle, RefreshCw, Database,
  Calendar, Users, BookOpen, UserCheck, AlertCircle, Loader2
} from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * TimetableCleanup - Admin utility to clear timetable data
 *
 * Allows clearing:
 * - Class timetables
 * - Teacher timetables
 * - Staff subject assignments
 * - Class teacher assignments
 * - Conflict logs
 * - Substitutions
 */
export default function TimetableCleanup() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [results, setResults] = useState(null);

  const [options, setOptions] = useState({
    timetables: true,
    teacherTimetables: true,
    staffAssignments: true,
    classTeachers: true,
    conflicts: true,
    substitutions: true
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const confirmModal = useDisclosure();

  // Fetch preview data
  const fetchPreview = async () => {
    setLoading(true);
    try {
      const response = await request('/timetable-cleanup/preview');
      if (response.success) {
        setPreviewData(response);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast.error('Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  // Handle option toggle
  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle cleanup execution
  const executeCleanup = async () => {
    setCleaning(true);
    setResults(null);

    try {
      const response = await request('/timetable-cleanup/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options })
      });

      if (response.success) {
        setResults(response.results);
        toast.success('Timetable data cleared successfully!');
        confirmModal.onClose();
        fetchPreview(); // Refresh preview
      }
    } catch (error) {
      console.error('Error executing cleanup:', error);
      toast.error('Failed to clear data');
    } finally {
      setCleaning(false);
    }
  };

  // Get total items to delete
  const getTotalItems = () => {
    if (!previewData) return 0;
    const { counts } = previewData;
    let total = 0;
    if (options.timetables) total += counts.classTimetables;
    if (options.teacherTimetables) total += counts.teacherTimetables;
    if (options.conflicts) total += counts.conflictLogs;
    if (options.substitutions) total += counts.substitutions;
    return total;
  };

  // Get total items to update
  const getTotalUpdates = () => {
    if (!previewData) return 0;
    const { counts } = previewData;
    let total = 0;
    if (options.staffAssignments) total += counts.staffWithAssignments;
    if (options.classTeachers) total += counts.classesWithTeachers;
    return total;
  };

  const cleanupOptions = [
    {
      key: 'timetables',
      label: 'Class Timetables',
      description: 'Weekly schedules for all classes',
      icon: Calendar,
      count: previewData?.counts?.classTimetables || 0,
      color: 'primary'
    },
    {
      key: 'teacherTimetables',
      label: 'Teacher Timetables',
      description: 'Individual teacher schedules',
      icon: Users,
      count: previewData?.counts?.teacherTimetables || 0,
      color: 'secondary'
    },
    {
      key: 'staffAssignments',
      label: 'Staff Subject Assignments',
      description: 'Subject-class assignments for teachers',
      icon: BookOpen,
      count: previewData?.counts?.staffWithAssignments || 0,
      color: 'success'
    },
    {
      key: 'classTeachers',
      label: 'Class Teacher Assignments',
      description: 'Class teacher for each class',
      icon: UserCheck,
      count: previewData?.counts?.classesWithTeachers || 0,
      color: 'warning'
    },
    {
      key: 'conflicts',
      label: 'Conflict Logs',
      description: 'Scheduling conflict records',
      icon: AlertTriangle,
      count: previewData?.counts?.conflictLogs || 0,
      color: 'danger'
    },
    {
      key: 'substitutions',
      label: 'Substitutions',
      description: 'Teacher substitution records',
      icon: RefreshCw,
      count: previewData?.counts?.substitutions || 0,
      color: 'default'
    }
  ];

  return (
    <Card className="border border-danger-200">
      <CardHeader className="bg-danger-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-danger-100 rounded-lg">
            <Trash2 className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <h3 className="font-semibold text-danger-700">{t('components.timetableDataCleanup')}</h3>
            <p className="text-xs text-danger-500">{t('components.clearAllTimetableRelatedData')}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={fetchPreview}
          isLoading={loading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>

      <Divider />

      <CardBody className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">{t('components.loadingPreview')}</span>
          </div>
        ) : results ? (
          /* Show Results */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{t('components.cleanupComplete')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(results.deleted || {}).map(([key, count]) => (
                <div key={key} className="bg-danger-50 rounded-lg p-3">
                  <p className="text-xs text-danger-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-lg font-semibold text-danger-700">{count} deleted</p>
                </div>
              ))}
              {Object.entries(results.updated || {}).map(([key, count]) => (
                <div key={key} className="bg-warning-50 rounded-lg p-3">
                  <p className="text-xs text-warning-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-lg font-semibold text-warning-700">{count} updated</p>
                </div>
              ))}
            </div>

            <Button
              color="primary"
              variant="flat"
              onPress={() => setResults(null)}
              className="w-full"
            >
              Clear Results
            </Button>
          </div>
        ) : previewData ? (
          /* Show Options */
          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-700">{t('components.warningThisActionCannotBeUndone')}</p>
                <p className="text-xs text-warning-600">
                  Make sure you have a backup before proceeding. This will permanently delete timetable data.
                </p>
              </div>
            </div>

            {/* Cleanup Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('components.selectWhatToClear')}</p>

              {cleanupOptions.map((option) => (
                <div
                  key={option.key}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    options[option.key]
                      ? 'border-danger-300 bg-danger-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleOption(option.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox size="sm"
                        isSelected={options[option.key]}
                        onValueChange={() => toggleOption(option.key)}
                        color="danger"
                      />
                      <option.icon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </div>
                    <Chip size="sm" color={option.color} variant="flat">
                      {option.count}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('components.itemsToDelete')}</span>
                <span className="font-semibold text-danger-600">{getTotalItems()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('components.recordsToUpdate')}</span>
                <span className="font-semibold text-warning-600">{getTotalUpdates()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                color="danger"
                variant="flat"
                onPress={confirmModal.onOpen}
                isDisabled={getTotalItems() === 0 && getTotalUpdates() === 0}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Selected Data
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('components.unableToLoadPreviewData')}</p>
            <Button size="sm" variant="light" onPress={fetchPreview} className="mt-2">
              Retry
            </Button>
          </div>
        )}
      </CardBody>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.onClose}>
        <ModalContent>
          <ModalHeader className="text-danger-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Confirm Cleanup
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600">
              You are about to permanently delete:
            </p>

            <ul className="space-y-1 text-sm">
              {options.timetables && previewData?.counts?.classTimetables > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                  {previewData.counts.classTimetables} class timetables
                </li>
              )}
              {options.teacherTimetables && previewData?.counts?.teacherTimetables > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-500" />
                  {previewData.counts.teacherTimetables} teacher timetables
                </li>
              )}
              {options.staffAssignments && previewData?.counts?.staffWithAssignments > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success-500" />
                  Staff assignments for {previewData.counts.staffWithAssignments} teachers
                </li>
              )}
              {options.classTeachers && previewData?.counts?.classesWithTeachers > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning-500" />
                  Class teachers for {previewData.counts.classesWithTeachers} classes
                </li>
              )}
              {options.conflicts && previewData?.counts?.conflictLogs > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger-500" />
                  {previewData.counts.conflictLogs} conflict logs
                </li>
              )}
              {options.substitutions && previewData?.counts?.substitutions > 0 && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  {previewData.counts.substitutions} substitution records
                </li>
              )}
            </ul>

            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-danger-700 font-medium">
                This action cannot be undone!
              </p>
              <p className="text-xs text-danger-600 mt-1">
                All selected data will be permanently removed from the database.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={confirmModal.onClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={executeCleanup}
              isLoading={cleaning}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirm & Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
