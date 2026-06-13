/**
 * StaffDocumentsTab - Minimal gray styling matching StudentDashboard
 */
import { useRef } from "react";
import { Upload, FileText, Eye, Download, Link2, Trash2, FolderPlus, FileCheck, IdCard, Award, FileSignature } from "lucide-react";
import { Button, Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../../utils/dateFormatter';

export default function StaffDocumentsTab({
  documents,
  activeUploads,
  documentInputRef,
  onDocumentUpload,
  onDeleteDocument,
  staffName,
}) {
  const { t } = useTranslation();
  const uploadTypeRef = useRef('Custom');
  // Guard against undefined documents prop
  if (!documents) documents = [];
  const getDocumentType = (doc) => {
    if (doc.type?.includes('ID') || doc.type === 'ID Proof') return 'ID Proof';
    if (doc.type?.includes('Qualification') || doc.type === 'Qualification') return 'Qualification';
    return 'Custom';
  };

  return (
    <div className="space-y-5">
      <input
        type="file"
        ref={documentInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => onDocumentUpload(e, uploadTypeRef.current)}
      />

      {/* Document Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-surface rounded-lg p-4 border border-border-token hover:border-border-strong transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-fg-faint" />
            <span className="text-xs text-fg-muted font-medium">{t('pages.totalDocuments')}</span>
          </div>
          <p className="text-2xl font-bold text-fg">{documents.length}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border-token hover:border-border-strong transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck size={16} className="text-fg-faint" />
            <span className="text-xs text-fg-muted font-medium">{t('pages.iDProofs')}</span>
          </div>
          <p className="text-2xl font-bold text-fg">{documents.filter(d => getDocumentType(d) === 'ID Proof').length}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border-token hover:border-border-strong transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-fg-faint" />
            <span className="text-xs text-fg-muted font-medium">{t('pages.qualifications')}</span>
          </div>
          <p className="text-2xl font-bold text-fg">{documents.filter(d => getDocumentType(d) === 'Qualification').length}</p>
        </div>
      </div>

      {/* Active Uploads */}
      {activeUploads.length > 0 && (
        <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
          <div className="p-5 border-b border-border-token">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Upload size={16} className="text-fg-muted" /></div>
              <div><h3 className="font-medium text-fg text-sm">{t('pages.uploadingFiles')}</h3><p className="text-xs text-fg-muted">{activeUploads.length} file(s) in progress</p></div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {activeUploads.map((upload) => (
              <div key={upload.id} className="p-3 bg-surface-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText size={14} className="text-fg-muted" />
                    <span className="text-sm font-medium text-fg">{upload.name}</span>
                  </div>
                  <span className="text-xs text-fg-muted">{upload.progress}%</span>
                </div>
                <Progress
                  aria-label={t('aria.misc.uploadProgress')}
                  value={upload.progress}
                  className="h-1"
                  classNames={{ track: "bg-surface-2", indicator: "bg-fg-muted" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-fg">{t('pages.documentLibrary')}</h3>
            <p className="text-xs text-fg-muted mt-0.5">{t('pages.allUploadedDocuments')}</p>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" className="bg-fg text-surface" startContent={<Upload size={14} />}>
                Upload
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Upload document type"
              onAction={(key) => { uploadTypeRef.current = key; documentInputRef.current?.click(); }}
            >
              <DropdownItem key="ID Proof" startContent={<IdCard size={14} />}>ID Proof</DropdownItem>
              <DropdownItem key="Qualification" startContent={<Award size={14} />}>Certificate / Qualification</DropdownItem>
              <DropdownItem key="Custom" startContent={<FileSignature size={14} />}>Contract / Other</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-surface-2 rounded-lg mb-4">
              <FolderPlus size={32} className="text-fg-faint" />
            </div>
            <h4 className="font-medium text-fg mb-1">{t('pages.noDocumentsUploadedYet')}</h4>
            <p className="text-sm text-fg-muted max-w-xs mx-auto mb-4">
              Upload certificates, ID proofs, contracts, or other essential documents.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button size="sm" variant="flat" className="bg-surface-2 text-fg" startContent={<IdCard size={14} />}
                onPress={() => { uploadTypeRef.current = 'ID Proof'; documentInputRef.current?.click(); }}>
                ID Proof
              </Button>
              <Button size="sm" variant="flat" className="bg-surface-2 text-fg" startContent={<Award size={14} />}
                onPress={() => { uploadTypeRef.current = 'Qualification'; documentInputRef.current?.click(); }}>
                Certificate
              </Button>
              <Button size="sm" variant="flat" className="bg-surface-2 text-fg" startContent={<FileSignature size={14} />}
                onPress={() => { uploadTypeRef.current = 'Custom'; documentInputRef.current?.click(); }}>
                Contract / Other
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {documents.map((doc) => {
              const docType = getDocumentType(doc);

              return (
                <div
                  key={doc._id || doc.name}
                  className="px-5 py-3 flex items-center justify-between hover:bg-surface-hover/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center">
                      <FileText size={14} className="text-fg-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-fg-muted">{docType}</span>
                        <span className="text-xs text-fg-faint">
                          {doc.uploadDate ? formatShortDate(doc.uploadDate) : 'Just now'}
                          {doc.size && ` • ${doc.size}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 hover:bg-surface-hover rounded-lg"
                      onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                      title={t('pages.view1')}
                    >
                      <Eye size={14} className="text-fg-faint" />
                    </button>
                    <a
                      href={doc.url}
                      download={doc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-surface-hover rounded-lg"
                      title={t('pages.download')}
                    >
                      <Download size={14} className="text-fg-faint" />
                    </a>
                    <button
                      className="p-2 hover:bg-surface-hover rounded-lg"
                      onClick={() => {
                        if (doc.url) {
                          navigator.clipboard.writeText(doc.url).then(
                            () => toast.success('Document link copied to clipboard'),
                            () => toast.error('Failed to copy link')
                          );
                        } else {
                          toast.error('No document URL available');
                        }
                      }}
                      title={t('pages.share')}
                    >
                      <Link2 size={14} className="text-fg-faint" />
                    </button>
                    <button
                      className="p-2 hover:bg-surface-hover rounded-lg"
                      onClick={() => onDeleteDocument(doc._id || doc.id)}
                      title={t('pages.delete1')}
                    >
                      <Trash2 size={14} className="text-fg-subtle hover:text-danger-token" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
