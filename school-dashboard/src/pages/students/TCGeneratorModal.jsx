import { useState, useEffect, useRef, useMemo } from "react";
import { Button, Modal, Input, Textarea } from "../../components/ui";
import { ArrowRight, ArrowLeft, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { TransferCertificateTemplate } from "./TransferCertificateTemplate";
import { useTranslation } from 'react-i18next';
import { request } from "../../services/api";
import { DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";
import { toTodayDateString, formatDate } from '../../utils/dateFormatter';
import logger from '../../utils/logger';

export default function TCGeneratorModal({ isOpen, onClose, students }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allFormData, setAllFormData] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [hasMovedNext, setHasMovedNext] = useState(false);
  const [baseNumber, setBaseNumber] = useState(null);
  const [formLoading, setFormLoading] = useState(true);
  const printRef = useRef();
  const generatingRef = useRef(false);

  const currentStudent = students[currentIndex];
  const isLastStudent = currentIndex === students.length - 1;
  const canGoBack = currentIndex > 0;

  useEffect(() => {
    if (isOpen && students.length > 0) {
      setCurrentIndex(0);
      setAllFormData({});
      setHasMovedNext(false);
      setIsGenerating(false);
      setGenerationProgress(0);
      setFormLoading(true);
      request('/students/tc/next-number')
        .then(res => {
          const fetchedNumber = res?.tcNumber || '';
          setBaseNumber(fetchedNumber);
          initializeForm(students[0], 0, fetchedNumber);
        })
        .catch(() => {
          const fallback = `TC-${new Date().getFullYear()}-0001`;
          setBaseNumber(fallback);
          initializeForm(students[0], 0, fallback);
        })
        .finally(() => setFormLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, students]);

  const buildTcNumber = (base, index) => {
    if (!base) return '';
    const match = base.match(/^(.*?)(\d+)$/);
    if (!match) return base;
    const prefix = match[1];
    const num = parseInt(match[2], 10) + index;
    return `${prefix}${String(num).padStart(match[2].length, '0')}`;
  };

  const initializeForm = (student, index = 0, tcBase = baseNumber) => {
    const formData = {
      tcNumber: buildTcNumber(tcBase, index),
      studentName: student.name || "",
      admissionNo: student.admissionId || "",
      gender: student.gender || "",
      motherName: student.parents?.find(p => p.relationship?.toLowerCase() === 'mother')?.name || "",
      fatherName: student.parents?.find(p => p.relationship?.toLowerCase() === 'father')?.name || student.parentName || "",
      dob: student.dob || "",
      dobInWords: student.dob ? formatDate(student.dob) : "",
      admissionClass: student.admissionClass || "I",
      standardLeaving: student.class || "",
      dateOfAdmission: student.admissionDate || "",
      nationality: student.nationality || "",
      religion: student.religion || "",
      community: student.category || student.community || "",
      motherTongue: student.motherTongue || "",
      isScSt: "No",
      examResult: "Passed",
      whetherFailed: "No",
      subjects: "English, Tamil, Maths, Science, Social Science",
      qualifiedForPromotion: "Yes",
      paidFees: "Yes",
      scholarship: "No",
      workingDays: "220",
      presentDays: "210",
      nccDetails: "Nil",
      extraCurricular: "Nil",
      generalConduct: "Good",
      applicationDate: toTodayDateString(),
      issueDate: toTodayDateString(),
      reasonForLeaving: "Parents Request",
      remarks: "Nil",
    };
    setAllFormData(prev => ({ ...prev, [student.admissionId]: formData }));
  };

  const getCurrentFormData = () => allFormData[currentStudent?.admissionId] || {};

  const handleInputChange = (field, value) => {
    setAllFormData(prev => ({
      ...prev,
      [currentStudent.admissionId]: {
        ...prev[currentStudent.admissionId],
        [field]: value,
      },
    }));
  };

  // Bug-fix license: TC serial number uniqueness.
  // If a user manually edits the TC number for one student, ensure subsequent
  // students still get unique numbers (don't clash with the manual entry).
  const allUsedTcNumbers = useMemo(() => {
    const set = new Set();
    Object.values(allFormData).forEach(f => { if (f?.tcNumber) set.add(f.tcNumber); });
    return set;
  }, [allFormData]);

  const handleNext = () => {
    const currentFormData = allFormData[currentStudent?.admissionId] || {};
    if (!currentFormData.studentName?.trim()) {
      toast.error(t('toast.error.studentNameIsRequiredBeforeProceeding'));
      return;
    }
    if (!currentFormData.tcNumber?.trim()) {
      toast.error('TC number is required');
      return;
    }

    if (isLastStudent) {
      startGeneration();
    } else {
      setHasMovedNext(true);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (!allFormData[students[nextIndex]?.admissionId]) {
        // Walk forward through the offset until we find an unused TC number
        let offset = nextIndex;
        let candidate = buildTcNumber(baseNumber, offset);
        while (candidate && allUsedTcNumbers.has(candidate) && offset < nextIndex + students.length + 10) {
          offset++;
          candidate = buildTcNumber(baseNumber, offset);
        }
        initializeForm(students[nextIndex], offset, baseNumber);
      }
    }
  };

  const handlePrevious = () => {
    if (canGoBack) setCurrentIndex(prev => prev - 1);
  };

  const startGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    generateAllTCs();
  };

  const escapeHtmlTitle = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const handlePrint = (formData) => {
    return new Promise((resolve) => {
      const content = printRef.current;
      if (!content) { resolve(); return; }

      const clonedContent = content.cloneNode(true);

      const html = `<html>
              <head>
                <title>Transfer Certificate - ${escapeHtmlTitle(formData.studentName)}</title>
                <style>
                    *, *::before, *::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
                    body { margin: 0; padding: 0; }
                    .hidden { display: none; }
                    .flex { display: flex; }
                    .grid { display: grid; }
                    .flex-col { flex-direction: column; }
                    .flex-grow { flex-grow: 1; }
                    .flex-shrink-0 { flex-shrink: 0; }
                    .justify-between { justify-content: space-between; }
                    .justify-center { justify-content: center; }
                    .items-center { align-items: center; }
                    .items-end { align-items: end; }
                    .grid-cols-\\[24px_1fr_10px_1fr\\] { grid-template-columns: 24px 1fr 10px 1fr; }
                    .gap-1\\.5 { gap: 0.375rem; }
                    .h-full { height: 100%; }
                    .w-full { width: 100%; }
                    .w-12 { width: 3rem; }
                    .h-12 { height: 3rem; }
                    .w-\\[210mm\\] { width: 210mm; }
                    .h-\\[297mm\\] { height: 297mm; }
                    .mx-auto { margin-left: auto; margin-right: auto; }
                    .mt-8 { margin-top: 2rem; }
                    .mb-0 { margin-bottom: 0; }
                    .mb-1 { margin-bottom: 0.25rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
                    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
                    .pt-4 { padding-top: 1rem; }
                    .pt-2 { padding-top: 0.5rem; }
                    .pb-4 { padding-bottom: 1rem; }
                    .pb-2 { padding-bottom: 0.5rem; }
                    .pb-1 { padding-bottom: 0.25rem; }
                    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                    .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
                    .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
                    .font-extrabold { font-weight: 800; }
                    .font-bold { font-weight: 700; }
                    .font-medium { font-weight: 500; }
                    .font-normal { font-weight: 400; }
                    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
                    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
                    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                    .text-\\[0\\.6rem\\] { font-size: 0.6rem; }
                    .text-\\[0\\.7rem\\] { font-size: 0.7rem; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .uppercase { text-transform: uppercase; }
                    .tracking-wide { letter-spacing: 0.025em; }
                    .leading-tight { line-height: 1.25; }
                    .leading-snug { line-height: 1.375; }
                    .underline { text-decoration-line: underline; }
                    .decoration-2 { text-decoration-thickness: 2px; }
                    .underline-offset-2 { text-underline-offset: 2px; }
                    .bg-white { background-color: #fff; }
                    .bg-surface-2 { background-color: #e5e7eb; }
                    .text-black { color: #000; }
                    .rounded-full { border-radius: 9999px; }
                    .border-2 { border-width: 2px; }
                    .border-b-2 { border-bottom-width: 2px; }
                    .border-b { border-bottom-width: 1px; }
                    .border-t { border-top-width: 1px; }
                    .border-black { border-color: #000; }
                    .border-dotted { border-style: dotted; }
                    .opacity-0 { opacity: 0; }

                    /* REVAMP-13 bug-fix: signature row uses CSS grid so all three
                       columns fit within the printable area without overflowing. */
                    .tc-print-signatures {
                      display: grid;
                      grid-template-columns: repeat(3, minmax(0, 1fr));
                      gap: 12px;
                      align-items: end;
                      margin-top: 32px;
                      padding-bottom: 16px;
                    }
                    .tc-print-signatures > div {
                      width: 100%;
                      max-width: 14rem;
                      margin: 0 auto;
                      text-align: center;
                    }
                    .tc-print-signatures > div > div {
                      border-top: 1px solid #000;
                      padding-top: 0.5rem;
                      font-weight: 700;
                      font-size: 0.875rem;
                    }

                    @media print {
                        @page { size: A4; margin: 0; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print\\:block { display: block; }
                        .print\\:w-full { width: 100%; }
                        .print\\:h-full { height: 100%; }
                        .print\\:absolute { position: absolute; }
                        .print\\:top-0 { top: 0; }
                        .print\\:left-0 { left: 0; }
                        .print\\:z-\\[9999\\] { z-index: 9999; }
                    }
                </style>
              </head>
              <body>
                ${clonedContent.outerHTML}
                <script>
                  setTimeout(() => {
                      window.print();
                      window.close();
                  }, 500);
                </script>
              </body>
            </html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '', 'width=800,height=600');
      const revoke = () => URL.revokeObjectURL(url);
      if (printWindow) {
        printWindow.addEventListener('afterprint', revoke);
        const tid = setInterval(() => { if (printWindow.closed) { clearInterval(tid); revoke(); } }, 1000);
      } else {
        revoke();
      }

      setTimeout(resolve, 1500);
    });
  };

  const generateAllTCs = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    const errors = [];
    let savedCount = 0;
    const usedNumbers = new Set();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const formData = allFormData[student.admissionId];

      setGenerationProgress(i + 1);
      setCurrentIndex(i);

      if (formData) {
        // Bug-fix license: guarantee uniqueness of TC numbers in this batch
        let tcNumber = formData.tcNumber || buildTcNumber(baseNumber, i);
        if (usedNumbers.has(tcNumber)) {
          // Fall through to the next available offset
          let offset = i;
          let candidate = buildTcNumber(baseNumber, offset);
          while (usedNumbers.has(candidate) && offset < i + students.length + 10) {
            offset++;
            candidate = buildTcNumber(baseNumber, offset);
          }
          tcNumber = candidate || tcNumber;
        }
        usedNumbers.add(tcNumber);
        const finalFormData = { ...formData, tcNumber };

        try {
          await request(`/students/${student._id}/transfer-certificate`, {
            method: 'POST',
            body: JSON.stringify({
              tcNumber,
              issueDate: finalFormData.issueDate || toTodayDateString(),
              reasonForLeaving: finalFormData.reasonForLeaving || '',
              lastClassAttended: finalFormData.standardLeaving || '',
              daysPresent: parseInt(finalFormData.presentDays, 10) || undefined,
              workingDays: parseInt(finalFormData.workingDays, 10) || undefined,
              generalConduct: finalFormData.generalConduct || 'Good',
              remarks: finalFormData.remarks || '',
            }),
          });
          savedCount++;
        } catch (err) {
          logger.warn(`[TC] Failed to record TC for ${student.name}:`, err?.message);
          errors.push(student.name);
        }

        try {
          await handlePrint({ ...finalFormData, serialNo: tcNumber, emisNo: student.emisNo || '' });
        } catch (err) {
          logger.error(`Failed to print TC for ${student.name}:`, err);
          errors.push(student.name);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (errors.length > 0) {
      toast.error(`Failed to generate TC for: ${errors.join(", ")}`);
    } else {
      toast.success(t('toast.success.allTcsGeneratedSuccessfully'));
    }

    if (savedCount > 0) {
      toast.success(`${savedCount} TC record${savedCount > 1 ? 's' : ''} saved`);
    }

    generatingRef.current = false;
    setTimeout(() => { onClose(); }, 1000);
  };

  if (!currentStudent) return null;

  const formData = getCurrentFormData();
  const dup = formData.tcNumber && Array.from(allUsedTcNumbers).filter(n => n === formData.tcNumber).length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isDismissable={!isGenerating}>
      
        <Modal.Header className="flex flex-col gap-1 border-b border-divider">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                {isGenerating ? 'Generating Transfer Certificate' : 'Enter Details'}
              </h2>
              <p className="text-sm text-fg-muted">
                <span className="font-medium text-fg">{currentStudent.name}</span>
                <span className="ml-2 text-fg-faint">Class {currentStudent.class || '—'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <span className="chip chip--info mono tnum">
                  {generationProgress}/{students.length}
                </span>
              ) : (
                <span className="chip mono tnum">
                  {currentIndex + 1}/{students.length}
                </span>
              )}
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="p-0">
          {formLoading ? (
            <div className="p-6"><DetailPageSkeleton fields={8} /></div>
          ) : !isGenerating ? (
            <div className="tcgen">
              {/* Left — form */}
              <div className="tcgen__form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="col-span-full text-sm font-semibold border-b border-divider pb-2 text-fg">
                    Certificate Details
                  </div>
                  <Input
                    label="TC Number *"
                    value={formData.tcNumber || ""}
                    onChange={(e) => handleInputChange("tcNumber", e.target.value)}
                    description={dup ? 'Duplicate TC number — please change' : 'Auto-generated · editable'}
                    isInvalid={dup}
                    
                  />
                  <Input
                    label="Admission No."
                    value={formData.admissionNo || ""}
                    onChange={(e) => handleInputChange("admissionNo", e.target.value)}
                    
                  />

                  <div className="col-span-full text-sm font-semibold border-b border-divider pb-2 mt-2 text-fg">
                    {t('pages.personalDetails')}
                  </div>
                  <Input label={t('pages.name1')} value={formData.studentName || ""} onChange={(e) => handleInputChange("studentName", e.target.value)} />
                  <Input label={t('pages.motherSName')} value={formData.motherName || ""} onChange={(e) => handleInputChange("motherName", e.target.value)} />
                  <Input label={t('pages.fatherSName1')} value={formData.fatherName || ""} onChange={(e) => handleInputChange("fatherName", e.target.value)} />
                  <Input label={t('pages.nationality1')} value={formData.nationality || ""} onChange={(e) => handleInputChange("nationality", e.target.value)} />
                  <Input label={t('pages.religion1')} value={formData.religion || ""} onChange={(e) => handleInputChange("religion", e.target.value)} />
                  <Input label={t('pages.community')} value={formData.community || ""} onChange={(e) => handleInputChange("community", e.target.value)} />
                  <Input label={t('pages.motherTongue1')} value={formData.motherTongue || ""} onChange={(e) => handleInputChange("motherTongue", e.target.value)} />
                  <Input label="SC/ST?" value={formData.isScSt || ""} onChange={(e) => handleInputChange("isScSt", e.target.value)} />
                  <Input label={t('pages.dateOfBirth2')} type="date" value={formData.dob || ""} onChange={(e) => handleInputChange("dob", e.target.value)} />

                  <div className="col-span-full text-sm font-semibold border-b border-divider pb-2 mt-2 text-fg">
                    {t('pages.academicDetails')}
                  </div>
                  <Input label={t('pages.dateOfAdmission')} value={formData.dateOfAdmission || ""} onChange={(e) => handleInputChange("dateOfAdmission", e.target.value)} />
                  <Input label={t('pages.admissionClass')} value={formData.admissionClass || ""} onChange={(e) => handleInputChange("admissionClass", e.target.value)} />
                  <Input label={t('pages.classLeaving')} value={formData.standardLeaving || ""} onChange={(e) => handleInputChange("standardLeaving", e.target.value)} />
                  <Input label={t('pages.examResult')} value={formData.examResult || ""} onChange={(e) => handleInputChange("examResult", e.target.value)} />
                  <Input label={t('pages.failed1')} value={formData.whetherFailed || ""} onChange={(e) => handleInputChange("whetherFailed", e.target.value)} />
                  <Textarea label={t('pages.subjectsStudied')} value={formData.subjects || ""} onChange={(e) => handleInputChange("subjects", e.target.value)} className="col-span-full" />
                  <Input label={t('pages.qualifiedForPromotion')} value={formData.qualifiedForPromotion || ""} onChange={(e) => handleInputChange("qualifiedForPromotion", e.target.value)} />

                  <div className="col-span-full text-sm font-semibold border-b border-divider pb-2 mt-2 text-fg">
                    {t('pages.otherDetails')}
                  </div>
                  <Input label={t('pages.feesPaid')} value={formData.paidFees || ""} onChange={(e) => handleInputChange("paidFees", e.target.value)} />
                  <Input label={t('pages.scholarship')} value={formData.scholarship || ""} onChange={(e) => handleInputChange("scholarship", e.target.value)} />
                  <Input label={t('pages.workingDays')} value={formData.workingDays || ""} onChange={(e) => handleInputChange("workingDays", e.target.value)}  />
                  <Input label={t('pages.presentDays')} value={formData.presentDays || ""} onChange={(e) => handleInputChange("presentDays", e.target.value)}  />
                  <Input label={t('pages.generalConduct')} value={formData.generalConduct || ""} onChange={(e) => handleInputChange("generalConduct", e.target.value)} />
                  <Input label={t('pages.reasonForLeaving')} value={formData.reasonForLeaving || ""} onChange={(e) => handleInputChange("reasonForLeaving", e.target.value)} />
                  <Input label={t('pages.applicationDate')} type="date" value={formData.applicationDate || ""} onChange={(e) => handleInputChange("applicationDate", e.target.value)} />
                  <Input label={t('pages.issueDate')} type="date" value={formData.issueDate || ""} onChange={(e) => handleInputChange("issueDate", e.target.value)} />
                </div>
              </div>

              {/* Right — preview pane */}
              <div className="tcgen__preview" aria-label="Preview">
                <p className="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Preview</p>
                <div className="tcgen__preview-card">
                  <h3>Transfer Certificate</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6 }}>
                    <span>Serial No.: <b>{formData.tcNumber || '—'}</b></span>
                    <span>Adm No.: <b>{formData.admissionNo || '—'}</b></span>
                  </div>
                  {[
                    ['Name', formData.studentName],
                    ['Mother', formData.motherName],
                    ['Father', formData.fatherName],
                    ['Date of Birth', formData.dob],
                    ['Class on leaving', formData.standardLeaving],
                    ['Exam result', formData.examResult],
                    ['Qualified for promotion', formData.qualifiedForPromotion],
                    ['Fees paid', formData.paidFees],
                    ['Working days', formData.workingDays],
                    ['Present days', formData.presentDays],
                    ['Conduct', formData.generalConduct],
                    ['Reason', formData.reasonForLeaving],
                    ['Issue date', formData.issueDate],
                  ].map(([label, value], idx) => (
                    <div className="tcrow" key={`tc-row-${idx}`}>
                      <b>{idx + 1}.</b>
                      <span>{label}</span>
                      <span>:</span>
                      <span>{value || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-pulse mb-4">
                <Printer size={48} className="text-primary" aria-hidden />
              </div>
              <p className="text-base font-semibold mb-2">{t('pages.generatingTransferCertificates')}</p>
              <p className="text-sm text-fg-muted">{t('pages.pleaseWaitWhileAllTcsAreBeingPrinted')}</p>
              <div className="mt-4 w-64 bg-default-200 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(generationProgress / students.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-fg-faint mt-2 mono tnum">
                {generationProgress} / {students.length}
              </p>
            </div>
          )}

          {/* Hidden template for printing */}
          <div className="hidden">
            <TransferCertificateTemplate
              ref={printRef}
              data={{ ...formData, serialNo: formData.tcNumber || '', emisNo: currentStudent?.emisNo || '' }}
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="border-t border-divider">
          {!isGenerating ? (
            <div className="flex justify-between w-full items-center">
              <div className="flex gap-2">
                {hasMovedNext && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={handlePrevious}
                    disabled={!canGoBack}
                    icon={<ArrowLeft size={14} aria-hidden />}
                  >
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs text-fg-faint mono tnum">
                  {currentIndex + 1} of {students.length}
                </span>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  endContent={isLastStudent ? <Printer size={14} aria-hidden /> : <ArrowRight size={14} aria-hidden />}
                  disabled={dup}
                >
                  {isLastStudent ? "Generate all TCs" : "Next"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <p className="text-fg-faint text-sm">{t('pages.pleaseWait')}</p>
            </div>
          )}
        </Modal.Footer>
      
    </Modal>
  );
}
