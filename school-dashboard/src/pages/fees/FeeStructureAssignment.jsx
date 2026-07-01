import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Save,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Check,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { feesApi } from "../../services/api.js";
import { feeStructureAssignmentSchema, parseFormSchema } from "../../validators/formSchemas";
import { useApp } from "../../context/AppContext";
import { useCurrency } from "../../context/hooks/useCurrency";
import { getAcademicYearOptions } from "../../utils/constants";
import { getDateLocale } from "../../i18n/index";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import logger from "../../utils/logger";
import { ConfirmDialog, EmptyState, Skeleton } from "../../components/ui";

import StudentsPreviewModal from "./feeStructure/StudentsPreviewModal";
import { calculateAnnualTotal } from "./utils/feeMath";

const COLLECTION_MODES = [
  { value: "term", label: "Term-wise" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly (One-time)" },
];

const getAcademicYearStart = (academicYear) => {
  const parsedYear = Number.parseInt(String(academicYear || "").split("-")[0], 10);
  return Number.isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
};

const buildAcademicYearDate = (academicYear, month, day, useNextYear = false) => {
  const startYear = getAcademicYearStart(academicYear);
  const year = useNextYear ? startYear + 1 : startYear;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export default function FeeStructureAssignment({ classes, onAssignmentComplete }) {
  const { t } = useTranslation();
  const { fmt, currencySymbol } = useCurrency();
  const { currentAcademicYear } = useApp();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 2 }),
    [currentAcademicYear],
  );

  const [templates, setTemplates] = useState([]);
  const [templateError, setTemplateError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [academicYearOverride, setAcademicYearOverride] = useState(null);
  const [existingStructure, setExistingStructure] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const academicYear = academicYearOverride || currentAcademicYear;

  const [formData, setFormData] = useState({
    templateId: "",
    feeHeads: [],
    collectionSchedule: { mode: "term", installments: [] },
    totalAnnualFee: 0,
  });

  const [previewStudents, setPreviewStudents] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Group classes by name (e.g. "Class 6") so the .optgrid lists grades and
  // .taginput chips show sections within that grade. Each .Class document is
  // still one section — assignment runs per-class under the hood.
  const gradeGroups = useMemo(() => {
    const map = new Map();
    (classes || []).forEach((cls) => {
      const key = String(cls.name || "Unnamed").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(cls);
    });
    return Array.from(map.entries())
      .map(([name, sections]) => ({
        name,
        sections: sections.sort((a, b) =>
          String(a.section || "").localeCompare(String(b.section || "")),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [classes]);

  const sectionsForSelectedGrade = useMemo(
    () => gradeGroups.find((g) => g.name === selectedGrade)?.sections || [],
    [gradeGroups, selectedGrade],
  );

  // When the grade changes, default to its first section so the user is never
  // stuck with an empty selection.
  useEffect(() => {
    if (!selectedGrade) {
      setSelectedClass("");
      return;
    }
    const sections = gradeGroups.find((g) => g.name === selectedGrade)?.sections || [];
    if (!sections.find((s) => s._id === selectedClass)) {
      setSelectedClass(sections[0]?._id || "");
    }
  }, [selectedGrade, gradeGroups, selectedClass]);

  const generateInstallments = useCallback(
    (feeHeads, mode, totalAnnualFee = formData.totalAnnualFee) => {
      const installments = [];

      if (mode === "term") {
        installments.push(
          { name: "Term 1", dueDate: buildAcademicYearDate(academicYear, 4, 15), amount: totalAnnualFee / 2, status: "pending" },
          { name: "Term 2", dueDate: buildAcademicYearDate(academicYear, 10, 15), amount: totalAnnualFee / 2, status: "pending" },
        );
      } else if (mode === "monthly") {
        const monthlyAmount = totalAnnualFee / 12;
        const monthlySchedule = [
          ["Apr", 4, false], ["May", 5, false], ["Jun", 6, false], ["Jul", 7, false],
          ["Aug", 8, false], ["Sep", 9, false], ["Oct", 10, false], ["Nov", 11, false],
          ["Dec", 12, false], ["Jan", 1, true], ["Feb", 2, true], ["Mar", 3, true],
        ];
        monthlySchedule.forEach(([label, month, useNextYear], index) => {
          installments.push({
            name: `${label} Fee`,
            dueDate: buildAcademicYearDate(academicYear, month, 10, useNextYear),
            amount: monthlyAmount,
            status: "pending",
            order: index + 1,
          });
        });
      } else if (mode === "quarterly") {
        installments.push(
          { name: "Q1 (Apr-Jun)", dueDate: buildAcademicYearDate(academicYear, 4, 15), amount: totalAnnualFee / 4, status: "pending" },
          { name: "Q2 (Jul-Sep)", dueDate: buildAcademicYearDate(academicYear, 7, 15), amount: totalAnnualFee / 4, status: "pending" },
          { name: "Q3 (Oct-Dec)", dueDate: buildAcademicYearDate(academicYear, 10, 15), amount: totalAnnualFee / 4, status: "pending" },
          { name: "Q4 (Jan-Mar)", dueDate: buildAcademicYearDate(academicYear, 1, 15, true), amount: totalAnnualFee / 4, status: "pending" },
        );
      } else if (mode === "yearly") {
        installments.push({
          name: "Annual",
          dueDate: buildAcademicYearDate(academicYear, 4, 15),
          amount: totalAnnualFee,
          status: "pending",
        });
      }

      return installments;
    },
    [academicYear, formData.totalAnnualFee],
  );

  const fetchTemplates = useCallback(async () => {
    setTemplateError(null);
    try {
      const data = await feesApi.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Failed to fetch templates:", error);
      setTemplateError(error.message || "Failed to load fee templates");
      toast.error(t("toast.error.failedToLoadTemplates"));
    }
  }, [t]);

  const fetchExistingStructure = useCallback(async () => {
    if (!selectedClass) return;
    setStructureLoading(true);
    try {
      const data = await feesApi.getFeeStructure(selectedClass, academicYear);
      setExistingStructure(data);
      setFormData({
        templateId: data.templateId?._id || data.templateId || "",
        feeHeads: data.feeHeads || [],
        collectionSchedule: data.collectionSchedule || { mode: "term", installments: [] },
        totalAnnualFee: data.totalAnnualFee || calculateAnnualTotal(data.feeHeads || []),
      });
      if (data.templateId?._id) {
        setSelectedTemplate(data.templateId._id);
      }
    } catch {
      setExistingStructure(null);
      setSelectedTemplate("");
      setFormData({
        templateId: "",
        feeHeads: [],
        collectionSchedule: { mode: "term", installments: [] },
        totalAnnualFee: 0,
      });
    } finally {
      setStructureLoading(false);
    }
  }, [selectedClass, academicYear]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (selectedClass && academicYear) {
      const timer = setTimeout(() => fetchExistingStructure(), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedClass, academicYear, fetchExistingStructure]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setFormData((prev) => ({ ...prev, templateId: "" }));
      return;
    }
    const template = templates.find((tpl) => tpl._id === templateId);
    if (template) {
      const feeHeads = template.feeHeads || [];
      const annual = template.totalAnnualFee || calculateAnnualTotal(feeHeads);
      setFormData({
        templateId,
        feeHeads,
        collectionSchedule: {
          mode: "term",
          installments: generateInstallments(feeHeads, "term", annual),
        },
        totalAnnualFee: annual,
      });
    }
  };

  const updateFeeHeadAmount = (index, amount) => {
    const updatedHeads = [...formData.feeHeads];
    updatedHeads[index] = { ...updatedHeads[index], amount: Math.max(0, parseFloat(amount) || 0) };
    const newTotal = calculateAnnualTotal(updatedHeads);
    setFormData({
      ...formData,
      feeHeads: updatedHeads,
      totalAnnualFee: newTotal,
      collectionSchedule: {
        ...formData.collectionSchedule,
        installments: generateInstallments(updatedHeads, formData.collectionSchedule.mode, newTotal),
      },
    });
  };

  const removeFeeHead = (index) => {
    const updatedHeads = formData.feeHeads.filter((_, i) => i !== index);
    const newTotal = calculateAnnualTotal(updatedHeads);
    setFormData({
      ...formData,
      feeHeads: updatedHeads,
      totalAnnualFee: newTotal,
      collectionSchedule: {
        ...formData.collectionSchedule,
        installments: generateInstallments(updatedHeads, formData.collectionSchedule.mode, newTotal),
      },
    });
  };

  const handleCollectionModeChange = (newMode) => {
    setFormData({
      ...formData,
      collectionSchedule: {
        mode: newMode,
        installments: generateInstallments(formData.feeHeads, newMode, formData.totalAnnualFee),
      },
    });
  };

  const handleSaveStructure = async () => {
    const { success, errors: zodErrors } = parseFormSchema(feeStructureAssignmentSchema, {
      classId: selectedClass,
      feeHeads: formData.feeHeads,
      academicYear,
    });
    if (!success) {
      toast.error(Object.values(zodErrors)[0] || t("toast.error.pleaseSelectAClassAndAddFeeHeads"));
      return;
    }
    setSaving(true);
    try {
      await feesApi.saveFeeStructure({ classId: selectedClass, academicYear, ...formData });
      toast.success(t("toast.success.feeStructureSavedSuccessfully"));
      fetchExistingStructure();
      onAssignmentComplete?.();
    } catch (error) {
      logger.error("Failed to save structure:", error);
      toast.error(t("toast.error.failedToSaveFeeStructure"));
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewStudents = async () => {
    if (!selectedClass) return;
    try {
      const data = await feesApi.getClassFeeStatus(selectedClass, academicYear);
      setPreviewStudents(Array.isArray(data) ? data : []);
      setIsPreviewOpen(true);
    } catch (error) {
      logger.error("Failed to fetch students:", error);
      toast.error(t("toast.error.failedToLoadStudentList"));
    }
  };

  const existingStudentCount = previewStudents.length;

  const handleApplyToStudents = () => {
    if (!selectedClass) {
      toast.error(t("toast.error.pleaseSelectAClassFirst"));
      return;
    }
    const overwriteWarning = existingStudentCount > 0
      ? ` ${existingStudentCount} student${existingStudentCount === 1 ? "" : "s"} already have a fee structure and will be skipped (existing balances are preserved).`
      : "";
    showConfirm({
      title: t("pages.applyFeeStructure", "Apply Fee Structure"),
      message:
        t(
          "confirm.applyFeeStructure",
          "Apply this fee structure to all students in the selected class? This cannot be undone.",
        ) + overwriteWarning,
      variant: "warning",
      confirmText: t("pages.apply", "Apply"),
      onConfirm: async () => {
        setApplying(true);
        try {
          const result = await feesApi.applyToStudents({ classId: selectedClass, academicYear });
          toast.success(result.message || t("toast.success.feeStructureApplied"));
          setIsPreviewOpen(false);
        } catch (error) {
          logger.error("Failed to apply structure:", error);
          toast.error(t("toast.error.failedToApplyFeeStructureToStudents"));
        } finally {
          setApplying(false);
        }
      },
    });
  };

  const templateOptions = useMemo(
    () => [
      { value: "", label: t("pages.selectATemplateOptional", "Select a template (optional)") },
      ...templates.map((tpl) => ({
        value: tpl._id,
        label: `${tpl.name} — ${tpl.section || "All"} • ${fmt(tpl.totalAnnualFee || 0)}/year`,
      })),
    ],
    [templates, t, fmt],
  );

  const selectedClassDoc = useMemo(
    () => sectionsForSelectedGrade.find((s) => s._id === selectedClass),
    [sectionsForSelectedGrade, selectedClass],
  );

  const totalsByCategory = useMemo(() => {
    const map = {};
    formData.feeHeads.forEach((h) => {
      const cat = h.category || "other";
      map[cat] = (map[cat] || 0) + (Number(h.amount) || 0);
    });
    return map;
  }, [formData.feeHeads]);

  return (
    <div className="fees-assign">
      {/* Class & year picker */}
      <section className="section">
        <div className="section__head">
          <div>
            <div className="section__title">
              {t("pages.assignFeeStructureToClass", "Assign Fee Structure to Class")}
            </div>
            <div className="section__hint">
              {t(
                "pages.createOrUpdateFeeStructureForASpecificClass",
                "Create or update fee structure for a specific class",
              )}
            </div>
          </div>
          {existingStructure && (
            <span className="chip chip--ok">
              <Check size={9} strokeWidth={2.5} aria-hidden /> {t("pages.structureExists", "Structure exists")}
            </span>
          )}
        </div>

        <div className="fgrid">
          <div className="field span-2">
            <label className="field__label" id="select-class-label">
              {t("pages.selectClass1", "Select Class")}
              <span className="req">*</span>
            </label>
            {gradeGroups.length === 0 ? (
              <EmptyState
                icon={Info}
                size="sm"
                title={t("pages.noClassesAvailable", "No classes available")}
              />
            ) : (
              <div className="optgrid" role="radiogroup" aria-labelledby="select-class-label">
                {gradeGroups.map((g) => {
                  const isActive = g.name === selectedGrade;
                  return (
                    <button
                      key={g.name}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`opt ${isActive ? "is-active" : ""}`}
                      onClick={() => setSelectedGrade(g.name)}
                    >
                      <span className="opt__icon" aria-hidden>
                        <Users size={12} strokeWidth={2} />
                      </span>
                      <span className="col" style={{ gap: 1, minWidth: 0, alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 520 }}>{g.name}</span>
                        <span className="subtle" style={{ fontSize: 11 }}>
                          {g.sections.length} {g.sections.length === 1 ? "section" : "sections"}
                        </span>
                      </span>
                      <span className="opt__check" aria-hidden>
                        <Check size={8} strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedGrade && (
            <div className="field span-2">
              <label className="field__label" id="section-label">
                {t("pages.section", "Section")}
                <span className="req">*</span>
              </label>
              <div className="taginput" role="radiogroup" aria-labelledby="section-label">
                {sectionsForSelectedGrade.map((s) => {
                  const isActive = s._id === selectedClass;
                  return (
                    <button
                      key={s._id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`tagchip${isActive ? "" : " tagchip--muted"}`}
                      onClick={() => setSelectedClass(s._id)}
                    >
                      {s.section || "—"}
                      {isActive && <Check size={10} strokeWidth={2.5} aria-hidden />}
                    </button>
                  );
                })}
              </div>
              <span className="field__hint">
                {t(
                  "pages.assignmentRunsPerSection",
                  "Each section gets its own structure. Switch sections to assign multiple.",
                )}
              </span>
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="academic-year">
              {t("pages.academicYear1", "Academic Year")}
            </label>
            <select
              id="academic-year"
              className="select mono tnum"
              value={academicYear}
              onChange={(e) => {
                const next = e.target.value;
                setAcademicYearOverride(next === currentAcademicYear ? null : next);
              }}
            >
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {!selectedClass && (
        <EmptyState
          icon={Info}
          size="md"
          title={t("pages.pleaseSelectAClassToAssignFeeStructure", "Please select a class to assign a fee structure")}
        />
      )}

      {selectedClass && (
        <>
          {structureLoading && (
            <div className="section">
              <Skeleton className="h-10 w-full" />
              <div style={{ height: 8 }} />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {templateError && (
            <div className="help-banner help-banner--danger">
              <AlertCircle size={12} style={{ marginTop: 1, flexShrink: 0 }} aria-hidden />
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{t("toast.error.failedToLoadFeeTemplates", "Failed to load fee templates")}</strong>
                <br />
                <span className="subtle">{templateError}</span>
              </span>
              <button type="button" className="btn btn--sm" onClick={fetchTemplates}>
                {t("pages.retry", "Retry")}
              </button>
            </div>
          )}

          {existingStructure && (
            <div className="help-banner">
              <AlertTriangle size={12} style={{ marginTop: 1, flexShrink: 0 }} aria-hidden />
              <span style={{ flex: 1, minWidth: 0 }}>
                {t(
                  "pages.feeStructureOverwriteWarning",
                  "Saving will overwrite the existing structure for this class & year. Already-assigned student structures keep their balances; only the class template changes.",
                )}
              </span>
            </div>
          )}

          {!structureLoading && (
            <section className="section">
              <div className="section__head">
                <div>
                  <div className="section__title">
                    {t("pages.selectFeeTemplate", "Select Fee Template")}
                  </div>
                  <div className="section__hint">
                    {t(
                      "pages.chooseFromExistingTemplatesOrCreateCustomStructure",
                      "Choose from existing templates or create a custom structure",
                    )}
                  </div>
                </div>
              </div>
              <label className="field__label" htmlFor="fee-template" style={{ marginBottom: 8, display: 'block' }}>
                {t("pages.feeTemplate", "Fee Template")}
              </label>
              <select
                id="fee-template"
                className="select"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                {templateOptions.map((opt) => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </section>
          )}

          {formData.feeHeads.length > 0 && (
            <>
              <section className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">{t("pages.feeHeads1", "Fee Heads")}</div>
                    <div className="section__hint">
                      {t("pages.reviewAndCustomizeAmountsIfNeeded", "Review and customize amounts if needed")}
                    </div>
                  </div>
                  <span className="chip chip--ok mono tnum" title="Annual total" aria-label="Annual total">
                    {fmt(formData.totalAnnualFee)}/{t("pages.year", "year")}
                  </span>
                </div>

                <ul className="fees-heads">
                  {formData.feeHeads.map((head, index) => (
                    <li key={head._id || `${head.name}-${index}`} className="fees-heads__row">
                      <div className="fees-heads__main">
                        <span className="fees-heads__name">{head.name}</span>
                        <div className="fees-heads__meta">
                          <span className={`chip ${head.mandatory ? "chip--ok" : "chip--warn"}`}>
                            {head.mandatory
                              ? t("common.mandatory", "Mandatory")
                              : t("common.optional", "Optional")}
                          </span>
                          <span className="subtle" style={{ fontSize: 11 }}>
                            {head.category} · {head.frequency}
                          </span>
                        </div>
                      </div>
                      <div className="fees-heads__amt">
                        <span className="subtle" style={{ fontSize: 11 }}>
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          aria-label={`${head.name} ${t("pages.amount1", "Amount")}`}
                          className="input mono tnum"
                          value={head.amount ?? 0}
                          onChange={(e) => updateFeeHeadAmount(index, e.target.value)}
                          style={{ width: "8rem", textAlign: "right" }}
                        />
                        <button
                          type="button"
                          className="iconbtn"
                          aria-label={t("common.remove", "Remove")}
                          onClick={() => removeFeeHead(index)}
                          style={{ color: "var(--danger)" }}
                        >
                          <Trash2 size={13} aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {Object.keys(totalsByCategory).length > 1 && (
                  <div className="fees-heads__totals">
                    {Object.entries(totalsByCategory).map(([cat, sum]) => (
                      <span key={cat} className="dp-kv">
                        <span className="subtle">{cat}</span>
                        <span className="mono tnum">{fmt(sum)}</span>
                      </span>
                    ))}
                    <span className="dp-kv" style={{ fontWeight: 600 }}>
                      <span>{t("pages.annualTotal", "Annual total")}</span>
                      <span className="mono tnum">{fmt(formData.totalAnnualFee)}</span>
                    </span>
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">
                      {t("pages.collectionSchedule", "Collection Schedule")}
                    </div>
                    <div className="section__hint">
                      {t("pages.configureHowFeesWillBeCollected", "Configure how fees will be collected")}
                    </div>
                  </div>
                  <select
                    aria-label={t("pages.collectionSchedule", "Collection Schedule")}
                    className="select"
                    value={formData.collectionSchedule.mode}
                    onChange={(e) => handleCollectionModeChange(e.target.value)}
                    style={{ width: 180 }}
                  >
                    {COLLECTION_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {t(`fees.collectionMode.${mode.value}`, mode.label)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fees-schedule">
                  {formData.collectionSchedule.installments.map((installment) => (
                    <div key={installment._id || installment.name} className="fees-schedule__cell">
                      <div className="fees-schedule__head">
                        <span className="fees-schedule__name">{installment.name}</span>
                        <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                          {installment.dueDate
                            ? new Date(installment.dueDate).toLocaleDateString(getDateLocale(), {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div className="fees-schedule__amt mono tnum">{fmt(installment.amount)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="fees-assign__foot">
                {selectedClassDoc && (
                  <span className="subtle" style={{ fontSize: 12 }}>
                    <Sparkles size={11} aria-hidden style={{ marginRight: 4, verticalAlign: -1 }} />
                    {selectedClassDoc.name} — {selectedClassDoc.section} · {academicYear}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  className="btn"
                  onClick={handlePreviewStudents}
                  disabled={!existingStructure}
                  title={
                    !existingStructure
                      ? t("pages.saveStructureFirstHint", "Save the structure first to preview students")
                      : undefined
                  }
                >
                  <Users size={11} aria-hidden />
                  {t("pages.previewStudents", "Preview Students")}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleSaveStructure}
                  disabled={saving}
                >
                  <Save size={11} aria-hidden />
                  {saving
                    ? t("common.saving", "Saving…")
                    : t("pages.saveStructure", "Save Structure")}
                </button>
                {existingStructure && (
                  <button
                    type="button"
                    className="btn btn--accent"
                    onClick={handleApplyToStudents}
                    disabled={applying}
                  >
                    <CheckCircle size={11} aria-hidden />
                    {applying
                      ? t("common.applying", "Applying…")
                      : t("pages.applyToStudents1", "Apply to Students")}
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      <StudentsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        students={previewStudents}
        applying={applying}
        onApply={handleApplyToStudents}
        classDoc={selectedClassDoc}
        academicYear={academicYear}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}

FeeStructureAssignment.propTypes = {
  classes: PropTypes.array,
  onAssignmentComplete: PropTypes.func,
};
