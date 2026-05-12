import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { z } from "zod";
import Modal from "../../../../components/ui/Modal";
import logger from "../../../../utils/logger";

const moveSchema = z.object({
  newClass: z.string().min(1, "Please select a new class"),
});

export default function MoveClassModal({
  isOpen,
  onClose,
  student,
  availableClasses = [],
  classObjects = [],
  onMove,
}) {
  const { t } = useTranslation();
  const [newClass, setNewClass] = useState("");
  const [classError, setClassError] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNewClass("");
      setClassError("");
      setIsMoving(false);
    }
  }, [isOpen]);

  const classIdMap = useMemo(() => {
    const map = {};
    for (const cls of classObjects) {
      const label = cls.section ? `${cls.name}-${cls.section}` : cls.name;
      map[label] = cls._id || cls.id;
    }
    return map;
  }, [classObjects]);

  const handleMove = async () => {
    const parsed = moveSchema.safeParse({ newClass });
    if (!parsed.success) {
      setClassError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }
    if (parsed.data.newClass === student?.class) {
      setClassError("Student is already in this class");
      return;
    }

    setIsMoving(true);
    const loadingToast = toast.loading(t("toast.loading.movingStudentToNewClass"));
    try {
      const { request } = await import("../../../../services/api");
      const classId = classIdMap[parsed.data.newClass] || parsed.data.newClass;
      await request(`/students/${student.id}`, {
        method: "PUT",
        body: JSON.stringify({ classId }),
      });
      toast.success(
        t("toast.success.studentMovedToClass", {
          className: parsed.data.newClass,
          defaultValue: `Student moved to ${parsed.data.newClass}`,
        }),
        { id: loadingToast }
      );
      onMove?.(parsed.data.newClass);
      onClose();
    } catch (error) {
      logger.error("Error moving student:", error);
      toast.error(
        t("toast.error.failedToMoveStudent", "Failed to move student") +
          ": " +
          (error.message || t("common.unknownError", "Unknown error")),
        { id: loadingToast }
      );
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("pages.moveToAnotherClass", "Move to Another Class/Section")}
      description={
        student?.name
          ? `${student.name} · Current: ${student.class || "—"}`
          : undefined
      }
      size="sm"
      isDismissable={!isMoving}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isMoving}
          >
            {t("pages.cancel2", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleMove}
            disabled={isMoving || !newClass}
            aria-busy={isMoving || undefined}
          >
            {isMoving
              ? t("pages.moving", "Moving…")
              : t("pages.moveStudent", "Move Student")}
          </button>
        </>
      }
    >
      <div className="section" style={{ margin: 0 }}>
        <div className="field">
          <label className="field__label" htmlFor="move-class-select">
            {t("pages.selectNewClass", "Select new class")}
            <span className="req" aria-hidden>
              *
            </span>
          </label>
          <select
            id="move-class-select"
            className={`select ${classError ? "input--err" : ""}`}
            value={newClass}
            onChange={(e) => {
              setNewClass(e.target.value);
              if (classError) setClassError("");
            }}
            aria-invalid={classError ? "true" : undefined}
            aria-describedby={classError ? "move-class-err" : undefined}
          >
            <option value="">{t("pages.chooseAClass", "Choose a class…")}</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          {classError ? (
            <span
              id="move-class-err"
              className="field__hint"
              style={{ color: "var(--danger)" }}
            >
              {classError}
            </span>
          ) : (
            <span className="field__hint">
              The student&apos;s class assignment will update immediately.
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
