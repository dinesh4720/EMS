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
      console.log("Print completed");
      toast.success("Student profile downloaded successfully!");
    },
    onBeforeGetContent: () => {
      console.log("Preparing content for printing...");
      return Promise.resolve();
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📸 File selected:', file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ File loaded, opening photo editor');
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
        e.target.value = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSave = async (croppedImage) => {
    console.log('💾 Saving cropped photo for student');
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
      console.log('✅ Photo file created, uploading to server');

      // Upload to Cloudinary
      const response = await uploadApi.uploadFile(file);

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Update student photo using direct MongoDB update
      const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          photo: response.url,
          // Include all other fields to prevent data loss
          name: student.name,
          admissionId: student.admissionId,
          classId: student.classId,
          rollNo: student.rollNo,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          bloodGroup: student.bloodGroup,
          email: student.email,
          phone: student.phone,
          address: student.address,
          city: student.city || "",
          state: student.state || "",
          zipCode: student.zipCode || "",
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          status: student.status,
          feeStatus: student.feeStatus
        })
      });

      if (!response2.ok) {
        const error = await response2.json();
        throw new Error(error.error || 'Failed to save photo');
      }

      // Update global state to trigger instant re-render
      if (onUpdateStudent) {
        onUpdateStudent(student.id, { photo: response.url });
      }

      // Update local preview
      setPhotoPreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });

      // Close modal after successful upload
      setIsPhotoEditorOpen(false);
    } catch (error) {
      console.error("❌ Photo upload error:", error);
      toast.error("Photo upload failed: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleCameraPhotoCapture = async (file) => {
    console.log('📸 Photo captured from camera/upload:', file.name);

    const loadingToast = toast.loading("Uploading photo...");

    try {
      // Upload to Cloudinary
      const response = await uploadApi.uploadFile(file);

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Update student photo using direct MongoDB update
      const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          photo: response.url,
          // Include all other fields to prevent data loss
          name: student.name,
          admissionId: student.admissionId,
          classId: student.classId,
          rollNo: student.rollNo,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          bloodGroup: student.bloodGroup,
          email: student.email,
          phone: student.phone,
          address: student.address,
          city: student.city || "",
          state: student.state || "",
          zipCode: student.zipCode || "",
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          status: student.status,
          feeStatus: student.feeStatus
        })
      });

      if (!response2.ok) {
        const error = await response2.json();
        throw new Error(error.error || 'Failed to save photo');
      }

      // Update global state to trigger instant re-render
      if (onUpdateStudent) {
        onUpdateStudent(student.id, { photo: response.url });
      }

      // Update local preview
      setPhotoPreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });

      // Close camera modal after successful upload
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
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Update student photo to null/empty
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          photo: null,
          // Include all other fields to prevent data loss
          name: student.name,
          admissionId: student.admissionId,
          classId: student.classId,
          rollNo: student.rollNo,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          bloodGroup: student.bloodGroup,
          email: student.email,
          phone: student.phone,
          address: student.address,
          city: student.city || "",
          state: student.state || "",
          zipCode: student.zipCode || "",
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          status: student.status,
          feeStatus: student.feeStatus
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove photo');
      }

      // Update global state to trigger instant re-render
      if (onUpdateStudent) {
        onUpdateStudent(student.id, { photo: null });
      }

      // Update local preview
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
