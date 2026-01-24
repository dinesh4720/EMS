import { Card, CardBody, Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { AlertTriangle, X, UserX, RefreshCw, Info } from "lucide-react";
import { useState } from "react";

/**
 * ConflictIndicator Component
 * 
 * Displays scheduling conflicts with detailed information and resolution options.
 * Supports multiple conflict types: double_booking, unqualified, invalid_assignment
 * 
 * @param {Object} props
 * @param {Array} props.conflicts - Array of conflict objects
 * @param {Function} props.onResolve - Callback when a resolution action is taken
 * @param {boolean} props.compact - Whether to show compact view (default: false)
 * @param {string} props.className - Additional CSS classes
 */
export default function ConflictIndicator({ 
  conflicts = [], 
  onResolve, 
  compact = false,
  className = "" 
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutionAction, setResolutionAction] = useState(null);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  /**
   * Display detailed conflict information
   * @param {Object} conflict - The conflict object to display
   * @returns {JSX.Element} Formatted conflict details
   */
  const displayConflictDetails = (conflict) => {
    const { type, teacherName, teacherCode, day, periodIndex, conflicts: conflictList, message, subject, classId, className } = conflict;

    return (
      <div className="space-y-3">
        {/* Conflict Type Badge */}
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            color={type === 'double_booking' ? 'danger' : type === 'unqualified' ? 'warning' : 'default'}
            startContent={<AlertTriangle size={14} />}
          >
            {type === 'double_booking' ? 'Double Booking' : 
             type === 'unqualified' ? 'Unqualified Teacher' : 
             'Invalid Assignment'}
          </Chip>
        </div>

        {/* Teacher Information */}
        <div className="bg-default-100 rounded-lg p-3">
          <p className="text-xs text-default-500 mb-1">Teacher</p>
          <p className="text-sm font-semibold text-default-900">
            {teacherName || 'Unknown Teacher'}
            {teacherCode && <span className="text-xs text-default-500 ml-2">({teacherCode})</span>}
          </p>
        </div>

        {/* Time Slot Information */}
        <div className="bg-default-100 rounded-lg p-3">
          <p className="text-xs text-default-500 mb-1">Time Slot</p>
          <p className="text-sm font-semibold text-default-900">
            {day} - Period {periodIndex + 1}
          </p>
        </div>

        {/* Conflict Details */}
        {type === 'double_booking' && conflictList && conflictList.length > 0 && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
            <p className="text-xs text-danger-600 font-semibold mb-2">Conflicting Classes:</p>
            <div className="space-y-2">
              {conflictList.map((conf, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-danger-700">{conf.className}</p>
                    <p className="text-danger-600">
                      {conf.subject}
                      {conf.room && <span className="ml-1">• Room {conf.room}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'unqualified' && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-xs text-warning-600 font-semibold mb-1">Qualification Issue:</p>
            <p className="text-xs text-warning-700">
              Teacher is not assigned to teach <strong>{subject}</strong> in <strong>{className}</strong>
            </p>
          </div>
        )}

        {/* Conflict Message */}
        <div className="bg-default-50 border border-default-200 rounded-lg p-3">
          <p className="text-xs text-default-500 mb-1">Details</p>
          <p className="text-sm text-default-700">{message}</p>
        </div>
      </div>
    );
  };

  /**
   * Generate resolution suggestions based on conflict type
   * @param {Object} conflict - The conflict object
   * @returns {Array} Array of resolution options
   */
  const suggestResolutions = (conflict) => {
    const { type, conflicts: conflictList } = conflict;

    if (type === 'double_booking') {
      const resolutions = [
        {
          id: 'remove_current',
          label: 'Cancel This Assignment',
          description: 'Remove the teacher from the current slot',
          icon: X,
          color: 'danger',
          action: 'remove_current'
        },
        {
          id: 'choose_different',
          label: 'Choose Different Teacher',
          description: 'Select another qualified teacher for this slot',
          icon: RefreshCw,
          color: 'primary',
          action: 'choose_different'
        }
      ];

      // Add option to remove from each conflicting class
      if (conflictList && conflictList.length > 0) {
        conflictList.forEach((conf, idx) => {
          resolutions.push({
            id: `remove_from_${idx}`,
            label: `Remove from ${conf.className}`,
            description: `Free up the teacher by removing them from ${conf.className}`,
            icon: UserX,
            color: 'warning',
            action: 'remove_from_class',
            classId: conf.classId,
            className: conf.className
          });
        });
      }

      return resolutions;
    }

    if (type === 'unqualified') {
      return [
        {
          id: 'choose_different',
          label: 'Choose Qualified Teacher',
          description: 'Select a teacher who is assigned to teach this subject',
          icon: RefreshCw,
          color: 'primary',
          action: 'choose_different'
        },
        {
          id: 'update_assignments',
          label: 'Update Teacher Assignments',
          description: 'Add this subject-class assignment to the teacher',
          icon: Info,
          color: 'warning',
          action: 'update_assignments'
        }
      ];
    }

    // Default resolution for other types
    return [
      {
        id: 'cancel',
        label: 'Cancel Assignment',
        description: 'Remove this assignment',
        icon: X,
        color: 'danger',
        action: 'remove_current'
      }
    ];
  };

  /**
   * Handle resolution action selection
   * @param {Object} conflict - The conflict being resolved
   * @param {Object} resolution - The selected resolution option
   */
  const handleResolutionSelect = (conflict, resolution) => {
    setSelectedConflict(conflict);
    setResolutionAction(resolution);
    
    if (onResolve) {
      onResolve({
        conflict,
        resolution,
        action: resolution.action,
        classId: resolution.classId
      });
    }
    
    onClose();
  };

  /**
   * Open conflict details modal
   * @param {Object} conflict - The conflict to display
   */
  const openConflictDetails = (conflict) => {
    setSelectedConflict(conflict);
    onOpen();
  };

  // Compact view - single line with count
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          size="sm"
          color="danger"
          variant="flat"
          startContent={<AlertTriangle size={14} />}
          onPress={() => openConflictDetails(conflicts[0])}
          className="h-7"
        >
          {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
        </Button>
      </div>
    );
  }

  // Full view - card with details
  return (
    <>
      <Card className={`shadow-sm border border-danger-200 bg-danger-50 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-danger-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-danger-700 mb-1">
                {conflicts.length} Scheduling Conflict{conflicts.length > 1 ? 's' : ''} Detected
              </h4>
              
              {/* Show first conflict summary */}
              <p className="text-xs text-danger-600 mb-3">
                {conflicts[0].message}
              </p>

              {/* Show additional conflicts count */}
              {conflicts.length > 1 && (
                <p className="text-xs text-danger-600 font-medium mb-3">
                  +{conflicts.length - 1} more conflict{conflicts.length - 1 > 1 ? 's' : ''}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  color="danger"
                  variant="solid"
                  startContent={<Info size={14} />}
                  onPress={() => openConflictDetails(conflicts[0])}
                >
                  View Details
                </Button>
                
                {conflicts.length > 1 && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="bordered"
                    onPress={() => {
                      // Show all conflicts in modal
                      setSelectedConflict({ 
                        ...conflicts[0], 
                        allConflicts: conflicts 
                      });
                      onOpen();
                    }}
                  >
                    View All ({conflicts.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Conflict Details Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 border-b border-default-200">
            <AlertTriangle size={20} className="text-danger-500" />
            <span>Conflict Details & Resolution</span>
          </ModalHeader>
          
          <ModalBody className="py-4">
            {selectedConflict && (
              <>
                {/* Display conflict details */}
                {displayConflictDetails(selectedConflict)}

                {/* Show all conflicts if multiple */}
                {selectedConflict.allConflicts && selectedConflict.allConflicts.length > 1 && (
                  <div className="mt-4 space-y-3">
                    <h5 className="text-sm font-semibold text-default-700">All Conflicts:</h5>
                    {selectedConflict.allConflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-default-50 border border-default-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-default-700 mb-1">
                          Conflict {idx + 1}: {conflict.day} Period {conflict.periodIndex + 1}
                        </p>
                        <p className="text-xs text-default-600">{conflict.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resolution Options */}
                <div className="mt-6 space-y-3">
                  <h5 className="text-sm font-semibold text-default-700">Resolution Options:</h5>
                  <div className="space-y-2">
                    {suggestResolutions(selectedConflict).map((resolution) => {
                      const Icon = resolution.icon;
                      return (
                        <Card
                          key={resolution.id}
                          isPressable
                          shadow="none"
                          className="border border-default-200 hover:border-primary hover:bg-primary-50/50 transition-all"
                          onPress={() => handleResolutionSelect(selectedConflict, resolution)}
                        >
                          <CardBody className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-${resolution.color}-100 flex items-center justify-center flex-shrink-0`}>
                                <Icon size={16} className={`text-${resolution.color}-600`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-default-900 mb-0.5">
                                  {resolution.label}
                                </p>
                                <p className="text-xs text-default-600">
                                  {resolution.description}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </ModalBody>
          
          <ModalFooter className="border-t border-default-200">
            <Button 
              variant="light" 
              onPress={onClose}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
