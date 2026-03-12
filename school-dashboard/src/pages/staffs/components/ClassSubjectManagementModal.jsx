import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CheckCircle2, Users, BookOpen } from "lucide-react";

const ClassSubjectManagementModal = ({ isOpen, onClose, staffId, staffName }) => {
  const [showStepModal, setShowStepModal] = useState(false);

  const handleManageClick = () => {
    setShowStepModal(true);
  };

  const handleStepModalClose = () => {
    setShowStepModal(false);
    onClose();
  };

  const handleManageClasses = () => {
    // TODO: Navigate to class management or open class assignment modal
    // You can add navigation logic here
    handleStepModalClose();
  };

  const handleManageSubjects = () => {
    // TODO: Navigate to subject management or open subject assignment modal
    // You can add navigation logic here
    handleStepModalClose();
  };

  return (
    <>
      {/* Initial Success Modal */}
      <Modal isOpen={isOpen && !showStepModal} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <CheckCircle2 size={24} className="text-success" />
            <div>
              <span className="text-lg font-semibold">Staff Created Successfully!</span>
              <p className="text-sm text-default-500 mt-1">
                Would you like to manage class details and subjects for this staff member?
              </p>
            </div>
          </ModalHeader>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              No, Maybe Later
            </Button>
            <Button color="primary" onPress={handleManageClick}>
              Yes, Manage Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Step Management Modal */}
      <Modal isOpen={showStepModal} onClose={handleStepModalClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-lg font-semibold">Manage Class & Subject Details</span>
            <p className="text-sm text-default-500 font-normal">
              Configure class assignments and subjects for {staffName}
            </p>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              {/* Step 1: Manage Classes */}
              <div
                className="p-4 border-2 border-default-200 rounded-lg hover:border-primary hover:bg-primary-50/30 transition-all cursor-pointer group"
                onClick={handleManageClasses}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <Users size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                        STEP 1
                      </span>
                      <h3 className="text-base font-semibold text-default-900">Manage Classes</h3>
                    </div>
                    <p className="text-sm text-default-600">
                      Assign this staff member to specific classes and sections
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Manage Subjects */}
              <div
                className="p-4 border-2 border-default-200 rounded-lg hover:border-primary hover:bg-primary-50/30 transition-all cursor-pointer group"
                onClick={handleManageSubjects}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <BookOpen size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                        STEP 2
                      </span>
                      <h3 className="text-base font-semibold text-default-900">Manage Subjects</h3>
                    </div>
                    <p className="text-sm text-default-600">
                      Configure which subjects this staff member will teach
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleStepModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ClassSubjectManagementModal;
