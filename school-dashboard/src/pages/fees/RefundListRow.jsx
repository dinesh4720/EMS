import { forwardRef } from "react";
import PhotoAvatar from "../../components/PhotoAvatar";
import Checkbox from "../../components/ui/Checkbox";

// Status tone map — uses --ok-bg / --warn-bg / --danger-bg / --info-bg tokens
const STATUS_TONE = {
  processed: "ok",
  approved: "info",
  rejected: "danger",
  pending: "warn",
};

const RefundListRow = forwardRef(function RefundListRow(
  {
    refund,
    isActive,
    isChecked,
    onSelect,
    onToggleCheck,
    currencyFmt,
  },
  ref
) {
  const status = refund.status || "pending";
  const tone = STATUS_TONE[status] || "info";
  const student = refund.studentId;
  const studentName = student?.name || "Unknown";
  const classLabel = student?.classId
    ? `${student.classId.name || ""} ${student.classId.section || ""}`.trim()
    : "";
  const amount = refund.amount || 0;
  const reason = refund.reason || "";

  const handleRowClick = () => onSelect?.(refund);

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={handleRowClick}
      className={`refundlist__row ${isActive ? "is-active" : ""}`}
      data-refund-id={refund._id}
    >
      {onToggleCheck && (
        <span
          className="refundlist__checkbox"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(refund, e);
          }}
        >
          <Checkbox
            checked={isChecked}
            onChange={(e) => onToggleCheck(refund, e)}
            size="sm"
            aria-label={`Select refund for ${studentName}`}
          />
        </span>
      )}
      <PhotoAvatar
        src={student?.picture || student?.photo}
        alt={studentName}
        name={studentName}
        size="sm"
        type="student"
      />
      <div
        className="col"
        style={{
          minWidth: 0,
          flex: 1,
          lineHeight: 1.3,
          alignItems: "flex-start",
        }}
      >
        <div className="row gap-2" style={{ width: "100%", minWidth: 0 }}>
          <span
            style={{
              fontWeight: 520,
              letterSpacing: "-0.01em",
              fontSize: 13,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              flex: 1,
            }}
          >
            {studentName}
          </span>
          <span
            className="mono tnum"
            style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          >
            {currencyFmt(amount)}
          </span>
        </div>
        <div className="row gap-2" style={{ width: "100%", minWidth: 0 }}>
          {classLabel && (
            <span className="subtle" style={{ fontSize: 12 }}>
              {classLabel}
            </span>
          )}
          {reason && (
            <span
              className="faint"
              style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}
              title={reason}
            >
              · {reason}
            </span>
          )}
        </div>
      </div>
      <div className="col gap-1" style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <span className={`status status--${tone}`}>
          <span className="dot" aria-hidden="true" />
          {status}
        </span>
        {refund.refundDate && (
          <span className="mono tnum subtle" style={{ fontSize: 11 }}>
            {refund.refundDate}
          </span>
        )}
      </div>
    </button>
  );
});

export default RefundListRow;
