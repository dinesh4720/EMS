import { request } from '../../../services/api.js';
import { useState, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";
import { uploadApi } from "../../../services/api";

/**
 * Custom hook for student photo-related actions
 * Handles photo upload, camera capture, and photo removal
 *
 * @param {object} student - The student object
 * @param {function} onUpdateStudent - Callback when student data is updated
 * @param {React.RefObject} printRef - Reference to printable component
 */
export function useStudentPhotoActions(student, onUpdateStudent, printRef) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  // Setup print handler
  const handlePrint = useReactToPrint({
    content: () => printRef?.current,
    documentTitle: `${student?.name || "Student"}_Profile`,
    onAfterPrint: () => {
      toast.success(t('toast.success.studentProfileDownloadedSuccessfully'));
    },
    onBeforeGetContent: () => {
      return Promise.resolve();
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
        e.target.value = null;
      };
      reader.readAsDataURL(file);
    }
  };

  // useCallback with student?.id dep prevents stale closure when student identity changes (AP-12)
  const updatePhotoOnServer = useCallback(async (photoUrl) => {
    await request(`/students/${student.id}/photo`, {
      method: 'PUT',
      body: JSON.stringify({ photo: photoUrl })
    });
  }, [student?.id]);

  // Retry helper: attempts fn up to maxRetries times with exponential back-off (AP-20, AP-21)
  const withRetry = async (fn, maxRetries = 2) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  };

  const handlePhotoSave = async (croppedImage) => {
    const loadingToast = toast.loading(t('toast.loading.uploadingPhoto'));

    try {
      // Convert data URL to File
      const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const file = dataURLtoFile(croppedImage, "profile_photo.jpg");

      // Upload to Cloudinary with retry on network failure
      const response = await withRetry(() => uploadApi.uploadFile(file));

      await updatePhotoOnServer(response.url);

      if (onUpdateStudent) {
        onUpdateStudent(student.id, { photo: response.url });
      }

      setPhotoPreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
      setIsPhotoEditorOpen(false);
    } catch (error) {
      console.error("❌ Photo upload error:", error);
      toast.error("Photo upload failed: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleCameraPhotoCapture = async (file) => {
    const loadingToast = toast.loading(t('toast.loading.uploadingPhoto'));

    try {
      // Upload to Cloudinary with retry on network failure
      const response = await withRetry(() => uploadApi.uploadFile(file));

      await updatePhotoOnServer(response.url);

      if (onUpdateStudent) {
        onUpdateStudent(student.id, { photo: response.url });
      }

      setPhotoPreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
      setIsCameraCaptureOpen(false);
    } catch (error) {
      console.error("❌ Photo upload error:", error);
      toast.error("Photo upload failed: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleAdjustPhoto = () => {
    if (student?.photo) {
      setIsCameraCaptureOpen(true);
    } else {
      toast.error(t('toast.error.noPhotoToAdjust'));
    }
  };

  const handleUploadNewPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = async () => {
    if (!student?.photo) {
      toast.error(t('toast.error.noPhotoToRemove'));
      return;
    }

    const loadingToast = toast.loading(t('toast.loading.removingPhoto'));

    try {
      await updatePhotoOnServer(null);

      if (onUpdateStudent) {
        onUpdateStudent(student.id, { photo: null });
      }

      setPhotoPreview(null);
      toast.success("Photo removed successfully", { id: loadingToast });
    } catch (error) {
      console.error("❌ Photo removal error:", error);
      toast.error("Photo removal failed: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleDownload = () => {
    toast.loading("Preparing student profile for download...", { id: "download-profile" });
    handlePrint();
  };

  return {
    fileInputRef,
    photoPreview,
    selectedImageForEdit,
    isPhotoEditorOpen,
    setIsPhotoEditorOpen,
    isCameraCaptureOpen,
    setIsCameraCaptureOpen,
    handleFileSelect,
    handlePhotoSave,
    handleCameraPhotoCapture,
    handleAdjustPhoto,
    handleUploadNewPhoto,
    handleRemovePhoto,
    handleDownload
  };
}
