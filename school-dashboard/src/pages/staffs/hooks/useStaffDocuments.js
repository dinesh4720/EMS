import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import { filterAllowedFiles } from "../../../utils/fileValidation";

/**
 * useStaffDocuments
 * Manages document state, upload, and delete for a staff member.
 *
 * @param {string} id - Staff MongoDB ObjectId
 * @param {Function} updateStaff - AppContext updateStaff(id, data)
 * @param {object} uploadApi - API object with uploadFile(file) method
 */
export default function useStaffDocuments(id, updateStaff, uploadApi) {
  const { t } = useTranslation();
  const documentInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  const handleDocumentUpload = async (e, docType = "Custom") => {
    const { valid: files, rejected } = filterAllowedFiles(
      Array.from(e.target.files || [])
    );
    rejected.forEach((msg) => toast.error(msg));
    if (!files.length) return;

    const prefix =
      docType === "ID Proof" ? "id" : docType === "Qualification" ? "qual" : "custom";

    const newUploads = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending",
    }));

    setActiveUploads((prev) => [...prev, ...newUploads]);

    try {
      const newDocs = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        setActiveUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: "uploading", progress: 50 } : u
          )
        );

        const response = await uploadApi.uploadFile(file);

        const formatFileSize = (bytes) => {
          if (bytes < 1024) return bytes + " B";
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
          return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        };

        const newDoc = {
          id: `${prefix}-${Date.now()}-${i}`,
          name: file.name,
          type: docType,
          url: response.url,
          size: formatFileSize(file.size),
          uploadDate: new Date().toISOString(),
        };

        newDocs.push(newDoc);
        setDocuments((prev) => [...prev, newDoc]);
        setActiveUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: "completed", progress: 100 } : u
          )
        );
      }

      if (newDocs.length > 0) {
        // We need the current documents snapshot for building the update payload.
        // Use a functional update trick: capture via setDocuments callback.
        setDocuments((current) => {
          if (docType === "ID Proof") {
            const existingIdDocs = current
              .filter((d) => d.id?.startsWith("id-"))
              .map((d) => ({ type: d.type, url: d.url, name: d.name }));
            const allIdDocs = [
              ...existingIdDocs,
              ...newDocs.map((d) => ({ type: "ID Proof", url: d.url, name: d.name })),
            ];
            updateStaff(id, { idDocuments: allIdDocs });
          } else if (docType === "Qualification") {
            const existingQual = current
              .filter((d) => d.id?.startsWith("qual-"))
              .map((d) => d.url);
            updateStaff(id, {
              qualificationDocs: [...existingQual, ...newDocs.map((d) => d.url)],
            });
          } else {
            const existingCustom = current
              .filter((d) => d.id?.startsWith("custom-"))
              .map((d) => d.url);
            updateStaff(id, {
              customDocuments: [...existingCustom, ...newDocs.map((d) => d.url)],
            });
          }
          return current; // state is already set in the loop above
        });
      }

      setTimeout(() => setActiveUploads([]), 2000);
      toast.success(t("toast.success.documentsUploadedSuccessfully"));
    } catch (error) {
      logger.error("Upload error:", error);
      toast.error(t("toast.error.uploadFailed"));
    } finally {
      e.target.value = null;
    }
  };

  const handleDeleteDocument = async (docId) => {
    const updatedDocs = documents.filter((d) => d.id !== docId && d.url !== docId);

    try {
      const idDocuments = updatedDocs
        .filter((d) => d.id?.startsWith("id-"))
        .map((d) => ({ type: d.type, url: d.url, name: d.name }));
      const qualificationDocs = updatedDocs
        .filter((d) => d.id?.startsWith("qual-"))
        .map((d) => d.url);
      const customDocuments = updatedDocs
        .filter((d) => d.id?.startsWith("custom-"))
        .map((d) => d.url);

      await updateStaff(id, { idDocuments, qualificationDocs, customDocuments });
      setDocuments(updatedDocs);
      toast.success(t("toast.success.documentDeleted"));
    } catch (error) {
      logger.error("Document delete error:", error);
      toast.error(t("toast.error.deleteFailed"));
    }
  };

  /**
   * Populate documents state from a staff object fetched from context.
   * Call this in a useEffect whenever `staff` changes.
   */
  const initFromStaff = (staff) => {
    if (!staff) return;
    const allDocs = [];
    const uploadDate = staff.createdAt || new Date().toISOString();

    if (Array.isArray(staff.idDocuments)) {
      staff.idDocuments.forEach((doc, index) => {
        if (typeof doc === "string") {
          allDocs.push({ id: `id-${index}`, name: `ID Document ${index + 1}`, type: "ID Proof", url: doc, uploadDate });
        } else if (doc?.url) {
          allDocs.push({ id: `id-${index}`, name: doc.name || doc.type || "ID Document", type: doc.type || "ID Proof", url: doc.url, uploadDate });
        }
      });
    }

    if (Array.isArray(staff.qualificationDocs)) {
      staff.qualificationDocs.forEach((doc, index) => {
        allDocs.push({ id: `qual-${index}`, name: `Qualification Document ${index + 1}`, type: "Qualification", url: doc, uploadDate });
      });
    }

    if (Array.isArray(staff.customDocuments)) {
      staff.customDocuments.forEach((doc, index) => {
        allDocs.push({ id: `custom-${index}`, name: `Custom Document ${index + 1}`, type: "Custom", url: doc, uploadDate });
      });
    }

    setDocuments(allDocs);
  };

  return {
    documents,
    setDocuments,
    activeUploads,
    documentInputRef,
    handleDocumentUpload,
    handleDeleteDocument,
    initFromStaff,
  };
}
