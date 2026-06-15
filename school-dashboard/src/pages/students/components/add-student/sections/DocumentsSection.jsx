import { FileText, X } from "lucide-react";
import SectionHead from "../SectionHead";
import ComposerField from "../ComposerField";
import DocField from "../DocField";

export default function DocumentsSection({
  form,
  set,
  errors,
  initialData,
  isDocRequired,
  handleFile,
  handleMultiFile,
  fileRefs,
  registerField,
  done,
}) {
  return (
    <section id="student-section-documents" className="section">
      <SectionHead
        title="Documents"
        hint="PDF, JPG, or PNG · max 10 MB each."
        done={done}
      />
      <div className="fgrid">
        <DocField
          field="birthCertificate"
          label="Birth certificate"
          required={isDocRequired("birthCertificate")}
          file={form.birthCertificate}
          existing={initialData?.documents?.find((d) => d.category === "birthCertificate")}
          onFile={(f) => handleFile("birthCertificate", f)}
          onClear={() => set("birthCertificate", null)}
          error={errors.birthCertificate}
          inputRef={(el) => (fileRefs.current.birthCertificate = el)}
          registerField={registerField}
        />
        <DocField
          field="transferCertificate"
          label="Transfer certificate"
          required={isDocRequired("transferCertificate")}
          file={form.transferCertificate}
          existing={initialData?.documents?.find((d) => d.category === "transferCertificate")}
          onFile={(f) => handleFile("transferCertificate", f)}
          onClear={() => set("transferCertificate", null)}
          error={errors.transferCertificate}
          inputRef={(el) => (fileRefs.current.transferCertificate = el)}
          registerField={registerField}
        />
        <DocField
          field="aadhaarFront"
          label="Aadhaar (front)"
          required={isDocRequired("aadhaarFront")}
          file={form.aadhaarFront}
          existing={
            initialData?.documents?.find((d) => d.category === "aadhaarCard")?.front
          }
          onFile={(f) => handleFile("aadhaarFront", f)}
          onClear={() => set("aadhaarFront", null)}
          error={errors.aadhaarFront}
          inputRef={(el) => (fileRefs.current.aadhaarFront = el)}
          registerField={registerField}
        />
        <DocField
          field="aadhaarBack"
          label="Aadhaar (back)"
          required={isDocRequired("aadhaarBack")}
          file={form.aadhaarBack}
          existing={
            initialData?.documents?.find((d) => d.category === "aadhaarCard")?.back
          }
          onFile={(f) => handleFile("aadhaarBack", f)}
          onClear={() => set("aadhaarBack", null)}
          error={errors.aadhaarBack}
          inputRef={(el) => (fileRefs.current.aadhaarBack = el)}
          registerField={registerField}
        />

        <ComposerField label="Other documents" className="span-2" hint="Add transcripts, certificates, etc.">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleMultiFile("otherDocuments", e.target.files)}
            className="input"
            style={{ padding: 6 }}
          />
          {form.otherDocuments?.length > 0 && (
            <ul style={{ marginTop: 6, fontSize: 12, color: "var(--fg-muted)" }}>
              {form.otherDocuments.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`} className="row gap-2" style={{ alignItems: "center" }}>
                  <FileText size={11} aria-hidden />
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() =>
                      set(
                        "otherDocuments",
                        form.otherDocuments.filter((_, j) => j !== i)
                      )
                    }
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={10} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ComposerField>
      </div>
    </section>
  );
}
