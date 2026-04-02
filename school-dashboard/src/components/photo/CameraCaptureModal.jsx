import React, { useState, useRef, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Camera, Upload, X } from "lucide-react";
import CameraView from "./CameraView";
import PhotoEditorModal from "./PhotoEditorModal";
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

/**
 * CameraCaptureModal - Profile photo capture modal with upload and camera options
 *
 * User Flow:
 * 1. Modal opens with two options: Upload from Device or Take Photo with Camera
 * 2. If "Upload from Device" → Opens file picker → Opens PhotoEditorModal
 * 3. If "Take Photo" → Opens CameraView → Captures → Opens PhotoEditorModal
 * 4. PhotoEditorModal → Crops/edits → Returns final photo
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} props.onPhotoCaptured - Called with final photo (File object)
 * @param {string} props.title - Optional title override
 * @param {string} props.description - Optional description override
 */
const CameraCaptureModal = ({ isOpen, onClose, onPhotoCaptured, title, description }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null); // 'upload' | 'camera' | null
  const [, setCapturedFile] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorImage, setEditorImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleUploadFromDevice = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      openEditor(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const handleOpenCamera = useCallback(() => {
    setMode('camera');
  }, []);

  const handleCameraCapture = useCallback((file) => {
    setCapturedFile(file);
    setMode(null); // Reset mode
    openEditor(file);
  }, []);

  const openEditor = useCallback((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditorImage(reader.result);
      setIsEditorOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleEditorSave = useCallback((croppedImage) => {
    // Convert the cropped image (data URL) back to a File object
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
        onPhotoCaptured(file);
        handleClose();
      })
      .catch(err => {
        console.error("Error processing cropped image:", err);
      });
  }, [onPhotoCaptured]);

  const handleClose = useCallback(() => {
    setMode(null);
    setCapturedFile(null);
    setEditorImage(null);
    setIsEditorOpen(false);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    setMode(null);
    setCapturedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen && !mode}
        onClose={handleClose}
        size="md"
        portalContainer={document.body}
        classNames={{
          body: "p-0",
          base: "bg-background border border-default-200 z-[999999]",
          wrapper: "z-[999999]",
          backdrop: "z-[999999]",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 px-6 pt-6">
            <h3 className="text-xl font-bold text-default-900">{title || "Add Profile Photo"}</h3>
            <p className="text-sm text-default-500 font-normal">
              {description || "Choose how you'd like to add your profile photo"}
            </p>
          </ModalHeader>
          <ModalBody className="px-6 pb-2">
            <div className="grid grid-cols-1 gap-4">
              {/* Upload from Device Button */}
              <button
                className="group relative w-full py-5 px-5 rounded-xl border-2 border-default-200 hover:border-primary hover:bg-primary-50/30 dark:hover:bg-primary-900/30 transition-all duration-200 flex items-center gap-4"
                onClick={handleUploadFromDevice}
              >
                <div className="w-14 h-14 rounded-full bg-default-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                  <Upload size={28} className="text-default-500 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-semibold text-default-900 group-hover:text-primary transition-colors">
                    📁 Upload from Device
                  </h3>
                  <p className="text-sm text-default-500">{t('components.browseFilesOnYourDevice')}</p>
                </div>
              </button>

              {/* Take Photo with Camera Button */}
              <button
                className="group relative w-full py-5 px-5 rounded-xl border-2 border-default-200 hover:border-primary hover:bg-primary-50/30 dark:hover:bg-primary-900/30 transition-all duration-200 flex items-center gap-4"
                onClick={handleOpenCamera}
              >
                <div className="w-14 h-14 rounded-full bg-default-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                  <Camera size={28} className="text-default-500 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-semibold text-default-900 group-hover:text-primary transition-colors">
                    📷 Take Photo with Camera
                  </h3>
                  <p className="text-sm text-default-500">{t('components.captureANewPhotoUsingYourCamera')}</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </ModalBody>
          <ModalFooter className="px-6 pb-6 pt-4">
            <Button variant="flat" color="default" onPress={handleClose} className="font-medium">
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Camera Mode - Separate Modal */}
      <Modal
        isOpen={mode === 'camera'}
        onClose={handleBack}
        size="2xl"
        portalContainer={document.body}
        classNames={{
          base: "bg-black z-[999999]",
          body: "p-0",
          wrapper: "z-[999999]",
          backdrop: "z-[999999]",
        }}
      >
        <ModalContent className="bg-black">
          <CameraView
            onCapture={handleCameraCapture}
            onClose={handleBack}
          />
        </ModalContent>
      </Modal>

      {/* Photo Editor Modal */}
      <PhotoEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageSrc={editorImage}
        onSave={handleEditorSave}
      />
    </>
  );
};

export default CameraCaptureModal;
