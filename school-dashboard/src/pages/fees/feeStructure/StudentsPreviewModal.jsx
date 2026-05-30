import { useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { CheckCircle, Users, X, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCurrency } from "../../../context/hooks/useCurrency";

const STATUS_TONE = {
  paid: "ok",
  partial: "warn",
  pending: "danger",
};

// Right-pane preview drawer for the FeeStructureAssignment flow.
// Replaces the centered modal with a StaffDetailPane-style sheet so the user
// can keep the structure form visible while inspecting which students will
// be affected by an apply-to-students bulk operation.
export default function StudentsPreviewModal({
  isOpen,
  onClose,
  students,
  applying,
  onApply,
  classDoc,
  academicYear,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  // Esc closes; lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // The /students/class/:classId/fee-status endpoint only returns students who
  // already have a StudentFeeStructure for the year — it doesn't list "new"
  // students yet to be initialised. So `existingCount` IS `totalCount` here,
  // and the "to be created" delta is implicit. We surface "with structure" so
  // the user understands the bulk-apply will skip these and only create
  // structures for the rest.
  const totalCount = students.length;
  const pendingCount = students.filter(
    (s) => (s.overallStatus || s.status) === "pending",
  ).length;
  const partialCount = students.filter(
    (s) => (s.overallStatus || s.status) === "partial",
  ).length;
  const paidCount = students.filter(
    (s) => (s.overallStatus || s.status) === "paid",
  ).length;

  const className = classDoc
    ? `${classDoc.name}${classDoc.section ? ` — ${classDoc.section}` : ""}`
    : t("pages.studentsInClass", "Students in Class");

  return createPortal(
    <div
      className="composer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("pages.studentsInClass", "Students in Class")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ justifyContent: "flex-end", padding: 0 }}
    >
      <aside
        className="detail-pane fees-preview"
        role="complementary"
        aria-label={`Preview: ${className}`}
      >
        <div className="detail-pane__head">
          <button
            type="button"
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            onClick={onClose}
            aria-label={t("common.close", "Close")}
          >
            <X size={13} />
          </button>
          <span className="subtle mono tnum" style={{ fontSize: 11 }}>
            {className}
          </span>
          <div style={{ flex: 1 }} />
          {academicYear && (
            <span className="chip mono tnum" aria-label="Academic year">
              {academicYear}
            </span>
          )}
        </div>

        <div className="detail-pane__hero">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {t("pages.previewStudents", "Preview Students")}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-subtle)" }}>
              {t(
                "pages.reviewBeforeApplyingFeeStructure",
                "Review who is affected before applying. Students with an existing structure are skipped so balances are preserved.",
              )}
            </p>
          </div>
        </div>

        <div className="detail-pane__metrics">
          <div className="dp-metric">
            <span className="dp-metric__label">{t("pages.totalStudents1", "Total")}</span>
            <span className="dp-metric__value mono tnum">{totalCount}</span>
          </div>
          <div className="dp-metric">
            <span className="dp-metric__label">{t("pages.pending2", "Pending")}</span>
            <span className="dp-metric__value mono tnum dp-metric__value--danger">
              {pendingCount + partialCount}
            </span>
          </div>
          <div className="dp-metric">
            <span className="dp-metric__label">{t("pages.fullyPaid", "Paid")}</span>
            <span className="dp-metric__value mono tnum dp-metric__value--ok">
              {paidCount}
            </span>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="help-banner" style={{ margin: "12px 20px 0", fontSize: 11.5 }}>
            <AlertTriangle size={11} style={{ marginTop: 1, flexShrink: 0 }} aria-hidden />
            <span style={{ flex: 1, minWidth: 0 }}>
              {t(
                "pages.skipExistingStructuresWarning",
                "{{count}} student(s) already have a structure and will be skipped (existing balances stay intact).",
                { count: totalCount },
              )}
            </span>
          </div>
        )}

        <div className="detail-pane__section" style={{ paddingTop: 12 }}>
          <div className="section__head" style={{ marginBottom: 8 }}>
            <span className="section__title">{t("pages.students", "Students")}</span>
            <span className="subtle mono tnum" style={{ fontSize: 11 }}>
              {totalCount}
            </span>
          </div>

          {totalCount === 0 ? (
            <div className="fees-table__empty">
              <Users
                size={20}
                aria-hidden
                style={{ display: "inline-block", marginBottom: 8, opacity: 0.5 }}
              />
              <div>
                {t(
                  "pages.noStudentsWithStructureYet",
                  "No students have a fee structure yet — Apply will create one for every active student in this class.",
                )}
              </div>
            </div>
          ) : (
            <ul className="fees-preview__list">
              {students.map((student) => {
                const id = student.studentId || student.id;
                const name = student.studentName || student.name;
                const status = student.overallStatus || student.status || "pending";
                const tone = STATUS_TONE[status] || "info";
                const balance =
                  student.totalBalance ?? student.balanceAmount ?? 0;
                return (
                  <li key={id} className="fees-preview__row">
                    <div className="fees-preview__main">
                      <span className="fees-preview__name">{name}</span>
                      <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                        {student.admissionId || "—"}
                        {student.rollNo ? ` · #${student.rollNo}` : ""}
                      </span>
                    </div>
                    <div className="fees-preview__amt">
                      <span className="mono tnum" style={{ fontWeight: 520 }}>
                        {fmt(balance)}
                      </span>
                      <span className={`chip chip--${tone === "ok" ? "ok" : tone === "warn" ? "warn" : "danger"}`}>
                        {status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="detail-pane__foot">
          <button type="button" className="btn" onClick={onClose}>
            {t("common.close", "Close")}
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn--accent"
            onClick={onApply}
            disabled={applying}
          >
            <CheckCircle size={11} />
            {applying
              ? t("common.applying", "Applying…")
              : t("pages.applyToAllStudents", "Apply to All Students")}
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

StudentsPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  students: PropTypes.array.isRequired,
  applying: PropTypes.bool,
  onApply: PropTypes.func.isRequired,
  classDoc: PropTypes.object,
  academicYear: PropTypes.string,
};
