import { useRef } from "react";
import { Chip } from "@heroui/react";
import { IdCard, FileText, FileBadge, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import SectionHeader from "./SectionHeader";

const idProofTypes = ["Aadhar Card", "PAN Card", "Driving License", "Passport", "Voter ID", "Other"];

function IdentityDocumentsStep({
  formData,
  errors,
  updateField,
  handleIDProofUpload,
  removeIDProof,
  handleFileUpload,
  removeFile,
}) {
  const { t } = useTranslation();
  const qualDocsInputRef = useRef(null);

  const findDocByType = (type) => formData.idDocuments.find(doc => doc.type === type);

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="space-y-3">
        <SectionHeader icon={IdCard} title={t('staff.form.identityDocuments')} />
        <p className="text-xs text-fg-subtle -mt-1">{t('staff.form.identityDocumentsHint')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {idProofTypes.map((type) => {
            const doc = findDocByType(type);
            return (
              <div key={type} className="flex items-center justify-between p-3 border border-border-token rounded-lg hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <FileBadge size={16} className="text-fg-subtle" />
                  <div>
                    <span className="text-sm font-medium text-fg-muted">{type}</span>
                    {doc && <p className="text-2xs text-fg-subtle truncate max-w-[100px]">{doc.name}</p>}
                  </div>
                </div>
                {doc ? (
                  <button onClick={() => removeIDProof(type)} className="text-fg-faint hover:text-danger p-1 rounded-md hover:bg-surface-hover">
                    <X size={14} />
                  </button>
                ) : (
                  <div className="relative">
                    <button className="text-xs font-medium text-accent hover:text-accent-hover transition-colors px-2 py-1">{t('pages.upload')}</button>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleIDProofUpload(type, e.target.files)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-5 border-t border-border-token">
        <SectionHeader icon={FileText} title={t('staff.form.otherCertificates')} optional />
        <div
          className="border-2 border-dashed border-border-token rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-border-strong transition-colors text-center"
          onClick={() => qualDocsInputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-faint">
            <Upload size={18} />
          </div>
          <p className="text-xs text-fg-muted">{t('staff.form.clickToUpload')}</p>
          <p className="text-2xs text-fg-faint">{t('pages.pDFJpgPng')}</p>
          <input ref={qualDocsInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileUpload("qualificationDocs", e.target.files)} />
        </div>
        {formData.qualificationDocs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.qualificationDocs.map((file, i) => (
              <Chip key={file.name || `qdoc-${i}`} onClose={() => removeFile("qualificationDocs", i)} size="sm" variant="flat" classNames={{ base: "text-xs h-7" }}>
                {file.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IdentityDocumentsStep;
