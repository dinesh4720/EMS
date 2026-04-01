import { useRef } from "react";
import { Button, Chip } from "@heroui/react";
import { FileText, Upload, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * Documents Upload Step for Student Form
 * Extracted from AddStudent.jsx
 */
export default function DocumentsStep({
  formData,
  handleFileUpload,
  handleMultiFileUpload,
  removeFile,
  birthCertRef,
  tcRef,
  aadhaarFrontRef,
  aadhaarBackRef,
  otherDocsRef,
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-default-900">{t('pages.documentUploads')}</label>
        <p className="text-xs text-default-500">
          Upload required documents. All documents are optional and can be uploaded later.
        </p>
      </div>

      {/* Birth Certificate */}
      <DocumentUploadField
        label={t('pages.birthCertificate')}
        file={formData.birthCertificate}
        onUpload={(file) => handleFileUpload("birthCertificate", file)}
        onRemove={() => removeFile("birthCertificate")}
        inputRef={birthCertRef}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Transfer Certificate */}
      <DocumentUploadField
        label={t('pages.transferCertificateTc')}
        file={formData.transferCertificate}
        onUpload={(file) => handleFileUpload("transferCertificate", file)}
        onRemove={() => removeFile("transferCertificate")}
        inputRef={tcRef}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Aadhaar Card */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">{t('pages.aadhaarCardFrontBack')}</label>
        <p className="text-xs text-default-500">{t('pages.uploadBothSidesOfTheAadhaarCard')}</p>

        <DocumentUploadField
          label={formData.aadhaarFront ? `Front: ${formData.aadhaarFront.name}` : "Click to upload FRONT side"}
          file={formData.aadhaarFront}
          onUpload={(file) => handleFileUpload("aadhaarFront", file)}
          onRemove={() => removeFile("aadhaarFront")}
          inputRef={aadhaarFrontRef}
          accept=".pdf,.jpg,.jpeg,.png"
          compact
        />

        <DocumentUploadField
          label={formData.aadhaarBack ? `Back: ${formData.aadhaarBack.name}` : "Click to upload BACK side"}
          file={formData.aadhaarBack}
          onUpload={(file) => handleFileUpload("aadhaarBack", file)}
          onRemove={() => removeFile("aadhaarBack")}
          inputRef={aadhaarBackRef}
          accept=".pdf,.jpg,.jpeg,.png"
          compact
        />
      </div>

      {/* Other Documents */}
      <MultiDocumentUploadField
        label={t('pages.otherDocuments')}
        description="Upload any other relevant documents (medical records, previous report cards, etc.)"
        files={formData.otherDocuments || []}
        onUpload={(files) => handleMultiFileUpload("otherDocuments", files)}
        onRemove={(index) => removeFile("otherDocuments", index)}
        inputRef={otherDocsRef}
        accept=".pdf,.jpg,.jpeg,.png"
      />
    </div>
  );
}

function DocumentUploadField({ label, file, onUpload, onRemove, inputRef, accept, compact = false }) {
  return (
    <div className="space-y-2">
      {!compact && <label className="text-xs font-medium text-default-600">{label}</label>}
      <div
        className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-default-400" />
          {file ? (
            <span className="text-sm text-default-700">{file.name || label}</span>
          ) : (
            <span className="text-sm text-default-500">{compact ? label : `Click to upload ${label.toLowerCase()}`}</span>
          )}
        </div>
        {file ? (
          <Button
            size="sm"
            variant="light"
            color="danger"
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X size={14} />
          </Button>
        ) : (
          <Upload size={16} className="text-default-400" />
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onUpload(e.target.files[0])} />
    </div>
  );
}

function MultiDocumentUploadField({ label, description, files, onUpload, onRemove, inputRef, accept }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-default-600">{label}</label>
      <p className="text-xs text-default-500">{description}</p>
      <div
        className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-default-50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} className="text-default-500" />
        <span className="text-sm text-default-600">{t('pages.uploadAdditionalDocuments')}</span>
      </div>
      <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => onUpload(e.target.files)} />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((file, i) => (
            <Chip
              key={`doc-${file.name}-${i}`}
              onClose={() => onRemove(i)}
              size="sm"
              variant="flat"
              className="h-8 border border-default-200 bg-background"
            >
              {file.name}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
