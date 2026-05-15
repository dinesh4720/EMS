import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { z } from "zod";
import Modal from "../../../../components/ui/Modal";
import { getAuthHeaders } from "../../../../utils/authSession";
import logger from "../../../../utils/logger";

const REMARK_TYPES = [
  { value: "academic", label: "Academic" },
  { value: "behavioral", label: "Behavioral" },
  { value: "achievement", label: "Achievement" },
  { value: "attendance", label: "Attendance" },
  { value: "health", label: "Health" },
  { value: "general", label: "General" },
];

const remarkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Description must be at most 2000 characters"),
  category: z.string().min(1),
  sentToParent: z.boolean(),
});

const EMPTY_FORM = {
  type: "general",
  title: "",
  description: "",
  sendToParent: false,
};

export default function WriteRemarkModal({ isOpen, onClose, student, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSave = async () => {
    const parsed = remarkSchema.safeParse({
      title: form.title,
      description: form.description,
      category: form.type || "general",
      sentToParent: !!form.sendToParent,
    });
    if (!parsed.success) {
      const next = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (!next[key]) next[key] = issue.message;
      }
      setErrors({
        title: next.title,
        description: next.description,
      });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading(t("toast.loading.savingRemark"));
    try {
      const { request } = await import("../../../../services/api");
      await request(`/students/${student.id}/remarks`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(parsed.data),
      });
      toast.success("Remark saved successfully", { id: loadingToast });
      onSave?.();
      onClose();
    } catch (error) {
      logger.error("Error saving remark:", error);
      toast.error(
        "Failed to save remark: " + (error.message || "Unknown error"),
        { id: loadingToast }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("pages.writeARemark", "Write a remark")}
      description={student?.name ? `For ${student.name}` : undefined}
      size="md"
      isDismissable={!isSaving}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isSaving}
          >
            {t("pages.cancel2", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleSave}
            disabled={isSaving}
            aria-busy={isSaving || undefined}
          >
            {isSaving
              ? t("common.saving", "Saving…")
              : t("pages.saveRemark1", "Save Remark")}
          </button>
        </>
      }
    >
      <div className="section" style={{ margin: 0 }}>
        <div className="fgrid">
          <div className="field">
            <label className="field__label" htmlFor="remark-type">
              {t("pages.remarkType1", "Type")}
            </label>
            <select
              id="remark-type"
              className="select"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {REMARK_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label
              className="field__label"
              htmlFor="remark-send-to-parent"
              style={{ marginBottom: 6 }}
            >
              Visibility
            </label>
            <label
              htmlFor="remark-send-to-parent"
              className="row gap-2"
              style={{ cursor: "pointer", paddingTop: 4 }}
            >
              <input
                id="remark-send-to-parent"
                type="checkbox"
                checked={form.sendToParent}
                onChange={(e) => set("sendToParent", e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Send to parent</span>
            </label>
          </div>

          <div className="field span-2">
            <label className="field__label" htmlFor="remark-title">
              {t("pages.title1", "Title")}
              <span className="req" aria-hidden>
                *
              </span>
            </label>
            <input
              id="remark-title"
              className={`input ${errors.title ? "input--err" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t(
                "students.profile.remarks.titlePlaceholder",
                "Short summary"
              )}
              maxLength={120}
              aria-invalid={errors.title ? "true" : undefined}
              aria-describedby={errors.title ? "remark-title-err" : undefined}
            />
            {errors.title ? (
              <span
                id="remark-title-err"
                className="field__hint"
                style={{ color: "var(--danger)" }}
              >
                {errors.title}
              </span>
            ) : null}
          </div>

          <div className="field span-2">
            <label className="field__label" htmlFor="remark-desc">
              {t("pages.description1", "Description")}
              <span className="req" aria-hidden>
                *
              </span>
            </label>
            <textarea
              id="remark-desc"
              className={`textarea ${errors.description ? "input--err" : ""}`}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t(
                "pages.enterDetailedRemark",
                "Enter a detailed remark…"
              )}
              rows={5}
              maxLength={2000}
              aria-invalid={errors.description ? "true" : undefined}
              aria-describedby={
                errors.description ? "remark-desc-err" : undefined
              }
            />
            <div
              className="row"
              style={{ justifyContent: "space-between", gap: 8 }}
            >
              {errors.description ? (
                <span
                  id="remark-desc-err"
                  className="field__hint"
                  style={{ color: "var(--danger)" }}
                >
                  {errors.description}
                </span>
              ) : (
                <span className="field__hint">
                  {form.sendToParent
                    ? "Parent will see this remark in their app."
                    : "Visible to staff only."}
                </span>
              )}
              <span className="field__hint mono tnum">
                {form.description.length}/2000
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
