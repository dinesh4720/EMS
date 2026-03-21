import { useTranslation } from 'react-i18next';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button
} from "@heroui/react";
import { BarChart4, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function ProgressCardModal({ isOpen, onClose, student }) {
  const { t } = useTranslation();

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{t('students.profile.overview.studentProgressCard', 'Student Progress Card')}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <BarChart4 size={48} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{student.name}</h3>
              <p className="text-default-500">{t('students.profile.overview.classRollInfo', 'Class {{class}} • Roll {{roll}}', { class: student.class, roll: student.rollNo })}</p>
            </div>
            <p className="text-sm text-default-500 max-w-xs">
              {t('students.profile.overview.generateProgressCardDesc', 'Generate and download the detailed academic performance report card for the current academic year.')}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            color="primary"
            startContent={<Download size={18} />}
            onPress={() => {
              toast.success(t('students.profile.overview.progressCardDownloading', 'Progress card downloading...'));
              onClose();
            }}
          >
            {t('students.profile.overview.downloadReport', 'Download Report')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
