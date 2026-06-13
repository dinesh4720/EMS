import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, FolderTree } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { request } from "../../services/api.js";
import { useApp } from "../../context/AppContext";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import logger from "../../utils/logger";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SectionHeading,
  Skeleton,
} from "../../components/ui";

import FeeTemplateCard from "./feeTemplates/FeeTemplateCard";
import FeeTemplateModal from "./feeTemplates/FeeTemplateModal";

const SECTIONS = [
  { key: "primary", label: "Primary Section (Classes 1-5)" },
  { key: "middle", label: "Middle School (Classes 6-8)" },
  { key: "secondary", label: "Secondary School (Classes 9-10)" },
  { key: "senior", label: "Senior Secondary (Classes 11-12)" },
];

const emptyForm = {
  name: "",
  description: "",
  section: "primary",
  applicableFor: [],
  feeHeads: [],
  isActive: true,
};

const newFeeHead = () => ({
  name: "",
  category: "Academic",
  amount: 0,
  frequency: "yearly",
  mandatory: true,
  applicableTerms: [1, 2],
  dueDay: 10,
  refundable: false,
});

export default function FeeTemplatesManagement() {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchTemplates = useCallback(async (signal) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await request(`/fee-templates?academicYear=${currentAcademicYear}`, { signal });
      if (signal?.aborted) return;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.name === 'AbortError') return;
      logger.error("Failed to fetch templates:", error);
      setLoadError(error);
      toast.error(t("toast.error.failedToLoadFeeTemplates"));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentAcademicYear, t]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTemplates(controller.signal);
    return () => controller.abort();
  }, [fetchTemplates]);

  const calculateTotalAnnualFee = useCallback(
    (feeHeads) =>
      feeHeads.reduce((total, head) => {
        let annualAmount = head.amount || 0;
        if (head.frequency === "monthly") annualAmount *= 12;
        else if (head.frequency === "quarterly") annualAmount *= 4;
        else if (head.frequency === "term" && head.applicableTerms) {
          annualAmount *= head.applicableTerms.length;
        }
        return total + annualAmount;
      }, 0),
    [],
  );

  const totalAnnualFee = useMemo(
    () => calculateTotalAnnualFee(formData.feeHeads),
    [formData.feeHeads, calculateTotalAnnualFee],
  );

  const handleOpen = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || "",
        section: template.section,
        applicableFor: template.applicableFor || [],
        feeHeads: template.feeHeads || [],
        isActive: template.isActive,
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        ...emptyForm,
        feeHeads: [
          {
            name: "Tuition Fee",
            category: "Academic",
            amount: 5000,
            frequency: "monthly",
            mandatory: true,
            applicableTerms: [1, 2],
            dueDay: 10,
            refundable: false,
          },
        ],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t("toast.error.templateNameIsRequired"));
      return;
    }
    if (formData.feeHeads.length === 0) {
      toast.error(t("toast.error.atLeastOneFeeHeadIsRequired"));
      return;
    }
    if (formData.feeHeads.some((head) => !head.name?.trim())) {
      toast.error(t("toast.error.allFeeHeadsMustHaveName", "All fee heads must have a name"));
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, totalAnnualFee };
      const endpoint = selectedTemplate
        ? `/fee-templates/${selectedTemplate._id}`
        : `/fee-templates`;
      await request(endpoint, {
        method: selectedTemplate ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(
        selectedTemplate
          ? t("toast.success.templateUpdatedSuccessfully")
          : t("toast.success.templateCreatedSuccessfully"),
      );
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error) {
      logger.error("Failed to save template:", error);
      toast.error(error.message || t("toast.error.failedToSaveTemplate"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    let usageInfo = null;
    try {
      usageInfo = await request(`/fee-templates/${id}/usage`);
    } catch {
      // proceed without usage info
    }

    let message = t("confirm.deleteFeeTemplate");
    if (usageInfo?.studentCount > 0) {
      message +=
        " " +
        t("fees.templateUsedByStudents", {
          studentCount: usageInfo.studentCount,
          structureCount: usageInfo.structureCount,
        });
    } else if (usageInfo?.structureCount > 0) {
      message += " " + t("fees.templateUsedByStructures", { structureCount: usageInfo.structureCount });
    }

    showConfirm({
      title: t("pages.deleteFeeTemplate", "Delete Fee Template"),
      message,
      variant: "danger",
      confirmText: t("common.delete", "Delete"),
      onConfirm: async () => {
        try {
          await request(`/fee-templates/${id}`, { method: "DELETE" });
          toast.success(t("toast.success.templateDeletedSuccessfully"));
          fetchTemplates();
        } catch (error) {
          logger.error("Failed to delete template:", error);
          toast.error(error.message || t("toast.error.failedToDeleteTemplate"));
        }
      },
    });
  };

  const handleDuplicate = async (template) => {
    try {
      await request(`/fee-templates`, {
        method: "POST",
        body: JSON.stringify({ ...template, name: `${template.name} (Copy)`, _id: undefined }),
      });
      toast.success(t("toast.success.templateDuplicatedSuccessfully"));
      fetchTemplates();
    } catch (error) {
      logger.error("Failed to duplicate template:", error);
      toast.error(t("toast.error.failedToDuplicateTemplate"));
    }
  };

  const addFeeHead = () => {
    setFormData((prev) => ({ ...prev, feeHeads: [...prev.feeHeads, newFeeHead()] }));
  };

  const updateFeeHead = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.feeHeads];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, feeHeads: next };
    });
  };

  const removeFeeHead = (index) => {
    setFormData((prev) => ({
      ...prev,
      feeHeads: prev.feeHeads.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeading
          description={t(
            "pages.createAndManageReusableFeeStructuresForDifferentSections",
            "Create and manage reusable fee structures for different sections",
          )}
        >
          {t("pages.feeTemplates", "Fee Templates")}
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`tpl-skel-${i}`} padding="md" className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        description={t(
          "pages.createAndManageReusableFeeStructuresForDifferentSections",
          "Create and manage reusable fee structures for different sections",
        )}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpen()}
          >
            {t("pages.createTemplate", "Create Template")}
          </Button>
        }
      >
        {t("pages.feeTemplates", "Fee Templates")}
      </SectionHeading>

      {loadError ? (
        <ErrorState
          title={t("toast.error.failedToLoadFeeTemplates", "Failed to load fee templates")}
          error={loadError}
          onRetry={fetchTemplates}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SECTIONS.map((section) => {
            const sectionTemplates = templates.filter((tmpl) => tmpl.section === section.key);
            return (
              <Card key={section.key} padding="none" elevation="raised">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-divider bg-surface-2">
                  <div className="p-2 bg-surface-2 rounded-md text-fg">
                    <FolderTree size={20} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-fg">
                      {t("fees.section." + section.key, section.label)}
                    </h3>
                    <p className="text-xs text-fg-muted">
                      {t("fees.templateCount", { count: sectionTemplates.length, defaultValue: `${sectionTemplates.length} templates` })}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {sectionTemplates.length === 0 ? (
                    <EmptyState
                      size="sm"
                      title={t("pages.noTemplatesInThisSection", "No templates in this section")}
                    />
                  ) : (
                    sectionTemplates.map((template) => (
                      <FeeTemplateCard
                        key={template._id}
                        template={template}
                        onEdit={handleOpen}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FeeTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editing={selectedTemplate}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        onSave={handleSave}
        totalAnnualFee={totalAnnualFee}
        onAddFeeHead={addFeeHead}
        onUpdateFeeHead={updateFeeHead}
        onRemoveFeeHead={removeFeeHead}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
