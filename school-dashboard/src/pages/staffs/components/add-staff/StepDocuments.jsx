import { useRef } from "react";
import { Chip } from "@heroui/react";
import { FileBadge, Upload, X } from "lucide-react";
import { idProofTypes } from "./constants";
import { useTranslation } from "react-i18next";

const StepDocuments = ({
  formData,
  updateField,
  handleIDProofUpload,
  removeIDProof,
  handleFileUpload,
  removeFile,
}) => {
  const { t } = useTranslation();
  const qualDocsInputRef = useRef(null);

  // Helper function to find document by type
  const findDocByType = (type) => formData.idDocuments.find(doc => doc.type === type);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Identity Docs & Proofs */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-default-900">{t('pages.documentsProofs')}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {idProofTypes.map((type) => {
            const doc = findDocByType(type);
            return (
              <div key={type} className="flex items-center justify-between p-3 border border-default-200 rounded-lg bg-default-50/50 hover:bg-default-100 transition-colors">
                <div className="flex items-center gap-2">
                  <FileBadge size={16} className="text-default-500" />
                  <span className="text-sm font-medium text-default-700">{type}</span>
                </div>
                {doc ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-success-600 font-medium truncate max-w-[100px]">{doc.name}</span>
                    <button onClick={() => removeIDProof(type)} className="text-default-400 hover:text-danger p-1 rounded-full hover:bg-default-200">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors px-2 py-1">
                      Upload
                    </button>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleIDProofUpload(type, e.target.files)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-default-900">{t('pages.otherCertificates1')}</label>
          <div
            className="border border-dashed border-default-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-default-50 transition-colors text-center"
            onClick={() => qualDocsInputRef.current?.click()}
          >
            <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center text-default-500">
              <Upload size={16} />
            </div>
            <span className="text-xs text-default-600">{t('pages.clickToUploadScannedDocuments')}</span>
            <input ref={qualDocsInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => handleFileUpload("qualificationDocs", e.target.files)} />
          </div>
          {formData.qualificationDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.qualificationDocs.map((file, i) => (
                <Chip key={`doc-${file.name}-${i}`} onClose={() => removeFile("qualificationDocs", i)} size="sm" variant="flat" className="text-xs h-7 bg-default-100">
                  {file.name}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepDocuments;
