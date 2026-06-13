import { Chip, Spinner, Progress } from "@heroui/react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import {
    Check, Download, Upload, FileSpreadsheet, FileText, AlertTriangle, Info,
    CheckCircle, XCircle, Users, ChevronRight, GraduationCap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "../../../../components/ui/Modal";
import { groupStudentsByClassSection } from "../../utils/studentImportUtils";

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
                    <FileSpreadsheet size={14} aria-hidden style={{ color: "var(--accent)" }} />
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
                                <Spinner size="sm" />
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
            <div className="col" style={{ gap: 16 }}>
                {/* Instructions Section */}
                <div
                    style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 14,
                    }}
                >
                    <h4 className="row gap-2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                        <Info size={14} aria-hidden style={{ color: "var(--accent)" }} />
                        How to Bulk Upload Students
                    </h4>
                    <ol className="col" style={{ gap: 4, fontSize: 12.5, color: "var(--fg-muted)", paddingLeft: 18 }}>
                        <li>{t('pages.downloadTheCsvTemplateUsingTheButtonBelow')}</li>
                        <li>{t('pages.fillInTheStudentDataFollowingTheColumnFormat')}</li>
                        <li>Required fields: <span style={{ fontWeight: 600, color: "var(--fg)" }}>admissionId, name, class</span></li>
                        <li>Class names are flexible: <span className="mono">{t('pages.class3')}</span>, <span className="mono">3</span>, or <span className="mono">class 3</span> all work</li>
                        <li><span style={{ fontWeight: 600, color: "var(--fg)" }}>{t('pages.section1')}</span> is required if the class has sections (e.g., A, B, C)</li>
                        <li>{t('pages.uploadTheFilledCsvFile')}</li>
                        <li>{t('pages.reviewAndConfirmTheImportSummaryGroupedByClass')}</li>
                    </ol>
                </div>

                {/* Download Template Button */}
                <div className="row" style={{ justifyContent: "center" }}>
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
                    style={{
                        position: "relative",
                        border: `2px dashed ${csvFile ? "var(--ok)" : csvDragActive ? "var(--accent)" : "var(--border-strong)"}`,
                        background: csvFile ? "var(--ok-bg)" : csvDragActive ? "var(--accent-bg)" : "var(--surface)",
                        borderRadius: 10,
                        padding: 32,
                        textAlign: "center",
                        transition: "all 160ms ease",
                    }}
                    onDragEnter={handleCsvDrag}
                    onDragLeave={handleCsvDrag}
                    onDragOver={handleCsvDrag}
                    onDrop={handleCsvDrop}
                >
                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                        aria-label="Choose a CSV file to upload"
                        onChange={(e) => handleCsvFileSelect(e.target.files[0])}
                    />
                    <div className="col" style={{ gap: 10, alignItems: "center" }}>
                        <span
                            className="opt__icon"
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 999,
                                background: csvFile ? "var(--ok)" : "var(--surface-2)",
                                color: csvFile ? "white" : "var(--fg-faint)",
                            }}
                        >
                            {csvFile ? <Check size={22} aria-hidden /> : <Upload size={22} aria-hidden />}
                        </span>
                        {csvFile ? (
                            <>
                                <p style={{ fontWeight: 600, color: "var(--ok)", margin: 0 }}>{csvFile.name}</p>
                                <p className="subtle" style={{ fontSize: 12, margin: 0 }}>{(csvFile.size / 1024).toFixed(2)} KB</p>
                                <button
                                    type="button"
                                    className="btn btn--sm"
                                    style={{ color: "var(--danger)", borderColor: "var(--danger)", marginTop: 4 }}
                                    onClick={(e) => { e.stopPropagation(); setCsvFile(null); }}
                                >
                                    Remove File
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ fontWeight: 600, margin: 0 }}>{t('pages.dragDropYourCsvFileHere', 'Drag & drop your CSV file here')}</p>
                                <p className="subtle" style={{ fontSize: 12, margin: 0 }}>or click to browse files</p>
                                <p className="faint" style={{ fontSize: 11, margin: 0 }}>{t('pages.onlyCsvFilesAreSupported', 'Only .csv files are supported')}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Column Requirements */}
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
                    <h4 className="row gap-2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                        <FileText size={14} aria-hidden style={{ color: "var(--accent)" }} />
                        CSV Column Requirements
                    </h4>
                    <div className="fgrid fgrid--3" style={{ gap: "4px 16px", fontSize: 11.5 }}>
                        <div className="col" style={{ gap: 2 }}>
                            <p style={{ fontWeight: 600, color: "var(--fg)", margin: 0 }}>{t('pages.studentInformation1')}</p>
                            <p className="subtle" style={{ margin: 0 }}>• admissionId (Required)</p>
                            <p className="subtle" style={{ margin: 0 }}>• name (Required)</p>
                            <p className="subtle" style={{ margin: 0 }}>• class (Required)</p>
                            <p className="subtle" style={{ margin: 0 }}>• section (if class has sections)</p>
                            <p className="subtle" style={{ margin: 0 }}>• rollNo</p>
                            <p className="subtle" style={{ margin: 0 }}>• gender</p>
                            <p className="subtle" style={{ margin: 0 }}>• dateOfBirth (YYYY-MM-DD)</p>
                            <p className="subtle" style={{ margin: 0 }}>• bloodGroup</p>
                        </div>
                        <div className="col" style={{ gap: 2 }}>
                            <p style={{ fontWeight: 600, color: "var(--fg)", margin: 0 }}>{t('pages.contactDetails1')}</p>
                            <p className="subtle" style={{ margin: 0 }}>• phone</p>
                            <p className="subtle" style={{ margin: 0 }}>• email</p>
                            <p className="subtle" style={{ margin: 0 }}>• whatsappNumber</p>
                            <p className="subtle" style={{ margin: 0 }}>• address</p>
                            <p className="subtle" style={{ margin: 0 }}>• city</p>
                            <p className="subtle" style={{ margin: 0 }}>• state</p>
                            <p className="subtle" style={{ margin: 0 }}>• zipCode</p>
                        </div>
                        <div className="col" style={{ gap: 2 }}>
                            <p style={{ fontWeight: 600, color: "var(--fg)", margin: 0 }}>{t('pages.parentOther')}</p>
                            <p className="subtle" style={{ margin: 0 }}>• parentName</p>
                            <p className="subtle" style={{ margin: 0 }}>• parentPhone</p>
                            <p className="subtle" style={{ margin: 0 }}>• parentEmail</p>
                            <p className="subtle" style={{ margin: 0 }}>• parentRelationship</p>
                            <p className="subtle" style={{ margin: 0 }}>• parentOccupation</p>
                            <p className="subtle" style={{ margin: 0 }}>• emergencyContactName</p>
                            <p className="subtle" style={{ margin: 0 }}>• emergencyContactPhone</p>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)", borderRadius: 8, padding: 14, color: "var(--warn)" }}>
                    <h4 className="row gap-2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        <AlertTriangle size={14} aria-hidden />
                        Important Notes
                    </h4>
                    <ul className="col" style={{ gap: 3, fontSize: 12.5, paddingLeft: 18 }}>
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
                    <FileSpreadsheet size={14} aria-hidden style={{ color: "var(--accent)" }} />
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
                                <Spinner size="sm" />
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
            <div className="col" style={{ gap: 12 }}>
                {/* Summary Cards */}
                <div className="fgrid fgrid--3" style={{ gap: 8 }}>
                    {[
                        { Icon: Users, label: t('pages.totalStudents1', 'Total'), value: summary.total, color: "var(--fg)" },
                        { Icon: CheckCircle, label: t('pages.valid', 'Valid'), value: summary.valid, color: "var(--ok)" },
                        { Icon: AlertTriangle, label: t('pages.duplicates', 'Duplicates'), value: summary.duplicates, color: "var(--warn)" },
                        { Icon: XCircle, label: t('pages.invalid', 'Invalid'), value: summary.invalid, color: "var(--danger)" },
                    ].map(({ Icon, label, value, color }) => (
                        <div
                            key={label}
                            className="col"
                            style={{
                                gap: 4,
                                padding: 12,
                                background: "var(--surface-2)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                            }}
                        >
                            <span className="row gap-2 subtle" style={{ fontSize: 11 }}>
                                <Icon size={13} aria-hidden style={{ color }} />
                                {label}
                            </span>
                            <span className="mono tnum" style={{ fontSize: 18, fontWeight: 700, color }}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Filter Buttons */}
                <div className="row gap-2" style={{ flexWrap: "wrap" }}>
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
                    <div style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: 8, padding: 12 }}>
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>
                                {t('pages.importingStudents', 'Importing students…')}
                            </span>
                            <span className="mono tnum" style={{ fontSize: 12.5, color: "var(--accent)" }}>
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
                    <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 8, padding: 10, color: "var(--danger)" }}>
                        <p className="row gap-2" style={{ fontSize: 12.5, fontWeight: 600, margin: "0 0 6px" }}>
                            <XCircle size={13} aria-hidden />
                            {summary.invalid} row{summary.invalid !== 1 ? 's' : ''} will be skipped — fix errors before importing
                        </p>
                        <div className="row gap-1" style={{ flexWrap: "wrap" }}>
                            {validatedStudents.filter(s => !s.valid && !s.isDuplicate).map((s, i) => (
                                <span key={s.data._csvRow ?? i} className="chip chip--danger mono">
                                    {s.data._csvRow ? `Row ${s.data._csvRow}` : s.data.name || `Item ${i + 1}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Class-based Accordion */}
                <div style={{ maxHeight: 480, overflowY: "auto" }} className="col gap-3">
                    {Object.entries(grouped).map(([classKey, classData]) => {
                        const hasInvalid = classData.invalidCount > 0;

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
                                        <div className="row gap-3" style={{ paddingRight: 12, width: "100%" }}>
                                            <span
                                                className="opt__icon"
                                                style={{
                                                    background: hasInvalid ? "var(--danger-bg)" : classData.duplicateCount > 0 ? "var(--warn-bg)" : "var(--ok-bg)",
                                                    color: hasInvalid ? "var(--danger)" : classData.duplicateCount > 0 ? "var(--warn)" : "var(--ok)",
                                                }}
                                            >
                                                <GraduationCap size={14} aria-hidden />
                                            </span>
                                            <div className="col" style={{ gap: 1 }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{classKey}</p>
                                                <div className="row gap-2 subtle" style={{ fontSize: 11 }}>
                                                    <span>{classData.students.length} student{classData.students.length !== 1 ? 's' : ''}</span>
                                                    <span>•</span>
                                                    <span style={{ color: "var(--ok)" }}>{classData.validCount} valid</span>
                                                    {classData.invalidCount > 0 && (<><span>•</span><span style={{ color: "var(--danger)" }}>{classData.invalidCount} invalid</span></>)}
                                                    {classData.duplicateCount > 0 && (<><span>•</span><span style={{ color: "var(--warn)" }}>{classData.duplicateCount} duplicate</span></>)}
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    indicator={<ChevronRight size={16} className="text-default-400 transition-transform duration-200" aria-hidden />}
                                >
                                    <div className="col gap-2" style={{ paddingTop: 4, paddingBottom: 4 }}>
                                        {classData.students.map((student, idx) => (
                                            <div
                                                key={student.data?.admissionId || student.data?.name || `import-student-${idx}`}
                                                style={{
                                                    borderRadius: 8,
                                                    border: `1px solid ${student.isDuplicate ? "var(--warn)" : student.valid ? "var(--ok)" : "var(--danger)"}`,
                                                    background: student.isDuplicate ? "var(--warn-bg)" : student.valid ? "var(--ok-bg)" : "var(--danger-bg)",
                                                    padding: 12,
                                                }}
                                            >
                                                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" }}>
                                                    <div className="row gap-2" style={{ flex: 1, minWidth: 0 }}>
                                                        {student.isDuplicate ? <AlertTriangle size={14} aria-hidden style={{ color: "var(--warn)", flexShrink: 0 }} />
                                                            : student.valid ? <CheckCircle size={14} aria-hidden style={{ color: "var(--ok)", flexShrink: 0 }} />
                                                            : <XCircle size={14} aria-hidden style={{ color: "var(--danger)", flexShrink: 0 }} />}
                                                        <div className="col" style={{ minWidth: 0, gap: 1 }}>
                                                            <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {student.data.name || 'Unnamed Student'}
                                                            </p>
                                                            <p className="subtle" style={{ fontSize: 11, margin: 0 }}>
                                                                {student.data._csvRow && <span className="mono">Row {student.data._csvRow} · </span>}
                                                                ID: {student.data.admissionId || 'No ID'}{student.data.section ? ` • Section ${student.data.section}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="row gap-1" style={{ flexShrink: 0 }}>
                                                        {student.isDuplicate && <Chip size="sm" color="warning" variant="flat" className="h-5 text-xs">{t('pages.duplicate1')}</Chip>}
                                                        {!student.isDuplicate && student.warnings.length > 0 && <Chip size="sm" color="warning" variant="flat" className="h-5 text-xs">{student.warnings.length} {student.warnings.length === 1 ? 'Warn' : 'Warns'}</Chip>}
                                                        {!student.isDuplicate && !student.valid && <Chip size="sm" color="danger" variant="flat" className="h-5 text-xs">{t('pages.invalid')}</Chip>}
                                                    </div>
                                                </div>

                                                {!student.valid && !student.isDuplicate && Object.keys(student.errors).length > 0 && (
                                                    <div style={{ background: "var(--danger-bg)", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                                                        <div className="col" style={{ gap: 2 }}>
                                                            {Object.entries(student.errors).slice(0, 2).map(([field, error]) => (
                                                                <div key={field} style={{ fontSize: 11 }}>
                                                                    <span style={{ fontWeight: 600, color: "var(--danger)", textTransform: "capitalize" }}>{field}:</span>
                                                                    <span style={{ color: "var(--danger)", marginLeft: 4 }}>{error}</span>
                                                                </div>
                                                            ))}
                                                            {Object.keys(student.errors).length > 2 && (
                                                                <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--danger)" }}>
                                                                    +{Object.keys(student.errors).length - 2} more error{Object.keys(student.errors).length - 2 > 1 ? 's' : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!student.isDuplicate && student.warnings.length > 0 && (
                                                    <div style={{ background: "var(--warn-bg)", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                                                        <ul className="col" style={{ gap: 2, paddingLeft: 14 }}>
                                                            {student.warnings.slice(0, 2).map((w, i) => (
                                                                <li key={`warn-${i}`} style={{ fontSize: 11, color: "var(--warn)" }}>{w}</li>
                                                            ))}
                                                            {student.warnings.length > 2 && <li style={{ fontSize: 11, color: "var(--warn)", fontStyle: "italic" }}>+{student.warnings.length - 2} more warning{student.warnings.length - 2 > 1 ? 's' : ''}</li>}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="fgrid" style={{ fontSize: 11 }}>
                                                    <div className="subtle"><span className="faint">{t('pages.roll')}</span> {student.data.rollNo || '—'}</div>
                                                    <div className="subtle"><span className="faint">{t('pages.gender2')}</span> {student.data.gender || '—'}</div>
                                                    <div className="subtle" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        <span className="faint">{t('pages.parent1')}</span> {student.data.parentName || '—'}
                                                    </div>
                                                    <div className="subtle"><span className="faint">{t('pages.phone2')}</span> {student.data.parentPhone || '—'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionItem>
                            </Accordion>
                        );
                    })}

                    {filteredStudents.length === 0 && (
                        <div className="col" style={{ alignItems: "center", padding: "32px 0", gap: 6 }}>
                            <Users size={36} aria-hidden style={{ color: "var(--fg-faint)" }} />
                            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--fg-muted)" }}>
                                {t('pages.noStudentsToDisplay', 'No students to display')}
                            </p>
                            <p className="faint" style={{ fontSize: 12, margin: 0 }}>
                                {t('pages.tryChangingTheFilterAbove', 'Try changing the filter above')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
