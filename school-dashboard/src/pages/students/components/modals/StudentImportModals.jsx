import { Chip, CircularProgress, Progress } from "../../../../components/ui";
import {
    Check, Download, Upload, FileSpreadsheet, FileText, AlertTriangle, Info,
    CheckCircle, XCircle, Users, ChevronRight, GraduationCap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "../../../../components/ui/Modal";
import { groupStudentsByClassSection } from "../../utils/studentImportUtils";
import "./StudentImportModals.css";

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            isDismissable={!csvProcessing}
            title={
                <span className="row gap-2">
                    <FileSpreadsheet size={14} aria-hidden className="simport-c-accent" />
                    {t('pages.bulkUploadStudents', 'Bulk upload students')}
                </span>
            }
            description="Upload a CSV with admission ID, name, class, and optional fields."
            footer={
                <>
                    <button
                        type="button"
                        className="btn"
                        onClick={onClose}
                        disabled={csvProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn--accent"
                        onClick={processCsvUpload}
                        disabled={!csvFile || csvProcessing}
                        aria-busy={csvProcessing || undefined}
                    >
                        {csvProcessing ? (
                            <>
                                <CircularProgress size="sm" indeterminate />
                                Processing…
                            </>
                        ) : (
                            <>
                                <Upload size={13} aria-hidden /> Upload Students
                            </>
                        )}
                    </button>
                </>
            }
        >
            <div className="col gap-4">
                {/* Instructions Section */}
                <div className="simport-panel">
                    <h4 className="row gap-2 simport-panel__title">
                        <Info size={14} aria-hidden className="simport-c-accent" />
                        How to Bulk Upload Students
                    </h4>
                    <ol className="simport-list muted">
                        <li>{t('pages.downloadTheCsvTemplateUsingTheButtonBelow')}</li>
                        <li>{t('pages.fillInTheStudentDataFollowingTheColumnFormat')}</li>
                        <li>Required fields: <span className="simport-em">admissionId, name, class</span></li>
                        <li>Class names are flexible: <span className="mono">{t('pages.class3')}</span>, <span className="mono">3</span>, or <span className="mono">class 3</span> all work</li>
                        <li><span className="simport-em">{t('pages.section1')}</span> is required if the class has sections (e.g., A, B, C)</li>
                        <li>{t('pages.uploadTheFilledCsvFile')}</li>
                        <li>{t('pages.reviewAndConfirmTheImportSummaryGroupedByClass')}</li>
                    </ol>
                </div>

                {/* Download Template Button */}
                <div className="row justify-center">
                    <button
                        type="button"
                        className="btn"
                        onClick={downloadCsvTemplate}
                    >
                        <Download size={13} aria-hidden />
                        Download CSV Template
                    </button>
                </div>

                {/* File Upload Area */}
                <div
                    className={`simport-drop ${csvFile ? "is-filled" : csvDragActive ? "is-active" : ""}`}
                    onDragEnter={handleCsvDrag}
                    onDragLeave={handleCsvDrag}
                    onDragOver={handleCsvDrag}
                    onDrop={handleCsvDrop}
                >
                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        className="simport-drop__input"
                        aria-label="Choose a CSV file to upload"
                        onChange={(e) => handleCsvFileSelect(e.target.files[0])}
                    />
                    <div className="col gap-2.5 items-center">
                        <span className={`simport-filepill ${csvFile ? "is-filled" : ""}`}>
                            {csvFile ? <Check size={22} aria-hidden /> : <Upload size={22} aria-hidden />}
                        </span>
                        {csvFile ? (
                            <>
                                <p className="simport-c-ok font-semibold m-0">{csvFile.name}</p>
                                <p className="subtle simport-t12 m-0">{(csvFile.size / 1024).toFixed(2)} KB</p>
                                <button
                                    type="button"
                                    className="btn btn--sm mt-1"
                                    style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                                    onClick={(e) => { e.stopPropagation(); setCsvFile(null); }}
                                >
                                    Remove File
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold m-0">{t('pages.dragDropYourCsvFileHere', 'Drag & drop your CSV file here')}</p>
                                <p className="subtle simport-t12 m-0">or click to browse files</p>
                                <p className="faint simport-t11 m-0">{t('pages.onlyCsvFilesAreSupported', 'Only .csv files are supported')}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Column Requirements */}
                <div className="simport-panel">
                    <h4 className="row gap-2 simport-panel__title">
                        <FileText size={14} aria-hidden className="simport-c-accent" />
                        CSV Column Requirements
                    </h4>
                    <div className="fgrid fgrid--3 gap-x-4 gap-y-1 simport-t115">
                        <div className="col gap-0.5">
                            <p className="simport-em m-0">{t('pages.studentInformation1')}</p>
                            <p className="subtle m-0">• admissionId (Required)</p>
                            <p className="subtle m-0">• name (Required)</p>
                            <p className="subtle m-0">• class (Required)</p>
                            <p className="subtle m-0">• section (if class has sections)</p>
                            <p className="subtle m-0">• rollNo</p>
                            <p className="subtle m-0">• gender</p>
                            <p className="subtle m-0">• dateOfBirth (YYYY-MM-DD)</p>
                            <p className="subtle m-0">• bloodGroup</p>
                        </div>
                        <div className="col gap-0.5">
                            <p className="simport-em m-0">{t('pages.contactDetails1')}</p>
                            <p className="subtle m-0">• phone</p>
                            <p className="subtle m-0">• email</p>
                            <p className="subtle m-0">• whatsappNumber</p>
                            <p className="subtle m-0">• address</p>
                            <p className="subtle m-0">• city</p>
                            <p className="subtle m-0">• state</p>
                            <p className="subtle m-0">• zipCode</p>
                        </div>
                        <div className="col gap-0.5">
                            <p className="simport-em m-0">{t('pages.parentOther')}</p>
                            <p className="subtle m-0">• parentName</p>
                            <p className="subtle m-0">• parentPhone</p>
                            <p className="subtle m-0">• parentEmail</p>
                            <p className="subtle m-0">• parentRelationship</p>
                            <p className="subtle m-0">• parentOccupation</p>
                            <p className="subtle m-0">• emergencyContactName</p>
                            <p className="subtle m-0">• emergencyContactPhone</p>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="simport-panel simport-panel--warn">
                    <h4 className="row gap-2 simport-panel__title">
                        <AlertTriangle size={14} aria-hidden />
                        Important Notes
                    </h4>
                    <ul className="simport-list">
                        <li>The first row must contain exact column headers</li>
                        <li>Date of birth must be in YYYY-MM-DD format</li>
                        <li>Phone numbers should be 10 digits</li>
                        <li>Class name formats: <span className="mono">{t('pages.class3')}</span>, <span className="mono">3</span>, <span className="mono">class 3</span> all work</li>
                        <li>Section is required if the class has multiple sections (A, B, C, etc.)</li>
                        <li>If the class has no sections, leave the section column empty</li>
                        <li>Duplicate admission IDs will be skipped</li>
                        <li>Empty cells will be treated as null values</li>
                        <li>Maximum file size: 5 MB</li>
                    </ul>
                </div>
            </div>
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

    const filters = [
        { key: 'all', label: `All (${summary.total})` },
        { key: 'valid', label: `Valid (${summary.valid})` },
        { key: 'duplicates', label: `Duplicates (${summary.duplicates})` },
        { key: 'invalid', label: `Invalid (${summary.invalid})` },
        { key: 'warnings', label: `Warnings (${summary.warnings})` },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            isDismissable={!csvProcessing}
            title={
                <span className="row gap-2">
                    <FileSpreadsheet size={14} aria-hidden className="simport-c-accent" />
                    {t('pages.previewStudents', 'Preview Students')}
                </span>
            }
            description={`${summary.total} rows · ${summary.valid} valid · ${summary.invalid} invalid · ${summary.duplicates} duplicates`}
            footer={
                <>
                    <button
                        type="button"
                        className="btn"
                        onClick={onClose}
                        disabled={csvProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn--accent"
                        onClick={importValidStudents}
                        disabled={csvProcessing || summary.valid === 0}
                        aria-busy={csvProcessing || undefined}
                    >
                        {csvProcessing ? (
                            <>
                                <CircularProgress size="sm" indeterminate />
                                Importing {importProgress.current}/{importProgress.total}…
                            </>
                        ) : (
                            <>
                                <CheckCircle size={13} aria-hidden />
                                {summary.duplicates > 0
                                    ? `Add ${summary.valid} (${summary.duplicates} dup skipped)`
                                    : `Add ${summary.valid} Valid Students`}
                            </>
                        )}
                    </button>
                </>
            }
        >
            <div className="col gap-3">
                {/* Summary Cards */}
                <div className="fgrid fgrid--3 gap-2">
                    {[
                        { Icon: Users, label: t('pages.totalStudents1', 'Total'), value: summary.total, color: "var(--fg)" },
                        { Icon: CheckCircle, label: t('pages.valid', 'Valid'), value: summary.valid, color: "var(--ok)" },
                        { Icon: AlertTriangle, label: t('pages.duplicates', 'Duplicates'), value: summary.duplicates, color: "var(--warn)" },
                        { Icon: XCircle, label: t('pages.invalid', 'Invalid'), value: summary.invalid, color: "var(--danger)" },
                    ].map(({ Icon, label, value, color }) => (
                        <div key={label} className="simport-stat">
                            <span className="row gap-2 subtle simport-t11">
                                <Icon size={13} aria-hidden style={{ color }} />
                                {label}
                            </span>
                            <span className="mono tnum simport-stat__value" style={{ color }}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Filter Buttons */}
                <div className="row gap-2 flex-wrap">
                    {filters.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            className={`btn btn--sm ${previewFilter === key ? "btn--accent" : ""}`}
                            onClick={() => setPreviewFilter(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Import Progress */}
                {csvProcessing && importProgress.total > 0 && (
                    <div className="simport-panel simport-panel--accent">
                        <div className="row justify-between mb-2">
                            <span className="simport-t125 font-semibold simport-c-accent">
                                {t('pages.importingStudents', 'Importing students…')}
                            </span>
                            <span className="mono tnum simport-t125 simport-c-accent">
                                {importProgress.current} of {importProgress.total}
                            </span>
                        </div>
                        <Progress
                            aria-label="Import progress"
                            value={(importProgress.current / importProgress.total) * 100}
                            color="primary"
                            size="sm"
                            className="w-full"
                        />
                    </div>
                )}

                {/* Error Summary Banner */}
                {summary.invalid > 0 && previewFilter === 'all' && (
                    <div className="simport-panel simport-panel--danger">
                        <p className="row gap-2 simport-t125 font-semibold m-0 mb-1.5">
                            <XCircle size={13} aria-hidden />
                            {summary.invalid} row{summary.invalid !== 1 ? 's' : ''} will be skipped — fix errors before importing
                        </p>
                        <div className="row gap-1 flex-wrap">
                            {validatedStudents.filter(s => !s.valid && !s.isDuplicate).map((s, i) => (
                                <span key={s.data._csvRow ?? i} className="chip chip--danger mono">
                                    {s.data._csvRow ? `Row ${s.data._csvRow}` : s.data.name || `Item ${i + 1}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Class-based Accordion */}
                <div className="col gap-3 simport-scroll">
                    {Object.entries(grouped).map(([classKey, classData]) => {
                        const hasInvalid = classData.invalidCount > 0;

                        return (
                            <details
                                key={classKey}
                                className="rounded-lg overflow-hidden simport-acc"
                                open={hasInvalid || Object.keys(grouped).length <= 2}
                            >
                                <summary className="row gap-3 simport-acc__summary">
                                    <span className={`simport-classico ${hasInvalid ? "has-invalid" : classData.duplicateCount > 0 ? "has-dup" : ""}`}>
                                        <GraduationCap size={14} aria-hidden />
                                    </span>
                                    <div className="col gap-px flex-1 min-w-0">
                                        <p className="simport-t13 font-semibold m-0">{classKey}</p>
                                        <div className="row gap-2 subtle simport-t11">
                                            <span>{classData.students.length} student{classData.students.length !== 1 ? 's' : ''}</span>
                                            <span>•</span>
                                            <span className="simport-c-ok">{classData.validCount} valid</span>
                                            {classData.invalidCount > 0 && (<><span>•</span><span className="simport-c-danger">{classData.invalidCount} invalid</span></>)}
                                            {classData.duplicateCount > 0 && (<><span>•</span><span className="simport-c-warn">{classData.duplicateCount} duplicate</span></>)}
                                        </div>
                                    </div>
                                    <span className="simport-chevron">
                                        <ChevronRight size={16} aria-hidden />
                                    </span>
                                </summary>
                                <div className="col gap-2 simport-acc__body">
                                    {classData.students.map((student, idx) => (
                                            <div
                                                key={student.data?.admissionId || student.data?.name || `import-student-${idx}`}
                                                className={`simport-srow ${student.isDuplicate ? "is-dup" : student.valid ? "" : "is-invalid"}`}
                                            >
                                                <div className="row justify-between mb-2 items-start">
                                                    <div className="row gap-2 flex-1 min-w-0">
                                                        {student.isDuplicate ? <AlertTriangle size={14} aria-hidden className="simport-c-warn shrink-0" />
                                                            : student.valid ? <CheckCircle size={14} aria-hidden className="simport-c-ok shrink-0" />
                                                            : <XCircle size={14} aria-hidden className="simport-c-danger shrink-0" />}
                                                        <div className="col min-w-0 gap-px">
                                                            <p className="simport-t125 font-semibold m-0 truncate">
                                                                {student.data.name || 'Unnamed Student'}
                                                            </p>
                                                            <p className="subtle simport-t11 m-0">
                                                                {student.data._csvRow && <span className="mono">Row {student.data._csvRow} · </span>}
                                                                ID: {student.data.admissionId || 'No ID'}{student.data.section ? ` • Section ${student.data.section}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="row gap-1 shrink-0">
                                                        {student.isDuplicate && <Chip size="sm" color="warning" className="h-5 text-xs">{t('pages.duplicate1')}</Chip>}
                                                        {!student.isDuplicate && student.warnings.length > 0 && <Chip size="sm" color="warning" className="h-5 text-xs">{student.warnings.length} {student.warnings.length === 1 ? 'Warn' : 'Warns'}</Chip>}
                                                        {!student.isDuplicate && !student.valid && <Chip size="sm" color="danger" className="h-5 text-xs">{t('pages.invalid')}</Chip>}
                                                    </div>
                                                </div>

                                                {!student.valid && !student.isDuplicate && Object.keys(student.errors).length > 0 && (
                                                    <div className="simport-subblock simport-subblock--danger">
                                                        <div className="col gap-0.5">
                                                            {Object.entries(student.errors).slice(0, 2).map(([field, error]) => (
                                                                <div key={field} className="simport-t11">
                                                                    <span className="font-semibold simport-c-danger capitalize">{field}:</span>
                                                                    <span className="simport-c-danger ml-1">{error}</span>
                                                                </div>
                                                            ))}
                                                            {Object.keys(student.errors).length > 2 && (
                                                                <div className="simport-t11 italic simport-c-danger">
                                                                    +{Object.keys(student.errors).length - 2} more error{Object.keys(student.errors).length - 2 > 1 ? 's' : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!student.isDuplicate && student.warnings.length > 0 && (
                                                    <div className="simport-subblock simport-subblock--warn">
                                                        <ul className="col gap-0.5 pl-3.5">
                                                            {student.warnings.slice(0, 2).map((w, i) => (
                                                                <li key={`warn-${i}`} className="simport-t11 simport-c-warn">{w}</li>
                                                            ))}
                                                            {student.warnings.length > 2 && <li className="simport-t11 simport-c-warn italic">+{student.warnings.length - 2} more warning{student.warnings.length - 2 > 1 ? 's' : ''}</li>}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="fgrid simport-t11">
                                                    <div className="subtle"><span className="faint">{t('pages.roll')}</span> {student.data.rollNo || '—'}</div>
                                                    <div className="subtle"><span className="faint">{t('pages.gender2')}</span> {student.data.gender || '—'}</div>
                                                    <div className="subtle truncate">
                                                        <span className="faint">{t('pages.parent1')}</span> {student.data.parentName || '—'}
                                                    </div>
                                                    <div className="subtle"><span className="faint">{t('pages.phone2')}</span> {student.data.parentPhone || '—'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            </details>
                        );
                    })}

                    {filteredStudents.length === 0 && (
                        <div className="col items-center py-8 gap-1.5">
                            <Users size={36} aria-hidden className="faint" />
                            <p className="simport-t13 font-medium m-0 muted">
                                {t('pages.noStudentsToDisplay', 'No students to display')}
                            </p>
                            <p className="faint simport-t12 m-0">
                                {t('pages.tryChangingTheFilterAbove', 'Try changing the filter above')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
