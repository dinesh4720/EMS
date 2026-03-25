import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

const GATE_PASS_REASONS = {
  'MEDICAL_EMERGENCY': 'Medical Emergency',
  'FAMILY_EMERGENCY': 'Family Emergency',
  'SPECIAL_EVENT': 'Special Event',
  'EARLY_DISMISSAL': 'Early Dismissal',
  'SUSPENSION_EXPULSION': 'Suspension/Expulsion',
  'OTHER': 'Other'
};

// School configuration - uses environment variables or provided props
const getSchoolConfig = (schoolName) => ({
  name: schoolName || import.meta.env.VITE_SCHOOL_NAME || 'EduMaster School',
  address: import.meta.env.VITE_SCHOOL_ADDRESS || 'School Address',
  contact: import.meta.env.VITE_SCHOOL_CONTACT || 'Phone: XXXX-XXXXXXX | Email: info@school.com'
});

export default function GatePassPrint({ gatePass, isOpen, onClose, schoolName }) {
  const { t } = useTranslation();
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => {
      // Optional: Close modal after print
      // onClose();
    }
  });

  // Early return if no gate pass data
  if (!gatePass) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.gatePassPreview')}</ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <p className="text-default-500">{t('pages.noGatePassDataAvailable')}</p>
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

  const schoolConfig = getSchoolConfig(schoolName);

  const getReasonLabel = (reason) => {
    return GATE_PASS_REASONS[reason] || reason || '-';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>{t('pages.gatePassPreview')}</ModalHeader>
        <ModalBody>
          {/* Printable Gate Pass */}
          <div ref={printRef} className="print-content p-6 border-2 border-dashed border-gray-300 bg-white">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{schoolConfig.name}</h1>
              <p className="text-sm text-gray-600">Gate Pass / Exit Slip</p>
            </div>

            {/* Gate Pass Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600 font-medium">{t('pages.gatePassId')}</span>
                <span className="font-bold">{gatePass._id?.slice(-8).toUpperCase() || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 text-sm">{t('pages.studentName3')}</span>
                  <p className="font-bold text-lg">{gatePass.studentName || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">{t('pages.class2')}</span>
                  <p className="font-bold text-lg">
                    {gatePass.class ? `${gatePass.class}${gatePass.section ? ` - ${gatePass.section}` : ''}` : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 text-sm">{t('pages.date3')}</span>
                  <p className="font-medium">{gatePass.leavingDate ? new Date(gatePass.leavingDate).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">{t('pages.time')}</span>
                  <p className="font-medium">{gatePass.leavingTime || '-'}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-600 text-sm">{t('pages.reason1')}</span>
                <p className="font-medium text-lg">{getReasonLabel(gatePass.reason)}</p>
                {gatePass.reason === 'OTHER' && gatePass.otherReason && (
                  <p className="text-sm text-gray-500">({gatePass.otherReason})</p>
                )}
              </div>

              {gatePass.expectedReturnDate && (
                <div className="grid grid-cols-2 gap-3 bg-yellow-50 p-2 rounded">
                  <div>
                    <span className="text-gray-600 text-sm">{t('pages.expectedReturn')}</span>
                    <p className="font-medium">
                      {gatePass.expectedReturnDate ? new Date(gatePass.expectedReturnDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">{t('pages.time')}</span>
                    <p className="font-medium">{gatePass.expectedReturnTime || '-'}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <span className="text-gray-600 text-sm font-medium">{t('pages.leavingWith')}</span>
                {gatePass.leavingWith === 'PARENTS' ? (
                  <p className="font-medium">Parents / Guardian</p>
                ) : (
                  <div>
                    <p className="font-medium">{gatePass.escortName || '-'}</p>
                    {gatePass.escortRelation && <p className="text-sm text-gray-500">({gatePass.escortRelation})</p>}
                  </div>
                )}
              </div>

              {/* Approval Section */}
              <div className="border-t pt-3 mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">{t('pages.approvedBy1')}</span>
                    <p className="font-medium">{gatePass.approvedByName || gatePass.approvedBy || '-'}</p>
                    <p className="text-xs text-gray-500">({gatePass.approvedBy?.replace(/_/g, ' ') || '-'})</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">{t('pages.status3')}</span>
                    <p className={`font-bold ${
                      gatePass.approvalStatus === 'APPROVED' ? 'text-green-600' :
                      gatePass.approvalStatus === 'PENDING' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {gatePass.approvalStatus?.replace(/_/g, ' ') || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-3 mt-3 text-xs text-gray-500">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="font-medium">{t('pages.issuedBy')}</p>
                    <p>{gatePass.requestedByName || 'Front Desk'}</p>
                  </div>
                  <div>
                    <p className="font-medium">{t('pages.issueDate1')}</p>
                    <p>{gatePass.createdAt ? new Date(gatePass.createdAt).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium">{t('pages.validUntil')}</p>
                    <p>{gatePass.leavingDate ? new Date(gatePass.leavingDate).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-2 gap-8 mt-4 pt-2">
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-600">{t('pages.securitySignature')}</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-600">Parent/Guardian Signature</p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-red-50 border border-red-200 p-2 rounded mt-3">
                <p className="text-xs font-bold text-red-700 text-center">
                  ⚠️ This gate pass is valid only for the date mentioned above.
                  Please return this slip to the security guard when leaving.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions for non-print view */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>{t('pages.note1')}</strong> Click "Download PDF" or "Print" to save the gate pass.
              You can also save it as PDF from the print dialog by selecting "Save as PDF" as the printer.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handlePrint}>
            Download PDF / Print
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
