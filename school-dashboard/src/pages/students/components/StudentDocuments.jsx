import { request } from '../../../services/api.js';
import { useRef, useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { FileText, Upload, FolderPlus, AlertTriangle, Eye, Download, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadApi } from "../../../services/api";
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function StudentDocuments({
  studentId,
  documents,
  activeUploads,
  onDocumentsChange,
  onActiveUploadsChange
}) {
  const { t } = useTranslation();
  const documentInputRef = useRef(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {

      // Initialize uploads state
      const newUploads = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending' // pending, uploading, completed, error
      }));

      onActiveUploadsChange(prev => [...prev, ...newUploads]);

      try {
        let successCount = 0;
        let failCount = 0;

        // Upload each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadId = newUploads[i].id;

          // Update Status to Uploading
          onActiveUploadsChange(prev => prev.map(u =>
            u.id === uploadId ? { ...u, status: 'uploading', progress: 5 } : u
          ));

          // Simulate progress for UX
          const progressInterval = setInterval(() => {
            onActiveUploadsChange(prev => prev.map(u =>
              u.id === uploadId && u.progress < 90 ? { ...u, progress: u.progress + 10 } : u
            ));
          }, 200);

          // Retry helper: up to 2 retries with back-off on network failure (AP-19)
          const uploadWithRetry = async (f, maxRetries = 2) => {
            let lastErr;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
              try { return await uploadApi.uploadFile(f); } catch (err) {
                lastErr = err;
                if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
              }
            }
            throw lastErr;
          };

          try {
            // Upload to backend/Cloudinary with retry on network failure
            const response = await uploadWithRetry(file);

            clearInterval(progressInterval);

            // Format file size
            const formatFileSize = (bytes) => {
              if (bytes < 1024) return bytes + ' B';
              if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
              return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            };

            // Construct new doc object
            const newDoc = {
              name: file.name,
              type: file.type,
              url: response.url,
              size: formatFileSize(file.size),
              uploadDate: new Date().toISOString()
            };

            // Use dedicated document endpoint to append to array
            const result = await request(`/students/${studentId}/documents`, {
              method: 'POST',
              body: JSON.stringify(newDoc)
            });

            // Update local state with all documents from server
            onDocumentsChange(result.documents || []);

            // Mark completed
            onActiveUploadsChange(prev => prev.map(u =>
              u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
            ));

            successCount++;
          } catch (error) {
            clearInterval(progressInterval);
            console.error(`Upload error for ${file.name}:`, error);
            // Mark error
            onActiveUploadsChange(prev => prev.map(u =>
              u.id === uploadId ? { ...u, status: 'error', progress: 0 } : u
            ));
            failCount++;
          }
        }

        // Auto-close after a few seconds if all success
        if (failCount === 0) {
          setTimeout(() => {
            onActiveUploadsChange([]); // Clear uploads
            toast.success(t('toast.success.allDocumentsUploadedSuccessfully'));
          }, 3000);
        } else {
          toast.error(t('toast.error.uploadPartialFailure', { success: successCount, fail: failCount, defaultValue: `Uploaded ${successCount}, Failed ${failCount}` }));
        }

      } catch (error) {
        console.error("Batch upload error:", error);
        toast.error(t('toast.error.uploadFailed'));
      } finally {
        e.target.value = null; // Reset input
      }
    }
  };

  const handleDeleteDocument = (docId) => {
    // Find the document to show its name in confirmation
    const docIndex = documents.findIndex(d => d.id === docId);
    const parsedIndex = parseInt(docId?.toString().replace('doc-', ''), 10);
    const doc = docIndex !== -1 ? documents[docIndex] : (!isNaN(parsedIndex) ? documents[parsedIndex] : null);
    setDocToDelete({ id: docId, name: doc?.name || t('common.document', 'Document') });
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    const docId = docToDelete.id;

    // Find the index of the document to delete
    let docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex === -1 && docId.startsWith('doc-')) {
      docIndex = parseInt(docId.replace('doc-', ''));
    }

    if (docIndex === -1 || docIndex >= documents.length) {
      toast.error(t('toast.error.documentNotFound'));
      setDocToDelete(null);
      return;
    }

    setIsDeletingDoc(true);
    try {
      const result = await request(`/students/${studentId}/documents/${docIndex}`, {
        method: 'DELETE'
      });
      onDocumentsChange(result.documents || []);
      toast.success(t('toast.success.documentDeleted', 'Document deleted successfully'));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t('toast.error.failedToDeleteDocument', 'Failed to delete document') + ": " + (error.message || t('common.unknownError', 'Unknown error')));
    } finally {
      setIsDeletingDoc(false);
      setDocToDelete(null);
    }
  };

  const handleCleanupCorruptedDocuments = async () => {
    const loadingToast = toast.loading(t('toast.loading.fixingDocuments'));

    try {
      const result = await request(`/students/${studentId}/fix-documents`, {
        method: 'POST'
      });

      // Update local state with fixed documents
      onDocumentsChange(result.documents || []);
      toast.success(t('toast.success.documentsFixed', 'Documents fixed successfully'), { id: loadingToast });
    } catch (error) {
      console.error("Fix error:", error);
      toast.error(t('toast.error.failedToFixDocuments', 'Failed to fix documents') + ": " + (error.message || t('common.unknownError', 'Unknown error')), { id: loadingToast });
    }
  };

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Documents Section */}
      <input
        type="file"
        ref={documentInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleDocumentUpload}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-zinc-400">{documents.length} documents</span>
        </div>
        <div className="flex gap-2">
          {documents.some(doc => !doc.url || !doc.name || !doc.id) && (
            <Button
              size="sm"
              color="warning"
              variant="flat"
              startContent={<AlertTriangle size={16} />}
              onPress={handleCleanupCorruptedDocuments}
            >
              Fix Documents
            </Button>
          )}
          <Button size="sm" color="primary" startContent={<Upload size={16} />} onPress={() => documentInputRef.current?.click()}>{t('pages.uploadDocument')}</Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer group" role="button" tabIndex={0} onClick={() => documentInputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); documentInputRef.current?.click(); } }}>
          <div className="inline-flex p-4 bg-white dark:bg-zinc-900 rounded-full mb-4 ring-1 ring-gray-200 dark:ring-zinc-700 shadow-sm dark:shadow-zinc-900/50 group-hover:scale-110 transition-transform">
            <FolderPlus size={32} className="text-gray-600 dark:text-zinc-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">{t('pages.noDocumentsUploadedYet')}</h4>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">{t('pages.uploadBirthCertificateTransferCertificateOrOtherEssentialDocuments')}</p>
          <Button className="mt-4" size="sm" variant="bordered" onPress={() => documentInputRef.current?.click()}>{t('pages.browseFiles')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            // Check if document has valid data
            const isFrontBack = doc.front && doc.back;
            const isCorrupted = !doc.url && !isFrontBack;
            const docId = doc.id || `doc-${index}`;

            return (
              <div key={docId} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCorrupted ? 'border-red-200 bg-red-50/30' : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCorrupted ? 'bg-red-50 text-red-600' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'}`}>
                    {isCorrupted ? <AlertTriangle size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isCorrupted ? 'text-red-700' : 'text-gray-900 dark:text-zinc-100'}`}>
                      {doc.name || 'Corrupted Document'}
                      {isFrontBack && <span className="ml-2 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded">{t('pages.frontBack')}</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {isCorrupted ? 'Invalid file - please delete' : `${doc.date || 'Unknown date'} • ${doc.size || 'Unknown size'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* View buttons for front/back documents */}
                  {isFrontBack ? (
                    <>
                      <Tooltip content="View front">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            window.open(doc.front.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Eye size={16} className="text-gray-500 dark:text-zinc-400" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="View back">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            window.open(doc.back.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Eye size={16} className="text-gray-500 dark:text-zinc-400" />
                        </Button>
                      </Tooltip>
                    </>
                  ) : !isCorrupted && doc.url && (
                    <>
                      <Tooltip content="View document">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            // Check if it's a data URL (base64)
                            if (doc.url.startsWith('data:')) {
                              // Convert data URL to Blob and create object URL
                              fetch(doc.url)
                                .then(res => res.blob())
                                .then(blob => {
                                  const objectUrl = URL.createObjectURL(blob);
                                  window.open(objectUrl, '_blank', 'noopener,noreferrer');
                                  // Clean up after a delay
                                  setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
                                })
                                .catch(err => {
                                  console.error('Error opening document:', err);
                                  toast.error(t('toast.error.failedToOpenDocument'));
                                });
                            } else {
                              // For Cloudinary URLs, add fl_attachment flag for PDFs to force download/view
                              let viewUrl = doc.url;
                              if (doc.url.includes('cloudinary.com') && doc.name?.toLowerCase().endsWith('.pdf')) {
                                // Insert fl_attachment:false to force inline viewing
                                viewUrl = doc.url.replace('/upload/', '/upload/fl_attachment:false/');
                              }
                              window.open(viewUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          <Eye size={16} className="text-gray-500 dark:text-zinc-400" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Download document">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          as="a"
                          href={doc.url}
                          download={doc.name}
                          target="_blank"
                        >
                          <Download size={16} className="text-gray-500 dark:text-zinc-400" />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip content="Delete document">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteDocument(docId)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Delete Document Confirmation */}
    <ConfirmDialog
      isOpen={!!docToDelete}
      onClose={() => setDocToDelete(null)}
      onConfirm={confirmDeleteDocument}
      title={t('confirm.deleteDocumentTitle', 'Delete Document')}
      message={t('confirm.deleteDocumentMessage', { name: docToDelete?.name, defaultValue: `Are you sure you want to delete "${docToDelete?.name}"? This action cannot be undone.` })}
      confirmText={t('common.delete', 'Delete')}
      cancelText={t('common.cancel', 'Cancel')}
      variant="danger"
      isLoading={isDeletingDoc}
    />
    </>
  );
}
