import { Button, Chip } from "@heroui/react";
import { Upload, X, FileText } from "lucide-react";
import { useTranslation } from 'react-i18next';

function Step3Documents({
  formData,
  errors,
  updateField,
  handleFileUpload,
  handleMultiFileUpload,
  removeFile,
  isDocRequired,
  documentConfigs,
  // Refs
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
          {documentConfigs.some(c => c.isRequired)
            ? 'Upload required documents. Fields marked with * are mandatory.'
            : t('pages.uploadRequiredDocumentsAllDocumentsAreOptionalAndCanBeUploadedLater')}
        </p>
      </div>

      {/* Birth Certificate */}
      <div className="space-y-2">
        <label htmlFor="birthCertificate-upload" className="text-xs font-medium text-default-600">
          {t('pages.birthCertificate')}
          {isDocRequired('birthCertificate') && <span className="text-danger ml-1">*</span>}
        </label>
        <div
          id="birthCertificate-upload"
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.birthCertificate ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          aria-describedby={errors.birthCertificate ? "birthCertificate-error" : undefined}
          aria-invalid={errors.birthCertificate ? "true" : undefined}
          onClick={() => birthCertRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); birthCertRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.birthCertificate ? (
              <span className="text-sm text-default-700">{formData.birthCertificate.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadBirthCertificate')}</span>
            )}
          </div>
          {formData.birthCertificate ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("birthCertificate", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        {errors.birthCertificate && <p id="birthCertificate-error" role="alert" aria-live="polite" className="text-xs text-danger">{errors.birthCertificate}</p>}
        <input ref={birthCertRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("birthCertificate", e.target.files[0])} />
      </div>

      {/* Transfer Certificate */}
      <div className="space-y-2">
        <label htmlFor="transferCertificate-upload" className="text-xs font-medium text-default-600">
          {t('pages.transferCertificateTc')}
          {isDocRequired('transferCertificate') && <span className="text-danger ml-1">*</span>}
        </label>
        <div
          id="transferCertificate-upload"
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.transferCertificate ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          aria-describedby={errors.transferCertificate ? "transferCertificate-error" : undefined}
          aria-invalid={errors.transferCertificate ? "true" : undefined}
          onClick={() => tcRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tcRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.transferCertificate ? (
              <span className="text-sm text-default-700">{formData.transferCertificate.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadTransferCertificate')}</span>
            )}
          </div>
          {formData.transferCertificate ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("transferCertificate", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        {errors.transferCertificate && <p id="transferCertificate-error" role="alert" aria-live="polite" className="text-xs text-danger">{errors.transferCertificate}</p>}
        <input ref={tcRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("transferCertificate", e.target.files[0])} />
      </div>

      {/* Aadhaar Card (Front & Back) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">
          {t('pages.aadhaarCardFrontBack')}
          {isDocRequired('aadhaarFront') && <span className="text-danger ml-1">*</span>}
        </label>
        <p className="text-xs text-default-500">{t('pages.uploadBothSidesOfTheAadhaarCard')}</p>

        {/* Front Side */}
        <div
          id="aadhaarFront-upload"
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.aadhaarFront ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          aria-label="Upload Aadhaar front side"
          aria-describedby={errors.aadhaarFront ? "aadhaarFront-error" : undefined}
          aria-invalid={errors.aadhaarFront ? "true" : undefined}
          onClick={() => aadhaarFrontRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aadhaarFrontRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.aadhaarFront ? (
              <span className="text-sm text-default-700">Front: {formData.aadhaarFront.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadFrontSide')}</span>
            )}
          </div>
          {formData.aadhaarFront ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("aadhaarFront", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        {errors.aadhaarFront && <p id="aadhaarFront-error" role="alert" aria-live="polite" className="text-xs text-danger">{errors.aadhaarFront}</p>}
        <input ref={aadhaarFrontRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarFront", e.target.files[0])} />

        {/* Back Side */}
        <div
          id="aadhaarBack-upload"
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.aadhaarBack ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          aria-label="Upload Aadhaar back side"
          aria-describedby={errors.aadhaarBack ? "aadhaarBack-error" : undefined}
          aria-invalid={errors.aadhaarBack ? "true" : undefined}
          onClick={() => aadhaarBackRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aadhaarBackRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.aadhaarBack ? (
              <span className="text-sm text-default-700">Back: {formData.aadhaarBack.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadBackSide')}</span>
            )}
          </div>
          {formData.aadhaarBack ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("aadhaarBack", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        {errors.aadhaarBack && <p id="aadhaarBack-error" role="alert" aria-live="polite" className="text-xs text-danger">{errors.aadhaarBack}</p>}
        <input ref={aadhaarBackRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarBack", e.target.files[0])} />
      </div>

      {/* Other Documents */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">{t('pages.otherDocuments')}</label>
        <p className="text-xs text-default-500">Upload any other relevant documents (medical records, previous report cards, etc.)</p>
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-default-50 transition-colors"
          role="button"
          tabIndex={0}
          onClick={() => otherDocsRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); otherDocsRef.current?.click(); } }}
        >
          <Upload size={14} className="text-default-500" />
          <span className="text-sm text-default-600">{t('pages.uploadAdditionalDocuments')}</span>
        </div>
        <input ref={otherDocsRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleMultiFileUpload("otherDocuments", e.target.files)} />
        {formData.otherDocuments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.otherDocuments?.map((file, i) => (
              <Chip key={file.name || `doc-${i}`} onClose={() => removeFile("otherDocuments", i)} size="sm" variant="flat" className="h-8 border border-default-200 bg-background">
                {file.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Step3Documents;
