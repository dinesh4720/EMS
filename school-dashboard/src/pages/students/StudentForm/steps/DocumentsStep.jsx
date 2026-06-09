import { useState } from "react";
import { Button, Chip, Progress } from "@heroui/react";
import { FileText, Upload, X, CheckCircle } from "lucide-react";
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
        <p className="text-xs text-fg-muted">
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
        <label className="text-xs font-medium text-fg-subtle">{t('pages.aadhaarCardFrontBack')}</label>
        <p className="text-xs text-fg-muted">{t('pages.uploadBothSidesOfTheAadhaarCard')}</p>

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

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentUploadField({ label, file, onUpload, onRemove, inputRef, accept, compact = false }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setIsProcessing(true);
    // Brief processing animation, then pass file up
    setTimeout(() => {
      onUpload(selectedFile);
      setIsProcessing(false);
    }, 300);
  };

  return (
    <div className="space-y-2">
      {!compact && <label className="text-xs font-medium text-fg-subtle">{label}</label>}
      <div
        className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${
          file
            ? "border-[var(--ok)]/20 bg-[var(--ok-bg)]/50 hover:bg-[var(--ok-bg)]"
            : "border-border-token hover:bg-surface-2"
        }`}
        onClick={() => !isProcessing && inputRef.current?.click()}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {file ? (
            <CheckCircle size={20} className="text-success flex-shrink-0" />
          ) : (
            <FileText size={20} className="text-fg-faint flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {isProcessing ? (
              <div className="space-y-1">
                <span className="text-sm text-fg-muted">Processing...</span>
                <Progress size="sm" isIndeterminate color="primary" className="max-w-full" />
              </div>
            ) : file ? (
              <div className="min-w-0">
                <span className="text-sm text-fg truncate block">{file.name || label}</span>
                {file.size && (
                  <span className="text-xs text-fg-faint">{formatFileSize(file.size)}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-fg-muted">{compact ? label : `Click to upload ${label.toLowerCase()}`}</span>
            )}
          </div>
        </div>
        {file ? (
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X size={14} />
          </Button>
        ) : (
          <Upload size={16} className="text-fg-faint flex-shrink-0" />
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function MultiDocumentUploadField({ label, description, files, onUpload, onRemove, inputRef, accept }) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesChange = (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      onUpload(selectedFiles);
      setIsProcessing(false);
    }, 300);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-fg-subtle">{label}</label>
      <p className="text-xs text-fg-muted">{description}</p>
      {isProcessing ? (
        <div className="border border-solid border-border-token rounded-lg p-4">
          <Progress size="sm" isIndeterminate color="primary" label="Processing files..." className="max-w-full" />
        </div>
      ) : (
        <div
          className="border border-solid border-border-token rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-2 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} className="text-fg-muted" />
          <span className="text-sm text-fg-subtle">{t('pages.uploadAdditionalDocuments')}</span>
        </div>
      )}
      <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={handleFilesChange} />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((file, i) => (
            <Chip
              key={`doc-${file.name}-${i}`}
              onClose={() => onRemove(i)}
              size="sm"
              variant="flat"
              className="h-8 border border-divider bg-surface"
            >
              {file.name} {file.size ? `(${formatFileSize(file.size)})` : ''}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
