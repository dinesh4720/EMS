import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Save,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
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
import {
  Badge,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  InlineEdit,
  SectionHeading,
  Select,
  Skeleton,
} from "../../components/ui";

import StudentsPreviewModal from "./feeStructure/StudentsPreviewModal";

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

const calculateAnnualTotal = (feeHeads) =>
  feeHeads.reduce((sum, head) => {
    let annualAmount = head.amount || 0;
    if (head.frequency === "monthly") annualAmount *= 12;
    else if (head.frequency === "quarterly") annualAmount *= 4;
    else if (head.frequency === "term" && head.applicableTerms) {
      annualAmount *= head.applicableTerms.length;
    }
    return sum + annualAmount;
  }, 0);

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
        totalAnnualFee: data.totalAnnualFee || 0,
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
    const template = templates.find((tpl) => tpl._id === templateId);
    if (template) {
      const annual = template.totalAnnualFee || 0;
      setFormData({
        templateId,
        feeHeads: template.feeHeads || [],
        collectionSchedule: {
          mode: "term",
          installments: generateInstallments(template.feeHeads, "term", annual),
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

  const handleApplyToStudents = () => {
    if (!selectedClass) {
      toast.error(t("toast.error.pleaseSelectAClassFirst"));
      return;
    }
    showConfirm({
      title: t("pages.applyFeeStructure", "Apply Fee Structure"),
      message: t(
        "confirm.applyFeeStructure",
        "Apply this fee structure to all students in the selected class? This cannot be undone.",
      ),
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

  const classOptions = useMemo(
    () => (classes || []).map((cls) => ({ value: cls._id, label: `${cls.name} - ${cls.section}` })),
    [classes],
  );

  const templateOptions = useMemo(
    () => [
      { value: "", label: t("pages.selectATemplateOptional", "Select a template (optional)") },
      ...templates.map((tpl) => ({
        value: tpl._id,
        label: `${tpl.name} — ${tpl.section} • ${fmt(tpl.totalAnnualFee || 0)}/year`,
      })),
    ],
    [templates, t, fmt],
  );

  return (
    <Card padding="md" elevation="raised" className="space-y-6">
      <SectionHeading
        description={t(
          "pages.createOrUpdateFeeStructureForASpecificClass",
          "Create or update fee structure for a specific class",
        )}
        actions={
          existingStructure ? (
            <Badge color="success" dot>
              {t("pages.structureExists", "Structure exists")}
            </Badge>
          ) : null
        }
      >
        {t("pages.assignFeeStructureToClass", "Assign Fee Structure to Class")}
      </SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t("pages.selectClass1", "Select Class")}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          options={[
            { value: "", label: t("pages.chooseAClass", "Choose a class") },
            ...classOptions,
          ]}
        />
        <Select
          label={t("pages.academicYear1", "Academic Year")}
          value={academicYear}
          onChange={(e) => {
            const next = e.target.value;
            setAcademicYearOverride(next === currentAcademicYear ? null : next);
          }}
          options={academicYearOptions.map((year) => ({ value: year, label: year }))}
        />
      </div>

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
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {templateError && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
              <AlertCircle size={18} className="text-red-500 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t("toast.error.failedToLoadFeeTemplates", "Failed to load fee templates")}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{templateError}</p>
              </div>
              <Button size="sm" variant="outline" onClick={fetchTemplates}>
                {t("pages.retry", "Retry")}
              </Button>
            </div>
          )}

          {!structureLoading && (
            <div className="space-y-3 border-t border-divider pt-5">
              <div>
                <h4 className="text-sm font-semibold text-fg">
                  {t("pages.selectFeeTemplate", "Select Fee Template")}
                </h4>
                <p className="text-xs text-fg-muted">
                  {t(
                    "pages.chooseFromExistingTemplatesOrCreateCustomStructure",
                    "Choose from existing templates or create a custom structure",
                  )}
                </p>
              </div>
              <Select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                options={templateOptions}
              />
            </div>
          )}

          {formData.feeHeads.length > 0 && (
            <>
              <div className="border-t border-divider pt-5">
                <SectionHeading
                  size="md"
                  description={t("pages.reviewAndCustomizeAmountsIfNeeded", "Review and customize amounts if needed")}
                  actions={
                    <Badge color="primary">
                      {fmt(formData.totalAnnualFee)}/{t("pages.year", "year")}
                    </Badge>
                  }
                >
                  {t("pages.feeHeads1", "Fee Heads")}
                </SectionHeading>

                <ul className="mt-4 space-y-3">
                  {formData.feeHeads.map((head, index) => (
                    <li
                      key={head._id || `${head.name}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-divider bg-surface-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-fg">{head.name}</span>
                          <Badge color={head.mandatory ? "success" : "warning"} size="sm">
                            {head.mandatory ? t("common.mandatory", "Mandatory") : t("common.optional", "Optional")}
                          </Badge>
                          <Chip size="sm" color="neutral">{head.frequency}</Chip>
                        </div>
                        <p className="text-xs text-fg-muted mt-1">{head.category}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-fg-muted">{currencySymbol}</span>
                        <InlineEdit
                          type="number"
                          numeric
                          ariaLabel={t("pages.amount1", "Amount")}
                          value={head.amount}
                          min={0}
                          width="8rem"
                          validate={(val) => (val < 0 ? t("common.mustBePositive", "Must be ≥ 0") : null)}
                          display={(val) => fmt(val ?? 0)}
                          onSave={(val) => updateFeeHeadAmount(index, val)}
                        />
                        <IconButton
                          icon={<Trash2 size={14} />}
                          aria-label={t("common.remove", "Remove")}
                          size="sm"
                          variant="danger"
                          onClick={() => removeFeeHead(index)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-divider pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">
                      {t("pages.collectionSchedule", "Collection Schedule")}
                    </h4>
                    <p className="text-xs text-fg-muted">
                      {t("pages.configureHowFeesWillBeCollected", "Configure how fees will be collected")}
                    </p>
                  </div>
                  <Select
                    aria-label={t("pages.collectionSchedule", "Collection Schedule")}
                    value={formData.collectionSchedule.mode}
                    onChange={(e) => handleCollectionModeChange(e.target.value)}
                    options={COLLECTION_MODES.map((mode) => ({
                      value: mode.value,
                      label: t(`fees.collectionMode.${mode.value}`, mode.label),
                    }))}
                    className="sm:w-56"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.collectionSchedule.installments.map((installment) => (
                    <div
                      key={installment._id || installment.name}
                      className="p-4 rounded-lg border border-divider bg-surface"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-fg">
                          {installment.name}
                        </span>
                        <Badge color="neutral" size="sm">
                          {t("fees.dueLabel", {
                            date: installment.dueDate
                              ? new Date(installment.dueDate).toLocaleDateString(getDateLocale(), {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—",
                            defaultValue: `Due ${installment.dueDate || "—"}`,
                          })}
                        </Badge>
                      </div>
                      <p className="text-xl font-semibold font-mono text-fg">
                        {fmt(installment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-divider">
                <Button
                  variant="outline"
                  icon={<Users size={16} />}
                  onClick={handlePreviewStudents}
                  disabled={!existingStructure}
                >
                  {t("pages.previewStudents", "Preview Students")} ({previewStudents.length})
                </Button>
                <Button
                  variant="secondary"
                  icon={<Save size={16} />}
                  loading={saving}
                  onClick={handleSaveStructure}
                >
                  {t("pages.saveStructure", "Save Structure")}
                </Button>
                {existingStructure && (
                  <Button
                    variant="primary"
                    icon={<CheckCircle size={16} />}
                    loading={applying}
                    onClick={handleApplyToStudents}
                  >
                    {t("pages.applyToStudents1", "Apply to Students")}
                  </Button>
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
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </Card>
  );
}

FeeStructureAssignment.propTypes = {
  classes: PropTypes.array,
  onAssignmentComplete: PropTypes.func,
};
