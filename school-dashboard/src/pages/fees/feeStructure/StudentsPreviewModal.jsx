import PropTypes from "prop-types";
import { CheckCircle, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, EmptyState, Modal } from "../../../components/ui";
import { useCurrency } from "../../../context/hooks/useCurrency";

const STATUS_COLOR = {
  paid: "success",
  partial: "warning",
  pending: "danger",
};

export default function StudentsPreviewModal({
  isOpen,
  onClose,
  students,
  applying,
  onApply,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  const totalCount = students.length;
  const pendingCount = students.filter((student) => student.status === "pending").length;
  const paidCount = students.filter((student) => student.status === "paid").length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("pages.studentsInClass", "Students in Class")}
      description={t("pages.reviewBeforeApplyingFeeStructure", "Review before applying fee structure")}
      size="4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.close", "Close")}
          </Button>
          <Button
            variant="primary"
            icon={<CheckCircle size={16} />}
            loading={applying}
            onClick={onApply}
          >
            {t("pages.applyToAllStudents", "Apply to All Students")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-lg border border-divider bg-surface-2 text-center">
            <p className="text-2xl font-semibold text-fg">{totalCount}</p>
            <p className="text-xs text-fg-muted uppercase tracking-wider mt-1">
              {t("pages.totalStudents1", "Total Students")}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 text-center">
            <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">{pendingCount}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider mt-1">
              {t("pages.pending2", "Pending")}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 text-center">
            <p className="text-2xl font-semibold text-green-700 dark:text-green-300">{paidCount}</p>
            <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wider mt-1">
              {t("pages.fullyPaid", "Fully Paid")}
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            size="sm"
            title={t("pages.noStudentsFound", "No students found")}
          />
        ) : (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg border border-divider bg-surface"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={student.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-fg-muted truncate">
                      {student.admissionId} •{" "}
                      {t("fees.rollLabel", { rollNo: student.rollNo, defaultValue: `Roll ${student.rollNo}` })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold font-mono text-fg">
                    {fmt(student.balanceAmount)}
                  </p>
                  <Badge color={STATUS_COLOR[student.status] || "neutral"} dot size="sm">
                    {student.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

StudentsPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  students: PropTypes.array.isRequired,
  applying: PropTypes.bool,
  onApply: PropTypes.func.isRequired,
};
