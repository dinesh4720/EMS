import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Progress } from '@heroui/react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { frontDeskApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { formatShortDate, formatTime } from '../../utils/dateFormatter';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';


export default function AdmissionTracker({ admission, isOpen, onClose }) {
  const { t } = useTranslation();
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && admission?._id) {
      loadTracker();
    }
  }, [isOpen, admission?._id]);

  const loadTracker = async () => {
    setLoading(true);
    try {
      const data = await frontDeskApi.getAdmissionTracker(admission._id);
      setTrackerData(data);
    } catch (error) {
      logger.error('Failed to load tracker:', error);
      toast.error('Failed to load admission tracker');
    } finally {
      setLoading(false);
    }
  };

  if (!trackerData || loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.admissionTracker')}</ModalHeader>
          <ModalBody>
            <div className="flex justify-center p-8">{t('pages.loading')}</div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          Admission Tracker - {admission.studentName}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{t('pages.progress')}</span>
                <span className="text-sm text-default-500">{Math.round(trackerData.progress)}%</span>
              </div>
              <Progress
                value={trackerData.progress}
                color="success"
                className="w-full"
              />
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {trackerData.timeline.map((item, index) => (
                <div key={item.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.isCompleted
                        ? 'bg-success-100 text-success-600'
                        : item.isCurrent
                        ? 'bg-primary-100 text-primary-600 animate-pulse'
                        : 'bg-default-100 text-default-400'
                    }`}>
                      {item.isCompleted ? (
                        <CheckCircle size={16} />
                      ) : item.isCurrent ? (
                        <Clock size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </div>
                    {index < trackerData.timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${
                        item.isCompleted ? 'bg-success-300' : 'bg-default-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${
                          item.isCompleted ? 'text-success-600' : item.isCurrent ? 'text-primary-600' : 'text-default-400'
                        }`}>
                          {item.label}
                        </p>
                        {item.date && (
                          <p className="text-sm text-default-500 mt-1">
                            {formatShortDate(item.date)} {formatTime(item.date)}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-default-600 mt-1">{item.notes}</p>
                        )}
                        {item.assignedTo && (
                          <p className="text-xs text-default-400 mt-1">Assigned to: {item.assignedTo}</p>
                        )}
                      </div>
                      {item.isCurrent && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-600 text-xs rounded-full">
                          Current Stage
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Student Details Summary */}
            <div className="bg-default-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">{t('pages.admissionDetails')}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-default-500">{t('pages.class2')}</span>
                  <span className="ml-2">{admission.classApplyingFor || '-'}</span>
                </div>
                <div>
                  <span className="text-default-500">{t('pages.source1')}</span>
                  <span className="ml-2">{admission.source || '-'}</span>
                </div>
                <div>
                  <span className="text-default-500">{t('pages.parent1')}</span>
                  <span className="ml-2">{admission.parentName || '-'}</span>
                </div>
                <div>
                  <span className="text-default-500">{t('pages.phone2')}</span>
                  <span className="ml-2">{admission.phoneNumber || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
