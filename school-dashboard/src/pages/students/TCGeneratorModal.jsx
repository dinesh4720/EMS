import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea, DatePicker } from "@heroui/react";
import { Check, ArrowRight, ArrowLeft, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { TransferCertificateTemplate } from "./TransferCertificateTemplate";
import { useReactToPrint } from "react-to-print";

export default function TCGeneratorModal({ isOpen, onClose, students }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [allFormData, setAllFormData] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [hasMovedNext, setHasMovedNext] = useState(false);
    const printRef = useRef();

    const currentStudent = students[currentIndex];
    const isLastStudent = currentIndex === students.length - 1;
    const canGoBack = currentIndex > 0;

    // Reset when students change or modal opens
    useEffect(() => {
        if (isOpen && students.length > 0) {
            setCurrentIndex(0);
            setAllFormData({});
            setHasMovedNext(false);
            setIsGenerating(false);
            setGenerationProgress(0);
            initializeForm(students[0]);
        }
    }, [isOpen, students]);

    const initializeForm = (student) => {
        const formData = {
            studentName: student.name || "",
            admissionNo: student.admissionId || "",
            gender: student.gender || "",
            motherName: student.motherName || "",
            fatherName: student.parentName || "",
            dob: student.dob || "",
            admissionClass: student.admissionClass || "I",
            standardLeaving: student.class || "",
            dateOfAdmission: student.admissionDate || "",
            nationality: "Indian",
            religion: "Hindu",
            community: "General",
            motherTongue: "Tamil",
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
            applicationDate: new Date().toISOString().split('T')[0],
            issueDate: new Date().toISOString().split('T')[0],
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
            toast.error("Student name is required before proceeding");
            return;
        }

        if (isLastStudent) {
            startGeneration();
        } else {
            setHasMovedNext(true);
            setCurrentIndex(prev => prev + 1);
            if (!allFormData[students[currentIndex + 1]?.admissionId]) {
                initializeForm(students[currentIndex + 1]);
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
    };

    const handlePrint = (formData) => {
        return new Promise((resolve) => {
            const printWindow = window.open('', '', 'width=800,height=600');
            const content = printRef.current;

            if (!content) {
                resolve();
                return;
            }

            // Clone and update the template with current data
            const clonedContent = content.cloneNode(true);

            printWindow.document.write(`
            <html>
              <head>
                <title>Transfer Certificate - ${formData.studentName}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
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
            </html>
          `);
            printWindow.document.close();

            // Resolve after print dialog opens
            setTimeout(resolve, 1500);
        });
    };

    // Effect to handle generation phase
    useEffect(() => {
        if (isGenerating) {
            generateAllTCs();
        }
    }, [isGenerating]);

    const generateAllTCs = async () => {
        const errors = [];

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const formData = allFormData[student.admissionId];

            setGenerationProgress(i + 1);
            setCurrentIndex(i);

            if (formData) {
                try {
                    await handlePrint({ ...formData, serialNo: i + 101, emisNo: "330201015" });
                } catch (err) {
                    console.error(`Failed to print TC for ${student.name}:`, err);
                    errors.push(student.name);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (errors.length > 0) {
            toast.error(`Failed to generate TC for: ${errors.join(", ")}`);
        } else {
            toast.success("All TCs generated successfully");
        }

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
                                    <span className="font-bold text-primary">Generating...</span>
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
                    {!isGenerating ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Personal Details */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-2">Personal Details</div>
                            <Input
                                label="Name"
                                value={formData.studentName || ""}
                                onValueChange={(v) => handleInputChange("studentName", v)}
                            />
                            <Input
                                label="Mother's Name"
                                value={formData.motherName || ""}
                                onValueChange={(v) => handleInputChange("motherName", v)}
                            />
                            <Input
                                label="Father's Name"
                                value={formData.fatherName || ""}
                                onValueChange={(v) => handleInputChange("fatherName", v)}
                            />
                            <Input
                                label="Nationality"
                                value={formData.nationality || ""}
                                onValueChange={(v) => handleInputChange("nationality", v)}
                            />
                            <Input
                                label="Religion"
                                value={formData.religion || ""}
                                onValueChange={(v) => handleInputChange("religion", v)}
                            />
                            <Input
                                label="Community"
                                value={formData.community || ""}
                                onValueChange={(v) => handleInputChange("community", v)}
                            />
                            <Input
                                label="Mother Tongue"
                                value={formData.motherTongue || ""}
                                onValueChange={(v) => handleInputChange("motherTongue", v)}
                            />
                            <Input
                                label="SC/ST?"
                                value={formData.isScSt || ""}
                                onValueChange={(v) => handleInputChange("isScSt", v)}
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={formData.dob || ""}
                                onValueChange={(v) => handleInputChange("dob", v)}
                            />

                            {/* Admission & School Details */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-4">Academic Details</div>
                            <Input
                                label="Date of Admission"
                                value={formData.dateOfAdmission || ""}
                                onValueChange={(v) => handleInputChange("dateOfAdmission", v)}
                            />
                            <Input
                                label="Admission Class"
                                value={formData.admissionClass || ""}
                                onValueChange={(v) => handleInputChange("admissionClass", v)}
                                placeholder="e.g. Standard I"
                            />
                            <Input
                                label="Class Leaving"
                                value={formData.standardLeaving || ""}
                                onValueChange={(v) => handleInputChange("standardLeaving", v)}
                            />
                            <Input
                                label="Exam Result"
                                value={formData.examResult || ""}
                                onValueChange={(v) => handleInputChange("examResult", v)}
                            />
                            <Input
                                label="Failed?"
                                value={formData.whetherFailed || ""}
                                onValueChange={(v) => handleInputChange("whetherFailed", v)}
                            />
                            <Textarea
                                label="Subjects Studied"
                                value={formData.subjects || ""}
                                onValueChange={(v) => handleInputChange("subjects", v)}
                                className="col-span-full md:col-span-2"
                            />
                            <Input
                                label="Qualified for Promotion?"
                                value={formData.qualifiedForPromotion || ""}
                                onValueChange={(v) => handleInputChange("qualifiedForPromotion", v)}
                            />

                            {/* Other Details */}
                            <div className="col-span-full font-bold text-lg border-b pb-2 mt-4">Other Details</div>
                            <Input
                                label="Fees Paid?"
                                value={formData.paidFees || ""}
                                onValueChange={(v) => handleInputChange("paidFees", v)}
                            />
                            <Input
                                label="Scholarship?"
                                value={formData.scholarship || ""}
                                onValueChange={(v) => handleInputChange("scholarship", v)}
                            />
                            <Input
                                label="Working Days"
                                value={formData.workingDays || ""}
                                onValueChange={(v) => handleInputChange("workingDays", v)}
                            />
                            <Input
                                label="Present Days"
                                value={formData.presentDays || ""}
                                onValueChange={(v) => handleInputChange("presentDays", v)}
                            />
                            <Input
                                label="General Conduct"
                                value={formData.generalConduct || ""}
                                onValueChange={(v) => handleInputChange("generalConduct", v)}
                            />
                            <Input
                                label="Reason for Leaving"
                                value={formData.reasonForLeaving || ""}
                                onValueChange={(v) => handleInputChange("reasonForLeaving", v)}
                            />
                            <Input
                                label="Application Date"
                                type="date"
                                value={formData.applicationDate || ""}
                                onValueChange={(v) => handleInputChange("applicationDate", v)}
                            />
                            <Input
                                label="Issue Date"
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
                            <p className="text-lg font-semibold mb-2">Generating Transfer Certificates</p>
                            <p className="text-default-500">Please wait while all TCs are being printed...</p>
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
                            data={{ ...formData, serialNo: currentIndex + 101, emisNo: "330201015" }}
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
                            <p className="text-default-400 text-sm">Please wait...</p>
                        </div>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
