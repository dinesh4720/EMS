import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";
import { uploadApi } from "../../../services/api";

const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      console.error('Failed to parse user data:', err);
      return null;
    }
  }
  return null;
};

/**
 * Custom hook for student photo-related actions
 * Handles photo upload, camera capture, and photo removal
 *
 * @param {object} student - The student object
 * @param {function} onUpdateStudent - Callback when student data is updated
 * @param {React.RefObject} printRef - Reference to printable component
 */
export function useStudentPhotoActions(student, onUpdateStudent, printRef) {
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
      toast.success("Student profile downloaded successfully!");
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

  const updatePhotoOnServer = async (photoUrl) => {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${student.id}/photo`,
      { method: 'PUT', headers, body: JSON.stringify({ photo: photoUrl }) }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update photo');
    }
  };

  const handlePhotoSave = async (croppedImage) => {
    const loadingToast = toast.loading("Uploading photo...");

    try {
      // Convert data URL to File
      const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const file = dataURLtoFile(croppedImage, "profile_photo.jpg");

      // Upload to Cloudinary
      const response = await uploadApi.uploadFile(file);

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
    const loadingToast = toast.loading("Uploading photo...");

    try {
      const response = await uploadApi.uploadFile(file);

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
      toast.error("No photo to adjust");
    }
  };

  const handleUploadNewPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = async () => {
    if (!student?.photo) {
      toast.error("No photo to remove");
      return;
    }

    const loadingToast = toast.loading("Removing photo...");

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
