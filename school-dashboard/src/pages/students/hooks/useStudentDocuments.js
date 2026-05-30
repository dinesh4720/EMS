import { request } from '../../../services/api.js';
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { formatFileSize } from "../utils/studentHelpers";
import { uploadApi } from "../../../services/api";
import toast from "react-hot-toast";
import { filterAllowedFiles } from "../../../utils/fileValidation";
import logger from '../../../utils/logger';



/**
 * Custom hook for managing student documents
 */
export function useStudentDocuments(studentId) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch documents from server
   */
  const fetchDocuments = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const data = await request(`/students/${studentId}`);
      if (data.documents) {
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      }
    } catch (err) {
      logger.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Auto-fetch documents when studentId changes (fixes stale closure — AP-11)
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /**
   * Handle document upload
   */
  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const { valid: fileArray, rejected } = filterAllowedFiles(Array.from(files));
    rejected.forEach(msg => toast.error(msg));
    if (fileArray.length === 0) return;

    const newUploads = fileArray.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }));

    setActiveUploads(prev => [...prev, ...newUploads]);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadId = newUploads[i].id;

      setActiveUploads(prev => prev.map(u =>
        u.id === uploadId ? { ...u, status: 'uploading', progress: 5 } : u
      ));

      const progressInterval = setInterval(() => {
        setActiveUploads(prev => prev.map(u =>
          u.id === uploadId && u.progress < 90 ? { ...u, progress: u.progress + 10 } : u
        ));
      }, 200);

      try {
        const response = await uploadApi.uploadFile(file);
        clearInterval(progressInterval);

        const newDoc = {
          name: file.name,
          type: file.type,
          url: response.url,
          size: formatFileSize(file.size),
          uploadDate: new Date().toISOString()
        };

        const result = await request(`/students/${studentId}/documents`, {
          method: 'POST',
          body: JSON.stringify(newDoc)
        });
        setDocuments(result.documents || []);

        setActiveUploads(prev => prev.map(u =>
          u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
        ));

        successCount++;
      } catch (error) {
        clearInterval(progressInterval);
        logger.error(`Upload error for ${file.name}:`, error);

        setActiveUploads(prev => prev.map(u =>
          u.id === uploadId ? { ...u, status: 'error', progress: 0, errorMsg: error.message } : u
        ));

        failCount++;
      }
    }

    if (failCount === 0) {
      setTimeout(() => {
        setActiveUploads([]);
        toast.success(t('toast.success.allDocumentsUploadedSuccessfully'));
      }, 3000);
    } else {
      toast.error(`Uploaded ${successCount}, Failed ${failCount}`);
    }

    return { successCount, failCount };
  }, [studentId, t]);

  /**
   * Handle document deletion
   */
  const handleDelete = useCallback(async (docId) => {
    let docIndex = documents.findIndex(d => d.id === docId);

    if (docIndex === -1 && typeof docId === 'string' && docId.startsWith('doc-')) {
      docIndex = parseInt(docId.replace('doc-', ''));
    }

    if (docIndex === -1 || docIndex >= documents.length) {
      toast.error(t('toast.error.documentNotFound'));
      return false;
    }

    const loadingToast = toast.loading(t('toast.loading.deletingDocument'));

    const docToDelete = documents[docIndex];
    const deleteId = docToDelete?.id ?? docId;

    try {
      const result = await request(`/students/${studentId}/documents/${deleteId}`, {
        method: 'DELETE'
      });
      setDocuments(result.documents || []);
      toast.success("Document deleted successfully", { id: loadingToast });

      return true;
    } catch (error) {
      logger.error("Delete error:", error);
      toast.error(error.message || "Failed to delete document", { id: loadingToast });
      return false;
    }
  }, [studentId, documents, t]);

  /**
   * Fix corrupted documents
   */
  const handleFixCorrupted = useCallback(async () => {
    const loadingToast = toast.loading(t('toast.loading.fixingDocuments'));

    try {
      const result = await request(`/students/${studentId}/fix-documents`, {
        method: 'POST'
      });
      setDocuments(result.documents || []);
      toast.success("Documents fixed successfully", { id: loadingToast });

      return true;
    } catch (error) {
      logger.error("Fix error:", error);
      toast.error(error.message || "Failed to fix documents", { id: loadingToast });
      return false;
    }
  }, [studentId]);

  const clearUploads = useCallback(() => {
    setActiveUploads([]);
  }, []);

  const setDocumentsState = useCallback((docs) => {
    setDocuments(docs);
  }, []);

  return {
    documents,
    activeUploads,
    loading,
    fetchDocuments,
    handleUpload,
    handleDelete,
    handleFixCorrupted,
    clearUploads,
    setDocumentsState
  };
}

export default useStudentDocuments;
