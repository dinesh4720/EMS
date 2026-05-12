import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FileText, Printer, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import Modal from "../../../../components/ui/Modal";
import { formatDate } from "../../../../utils/dateFormatter";
import { escapeHtml } from "../../../../utils/sanitize";

const CONDUCT_OPTIONS = [
  "Excellent",
  "Very Good",
  "Good",
  "Satisfactory",
  "Needs Improvement",
];

const bonafideSchema = z.object({
  purpose: z
    .string()
    .trim()
    .min(3, "Please enter the purpose for the certificate")
    .max(200, "Purpose must be at most 200 characters"),
});
const characterSchema = z.object({
  conductRating: z.enum([
    "Excellent",
    "Very Good",
    "Good",
    "Satisfactory",
    "Needs Improvement",
  ]),
  remarks: z.string().max(500).optional(),
});

const PRINT_CSS = `
  @page { size: A4; margin: 20mm; }
  body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; color: #000; }
  .certificate { max-width: 800px; margin: 0 auto; padding: 40px; border: 3px double #333; }
  .certificate-header { text-align: center; margin-bottom: 30px; }
  .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; }
  .certificate-title { font-size: 20px; font-weight: bold; text-decoration: underline; margin: 20px 0; text-align: center; }
  .certificate-body { font-size: 16px; line-height: 2; margin: 20px 0; }
  .certificate-footer { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; }
  @media print { @page { size: A4; margin: 20mm; } body { padding: 0; } }
`;

export default function CertificateModal({
  isOpen,
  onClose,
  student,
  type = "bonafide",
  schoolInfo,
}) {
  const [purpose, setPurpose] = useState("");
  const [conductRating, setConductRating] = useState("Good");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  const isBonafide = type === "bonafide";
  const title = isBonafide ? "Bonafide Certificate" : "Character Certificate";

  const resetForm = useCallback(() => {
    setPurpose("");
    setConductRating("Good");
    setRemarks("");
    setErrors({});
    setShowPreview(false);
  }, []);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen, resetForm]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleGenerate = () => {
    if (isBonafide) {
      const parsed = bonafideSchema.safeParse({ purpose });
      if (!parsed.success) {
        setErrors({ purpose: parsed.error.issues[0]?.message });
        return;
      }
    } else {
      const parsed = characterSchema.safeParse({ conductRating, remarks });
      if (!parsed.success) {
        setErrors({ remarks: parsed.error.issues[0]?.message });
        return;
      }
    }
    setErrors({});
    setShowPreview(true);
    toast.success(`${title} generated`);
  };

  const handleDownload = () => {
    const content = previewRef.current;
    if (!content) return;
    const html = `<html>
      <head>
        <title>${escapeHtml(title)} - ${escapeHtml(student?.name || "Student")}</title>
        <style>${PRINT_CSS}</style>
      </head>
      <body>
        ${content.outerHTML}
        <script>setTimeout(function(){window.print();window.close();},500);</${"script"}>
      </body>
    </html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "", "width=800,height=600");
    const revoke = () => URL.revokeObjectURL(url);
    if (printWindow) {
      printWindow.addEventListener("afterprint", revoke);
      const tid = setInterval(() => {
        if (printWindow.closed) {
          clearInterval(tid);
          revoke();
        }
      }, 1000);
    } else {
      revoke();
      toast.error("Pop-up blocked. Please allow pop-ups and try again.");
      return;
    }
    toast.success("Print dialog opened");
  };

  const today = useMemo(() => formatDate(new Date()), []);

  if (!student) return null;

  const guardian = student.parentName || student.guardianName || "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="row gap-2">
          <FileText size={14} aria-hidden style={{ color: "var(--accent)" }} />
          {title}
        </span>
      }
      description={`${student.name} · Class ${student.class || "—"}`}
      size="xl"
      footer={
        !showPreview ? (
          <>
            <button type="button" className="btn" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleGenerate}
            >
              <Eye size={13} aria-hidden /> Generate
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setShowPreview(false)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleDownload}
              data-testid="download-certificate"
            >
              <Printer size={13} aria-hidden /> Download / Print
            </button>
          </>
        )
      }
    >
      {!showPreview ? (
        <div className="section" style={{ margin: 0 }}>
          <div
            className="row"
            style={{
              padding: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div className="col" style={{ flex: "1 1 160px", gap: 1 }}>
              <span className="field__hint">Name</span>
              <span style={{ fontSize: 13, fontWeight: 520 }}>
                {student.name}
              </span>
            </div>
            <div className="col" style={{ flex: "1 1 80px", gap: 1 }}>
              <span className="field__hint">Class</span>
              <span style={{ fontSize: 13, fontWeight: 520 }}>
                {student.class || "—"}
              </span>
            </div>
            <div className="col" style={{ flex: "1 1 120px", gap: 1 }}>
              <span className="field__hint">Admission No</span>
              <span className="mono tnum" style={{ fontSize: 13 }}>
                {student.admissionId || student.admissionNo || "—"}
              </span>
            </div>
            <div className="col" style={{ flex: "1 1 80px", gap: 1 }}>
              <span className="field__hint">Roll No</span>
              <span className="mono tnum" style={{ fontSize: 13 }}>
                {student.rollNo || "—"}
              </span>
            </div>
          </div>

          <div className="fgrid">
            {isBonafide ? (
              <div className="field span-2">
                <label className="field__label" htmlFor="cert-purpose">
                  Purpose
                  <span className="req" aria-hidden>
                    *
                  </span>
                </label>
                <input
                  id="cert-purpose"
                  type="text"
                  className={`input ${errors.purpose ? "input--err" : ""}`}
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose) setErrors({});
                  }}
                  placeholder="e.g., Bank account opening, Passport application"
                  data-testid="certificate-purpose"
                  maxLength={200}
                  aria-invalid={errors.purpose ? "true" : undefined}
                />
                {errors.purpose ? (
                  <span
                    className="field__hint"
                    style={{ color: "var(--danger)" }}
                  >
                    {errors.purpose}
                  </span>
                ) : null}
              </div>
            ) : (
              <>
                <div className="field span-2">
                  <label className="field__label" htmlFor="cert-conduct">
                    Conduct Rating
                  </label>
                  <select
                    id="cert-conduct"
                    className="select"
                    value={conductRating}
                    onChange={(e) => setConductRating(e.target.value)}
                    data-testid="conduct-rating"
                  >
                    {CONDUCT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field span-2">
                  <label className="field__label" htmlFor="cert-remarks">
                    Remarks
                  </label>
                  <textarea
                    id="cert-remarks"
                    className={`textarea ${errors.remarks ? "input--err" : ""}`}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Additional remarks about the student's character and conduct"
                    data-testid="certificate-remarks"
                  />
                  <div
                    className="row"
                    style={{ justifyContent: "space-between" }}
                  >
                    {errors.remarks ? (
                      <span
                        className="field__hint"
                        style={{ color: "var(--danger)" }}
                      >
                        {errors.remarks}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="field__hint mono tnum">
                      {remarks.length}/500
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div
            ref={previewRef}
            className="certificate"
            data-testid="certificate-preview"
            style={{
              background: "#fff",
              color: "#000",
              padding: 32,
              border: "2px solid #d1d5db",
              borderRadius: 8,
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            <div className="certificate-header" style={{ textAlign: "center" }}>
              <div
                className="school-name"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {schoolInfo?.name || "School Name"}
              </div>
              {schoolInfo?.address ? (
                <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
                  {schoolInfo.address}
                </div>
              ) : null}
            </div>

            <div
              className="certificate-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                textDecoration: "underline",
                textAlign: "center",
                margin: "20px 0",
              }}
            >
              {title}
            </div>

            <div
              className="certificate-body"
              style={{ fontSize: 15, lineHeight: 2 }}
            >
              {isBonafide ? (
                <p>
                  This is to certify that <strong>{student.name}</strong>
                  {guardian ? (
                    <>
                      , son/daughter of <strong>{guardian}</strong>,
                    </>
                  ) : null}{" "}
                  is a bonafide student of this institution studying in Class{" "}
                  <strong>{student.class || "—"}</strong> with Admission Number{" "}
                  <strong>
                    {student.admissionId || student.admissionNo || "—"}
                  </strong>{" "}
                  and Roll Number <strong>{student.rollNo || "—"}</strong>.
                </p>
              ) : (
                <>
                  <p>
                    This is to certify that <strong>{student.name}</strong>
                    {guardian ? (
                      <>
                        , son/daughter of <strong>{guardian}</strong>,
                      </>
                    ) : null}{" "}
                    is a bonafide student of this institution studying in Class{" "}
                    <strong>{student.class || "—"}</strong>.
                  </p>
                  <p style={{ marginTop: 12 }}>
                    During the stay in this institution, the student&apos;s
                    conduct and character has been{" "}
                    <strong>{conductRating}</strong>.
                  </p>
                </>
              )}

              {isBonafide && purpose ? (
                <p style={{ marginTop: 12 }}>
                  This certificate is issued for the purpose of{" "}
                  <strong>{purpose}</strong>.
                </p>
              ) : null}
              {!isBonafide && remarks ? (
                <p style={{ marginTop: 12 }}>Remarks: {remarks}</p>
              ) : null}
            </div>

            <div
              className="certificate-footer"
              style={{
                marginTop: 32,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>
                  Date: {today}
                </p>
                <p style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
                  Place: ___________
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  className="signature-line"
                  style={{
                    width: 200,
                    borderTop: "1px solid #9ca3af",
                    paddingTop: 4,
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                    Principal / Headmaster
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
