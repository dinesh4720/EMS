import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart4, Printer, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../../../components/ui/Modal";
import { escapeHtml } from "../../../../utils/sanitize";
import { bg, fg, border as borderColor } from "../../../../theme/printPalette";

export default function ProgressCardModal({
  isOpen,
  onClose,
  student,
  onNavigateToAcademics,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!student) return null;

  const handleDownload = () => {
    setLoading(true);
    if (onNavigateToAcademics) {
      onClose();
      onNavigateToAcademics();
      toast.success(
        "Opening academics tab — use the Download Report Card button there.",
        { duration: 4000 }
      );
      setLoading(false);
      return;
    }
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Progress Card - ${escapeHtml(student.name)}</title>
        <style>
          body{font-family:sans-serif;padding:20px;max-width:800px;margin:0 auto}
          h1{font-size:24px}
          table{width:100%;border-collapse:collapse;margin-top:16px}
          th,td{border:1px solid ${borderColor.default};padding:8px;text-align:left}
          th{background:${bg.head}}
          @page { size: A4; margin: 20mm; }
          @media print{button{display:none}}
        </style>
        </head><body>
        <h1>Student Progress Card</h1>
        <p><strong>Name:</strong> ${escapeHtml(student.name)}</p>
        <p><strong>Class:</strong> ${escapeHtml(student.class || "N/A")} &nbsp; <strong>Roll No:</strong> ${escapeHtml(student.rollNo || "N/A")}</p>
        <p><strong>Admission No:</strong> ${escapeHtml(student.admissionNo || "N/A")}</p>
        <p style="margin-top:16px;color:${fg.muted};font-size:14px">For detailed marks and grades, visit the Academics tab of the student profile.</p>
        <script>window.onload=function(){window.print()}</script>
        </body></html>
      `);
      printWindow.document.close();
      toast.success("Print window opened");
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups and try again.");
    }
    onClose();
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        "students.profile.overview.studentProgressCard",
        "Student progress card"
      )}
      description={
        student?.class
          ? t(
              "students.profile.overview.classRollInfo",
              "Class {{class}} • Roll {{roll}}",
              { class: student.class, roll: student.rollNo || "—" }
            )
          : undefined
      }
      size="sm"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleDownload}
            disabled={loading}
            aria-busy={loading || undefined}
          >
            {onNavigateToAcademics ? (
              <>
                <ExternalLink size={13} aria-hidden /> Open Academics
              </>
            ) : (
              <>
                <Printer size={13} aria-hidden />{" "}
                {t(
                  "students.profile.overview.printReport",
                  "Print Report"
                )}
              </>
            )}
          </button>
        </>
      }
    >
      <div
        className="col"
        style={{
          gap: 12,
          alignItems: "center",
          textAlign: "center",
          padding: "8px 4px",
        }}
      >
        <span
          className="opt__icon"
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "var(--accent-bg)",
            color: "var(--accent)",
          }}
          aria-hidden
        >
          <BarChart4 size={28} />
        </span>
        <div className="col" style={{ gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{student.name}</span>
          <span className="subtle" style={{ fontSize: 12.5 }}>
            {t(
              "students.profile.overview.generateProgressCardDesc",
              "Generate and download the detailed academic performance report card for the current academic year."
            )}
          </span>
        </div>
        <span
          className="field__hint"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            padding: "8px 10px",
            borderRadius: 8,
            maxWidth: 320,
          }}
        >
          {onNavigateToAcademics
            ? "Opens the Academics tab where you can download the full report card with marks and grades."
            : "The report includes marks, grades, and attendance summary."}
        </span>
      </div>
    </Modal>
  );
}
