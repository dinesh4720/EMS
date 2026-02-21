import { useState, useCallback } from "react";
import { getAuthToken, formatFileSize } from "../utils/studentHelpers";
import { uploadApi } from "../../../services/api";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Custom hook for managing student documents
 */
export function useStudentDocuments(studentId) {
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
      const token = getAuthToken();
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/students/${studentId}`, { headers });

      if (response.ok) {
        const data = await response.json();
        if (data.documents) {
          setDocuments(data.documents);
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  /**
   * Handle document upload
   */
  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

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

        const token = getAuthToken();
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const saveResponse = await fetch(`${API_URL}/students/${studentId}/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newDoc)
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save document');
        }

        const result = await saveResponse.json();
        setDocuments(result.documents || []);

        setActiveUploads(prev => prev.map(u =>
          u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
        ));

        successCount++;
      } catch (error) {
        clearInterval(progressInterval);
        console.error(`Upload error for ${file.name}:`, error);

        setActiveUploads(prev => prev.map(u =>
          u.id === uploadId ? { ...u, status: 'error', progress: 0 } : u
        ));

        failCount++;
      }
    }

    if (failCount === 0) {
      setTimeout(() => {
        setActiveUploads([]);
        toast.success("All documents uploaded successfully");
      }, 3000);
    } else {
      toast.error(`Uploaded ${successCount}, Failed ${failCount}`);
    }

    return { successCount, failCount };
  }, [studentId]);

  /**
   * Handle document deletion
   */
  const handleDelete = useCallback(async (docId) => {
    let docIndex = documents.findIndex(d => d.id === docId);

    if (docIndex === -1 && typeof docId === 'string' && docId.startsWith('doc-')) {
      docIndex = parseInt(docId.replace('doc-', ''));
    }

    if (docIndex === -1 || docIndex >= documents.length) {
      toast.error("Document not found");
      return false;
    }

    const loadingToast = toast.loading("Deleting document...");

    try {
      const token = getAuthToken();
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${API_URL}/students/${studentId}/documents/${docIndex}`,
        { method: 'DELETE', headers }
      );

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      const result = await response.json();
      setDocuments(result.documents || []);
      toast.success("Document deleted successfully", { id: loadingToast });

      return true;
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document", { id: loadingToast });
      return false;
    }
  }, [studentId, documents]);

  /**
   * Fix corrupted documents
   */
  const handleFixCorrupted = useCallback(async () => {
    const loadingToast = toast.loading("Fixing documents...");

    try {
      const token = getAuthToken();
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${API_URL}/students/${studentId}/fix-documents`,
        { method: 'POST', headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fix documents');
      }

      const result = await response.json();
      setDocuments(result.documents || []);
      toast.success("Documents fixed successfully", { id: loadingToast });

      return true;
    } catch (error) {
      console.error("Fix error:", error);
      toast.error("Failed to fix documents", { id: loadingToast });
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
