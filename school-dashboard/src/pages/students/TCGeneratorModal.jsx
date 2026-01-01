import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea, DatePicker } from "@heroui/react";
import { Check, ArrowRight } from "lucide-react";
import { TransferCertificateTemplate } from "./TransferCertificateTemplate";
import { useReactToPrint } from "react-to-print"; // We might not have this, so we'll implement simple print logic or standard print

export default function TCGeneratorModal({ isOpen, onClose, students }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [formData, setFormData] = useState({});
    const currentStudent = students[currentIndex];
    const printRef = useRef();

    // Reset when students change or modal opens
    useEffect(() => {
        if (isOpen && students.length > 0) {
            setCurrentIndex(0);
            initializeForm(students[0]);
        }
    }, [isOpen, students]);

    const initializeForm = (student) => {
        // Attempt to pre-fill from student data
        setFormData({
            studentName: student.name || "",
            admissionNo: student.admissionId || "",
            gender: student.gender || "",
            motherName: student.motherName || "", // Assuming these might exist
            fatherName: student.parentName || "",
            dob: student.dob || "",
            admissionClass: student.admissionClass || "I", // Placeholder
            standardLeaving: student.class || "",
            dateOfAdmission: student.admissionDate || "", // Placeholder
            nationality: "Indian",
            religion: "Hindu", // Default
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
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateAndNext = () => {
        // 1. Trigger Print
        handlePrint();

        // 2. Wait a moment then move to next? Or user manually nexts?
        // The requirement: "download and then proceed to the next student"
        // We will do it in a callback or just move index after a short delay

        setTimeout(() => {
            if (currentIndex < students.length - 1) {
                setCurrentIndex(prev => prev + 1);
                initializeForm(students[currentIndex + 1]);
            } else {
                // Finished
                // alert("All TCs Generated");
                onClose();
            }
        }, 1000);
    };

    const handlePrint = () => {
        // Manual print logic finding the ref content
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '', 'width=800,height=600');
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
            ${content.outerHTML}
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
    };

    if (!currentStudent) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2>Generate Transfer Certificate ({currentIndex + 1}/{students.length})</h2>
                    <p className="text-sm text-default-500">Generating for: <span className="font-bold text-primary">{currentStudent.name}</span> (Class {currentStudent.class})</p>
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Personal Details */}
                        <div className="col-span-full font-bold text-lg border-b pb-2 mt-2">Personal Details</div>
                        <Input label="Name" value={formData.studentName} onValueChange={(v) => handleInputChange("studentName", v)} />
                        <Input label="Mother's Name" value={formData.motherName} onValueChange={(v) => handleInputChange("motherName", v)} />
                        <Input label="Father's Name" value={formData.fatherName} onValueChange={(v) => handleInputChange("fatherName", v)} />
                        <Input label="Nationality" value={formData.nationality} onValueChange={(v) => handleInputChange("nationality", v)} />
                        <Input label="Religion" value={formData.religion} onValueChange={(v) => handleInputChange("religion", v)} />
                        <Input label="Community" value={formData.community} onValueChange={(v) => handleInputChange("community", v)} />
                        <Input label="Mother Tongue" value={formData.motherTongue} onValueChange={(v) => handleInputChange("motherTongue", v)} />
                        <Input label="SC/ST?" value={formData.isScSt} onValueChange={(v) => handleInputChange("isScSt", v)} />
                        <Input label="Date of Birth" type="date" value={formData.dob} onValueChange={(v) => handleInputChange("dob", v)} />

                        {/* Admission & School Details */}
                        <div className="col-span-full font-bold text-lg border-b pb-2 mt-4">Academic Details</div>
                        <Input label="Date of Admission" value={formData.dateOfAdmission} onValueChange={(v) => handleInputChange("dateOfAdmission", v)} />
                        <Input label="Admission Class" value={formData.admissionClass} onValueChange={(v) => handleInputChange("admissionClass", v)} placeholder="e.g. Standard I" />
                        <Input label="Class Leaving" value={formData.standardLeaving} onValueChange={(v) => handleInputChange("standardLeaving", v)} />
                        <Input label="Exam Result" value={formData.examResult} onValueChange={(v) => handleInputChange("examResult", v)} />
                        <Input label="Failed?" value={formData.whetherFailed} onValueChange={(v) => handleInputChange("whetherFailed", v)} />
                        <Textarea label="Subjects Studied" value={formData.subjects} onValueChange={(v) => handleInputChange("subjects", v)} className="col-span-full md:col-span-2" />
                        <Input label="Qualified for Promotion?" value={formData.qualifiedForPromotion} onValueChange={(v) => handleInputChange("qualifiedForPromotion", v)} />

                        {/* Other Details */}
                        <div className="col-span-full font-bold text-lg border-b pb-2 mt-4">Other Details</div>
                        <Input label="Fees Paid?" value={formData.paidFees} onValueChange={(v) => handleInputChange("paidFees", v)} />
                        <Input label="Scholarship?" value={formData.scholarship} onValueChange={(v) => handleInputChange("scholarship", v)} />
                        <Input label="Working Days" value={formData.workingDays} onValueChange={(v) => handleInputChange("workingDays", v)} />
                        <Input label="Present Days" value={formData.presentDays} onValueChange={(v) => handleInputChange("presentDays", v)} />
                        <Input label="General Conduct" value={formData.generalConduct} onValueChange={(v) => handleInputChange("generalConduct", v)} />
                        <Input label="Reason for Leaving" value={formData.reasonForLeaving} onValueChange={(v) => handleInputChange("reasonForLeaving", v)} />
                        <Input label="Application Date" type="date" value={formData.applicationDate} onValueChange={(v) => handleInputChange("applicationDate", v)} />
                        <Input label="Issue Date" type="date" value={formData.issueDate} onValueChange={(v) => handleInputChange("issueDate", v)} />
                    </div>

                    {/* Hidden Template for Printing */}
                    <div className="hidden">
                        <TransferCertificateTemplate ref={printRef} data={{ ...formData, serialNo: currentIndex + 101, emisNo: "330201015" }} />
                    </div>

                </ModalBody>
                <ModalFooter>
                    <div className="flex justify-between w-full">
                        <div className="text-sm text-default-400 self-center">Step {currentIndex + 1} of {students.length}</div>
                        <div className="flex gap-2">
                            <Button variant="flat" onPress={onClose}>Cancel All</Button>
                            <Button color="primary" onPress={handleGenerateAndNext} endContent={currentIndex < students.length - 1 ? <ArrowRight size={16} /> : <Check size={16} />}>
                                {currentIndex < students.length - 1 ? "Generate & Next Student" : "Generate & Finish"}
                            </Button>
                        </div>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
