import { useState, useRef, useCallback } from 'react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Textarea, Select, SelectItem,
} from '@heroui/react';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CONDUCT_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'];

/**
 * CertificateModal — generates Bonafide or Character certificates.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - student: object with { name, class, rollNo, admissionId, dob, parentName, ... }
 *  - type: 'bonafide' | 'character'
 *  - schoolInfo: optional { name, address, phone, email }
 */
export default function CertificateModal({ isOpen, onClose, student, type = 'bonafide', schoolInfo }) {
  const { t } = useTranslation();
  const [purpose, setPurpose] = useState('');
  const [conductRating, setConductRating] = useState('Good');
  const [remarks, setRemarks] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  const isBonafide = type === 'bonafide';
  const title = isBonafide ? 'Bonafide Certificate' : 'Character Certificate';

  const resetForm = useCallback(() => {
    setPurpose('');
    setConductRating('Good');
    setRemarks('');
    setShowPreview(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGenerate = () => {
    if (isBonafide && !purpose.trim()) {
      toast.error('Please enter the purpose for the certificate');
      return;
    }
    setShowPreview(true);
    toast.success(`${title} generated successfully`);
  };

  const handleDownload = () => {
    const content = previewRef.current;
    if (!content) return;

    const clonedContent = content.cloneNode(true);

    const html = `<html>
      <head>
        <title>${title} - ${student?.name || 'Student'}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; }
          .certificate { max-width: 800px; margin: 0 auto; padding: 40px; border: 3px double #333; }
          .certificate-header { text-align: center; margin-bottom: 30px; }
          .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .certificate-title { font-size: 20px; font-weight: bold; text-decoration: underline; margin: 20px 0; text-align: center; }
          .certificate-body { font-size: 16px; line-height: 2; margin: 20px 0; }
          .certificate-footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; }
          @media print { @page { size: A4; margin: 20mm; } body { padding: 0; } }
        </style>
      </head>
      <body>
        ${clonedContent.outerHTML}
        <script>setTimeout(() => { window.print(); window.close(); }, 500);<\/script>
      </body>
    </html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '', 'width=800,height=600');
    if (printWindow) {
      printWindow.addEventListener('afterprint', () => URL.revokeObjectURL(url));
    } else {
      URL.revokeObjectURL(url);
    }
    toast.success('Print dialog opened');
  };

  if (!student) return null;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5">
          <FileText size={20} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-sm text-default-500">{student.name} — Class {student.class}</p>
          </div>
        </ModalHeader>

        <ModalBody>
          {!showPreview ? (
            <div className="space-y-4">
              {/* Student Info Summary */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">Name:</span>{' '}
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">Class:</span>{' '}
                    <span className="font-medium">{student.class}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">Admission No:</span>{' '}
                    <span className="font-medium">{student.admissionId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400">Roll No:</span>{' '}
                    <span className="font-medium">{student.rollNo || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              {isBonafide ? (
                <Input
                  label="Purpose"
                  placeholder="e.g., Bank account opening, Passport application"
                  value={purpose}
                  onValueChange={setPurpose}
                  variant="bordered"
                  isRequired
                  data-testid="certificate-purpose"
                />
              ) : (
                <>
                  <Select
                    label="Conduct Rating"
                    selectedKeys={[conductRating]}
                    onSelectionChange={(keys) => setConductRating([...keys][0] || 'Good')}
                    variant="bordered"
                    data-testid="conduct-rating"
                  >
                    {CONDUCT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </Select>
                  <Textarea
                    label="Remarks"
                    placeholder="Additional remarks about the student's character and conduct"
                    value={remarks}
                    onValueChange={setRemarks}
                    variant="bordered"
                    minRows={3}
                    data-testid="certificate-remarks"
                  />
                </>
              )}
            </div>
          ) : (
            /* Certificate Preview */
            <div>
              <div
                ref={previewRef}
                className="certificate bg-white text-black p-8 border-2 border-gray-300 rounded-lg"
                data-testid="certificate-preview"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold uppercase tracking-wide">
                    {schoolInfo?.name || 'School Name'}
                  </h2>
                  {schoolInfo?.address && (
                    <p className="text-sm text-gray-600 mt-1">{schoolInfo.address}</p>
                  )}
                </div>

                <h3 className="text-xl font-bold text-center underline underline-offset-4 mb-6">
                  {title}
                </h3>

                <div className="leading-8 text-base">
                  {isBonafide ? (
                    <p>
                      This is to certify that <strong>{student.name}</strong>,
                      {student.parentName && <> son/daughter of <strong>{student.parentName}</strong>,</>}
                      is a bonafide student of this institution studying in Class{' '}
                      <strong>{student.class}</strong> with Admission Number{' '}
                      <strong>{student.admissionId || 'N/A'}</strong> and Roll Number{' '}
                      <strong>{student.rollNo || 'N/A'}</strong>.
                    </p>
                  ) : (
                    <>
                      <p>
                        This is to certify that <strong>{student.name}</strong>,
                        {student.parentName && <> son/daughter of <strong>{student.parentName}</strong>,</>}
                        is a bonafide student of this institution studying in Class{' '}
                        <strong>{student.class}</strong>.
                      </p>
                      <p className="mt-4">
                        During the stay in this institution, the student&apos;s conduct and character
                        has been <strong>{conductRating}</strong>.
                      </p>
                    </>
                  )}

                  {isBonafide && purpose && (
                    <p className="mt-4">
                      This certificate is issued for the purpose of{' '}
                      <strong>{purpose}</strong>.
                    </p>
                  )}

                  {!isBonafide && remarks && (
                    <p className="mt-4">
                      Remarks: {remarks}
                    </p>
                  )}
                </div>

                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-600">Date: {today}</p>
                    <p className="text-sm text-gray-600">Place: ___________</p>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-t border-gray-400 pt-1">
                      <p className="text-sm font-medium">Principal / Headmaster</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose}>Cancel</Button>
          {!showPreview ? (
            <Button
              color="primary"
              onPress={handleGenerate}
              startContent={<Eye size={16} />}
            >
              Generate
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="flat"
                onPress={() => setShowPreview(false)}
              >
                Edit
              </Button>
              <Button
                color="primary"
                onPress={handleDownload}
                startContent={<Printer size={16} />}
                data-testid="download-certificate"
              >
                Download as PDF
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
