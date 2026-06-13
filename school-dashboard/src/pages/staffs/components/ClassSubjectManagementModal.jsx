import { CheckCircle2, ArrowRight } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalFooter, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

/**
 * ClassSubjectManagementModal — Shown after creating a new staff member.
 * Single, clear CTA: navigate to the staff profile's "Classes & Subjects" tab
 * where they can manage both class teacher assignment AND subject assignments
 * in one place, instead of a confusing multi-step redirect flow.
 */
const ClassSubjectManagementModal = ({ isOpen, onClose, staffId, staffName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleManageNow = () => {
    onClose();
    if (staffId) {
      navigate(`/staffs/${staffId}?tab=classes`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex gap-3 items-start pb-2">
          <div className="w-10 h-10 rounded-full bg-ok-bg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-ok" />
          </div>
          <div>
            <span className="text-lg font-semibold text-fg">
              {t('pages.staffCreatedSuccessfully')}
            </span>
            <p className="text-sm text-fg-muted mt-1 font-normal">
              <strong className="text-fg">{staffName}</strong> has been added. You can now assign them as a class teacher and configure which subjects they teach.
            </p>
          </div>
        </ModalHeader>
        <ModalFooter className="pt-2">
          <Button variant="light" onPress={onClose}>
            Maybe Later
          </Button>
          <Button
            color="primary"
            onPress={handleManageNow}
            endContent={<ArrowRight size={16} />}
          >
            Manage Classes & Subjects
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClassSubjectManagementModal;
