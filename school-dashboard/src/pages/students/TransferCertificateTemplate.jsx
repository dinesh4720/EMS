import React from "react";
import { useTranslation } from 'react-i18next';
import { useApp } from "../../context/AppContext";

export const TransferCertificateTemplate = React.forwardRef(({ data, schoolData: schoolDataProp }, ref) => {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const school = schoolDataProp || schoolSettings || {};
  const schoolName = school.schoolName || school.name || 'School Name Not Configured';
  const schoolAddress = school.address || school.schoolAddress || '';
  const affiliationInfo = school.affiliationBoard
    ? `Affiliated to ${school.affiliationBoard}${school.affiliationNumber ? ` | Affiliation Number ${school.affiliationNumber}` : ''}`
    : '';

    if (!data) return null;

    return (
        <div ref={ref} className="print-content bg-white text-black font-serif w-[210mm] h-[297mm] mx-auto hidden print:block print:w-full print:h-full print:absolute print:top-0 print:left-0 print:z-[9999]" id="tc-document">
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>

            <div className="flex flex-col h-full justify-between px-6 pt-4 pb-2">
                <div>
                    {/* Header */}
                    <div className="border-b-2 border-black pb-1 mb-2">
                        <div className="flex items-center justify-between mb-1">
                            {/* Logo */}
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-black">
                                <span className="text-[0.6rem] font-bold">{t('pages.lOGO')}</span>
                            </div>

                            {/* School Details */}
                            <div className="text-center flex-grow px-2">
                                <h1 className="text-xl font-extrabold uppercase tracking-wide leading-tight mb-0">{schoolName}</h1>
                                {affiliationInfo && <p className="text-[0.7rem] font-bold uppercase leading-tight">{affiliationInfo}</p>}
                                {schoolAddress && <p className="text-[0.7rem] font-bold leading-tight">{schoolAddress}</p>}
                            </div>

                            {/* Logo Balancer */}
                            <div className="w-12 h-12 opacity-0 hidden print:block"></div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-lg font-bold uppercase underline decoration-2 underline-offset-2">{t('pages.transferCertificate')}</h2>
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="flex justify-between font-bold mb-2 text-sm">
                        <div>Serial No.: <span className="font-normal">{data.serialNo || "_______"}</span></div>
                        <div className="text-right">
                            <div>Admission No.: <span className="font-normal">{data.admissionNo}</span></div>
                            <div>Emis No : <span className="font-normal">{data.emisNo || "_______"}</span></div>
                        </div>
                    </div>

                    {/* Form Fields - Balanced Grid */}
                    <div className="space-y-1.5 text-sm leading-snug">
                        {[
                            { label: "Name of the Pupil (in block letters)", value: data.studentName, bold: true, caps: true },
                            { label: "Mother's Name", value: data.motherName },
                            { label: "Father's Name / Guardian's Name", value: data.fatherName },
                            { label: "Sex", value: data.gender },
                            { label: "Nationality, Religion and Community", value: `${data.nationality}, ${data.religion}, ${data.community}` },
                            { label: "Mother Tongue", value: data.motherTongue },
                            { label: "Whether the candidate belongs to SC or ST", value: data.isScSt },
                            { label: "Date of Admission and Standard (The year to be entered in words)", value: `${data.dateOfAdmission}, ${data.admissionClass}` },
                            { label: "Date of birth, as entered in Admission Register (in figures and words)", value: `${data.dob} (${data.dobInWords})`, multiline: true },
                            { label: "Standard in which the pupil was studying at the time of leaving (in words)", value: data.standardLeaving },
                            { label: "School / Board / Annual Exam last taken with result", value: data.examResult },
                            { label: "Whether failed, if so once / twice in the same class", value: data.whetherFailed },
                            { label: "Subjects studied", value: data.subjects },
                            { label: "Whether qualified for promotion. If so, to which class (in figures & words)", value: data.qualifiedForPromotion },
                            { label: "Whether the pupil has paid all the fees", value: data.paidFees },
                            { label: "Whether the pupil was in receipt of any Scholarship (Nature to be specified)", value: data.scholarship },
                            { label: "Total No. of working days", value: data.workingDays },
                            { label: "Total No. of working days when the pupil was present", value: data.presentDays },
                            { label: "Whether NCC Cadet / Boy Scout / Girl Guide / JRC", value: data.nccDetails },
                            { label: "Game played or extra curricular activities in which the pupil usually took part", value: data.extraCurricular },
                            { label: "General Conduct", value: data.generalConduct },
                            { label: "Date of application of Transfer Certificate", value: data.applicationDate },
                            { label: "Date of issue of Certificate", value: data.issueDate },
                            { label: "Reasons for leaving the school", value: data.reasonForLeaving },
                            { label: "Any other remarks", value: data.remarks },
                        ].map((item, index) => (
                            <div key={item.label} className="grid grid-cols-[24px_1fr_10px_1fr] gap-1.5 items-end">
                                <span className="font-bold text-center">{index + 1}.</span>
                                <span className="font-bold">{item.label}</span>
                                <span>:</span>
                                <span className={`${item.bold ? "font-bold" : "font-medium"} ${item.caps ? "uppercase" : ""} border-b border-dotted border-black leading-tight ${item.multiline ? "py-1" : ""}`}>{item.value || ""}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Signatures */}
                <div className="mt-8 flex justify-between items-end pb-4">
                    <div className="text-center w-56">
                        <div className="border-t border-black pt-2 font-bold text-sm">{t('pages.signatureOfTheClassTeacher')}</div>
                    </div>
                    <div className="text-center w-56">
                        <div className="border-t border-black pt-2 font-bold text-sm">checked by</div>
                    </div>
                    <div className="text-center w-56">
                        <div className="border-t border-black pt-2 font-bold text-sm">{t('pages.principal2')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
});
