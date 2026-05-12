import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { GraduationCap, AlertTriangle } from "lucide-react";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { getNextClass } from "../../utils/studentHelpers";
import logger from "../../../../utils/logger";

/**
 * PromoteStudentModal — alertdialog-style confirm that auto-calculates the
 * next class and lets the user commit. Uses ConfirmDialog so it matches
 * AddStaffComposer's discard pattern (centered, ESC closes, focus-trapped).
 */
export default function PromoteStudentModal({
  isOpen,
  onClose,
  student,
  availableClasses,
  classObjects = [],
  onPromote,
}) {
  const { t } = useTranslation();
  const [isPromoting, setIsPromoting] = useState(false);

  const nextClass = useMemo(
    () => (student?.class ? getNextClass(student.class, availableClasses) : null),
    [student?.class, availableClasses]
  );
  const isGraduation = nextClass === "Passed Out / Alumni";

  const handlePromote = async () => {
    if (!student?.class) {
      toast.error(t("toast.error.unableToDetermineCurrentClass"));
      return;
    }
    if (!nextClass) {
      toast.error(
        t("toast.error.unableToCalculateNextClassPleaseUpdateClassManually")
      );
      return;
    }

    setIsPromoting(true);
    const loadingToast = toast.loading(`Promoting ${student.name}...`);

    try {
      const { studentsApi } = await import("../../../../services/api");
      const studentId = student.id || student._id;

      if (isGraduation) {
        await studentsApi.promote(studentId, { graduate: true });
      } else {
        const match = nextClass.match(/^(\d+|[A-Za-z]+)(?:-([A-Z]))?$/i);
        let targetClassId = null;
        if (match && Array.isArray(classObjects)) {
          const [, grade, section = ""] = match;
          const target = classObjects.find(
            (cls) =>
              String(cls.name) === String(grade) &&
              (cls.section || "") === String(section)
          );
          if (target) targetClassId = target._id || target.id;
        }
        if (!targetClassId) {
          toast.error(
            `Target class "${nextClass}" not found. Create the class first.`,
            { id: loadingToast }
          );
          return;
        }
        await studentsApi.promote(studentId, { targetClassId });
      }

      toast.success(`${student.name} promoted to ${nextClass}`, {
        id: loadingToast,
      });
      onPromote?.(nextClass);
      onClose();
    } catch (error) {
      logger.error("Promotion error:", error);
      toast.error(
        "Failed to promote student: " + (error.message || "Unknown error"),
        { id: loadingToast }
      );
      throw error;
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handlePromote}
      title={t("pages.promoteStudent", "Promote Student")}
      message={
        <span>
          {t("students.modals.promoteIntro", {
            name: student?.name || "this student",
            defaultValue: `Promote ${student?.name || "this student"} from class `,
          })}
          <strong>{student?.class || "—"}</strong>
          {" → "}
          <strong>{nextClass || "—"}</strong>?
        </span>
      }
      confirmText={isPromoting ? "Promoting…" : "Promote"}
      cancelText={t("pages.cancel2", "Cancel")}
      variant={isGraduation ? "warning" : "info"}
      isLoading={isPromoting}
    >
      <div className="section" style={{ margin: 0 }}>
        <div
          className="row gap-2"
          style={{
            padding: "10px 12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          <GraduationCap size={16} aria-hidden style={{ color: "var(--accent)" }} />
          <div className="col" style={{ gap: 2 }}>
            <span className="subtle" style={{ fontSize: 11 }}>
              {t("pages.autoCalculatedNextClass", "Auto-calculated next class")}
            </span>
            <span className="mono tnum" style={{ fontWeight: 600, fontSize: 14 }}>
              {nextClass || "Unable to calculate"}
            </span>
          </div>
        </div>
        {isGraduation && (
          <div
            className="row gap-2"
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "var(--warn-bg)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--warn)",
            }}
          >
            <AlertTriangle size={13} aria-hidden />
            <span>This will mark the student as &quot;Passed Out / Alumni&quot;.</span>
          </div>
        )}
      </div>
    </ConfirmDialog>
  );
}
