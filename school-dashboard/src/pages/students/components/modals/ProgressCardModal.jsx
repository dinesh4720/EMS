import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button
} from "@heroui/react";
import { BarChart4, Download, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function ProgressCardModal({ isOpen, onClose, student, onNavigateToAcademics }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!student) return null;

  const handleDownload = () => {
    setLoading(true);
    // If a navigate callback is provided, redirect to the academics tab which has the real print/PDF feature
    if (onNavigateToAcademics) {
      onClose();
      onNavigateToAcademics();
      toast.success('Opening academics tab — use the Download Report Card button there.', { duration: 4000 });
    } else {
      // Fallback: open a print window with basic student info
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Progress Card - ${student.name}</title>
          <style>body{font-family:sans-serif;padding:20px;max-width:800px;margin:0 auto}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}@media print{button{display:none}}</style>
          </head><body>
          <h1>Student Progress Card</h1>
          <p><strong>Name:</strong> ${student.name}</p>
          <p><strong>Class:</strong> ${student.class || 'N/A'} &nbsp; <strong>Roll No:</strong> ${student.rollNo || 'N/A'}</p>
          <p><strong>Admission No:</strong> ${student.admissionNo || 'N/A'}</p>
          <p style="margin-top:16px;color:#6b7280;font-size:14px">For detailed marks and grades, visit the Academics tab of the student profile.</p>
          <script>window.onload=function(){window.print()}</script>
          </body></html>
        `);
        printWindow.document.close();
        toast.success('Print window opened');
      } else {
        toast.error('Pop-up blocked. Please allow pop-ups and try again.');
      }
      onClose();
    }
    setLoading(false);
  };

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
            {onNavigateToAcademics && (
              <p className="text-xs text-default-400 max-w-xs">
                This will open the Academics tab where you can download the full report card with marks and grades.
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            color="primary"
            startContent={onNavigateToAcademics ? <ExternalLink size={18} /> : <Download size={18} />}
            onPress={handleDownload}
            isLoading={loading}
          >
            {onNavigateToAcademics ? 'Open Academics' : t('students.profile.overview.downloadReport', 'Download Report')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
