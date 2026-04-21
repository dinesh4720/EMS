import {
    Button, Chip, Spinner, Progress,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
} from "@heroui/react";
import {
    Check, Download, Upload, FileSpreadsheet, FileText, AlertTriangle, Info,
    CheckCircle, XCircle, Users, ChevronRight, GraduationCap,
} from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { groupStudentsByClassSection } from "../../utils/studentImportUtils";
import { useTranslation } from 'react-i18next';

// ─── CSV Upload Modal ─────────────────────────────────────────────────────────

export function StudentCsvUploadModal({
    isOpen,
    onClose,
    csvFile,
    setCsvFile,
    csvDragActive,
    csvInputRef,
    csvProcessing,
    handleCsvDrag,
    handleCsvDrop,
    handleCsvFileSelect,
    downloadCsvTemplate,
    processCsvUpload,
}) {
    const { t } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 rounded-lg">
                                    <FileSpreadsheet size={24} className="text-primary" />
                                </div>
                                <span className="text-xl font-semibold">{t('pages.bulkUploadStudents')}</span>
                            </div>
                        </ModalHeader>
                        <ModalBody className="space-y-6">
                            {/* Instructions Section */}
                            <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                                <h4 className="font-semibold text-default-900 mb-3 flex items-center gap-2">
                                    <Info size={18} className="text-primary" />
                                    How to Bulk Upload Students
                                </h4>
                                <ol className="space-y-2 text-sm text-default-600 list-decimal list-inside">
                                    <li>{t('pages.downloadTheCsvTemplateUsingTheButtonBelow')}</li>
                                    <li>{t('pages.fillInTheStudentDataFollowingTheColumnFormat')}</li>
                                    <li>Required fields: <span className="font-semibold text-default-900">admissionId, name, class</span></li>
                                    <li>Class names are flexible: <span className="font-mono text-xs bg-default-100 px-1 rounded">{t('pages.class3')}</span>, <span className="font-mono text-xs bg-default-100 px-1 rounded">3</span>, or <span className="font-mono text-xs bg-default-100 px-1 rounded">class 3</span> all work</li>
                                    <li><span className="font-semibold text-default-900">{t('pages.section1')}</span> is required if the class has sections (e.g., A, B, C)</li>
                                    <li>{t('pages.uploadTheFilledCsvFile')}</li>
                                    <li>{t('pages.reviewAndConfirmTheImportSummaryGroupedByClass')}</li>
                                </ol>
                            </div>

                            {/* Download Template Button */}
                            <div className="flex justify-center">
                                <Button
                                    color="primary"
                                    variant="flat"
                                    size="lg"
                                    onPress={downloadCsvTemplate}
                                    className="w-full sm:w-auto"
                                    startContent={<Download size={18} />}
                                >
                                    Download CSV Template
                                </Button>
                            </div>

                            {/* File Upload Area */}
                            <div
                                className={`
                                    relative border-2 border-dashed rounded-lg p-8
                                    transition-all duration-200 text-center
                                    ${csvDragActive
                                        ? 'border-primary bg-primary-50/50'
                                        : 'border-default-300 hover:border-primary-400 hover:bg-default-50'
                                    }
                                    ${csvFile ? 'border-success bg-success-50/30' : ''}
                                `}
                                onDragEnter={handleCsvDrag}
                                onDragLeave={handleCsvDrag}
                                onDragOver={handleCsvDrag}
                                onDrop={handleCsvDrop}
                            >
                                <input
                                    ref={csvInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => handleCsvFileSelect(e.target.files[0])}
                                />
                                <div className="space-y-3">
                                    <div className="flex justify-center">
                                        <div className={`p-3 rounded-full ${csvFile ? 'bg-success-100' : 'bg-default-100'}`}>
                                            {csvFile ? (
                                                <Check size={32} className="text-success" />
                                            ) : (
                                                <Upload size={32} className="text-default-400" />
                                            )}
                                        </div>
                                    </div>
                                    {csvFile ? (
                                        <>
                                            <p className="font-semibold text-success-700">{csvFile.name}</p>
                                            <p className="text-sm text-default-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                onPress={(e) => { e.stopPropagation(); setCsvFile(null); }}
                                                className="mt-2"
                                            >
                                                Remove File
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-semibold text-default-900">{t('pages.dragDropYourCsvFileHere')}</p>
                                            <p className="text-sm text-default-500">or click to browse files</p>
                                            <p className="text-xs text-default-400">{t('pages.onlyCsvFilesAreSupported')}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Column Requirements */}
                            <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                                <h4 className="font-semibold text-default-900 mb-3 flex items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    CSV Column Requirements
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-default-900">{t('pages.studentInformation1')}</p>
                                        <p className="text-default-600">• admissionId (Required)</p>
                                        <p className="text-default-600">• name (Required)</p>
                                        <p className="text-default-600">• class (Required)</p>
                                        <p className="text-default-600">• section (if class has sections)</p>
                                        <p className="text-default-600">• rollNo</p>
                                        <p className="text-default-600">• gender</p>
                                        <p className="text-default-600">• dateOfBirth (YYYY-MM-DD)</p>
                                        <p className="text-default-600">• bloodGroup</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-default-900">{t('pages.contactDetails1')}</p>
                                        <p className="text-default-600">• phone</p>
                                        <p className="text-default-600">• email</p>
                                        <p className="text-default-600">• whatsappNumber</p>
                                        <p className="text-default-600">• address</p>
                                        <p className="text-default-600">• city</p>
                                        <p className="text-default-600">• state</p>
                                        <p className="text-default-600">• zipCode</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-default-900">{t('pages.parentOther')}</p>
                                        <p className="text-default-600">• parentName</p>
                                        <p className="text-default-600">• parentPhone</p>
                                        <p className="text-default-600">• parentEmail</p>
                                        <p className="text-default-600">• parentRelationship</p>
                                        <p className="text-default-600">• parentOccupation</p>
                                        <p className="text-default-600">• emergencyContactName</p>
                                        <p className="text-default-600">• emergencyContactPhone</p>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                                <h4 className="font-semibold text-warning-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-warning" />
                                    Important Notes
                                </h4>
                                <ul className="space-y-1 text-sm text-warning-800">
                                    <li>• The first row must contain exact column headers</li>
                                    <li>• Date of birth must be in YYYY-MM-DD format</li>
                                    <li>• Phone numbers should be 10 digits</li>
                                    <li>• Class name formats: <span className="font-mono">{t('pages.class3')}</span>, <span className="font-mono">3</span>, <span className="font-mono">class 3</span> all work</li>
                                    <li>• Section is required if the class has multiple sections (A, B, C, etc.)</li>
                                    <li>• If the class has no sections, leave the section column empty</li>
                                    <li>• Duplicate admission IDs will be skipped</li>
                                    <li>• Empty cells will be treated as null values</li>
                                    <li>• Maximum file size: 5 MB</li>
                                </ul>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onModalClose} isDisabled={csvProcessing}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={processCsvUpload}
                                isDisabled={!csvFile || csvProcessing}
                                startContent={csvProcessing ? <Spinner size="sm" /> : <Upload size={16} />}
                            >
                                {csvProcessing ? 'Processing...' : 'Upload Students'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

// ─── CSV Preview Modal ────────────────────────────────────────────────────────

export function StudentCsvPreviewModal({
    isOpen,
    onClose,
    validatedStudents,
    previewFilter,
    setPreviewFilter,
    csvProcessing,
    importProgress,
    importValidStudents,
}) {
    const { t } = useTranslation();
    const getFilteredValidatedStudents = () => {
        switch (previewFilter) {
            case 'valid': return validatedStudents.filter(s => s.valid && !s.isDuplicate);
            case 'invalid': return validatedStudents.filter(s => !s.valid);
            case 'warnings': return validatedStudents.filter(s => s.warnings.length > 0);
            case 'duplicates': return validatedStudents.filter(s => s.isDuplicate);
            default: return validatedStudents;
        }
    };

    const summary = {
        total: validatedStudents.length,
        valid: validatedStudents.filter(s => s.valid && !s.isDuplicate).length,
        invalid: validatedStudents.filter(s => !s.valid && !s.isDuplicate).length,
        duplicates: validatedStudents.filter(s => s.isDuplicate).length,
        warnings: validatedStudents.filter(s => s.warnings.length > 0 && !s.isDuplicate).length,
    };

    const filteredStudents = getFilteredValidatedStudents();
    const grouped = groupStudentsByClassSection(filteredStudents);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 rounded-lg">
                                    <FileSpreadsheet size={24} className="text-primary" />
                                </div>
                                <span className="text-xl font-semibold">{t('pages.previewStudents')}</span>
                            </div>
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users size={18} className="text-default-600" />
                                        <span className="text-sm text-default-600">{t('pages.totalStudents1')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-default-900">{summary.total}</p>
                                </div>
                                <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle size={18} className="text-success" />
                                        <span className="text-sm text-success-700">{t('pages.valid')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-success">{summary.valid}</p>
                                </div>
                                <div className="bg-warning-50 rounded-lg p-4 border-warning-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle size={18} className="text-warning" />
                                        <span className="text-sm text-warning-700">{t('pages.duplicates')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-warning">{summary.duplicates}</p>
                                </div>
                                <div className="bg-danger-50 rounded-lg p-4 border-danger-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <XCircle size={18} className="text-danger" />
                                        <span className="text-sm text-danger-700">{t('pages.invalid')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-danger">{summary.invalid}</p>
                                </div>
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'all', label: `All (${summary.total})`, color: 'primary' },
                                    { key: 'valid', label: `Valid Only (${summary.valid})`, color: 'success' },
                                    { key: 'duplicates', label: `Duplicates (${summary.duplicates})`, color: 'warning' },
                                    { key: 'invalid', label: `Invalid Only (${summary.invalid})`, color: 'danger' },
                                    { key: 'warnings', label: `Has Warnings (${summary.warnings})`, color: 'warning' },
                                ].map(({ key, label, color }) => (
                                    <Button
                                        key={key}
                                        size="sm"
                                        variant={previewFilter === key ? 'solid' : 'flat'}
                                        color={previewFilter === key ? color : 'default'}
                                        onPress={() => setPreviewFilter(key)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>

                            {/* Import Progress */}
                            {csvProcessing && importProgress.total > 0 && (
                                <div className="bg-primary-50 rounded-lg p-4 border-primary-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-primary-900">{t('pages.importingStudents')}</span>
                                        <span className="text-sm text-primary-700">{importProgress.current} of {importProgress.total}</span>
                                    </div>
                                    <Progress
                                        value={(importProgress.current / importProgress.total) * 100}
                                        color="primary"
                                        size="sm"
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* Error Summary Banner */}
                            {summary.invalid > 0 && previewFilter === 'all' && (
                                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-danger-800 mb-2 flex items-center gap-1.5">
                                        <XCircle size={14} className="flex-shrink-0" />
                                        {summary.invalid} row{summary.invalid !== 1 ? 's' : ''} will be skipped — fix errors before importing
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {validatedStudents.filter(s => !s.valid && !s.isDuplicate).map((s, i) => (
                                            <span key={s.data._csvRow ?? i} className="text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded font-mono">
                                                {s.data._csvRow ? `Row ${s.data._csvRow}` : s.data.name || `Item ${i + 1}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Class-based Accordion */}
                            <div className="max-h-[500px] overflow-y-auto space-y-3">
                                {Object.entries(grouped).map(([classKey, classData]) => {
                                    const hasInvalid = classData.invalidCount > 0;
                                    const hasOnlyValid = classData.invalidCount === 0 && classData.duplicateCount === 0;
                                    const borderColor = hasInvalid ? 'border-danger-300' : classData.duplicateCount > 0 ? 'border-warning-300' : 'border-success-200';
                                    const bgColor = hasInvalid ? 'bg-danger-50/30' : classData.duplicateCount > 0 ? 'bg-warning-50/30' : 'bg-success-50/20';

                                    return (
                                        <Accordion
                                            key={classKey}
                                            variant="splitted"
                                            defaultExpanded={hasInvalid || Object.keys(grouped).length <= 2}
                                            className="px-0"
                                        >
                                            <AccordionItem
                                                aria-label={classKey}
                                                title={
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${hasOnlyValid ? 'bg-success-100' : hasInvalid ? 'bg-danger-100' : 'bg-warning-100'}`}>
                                                                <GraduationCap size={18} className={hasOnlyValid ? 'text-success' : hasInvalid ? 'text-danger' : 'text-warning'} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-default-900 text-base">{classKey}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs text-default-500">{classData.students.length} student{classData.students.length !== 1 ? 's' : ''}</span>
                                                                    <span className="text-default-300">•</span>
                                                                    <span className={`text-xs font-medium ${hasOnlyValid ? 'text-success' : hasInvalid ? 'text-danger' : 'text-warning'}`}>{classData.validCount} valid</span>
                                                                    {classData.invalidCount > 0 && <><span className="text-default-300">•</span><span className="text-xs font-medium text-danger">{classData.invalidCount} invalid</span></>}
                                                                    {classData.duplicateCount > 0 && <><span className="text-default-300">•</span><span className="text-xs font-medium text-warning">{classData.duplicateCount} duplicate</span></>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                                className={`rounded-lg border-2 ${borderColor} ${bgColor}`}
                                                indicator={<ChevronRight size={18} className="text-default-400 transition-transform duration-200" />}
                                            >
                                                <div className="pt-2 pb-1 px-1 space-y-2">
                                                    {classData.students.map((student, idx) => (
                                                        <div
                                                            key={student.data?.admissionId || student.data?.name || `import-student-${idx}`}
                                                            className={`rounded-lg border p-3 transition-all ${
                                                                student.isDuplicate ? 'border-warning-300 bg-warning-50/70'
                                                                    : student.valid ? 'border-success-200 bg-success-50/50'
                                                                    : 'border-danger-300 bg-danger-50/70'
                                                            } ${student.warnings.length > 0 && student.valid && !student.isDuplicate ? 'ring-2 ring-warning-300 ring-opacity-50' : ''}`}
                                                        >
                                                            {/* Student Header */}
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    {student.isDuplicate ? <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                                                                        : student.valid ? <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
                                                                        : <XCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />}
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-semibold text-default-900 text-sm truncate">{student.data.name || 'Unnamed Student'}</p>
                                                                        <p className="text-xs text-default-500 truncate">
                                                                            {student.data._csvRow && <span className="font-mono bg-default-100 px-1 rounded mr-1">Row {student.data._csvRow}</span>}
                                                                            ID: {student.data.admissionId || 'No ID'}{student.data.section ? ` • Section ${student.data.section}` : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                                    {student.isDuplicate && <Chip size="sm" color="warning" variant="flat" className="h-5 text-xs">{t('pages.duplicate1')}</Chip>}
                                                                    {!student.isDuplicate && student.warnings.length > 0 && <Chip size="sm" color="warning" variant="flat" className="h-5 text-xs">{student.warnings.length} {student.warnings.length === 1 ? 'Warn' : 'Warns'}</Chip>}
                                                                    {!student.isDuplicate && !student.valid && <Chip size="sm" color="danger" variant="flat" className="h-5 text-xs">{t('pages.invalid')}</Chip>}
                                                                </div>
                                                            </div>

                                                            {/* Errors */}
                                                            {!student.valid && !student.isDuplicate && Object.keys(student.errors).length > 0 && (
                                                                <div className="bg-danger-100/80 rounded-md p-2 mb-2">
                                                                    <div className="space-y-1">
                                                                        {Object.entries(student.errors).slice(0, 2).map(([field, error]) => (
                                                                            <div key={field} className="text-xs">
                                                                                <span className="text-danger-800 font-medium capitalize">{field}:</span>
                                                                                <span className="text-danger-700 ml-1">{error}</span>
                                                                            </div>
                                                                        ))}
                                                                        {Object.keys(student.errors).length > 2 && (
                                                                            <div className="text-xs text-danger-600 italic">+{Object.keys(student.errors).length - 2} more error{Object.keys(student.errors).length - 2 > 1 ? 's' : ''}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Warnings */}
                                                            {!student.isDuplicate && student.warnings.length > 0 && (
                                                                <div className="bg-warning-100/80 rounded-md p-2 mb-2">
                                                                    <ul className="space-y-0.5">
                                                                        {student.warnings.slice(0, 2).map((w, i) => (
                                                                            <li key={i} className="text-xs text-warning-800 flex items-start gap-1">
                                                                                <span className="flex-shrink-0">•</span>
                                                                                <span className="line-clamp-1">{w}</span>
                                                                            </li>
                                                                        ))}
                                                                        {student.warnings.length > 2 && <li className="text-xs text-warning-700 italic">+{student.warnings.length - 2} more warning{student.warnings.length - 2 > 1 ? 's' : ''}</li>}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* Quick Details */}
                                                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                <div className="text-default-600"><span className="text-default-500">{t('pages.roll')}</span> {student.data.rollNo || '—'}</div>
                                                                <div className="text-default-600"><span className="text-default-500">{t('pages.gender2')}</span> {student.data.gender || '—'}</div>
                                                                <div className="text-default-600 truncate"><span className="text-default-500">{t('pages.parent1')}</span> {student.data.parentName || '—'}</div>
                                                                <div className="text-default-600"><span className="text-default-500">{t('pages.phone2')}</span> {student.data.parentPhone || '—'}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionItem>
                                        </Accordion>
                                    );
                                })}

                                {filteredStudents.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users size={48} className="text-default-300 mx-auto mb-3" />
                                        <p className="text-default-500 font-medium">{t('pages.noStudentsToDisplay')}</p>
                                        <p className="text-default-400 text-sm mt-1">{t('pages.tryChangingTheFilterAbove')}</p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onModalClose} isDisabled={csvProcessing}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={importValidStudents}
                                isDisabled={csvProcessing || summary.valid === 0}
                                startContent={csvProcessing ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                            >
                                {csvProcessing
                                    ? `Importing ${importProgress.current}/${importProgress.total}...`
                                    : summary.duplicates > 0
                                        ? `Add ${summary.valid} Valid Students (${summary.duplicates} duplicate${summary.duplicates > 1 ? 's' : ''} will be skipped)`
                                        : `Add ${summary.valid} Valid Students`
                                }
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
