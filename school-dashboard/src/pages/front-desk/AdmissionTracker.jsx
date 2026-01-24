import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Progress } from '@heroui/react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdmissionTracker({ admission, isOpen, onClose }) {
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
      // Get token from sessionStorage using the same pattern as api.js
      const storedUser = sessionStorage.getItem('app_user');
      let token = null;

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          token = userData.token;
        } catch (err) {
          console.error('Failed to parse user data from sessionStorage:', err);
        }
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/front-desk/admissions/${admission._id}/tracker`, {
        headers
      });
      const data = await response.json();
      setTrackerData(data);
    } catch (error) {
      console.error('Failed to load tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!trackerData || loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Admission Tracker</ModalHeader>
          <ModalBody>
            <div className="flex justify-center p-8">Loading...</div>
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
                <span className="text-sm font-medium">Progress</span>
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
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
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
              <p className="text-sm font-medium mb-2">Admission Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-default-500">Class:</span>
                  <span className="ml-2">{admission.classApplyingFor || '-'}</span>
                </div>
                <div>
                  <span className="text-default-500">Source:</span>
                  <span className="ml-2">{admission.source || '-'}</span>
                </div>
                <div>
                  <span className="text-default-500">Parent:</span>
                  <span className="ml-2">{admission.parentName || '-'}</span>
                </div>
                <div>
                  <span className="text-default-500">Phone:</span>
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
