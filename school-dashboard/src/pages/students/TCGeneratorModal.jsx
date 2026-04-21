import { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea, DatePicker } from "@heroui/react";
import { Check, ArrowRight, ArrowLeft, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { TransferCertificateTemplate } from "./TransferCertificateTemplate";
import { useReactToPrint } from "react-to-print";
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
    const [baseNumber, setBaseNumber] = useState(null); // fetched from backend
    const [formLoading, setFormLoading] = useState(true);
    const printRef = useRef();
    const generatingRef = useRef(false);

    const currentStudent = students[currentIndex];
    const isLastStudent = currentIndex === students.length - 1;
    const canGoBack = currentIndex > 0;

    // Reset when students change or modal opens; fetch next TC number
    useEffect(() => {
        if (isOpen && students.length > 0) {
            setCurrentIndex(0);
            setAllFormData({});
            setHasMovedNext(false);
            setIsGenerating(false);
            setGenerationProgress(0);
            setFormLoading(true);
            // Fetch next TC number from backend, then init forms
            request('/students/tc/next-number')
                .then(res => {
                    const fetchedNumber = res?.tcNumber || '';
                    setBaseNumber(fetchedNumber);
                    initializeForm(students[0], 0, fetchedNumber);
                })
                .catch(() => {
                    // Fallback: use a local counter
                    const fallback = `TC-${new Date().getFullYear()}-0001`;
                    setBaseNumber(fallback);
                    initializeForm(students[0], 0, fallback);
                })
                .finally(() => setFormLoading(false));
        }
    }, [isOpen, students]);

    const buildTcNumber = (base, index) => {
        if (!base) return '';
        // Increment the numeric part of the TC number for each student
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

    const getCurrentFormData = () => {
        return allFormData[currentStudent?.admissionId] || {};
    };

    const handleInputChange = (field, value) => {
        setAllFormData(prev => ({
            ...prev,
            [currentStudent.admissionId]: {
                ...prev[currentStudent.admissionId],
                [field]: value
            }
        }));
    };

    const handleNext = () => {
        const currentFormData = allFormData[currentStudent?.admissionId] || {};
        if (!currentFormData.studentName?.trim()) {
            toast.error(t('toast.error.studentNameIsRequiredBeforeProceeding'));
            return;
        }

        if (isLastStudent) {
            startGeneration();
        } else {
            setHasMovedNext(true);
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            if (!allFormData[students[nextIndex]?.admissionId]) {
                initializeForm(students[nextIndex], nextIndex, baseNumber);
            }
        }
    };

    const handlePrevious = () => {
        if (canGoBack) {
            setCurrentIndex(prev => prev - 1);
        }
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

            if (!content) {
                resolve();
                return;
            }

            // Clone and serialize the template with current data
            const clonedContent = content.cloneNode(true);

            const html = `<html>
              <head>
                <title>Transfer Certificate - ${escapeHtmlTitle(formData.studentName)}</title>
                <style>
                    /* Preflight reset */
                    *, *::before, *::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
                    body { margin: 0; padding: 0; }

                    /* Display */
                    .hidden { display: none; }
                    .flex { display: flex; }
                    .grid { display: grid; }

                    /* Flex */
                    .flex-col { flex-direction: column; }
                    .flex-grow { flex-grow: 1; }
                    .flex-shrink-0 { flex-shrink: 0; }
                    .justify-between { justify-content: space-between; }
                    .justify-center { justify-content: center; }
                    .items-center { align-items: center; }
                    .items-end { align-items: end; }

                    /* Grid */
                    .grid-cols-\\[24px_1fr_10px_1fr\\] { grid-template-columns: 24px 1fr 10px 1fr; }
                    .gap-1\\.5 { gap: 0.375rem; }

                    /* Sizing */
                    .h-full { height: 100%; }
                    .w-full { width: 100%; }
                    .w-12 { width: 3rem; }
                    .h-12 { height: 3rem; }
                    .w-56 { width: 14rem; }
                    .w-\\[210mm\\] { width: 210mm; }
                    .h-\\[297mm\\] { height: 297mm; }

                    /* Spacing */
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

                    /* Typography */
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

                    /* Colors */
                    .bg-white { background-color: #fff; }
                    .bg-gray-200 { background-color: #e5e7eb; }
                    .text-black { color: #000; }

                    /* Borders */
                    .rounded-full { border-radius: 9999px; }
                    .border-2 { border-width: 2px; }
                    .border-b-2 { border-bottom-width: 2px; }
                    .border-b { border-bottom-width: 1px; }
                    .border-t { border-top-width: 1px; }
                    .border-black { border-color: #000; }
                    .border-dotted { border-style: dotted; }

                    /* Other */
                    .opacity-0 { opacity: 0; }

                    /* Print */
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
                <\/script>
              </body>
            </html>`;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '', 'width=800,height=600');
            const revoke = () => URL.revokeObjectURL(url);
            if (printWindow) {
                printWindow.addEventListener('afterprint', revoke);
                // Fallback: revoke blob URL even if afterprint never fires (e.g. window closed)
                const tid = setInterval(() => { if (printWindow.closed) { clearInterval(tid); revoke(); } }, 1000);
            } else {
                revoke();
            }

            // Resolve after print dialog opens
            setTimeout(resolve, 1500);
        });
    };

    const generateAllTCs = async () => {
        if (generatingRef.current) return;
        generatingRef.current = true;
        const errors = [];
        let savedCount = 0;

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const formData = allFormData[student.admissionId];

            setGenerationProgress(i + 1);
            setCurrentIndex(i);

            if (formData) {
                // Save TC record to backend (non-blocking)
                try {
                    await request(`/students/${student._id}/transfer-certificate`, {
                        method: 'POST',
                        body: JSON.stringify({
                            tcNumber: formData.tcNumber || buildTcNumber(baseNumber, i),
                            issueDate: formData.issueDate || toTodayDateString(),
                            reasonForLeaving: formData.reasonForLeaving || '',
                            lastClassAttended: formData.standardLeaving || '',
                            daysPresent: parseInt(formData.presentDays, 10) || undefined,
                            workingDays: parseInt(formData.workingDays, 10) || undefined,
                            generalConduct: formData.generalConduct || 'Good',
                            remarks: formData.remarks || '',
                        }),
                    });
                    savedCount++;
                } catch (err) {
                    logger.warn(`[TC] Failed to record TC for ${student.name}:`, err?.message);
                    errors.push(student.name);
                }

                // Print TC
                try {
                    await handlePrint({ ...formData, serialNo: formData.tcNumber || '', emisNo: student.emisNo || '' });
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
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    if (!currentStudent) return null;

    const formData = getCurrentFormData();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside" isDismissable={!isGenerating}>
            <ModalContent>
                {/* Header with prominent student name and count */}
                <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center justify-between">
                        <div>
                            {isGenerating ? (
                                <div className="text-sm">
                                    <span className="font-bold text-primary">{t('pages.generating')}</span>
                                    <span className="text-default-500 ml-2">{generationProgress}/{students.length}</span>
                                </div>
                            ) : (
                                <div className="text-2xl font-bold text-primary">
                                    {currentIndex + 1} <span className="text-default-400 text-lg">of {students.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Student Name */}
                    <div className="mt-2">
                        <h2 className="text-xl font-bold">
                            {isGenerating ? 'Generating Transfer Certificate' : 'Enter Details'}
                        </h2>
                        <p className="text-lg text-primary font-semibold">
                            {currentStudent.name}
                            <span className="text-sm text-default-500 font-normal ml-2">
                                (Class {currentStudent.class})
                            </span>
                        </p>
                    </div>
                </ModalHeader>

                <ModalBody>
                    {formLoading ? (
                        <DetailPageSkeleton fields={8} />
                    ) : !isGenerating ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* TC Number */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-2">Certificate Details</div>
                            <Input
                                label="TC Number *"
                                value={formData.tcNumber || ""}
                                onValueChange={(v) => handleInputChange("tcNumber", v)}
                                placeholder={t('students.form.tcNumberPlaceholder')}
                                description="Auto-generated from backend"
                            />
                            {/* Personal Details */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-2">{t('pages.personalDetails')}</div>
                            <Input
                                label={t('pages.name1')}
                                value={formData.studentName || ""}
                                onValueChange={(v) => handleInputChange("studentName", v)}
                            />
                            <Input
                                label={t('pages.motherSName')}
                                value={formData.motherName || ""}
                                onValueChange={(v) => handleInputChange("motherName", v)}
                            />
                            <Input
                                label={t('pages.fatherSName1')}
                                value={formData.fatherName || ""}
                                onValueChange={(v) => handleInputChange("fatherName", v)}
                            />
                            <Input
                                label={t('pages.nationality1')}
                                value={formData.nationality || ""}
                                onValueChange={(v) => handleInputChange("nationality", v)}
                            />
                            <Input
                                label={t('pages.religion1')}
                                value={formData.religion || ""}
                                onValueChange={(v) => handleInputChange("religion", v)}
                            />
                            <Input
                                label={t('pages.community')}
                                value={formData.community || ""}
                                onValueChange={(v) => handleInputChange("community", v)}
                            />
                            <Input
                                label={t('pages.motherTongue1')}
                                value={formData.motherTongue || ""}
                                onValueChange={(v) => handleInputChange("motherTongue", v)}
                            />
                            <Input
                                label="SC/ST?"
                                value={formData.isScSt || ""}
                                onValueChange={(v) => handleInputChange("isScSt", v)}
                            />
                            <Input
                                label={t('pages.dateOfBirth2')}
                                type="date"
                                value={formData.dob || ""}
                                onValueChange={(v) => handleInputChange("dob", v)}
                            />

                            {/* Admission & School Details */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-4">{t('pages.academicDetails')}</div>
                            <Input
                                label={t('pages.dateOfAdmission')}
                                value={formData.dateOfAdmission || ""}
                                onValueChange={(v) => handleInputChange("dateOfAdmission", v)}
                            />
                            <Input
                                label={t('pages.admissionClass')}
                                value={formData.admissionClass || ""}
                                onValueChange={(v) => handleInputChange("admissionClass", v)}
                                placeholder={t('students.form.admissionClassPlaceholder')}
                            />
                            <Input
                                label={t('pages.classLeaving')}
                                value={formData.standardLeaving || ""}
                                onValueChange={(v) => handleInputChange("standardLeaving", v)}
                            />
                            <Input
                                label={t('pages.examResult')}
                                value={formData.examResult || ""}
                                onValueChange={(v) => handleInputChange("examResult", v)}
                            />
                            <Input
                                label={t('pages.failed1')}
                                value={formData.whetherFailed || ""}
                                onValueChange={(v) => handleInputChange("whetherFailed", v)}
                            />
                            <Textarea
                                label={t('pages.subjectsStudied')}
                                value={formData.subjects || ""}
                                onValueChange={(v) => handleInputChange("subjects", v)}
                                className="col-span-full md:col-span-2"
                            />
                            <Input
                                label={t('pages.qualifiedForPromotion')}
                                value={formData.qualifiedForPromotion || ""}
                                onValueChange={(v) => handleInputChange("qualifiedForPromotion", v)}
                            />

                            {/* Other Details */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-4">{t('pages.otherDetails')}</div>
                            <Input
                                label={t('pages.feesPaid')}
                                value={formData.paidFees || ""}
                                onValueChange={(v) => handleInputChange("paidFees", v)}
                            />
                            <Input
                                label={t('pages.scholarship')}
                                value={formData.scholarship || ""}
                                onValueChange={(v) => handleInputChange("scholarship", v)}
                            />
                            <Input
                                label={t('pages.workingDays')}
                                value={formData.workingDays || ""}
                                onValueChange={(v) => handleInputChange("workingDays", v)}
                            />
                            <Input
                                label={t('pages.presentDays')}
                                value={formData.presentDays || ""}
                                onValueChange={(v) => handleInputChange("presentDays", v)}
                            />
                            <Input
                                label={t('pages.generalConduct')}
                                value={formData.generalConduct || ""}
                                onValueChange={(v) => handleInputChange("generalConduct", v)}
                            />
                            <Input
                                label={t('pages.reasonForLeaving')}
                                value={formData.reasonForLeaving || ""}
                                onValueChange={(v) => handleInputChange("reasonForLeaving", v)}
                            />
                            <Input
                                label={t('pages.applicationDate')}
                                type="date"
                                value={formData.applicationDate || ""}
                                onValueChange={(v) => handleInputChange("applicationDate", v)}
                            />
                            <Input
                                label={t('pages.issueDate')}
                                type="date"
                                value={formData.issueDate || ""}
                                onValueChange={(v) => handleInputChange("issueDate", v)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-pulse mb-4">
                                <Printer size={64} className="text-primary" />
                            </div>
                            <p className="text-lg font-semibold mb-2">{t('pages.generatingTransferCertificates')}</p>
                            <p className="text-default-500">{t('pages.pleaseWaitWhileAllTcsAreBeingPrinted')}</p>
                            <div className="mt-4 w-64 bg-default-200 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(generationProgress / students.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Hidden Template for Printing */}
                    <div className="hidden">
                        <TransferCertificateTemplate
                            ref={printRef}
                            data={{ ...formData, serialNo: formData.tcNumber || '', emisNo: currentStudent?.emisNo || '' }}
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    {!isGenerating ? (
                        <div className="flex justify-between w-full items-center">
                            <div className="flex gap-2">
                                {hasMovedNext && (
                                    <Button
                                        variant="flat"
                                        onPress={handlePrevious}
                                        isDisabled={!canGoBack}
                                        startContent={<ArrowLeft size={16} />}
                                    >
                                        Previous Student
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleNext}
                                    endContent={isLastStudent ? <Printer size={16} /> : <ArrowRight size={16} />}
                                >
                                    {isLastStudent ? "Generate All TCs" : "Next Student"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <p className="text-default-400 text-sm">{t('pages.pleaseWait')}</p>
                        </div>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
