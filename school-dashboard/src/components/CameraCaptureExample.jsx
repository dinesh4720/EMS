/**
 * CameraCaptureModal Integration Example
 *
 * This file demonstrates how to integrate the CameraCaptureModal
 * into your existing components.
 */

import React, { useState } from "react";
import { Button, Avatar } from "@heroui/react";
import { User, Camera } from "lucide-react";
import CameraCaptureModal from "./CameraCaptureModal";
import toast from "react-hot-toast";
import { uploadApi } from "../services/api";

/**
 * Example 1: Basic Usage - Simple profile photo upload
 */
export function BasicExample() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photo, setPhoto] = useState(null);

  const handlePhotoCaptured = (file) => {
    console.log("Photo captured:", file);
    setPhoto(file);
    setIsCameraOpen(false);
    toast.success("Photo captured successfully!");
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Example 1: Basic Usage</h2>

      {/* Avatar Display */}
      <div className="flex items-center gap-4">
        {photo ? (
          <Avatar
            src={URL.createObjectURL(photo)}
            className="w-24 h-24"
            onClick={() => setIsCameraOpen(true)}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full border-2 border-dashed border-default-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-50/20 transition-all"
            onClick={() => setIsCameraOpen(true)}
          >
            <User size={40} className="text-default-400" />
          </div>
        )}

        <Button
          color="primary"
          startContent={<Camera size={18} />}
          onPress={() => setIsCameraOpen(true)}
        >
          Add Photo
        </Button>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </div>
  );
}

/**
 * Example 2: With Server Upload - Upload to Cloudinary/backend
 */
export function WithUploadExample() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoCaptured = async (file) => {
    const loadingToast = toast.loading("Uploading photo...");
    setIsUploading(true);

    try {
      // Upload to your server/Cloudinary
      const response = await uploadApi.uploadFile(file);

      // Save the URL
      setPhotoUrl(response.url);
      setIsCameraOpen(false);

      toast.success("Photo uploaded successfully!", { id: loadingToast });

      // Optionally save to database
      // await api.updateProfile({ photo: response.url });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Example 2: With Server Upload</h2>

      <div className="flex items-center gap-4">
        {photoUrl ? (
          <Avatar
            src={photoUrl}
            className="w-24 h-24"
            isBordered
            color="primary"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full border-2 border-dashed border-default-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-50/20 transition-all"
            onClick={() => !isUploading && setIsCameraOpen(true)}
          >
            <User size={40} className="text-default-400" />
          </div>
        )}

        <Button
          color="primary"
          startContent={<Camera size={18} />}
          onPress={() => setIsCameraOpen(true)}
          isLoading={isUploading}
          isDisabled={isUploading}
        >
          {photoUrl ? "Change Photo" : "Upload Photo"}
        </Button>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        title="Upload Profile Photo"
        description="Choose a photo from your device or take a new one"
      />
    </div>
  );
}

/**
 * Example 3: Student Profile Integration
 * Demonstrates integration with student data form
 */
export function StudentProfileExample() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [studentData, setStudentData] = useState({
    name: "John Doe",
    photo: null,
  });

  const handlePhotoCaptured = async (file) => {
    const loadingToast = toast.loading("Updating photo...");

    try {
      // Upload photo
      const response = await uploadApi.uploadFile(file);

      // Update student data
      setStudentData((prev) => ({
        ...prev,
        photo: response.url,
      }));

      setIsCameraOpen(false);

      toast.success("Photo updated!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to update photo", { id: loadingToast });
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-md">
      <h2 className="text-xl font-bold">Example 3: Student Profile</h2>

      <div className="bg-default-50 rounded-xl p-6 space-y-4">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            {studentData.photo ? (
              <Avatar
                src={studentData.photo}
                name={studentData.name}
                className="w-20 h-20 text-2xl"
                isBordered
                color="primary"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-default-200 flex items-center justify-center cursor-pointer hover:bg-default-300 transition-colors"
                onClick={() => setIsCameraOpen(true)}
              >
                <User size={36} className="text-default-500" />
              </div>
            )}

            {/* Camera Icon */}
            <div
              className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-default-200 cursor-pointer hover:bg-default-50 transition-colors"
              onClick={() => setIsCameraOpen(true)}
            >
              <Camera size={14} className="text-default-600" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg">{studentData.name}</h3>
            <p className="text-sm text-default-500">Class 10-A • Roll 25</p>
          </div>
        </div>

        {/* Actions */}
        <Button
          variant="flat"
          color="primary"
          size="sm"
          onPress={() => setIsCameraOpen(true)}
        >
          {studentData.photo ? "Change Photo" : "Add Photo"}
        </Button>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </div>
  );
}

/**
 * Example 4: Custom Styling - Override title and description
 */
export function CustomStylingExample() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Example 4: Custom Styling</h2>

      <Button
        color="secondary"
        startContent={<Camera size={18} />}
        onPress={() => setIsCameraOpen(true)}
      >
        Open Custom Camera
      </Button>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(file) => {
          console.log("Custom flow:", file);
          setIsCameraOpen(false);
        }}
        title="Upload Your Avatar"
        description="Select a photo from your gallery or take a new selfie"
      />
    </div>
  );
}

/**
 * Complete Example Page
 */
export default function CameraCaptureExamples() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">CameraCaptureModal Examples</h1>
          <p className="text-default-500">
            Integration examples for the camera capture component system
          </p>
        </div>

        <div className="grid gap-8">
          <BasicExample />
          <hr className="border-default-200" />
          <WithUploadExample />
          <hr className="border-default-200" />
          <StudentProfileExample />
          <hr className="border-default-200" />
          <CustomStylingExample />
        </div>
      </div>
    </div>
  );
}
