import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";

/**
 * useStaffPhoto
 * Manages photo preview, editor, camera capture state and handlers.
 *
 * @param {string} id - Staff MongoDB ObjectId
 * @param {Function} updateStaff - AppContext updateStaff(id, data)
 * @param {object} uploadApi - API object with uploadFile(file) method
 */
export default function useStaffPhoto(id, updateStaff, uploadApi) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
        e.target.value = null;
        reader.onloadend = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraPhotoCapture = async (file) => {
    const loadingToast = toast.loading(t("toast.loading.uploadingPhoto"));

    try {
      const response = await uploadApi.uploadFile(file);
      await updateStaff(id, { picture: response.url });
      setPicturePreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
    } catch (error) {
      logger.error("Photo upload error:", error);
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handlePhotoSave = async (croppedBlob) => {
    const loadingToast = toast.loading(t("toast.loading.uploadingPhoto"));

    try {
      const file = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
      const response = await uploadApi.uploadFile(file);
      await updateStaff(id, { picture: response.url });
      setPicturePreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
    } catch (error) {
      logger.error("Photo upload error:", error);
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateStaff(id, { picture: null });
      setPicturePreview(null);
      toast.success(t("toast.success.photoRemoved"));
    } catch {
      toast.error(t("toast.error.failedToRemovePhoto"));
    }
  };

  return {
    picturePreview,
    setPicturePreview,
    selectedImageForEdit,
    isPhotoEditorOpen,
    setIsPhotoEditorOpen,
    isCameraCaptureOpen,
    setIsCameraCaptureOpen,
    fileInputRef,
    handleFileSelect,
    handleCameraPhotoCapture,
    handlePhotoSave,
    handleRemovePhoto,
  };
}
