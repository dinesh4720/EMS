import { Modal, Button } from '../../components/ui';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatShortDate } from '../../utils/dateFormatter';

const GATE_PASS_REASONS = {
  'MEDICAL_EMERGENCY': 'Medical Emergency',
  'FAMILY_EMERGENCY': 'Family Emergency',
  'SPECIAL_EVENT': 'Special Event',
  'EARLY_DISMISSAL': 'Early Dismissal',
  'SUSPENSION_EXPULSION': 'Suspension/Expulsion',
  'OTHER': 'Other'
};

// Hardcoded UI strings — centralised here for future i18n migration
const STRINGS = {
  gatePassExitSlip: 'Gate Pass / Exit Slip',
  na: 'N/A',
  parentsGuardian: 'Parents / Guardian',
  parentGuardianSignature: 'Parent/Guardian Signature',
  importantNotice: 'This gate pass is valid only for the date mentioned above. Please return this slip to the security guard when leaving.',
  printInstructions: 'Click "Download PDF" or "Print" to save the gate pass. You can also save it as PDF from the print dialog by selecting "Save as PDF" as the printer.',
  close: 'Close',
  cancel: 'Cancel',
  downloadPdfPrint: 'Download PDF / Print',
  frontDesk: 'Front Desk',
};

// School configuration - prefers live school settings from API, then component prop fallback
const getSchoolConfig = (schoolSettings, schoolNameProp) => ({
  name: schoolSettings?.schoolName || schoolSettings?.name || schoolNameProp || 'School name not configured',
  address: schoolSettings?.address || schoolSettings?.schoolAddress || '',
  contact: schoolSettings?.phone || schoolSettings?.contactNumber || ''
});

export default function GatePassPrint({ gatePass, isOpen, onClose, schoolName }) {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      // Optional: Close modal after print
      // onClose();
    }
  });

  // Early return if no gate pass data
  if (!gatePass) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('pages.gatePassPreview')}
        size="md"
        footer={
          <Button variant="ghost" onClick={onClose}>
            {STRINGS.close}
          </Button>
        }
      >
        <div className="text-center py-8">
          <p className="text-fg-muted">{t('pages.noGatePassDataAvailable')}</p>
        </div>
      </Modal>
    );
  }

  const schoolConfig = getSchoolConfig(schoolSettings, schoolName);

  const getReasonLabel = (reason) => {
    return GATE_PASS_REASONS[reason] || reason || '-';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pages.gatePassPreview')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {STRINGS.cancel}
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            {STRINGS.downloadPdfPrint}
          </Button>
        </>
      }
    >
      {/* Printable Gate Pass */}
      <div ref={printRef} className="print-content gp-print">
        {/* Header */}
        <div className="gp-print__header">
          <h1 className="gp-print__title">{schoolConfig.name}</h1>
          <p className="gp-print__subtitle">{STRINGS.gatePassExitSlip}</p>
        </div>

        {/* Gate Pass Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="gp-print__label">{t('pages.gatePassId')}</span>
            <span className="gp-print__value">{gatePass._id?.slice(-8).toUpperCase() || STRINGS.na}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="gp-print__label text-sm">{t('pages.studentName3')}</span>
              <p className="gp-print__value-lg">{gatePass.studentName || '-'}</p>
            </div>
            <div>
              <span className="gp-print__label text-sm">{t('pages.class2')}</span>
              <p className="gp-print__value-lg">
                {gatePass.class ? `${gatePass.class}${gatePass.section ? ` - ${gatePass.section}` : ''}` : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="gp-print__label text-sm">{t('pages.date3')}</span>
              <p className="font-medium">{gatePass.leavingDate ? formatShortDate(gatePass.leavingDate) : '-'}</p>
            </div>
            <div>
              <span className="gp-print__label text-sm">{t('pages.time')}</span>
              <p className="font-medium">{gatePass.leavingTime || '-'}</p>
            </div>
          </div>

          <div>
            <span className="gp-print__label text-sm">{t('pages.reason1')}</span>
            <p className="gp-print__value-lg">{getReasonLabel(gatePass.reason)}</p>
            {gatePass.reason === 'OTHER' && gatePass.otherReason && (
              <p className="text-sm gp-print__secondary">({gatePass.otherReason})</p>
            )}
          </div>

          {gatePass.expectedReturnDate && (
            <div className="grid grid-cols-2 gap-3 gp-print__warn-box">
              <div>
                <span className="gp-print__label text-sm">{t('pages.expectedReturn')}</span>
                <p className="font-medium">
                  {gatePass.expectedReturnDate ? formatShortDate(gatePass.expectedReturnDate) : '-'}
                </p>
              </div>
              <div>
                <span className="gp-print__label text-sm">{t('pages.time')}</span>
                <p className="font-medium">{gatePass.expectedReturnTime || '-'}</p>
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <span className="gp-print__label text-sm">{t('pages.leavingWith')}</span>
            {gatePass.leavingWith === 'PARENTS' ? (
              <p className="font-medium">{STRINGS.parentsGuardian}</p>
            ) : (
              <div>
                <p className="font-medium">{gatePass.escortName || '-'}</p>
                {gatePass.escortRelation && <p className="text-sm gp-print__secondary">({gatePass.escortRelation})</p>}
              </div>
            )}
          </div>

          {/* Approval Section */}
          <div className="border-t pt-3 mt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="gp-print__label text-sm">{t('pages.approvedBy1')}</span>
                <p className="font-medium">{gatePass.approvedByName || gatePass.approvedBy || '-'}</p>
                <p className="text-xs gp-print__secondary">({gatePass.approvedBy?.replace(/_/g, ' ') || '-'})</p>
              </div>
              <div>
                <span className="gp-print__label text-sm">{t('pages.status3')}</span>
                <p className={`font-bold ${
                  gatePass.approvalStatus === 'APPROVED' ? 'gp-print__status-ok' :
                  gatePass.approvalStatus === 'PENDING' ? 'gp-print__status-warn' :
                  'gp-print__status-danger'
                }`}>
                  {gatePass.approvalStatus?.replace(/_/g, ' ') || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-3 mt-3 gp-print__footer-label">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="font-medium">{t('pages.issuedBy')}</p>
                <p>{gatePass.requestedByName || STRINGS.frontDesk}</p>
              </div>
              <div>
                <p className="font-medium">{t('pages.issueDate1')}</p>
                <p>{gatePass.createdAt ? formatShortDate(gatePass.createdAt) : '-'}</p>
              </div>
              <div>
                <p className="font-medium">{t('pages.validUntil')}</p>
                <p>{gatePass.leavingDate ? formatShortDate(gatePass.leavingDate) : '-'}</p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-8 mt-4 pt-2">
            <div className="text-center">
              <div className="gp-print__signature-line"></div>
              <p className="text-xs gp-print__footer-label">{t('pages.securitySignature')}</p>
            </div>
            <div className="text-center">
              <div className="gp-print__signature-line"></div>
              <p className="text-xs gp-print__footer-label">{STRINGS.parentGuardianSignature}</p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="gp-print__danger-box mt-3">
            <p className="gp-print__notice">
              {STRINGS.importantNotice}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions for non-print view */}
      <div className="mt-4 gp-print__info-box">
        <p className="text-sm text-[var(--info)]">
          <strong>{t('pages.note1')}</strong> {STRINGS.printInstructions}
        </p>
      </div>
    </Modal>
  );
}
