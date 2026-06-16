import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { feesApi, studentsApi } from "../../services/api";
import { useCurrency } from "../../context/hooks/useCurrency";
import { createRefundSchema, parseFormSchema } from "../../validators/formSchemas";
import logger from "../../utils/logger";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;
const STUDENT_SEARCH_DEBOUNCE = 300;
const PAYMENTS_DEBOUNCE = 300;

export default function RefundsCreateModal({
  open,
  onClose,
  onCreated,
  t: tProp,
}) {
  const { t: tI18n } = useTranslation();
  const t = tProp || tI18n;
  const { fmt } = useCurrency();

  const [form, setForm] = useState({
    studentId: "",
    classId: "",
    amount: "",
    reason: "",
    refundMode: "cash",
    remarks: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [studentTotalPaid, setStudentTotalPaid] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!OBJECT_ID_REGEX.test(form.studentId)) {
      setStudentTotalPaid(null);
      return;
    }
    const timeout = setTimeout(() => {
      // PAG-27: refund-cap validation must use a server-side aggregate so
      // long-tenured students (with > 50 payments) don't have their
      // refundable total silently understated by the paginated /fees/payments
      // list endpoint.
      feesApi
        .getStudentTotalPaid(form.studentId)
        .then((res) => {
          const total = Number(res?.totalPaid);
          setStudentTotalPaid(Number.isFinite(total) ? total : 0);
        })
        .catch((err) => {
          logger.error("Failed to fetch student payments for refund validation:", err);
          toast.error(
            t(
              "toast.error.failedToLoadPaymentHistory",
              "Failed to load payment history — refund limit cannot be verified"
            )
          );
          setStudentTotalPaid(null);
        });
    }, PAYMENTS_DEBOUNCE);
    return () => clearTimeout(timeout);
  }, [form.studentId, t]);

  useEffect(() => {
    if (!studentSearch || studentSearch.length < 2) {
      setStudentResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await studentsApi.list({
          search: studentSearch,
          limit: 20,
        });
        setStudentResults(data || []);
      } catch {
        setStudentResults([]);
      }
    }, STUDENT_SEARCH_DEBOUNCE);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  const reset = () => {
    setForm({
      studentId: "",
      classId: "",
      amount: "",
      reason: "",
      refundMode: "cash",
      remarks: "",
    });
    setFormErrors({});
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setStudentTotalPaid(null);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch("");
    setStudentResults([]);
    const classId = student.classId?._id || student.classId || "";
    setForm((f) => ({
      ...f,
      studentId: student._id,
      classId: String(classId),
    }));
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setForm((f) => ({ ...f, studentId: "", classId: "" }));
    setStudentTotalPaid(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose?.();
  };

  const handleCreate = async () => {
    setFormErrors({});
    if (!selectedStudent) {
      setFormErrors({
        studentId: t("toast.error.pleaseSelectAStudent", "Please select a student"),
      });
      toast.error(t("toast.error.pleaseSelectAStudent", "Please select a student"));
      return;
    }
    const { success, errors } = parseFormSchema(createRefundSchema, form);
    if (!success) {
      setFormErrors(errors);
      toast.error(
        Object.values(errors)[0] || t("toast.error.pleaseFillAllRequiredFields")
      );
      return;
    }
    const parsedAmount = parseFloat(form.amount);
    if (studentTotalPaid !== null && parsedAmount > studentTotalPaid) {
      const msg = t("toast.error.refundExceedsTotalPaid", {
        amount: parsedAmount,
        totalPaid: studentTotalPaid,
        defaultValue: `Refund amount (${fmt(parsedAmount)}) cannot exceed total paid (${fmt(studentTotalPaid)})`,
      });
      setFormErrors({ amount: msg });
      toast.error(msg);
      return;
    }
    setSaving(true);
    try {
      await feesApi.createRefund({
        ...form,
        amount: parsedAmount,
      });
      toast.success(t("toast.success.refundRequestCreated"));
      reset();
      onClose?.();
      onCreated?.();
    } catch (error) {
      toast.error(error?.message || t("toast.error.failedToCreateRefund"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="composer-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="composer"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 560 }}
      >
        <header className="composer__head">
          <span className="composer__title">{t("pages.newRefundRequest")}</span>
          <button
            type="button"
            className="iconbtn"
            onClick={handleClose}
            aria-label="Close"
            disabled={saving}
          >
            <X size={14} />
          </button>
        </header>
        <div className="composer__body">
          <div className="fgrid">
            <label className="field span-2" htmlFor="refund-student-search">
              <span className="field__label">
                {t("pages.student", "Student")} <span className="req">*</span>
              </span>
              {selectedStudent ? (
                <div className="taginput">
                  <span className="tagchip">
                    {selectedStudent.name}
                    <button
                      type="button"
                      className="iconbtn"
                      aria-label={t("common.remove", "Remove")}
                      onClick={handleClearStudent}
                    >
                      <X size={12} />
                    </button>
                  </span>
                </div>
              ) : (
                <div className="field__icon-wrap">
                  <Search size={14} className="field__icon" aria-hidden />
                  <input
                    id="refund-student-search"
                    className="input input--with-icon"
                    placeholder={t(
                      "pages.searchStudentsByNameOrAdmissionNo",
                      "Search by name or admission number..."
                    )}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    role="combobox"
                    aria-expanded={studentResults.length > 0}
                    aria-controls="refund-student-results"
                    aria-autocomplete="list"
                  />
                  {studentResults.length > 0 && studentSearch && (
                    <div
                      id="refund-student-results"
                      role="listbox"
                      aria-label={t("pages.studentResults", "Student results")}
                      className="autocomplete-dropdown"
                      style={{
                        position: "absolute",
                        zIndex: 50,
                        width: "100%",
                        marginTop: 4,
                        maxHeight: 192,
                        overflowY: "auto",
                        background: "var(--surface)",
                        border: "1px solid var(--border-token)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      {studentResults.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          role="option"
                          onClick={() => handleSelectStudent(s)}
                          className="autocomplete-item"
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            fontSize: 13,
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--divider)",
                            cursor: "pointer",
                            color: "var(--fg)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--surface-2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span style={{ fontWeight: 520 }}>{s.name}</span>
                          <span
                            className="subtle"
                            style={{ marginLeft: 8, fontSize: 12 }}
                          >
                            {s.admissionNo || s.admissionId || ""} —{" "}
                            {t("common.class")} {s.classId?.name || ""}
                            {s.classId?.section ? ` ${s.classId.section}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {studentSearch.length >= 2 && studentResults.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 50,
                        width: "100%",
                        marginTop: 4,
                        padding: "12px",
                        fontSize: 13,
                        color: "var(--fg-muted)",
                        background: "var(--surface)",
                        border: "1px solid var(--border-token)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      {t("common.noResultsFound", "No students found")}
                    </div>
                  )}
                </div>
              )}
              {formErrors.studentId && (
                <span className="field__hint" style={{ color: "var(--danger)" }}>
                  {formErrors.studentId}
                </span>
              )}
            </label>

            <label className="field" htmlFor="refund-amount">
              <span className="field__label">
                {t("fees.amountLabel")} <span className="req">*</span>
              </span>
              <input
                id="refund-amount"
                type="number"
                className={`input mono tnum${formErrors.amount ? " input--err" : ""}`}
                placeholder={t("fees.amountPlaceholder")}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min={1}
              />
              {studentTotalPaid !== null && (
                <span className="field__hint">
                  {t("fees.maxRefundable", {
                    amount: studentTotalPaid.toLocaleString(),
                  })}
                </span>
              )}
              {formErrors.amount && (
                <span className="field__hint" style={{ color: "var(--danger)" }}>
                  {formErrors.amount}
                </span>
              )}
            </label>

            <label className="field" htmlFor="refund-mode">
              <span className="field__label">
                {t("pages.refundMode")} <span className="req">*</span>
              </span>
              <select
                id="refund-mode"
                className="select"
                value={form.refundMode}
                onChange={(e) => setForm({ ...form, refundMode: e.target.value })}
              >
                <option value="cash">{t("pages.cash1")}</option>
                <option value="cheque">{t("pages.cheque1")}</option>
                <option value="bank_transfer">{t("pages.bankTransfer1")}</option>
              </select>
              {formErrors.refundMode && (
                <span className="field__hint" style={{ color: "var(--danger)" }}>
                  {formErrors.refundMode}
                </span>
              )}
            </label>

            <label className="field span-2" htmlFor="refund-reason">
              <span className="field__label">
                {t("pages.reason")} <span className="req">*</span>
              </span>
              <textarea
                id="refund-reason"
                className={`textarea${formErrors.reason ? " textarea--err" : ""}`}
                placeholder={t("pages.reasonForRefund")}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
              />
              {formErrors.reason && (
                <span className="field__hint" style={{ color: "var(--danger)" }}>
                  {formErrors.reason}
                </span>
              )}
            </label>

            <label className="field span-2" htmlFor="refund-remarks">
              <span className="field__label">{t("pages.remarksOptional")}</span>
              <textarea
                id="refund-remarks"
                className="textarea"
                placeholder={t("pages.additionalNotes1")}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={2}
              />
            </label>
          </div>
        </div>
        <footer className="composer__foot">
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn"
            onClick={handleClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving
              ? t("common.creating", "Creating...")
              : t("fees.createRefund", "Create Refund")}
          </button>
        </footer>
      </div>
    </div>
  );
}
