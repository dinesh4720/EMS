import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Send, Phone, Mail, User } from "lucide-react";
import { z } from "zod";
import Modal from "../../../../components/ui/Modal";
import { request } from "../../../../services/api";
import { useApp } from "../../../../context/AppContext";
import { formatCurrency } from "../../../../utils/numberFormatter";
import logger from "../../../../utils/logger";

const reminderSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(500, "Message must be at most 500 characters"),
  channel: z.enum(["sms", "email", "both"]),
});

export default function FeeReminderModal({
  isOpen,
  onClose,
  student,
  studentFeeStructure,
}) {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const [reminderMessage, setReminderMessage] = useState("");
  const [channel, setChannel] = useState("both");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const submitGuard = useRef(false);

  const hasPhone = !!student?.parentPhone;
  const hasEmail = !!student?.parentEmail;
  const hasOutstanding = (studentFeeStructure?.totalBalance || 0) > 0;

  useEffect(() => {
    if (!isOpen) {
      setReminderMessage("");
      setError("");
      setSending(false);
      submitGuard.current = false;
      return;
    }
    const schoolName =
      schoolSettings?.name || schoolSettings?.schoolName || t("common.school", "School");
    const msg = hasOutstanding
      ? `Dear ${student?.parentName || "Parent"}, this is a reminder that fee payment of ${formatCurrency(studentFeeStructure?.totalBalance || 0)} is pending for ${student?.name}. Please pay at your earliest convenience. - ${schoolName}`
      : `Dear ${student?.parentName || "Parent"}, thank you for the fee payment of ${formatCurrency(studentFeeStructure?.totalPaid || 0)} for ${student?.name}. - ${schoolName}`;
    setReminderMessage(msg);

    if (channel === "both" && !hasPhone && hasEmail) setChannel("email");
    else if (channel === "both" && hasPhone && !hasEmail) setChannel("sms");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = async () => {
    if (submitGuard.current) return;
    const parsed = reminderSchema.safeParse({
      message: reminderMessage,
      channel,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }
    if (parsed.data.channel === "sms" && !hasPhone) {
      setError("Parent phone number is not available");
      return;
    }
    if (parsed.data.channel === "email" && !hasEmail) {
      setError("Parent email is not available");
      return;
    }
    if (parsed.data.channel === "both" && !hasPhone && !hasEmail) {
      setError("No contact information available");
      return;
    }

    submitGuard.current = true;
    setSending(true);
    try {
      await request(`/students/${student?.id}/send-reminder`, {
        method: "POST",
        body: JSON.stringify({
          message: parsed.data.message,
          channel: parsed.data.channel,
          parentPhone: student?.parentPhone,
          parentEmail: student?.parentEmail,
          studentName: student?.name,
        }),
      });
      toast.success(
        t("students.profile.overview.reminderSentTo", "Reminder sent to {{name}}", {
          name: student?.parentName || "parent",
        })
      );
      onClose();
    } catch (err) {
      logger.error("Error sending reminder:", err);
      toast.error(
        t(
          "students.profile.overview.reminderSendFailed",
          "Failed to send reminder"
        ) +
          ": " +
          (err.message ||
            t("students.profile.overview.unknownError", "Unknown error"))
      );
      submitGuard.current = false;
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("students.profile.overview.sendFeeReminder", "Send fee reminder")}
      description={
        hasOutstanding
          ? t(
              "students.profile.overview.outstandingFeeReminder",
              "Outstanding fee payment reminder"
            )
          : t(
              "students.profile.overview.feePaymentAcknowledgment",
              "Fee payment acknowledgment"
            )
      }
      size="md"
      isDismissable={!sending}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={sending}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleSend}
            disabled={sending || !reminderMessage.trim()}
            aria-busy={sending || undefined}
          >
            <Send size={13} aria-hidden />
            {sending
              ? t("students.profile.overview.sending", "Sending…")
              : t("students.profile.overview.sendReminderBtn", "Send Reminder")}
          </button>
        </>
      }
    >
      <div className="section" style={{ margin: 0 }}>
        <div
          className="col"
          style={{
            gap: 8,
            padding: 12,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            marginBottom: 14,
          }}
        >
          <span className="field__label" style={{ marginBottom: 2 }}>
            {t(
              "students.profile.overview.parentContactInformation",
              "Parent contact information"
            )}
          </span>
          <div className="row gap-2" style={{ fontSize: 13 }}>
            <User size={13} aria-hidden style={{ color: "var(--fg-faint)" }} />
            <span style={{ fontWeight: 500 }}>{student?.parentName || "—"}</span>
          </div>
          <div className="row gap-2" style={{ fontSize: 13 }}>
            <Phone size={13} aria-hidden style={{ color: "var(--fg-faint)" }} />
            <span className="mono tnum">{student?.parentPhone || "—"}</span>
          </div>
          <div className="row gap-2" style={{ fontSize: 13 }}>
            <Mail size={13} aria-hidden style={{ color: "var(--fg-faint)" }} />
            <span>{student?.parentEmail || "—"}</span>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <span className="field__label">
            {t("students.profile.overview.sendVia", "Send via")}
          </span>
          <div className="optgrid">
            {[
              { value: "sms", label: "SMS", disabled: !hasPhone },
              { value: "email", label: "Email", disabled: !hasEmail },
              {
                value: "both",
                label: t("students.profile.overview.both", "Both"),
                disabled: !hasPhone && !hasEmail,
              },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                className={`opt ${channel === c.value ? "is-active" : ""}`}
                onClick={() => !c.disabled && setChannel(c.value)}
                disabled={c.disabled}
                aria-pressed={channel === c.value}
              >
                <span style={{ fontSize: 12.5 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="row gap-2"
          style={{
            padding: "8px 12px",
            background: hasOutstanding ? "var(--warn-bg)" : "var(--ok-bg)",
            color: hasOutstanding ? "var(--warn)" : "var(--ok)",
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 12.5,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {hasOutstanding
              ? t(
                  "students.profile.overview.outstandingAmount",
                  "Outstanding"
                )
              : t(
                  "students.profile.overview.totalFeesPaidTillDate",
                  "Total paid"
                )}
          </span>
          <span style={{ flex: 1 }} />
          <span className="mono tnum" style={{ fontWeight: 600, fontSize: 14 }}>
            {formatCurrency(
              hasOutstanding
                ? studentFeeStructure?.totalBalance || 0
                : studentFeeStructure?.totalPaid || 0
            )}
          </span>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="reminder-msg">
            {t("students.profile.overview.message", "Message")}
            <span className="req" aria-hidden>
              *
            </span>
          </label>
          <textarea
            id="reminder-msg"
            className={`textarea ${error ? "input--err" : ""}`}
            rows={5}
            maxLength={500}
            value={reminderMessage}
            onChange={(e) => {
              setReminderMessage(e.target.value);
              if (error) setError("");
            }}
            placeholder={t(
              "students.profile.overview.enterYourMessage",
              "Enter your message…"
            )}
            aria-invalid={error ? "true" : undefined}
          />
          <div
            className="row"
            style={{ justifyContent: "space-between", gap: 8 }}
          >
            {error ? (
              <span
                className="field__hint"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </span>
            ) : (
              <span className="field__hint">
                Edit to personalize before sending.
              </span>
            )}
            <span className="field__hint mono tnum">
              {reminderMessage.length}/500
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
