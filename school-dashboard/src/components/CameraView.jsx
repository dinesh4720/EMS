import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";
import { RotateCcw, Check, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * CameraView - Fullscreen live camera preview with capture functionality
 *
 * Features:
 * - Live camera preview using getUserMedia API
 * - Front/back camera switching (mobile)
 * - Photo capture with instant preview
 * - Retake/confirm options
 * - Comprehensive error handling
 * - Responsive design for mobile and desktop
 *
 * @param {Object} props
 * @param {Function} props.onCapture - Called with captured photo (File object)
 * @param {Function} props.onClose - Close handler
 */
const CameraView = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // 'user' or 'environment'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsLoading(false);

      // Handle specific error types
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
        toast.error("Camera access denied. Please check your browser permissions.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
        toast.error("No camera detected on this device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera is already in use by another application.");
        toast.error("Camera is being used by another app.");
      } else {
        setError("Unable to access camera. Please try again.");
        toast.error("Failed to access camera.");
      }
    }
  }, [facingMode, stream]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
      // Clean up captured image URL
      if (capturedImage?.url) {
        URL.revokeObjectURL(capturedImage.url);
      }
    };
  }, []);

  // Reinitialize when facing mode changes
  useEffect(() => {
    if (capturedImage) return; // Don't restart if showing captured image

    startCamera();
  }, [facingMode]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip horizontally if using front camera for mirror effect
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage({ url: imageUrl, blob: blob });
          stopCamera();
        }
        setIsCapturing(false);
      },
      "image/jpeg",
      0.95
    );
  }, [facingMode, stopCamera, isCapturing]);

  // Retake photo
  const handleRetake = useCallback(() => {
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
    startCamera();
  }, [capturedImage, startCamera]);

  // Use captured photo
  const handleUsePhoto = useCallback(() => {
    if (capturedImage?.blob) {
      const file = new File([capturedImage.blob], "camera_photo.jpg", {
        type: "image/jpeg",
      });
      onCapture(file);
    }
  }, [capturedImage, onCapture]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    stopCamera();
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    onClose();
  }, [stopCamera, capturedImage, onClose]);

  return (
    <div className="relative w-full h-[600px] bg-black flex items-center justify-center">
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20 p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-danger" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Camera Error
            </h3>
            <p className="text-default-400 mb-8 text-sm">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button
                color="primary"
                onPress={startCamera}
                className="font-medium"
              >
                Try Again
              </Button>
              <Button
                variant="flat"
                color="default"
                onPress={handleClose}
                className="font-medium"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && !capturedImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-4 border-white border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm font-medium">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Camera Preview / Captured Image */}
      {!error && (
        <>
          <div className="relative w-full h-full">
            {capturedImage ? (
              // Captured Image Preview
              <img
                src={capturedImage.url}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            ) : (
              // Live Camera Feed
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />
              </>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center justify-center gap-6">
                {capturedImage ? (
                  // Preview Controls
                  <>
                    <Button
                      isIconOnly
                      size="lg"
                      variant="flat"
                      color="default"
                      onPress={handleRetake}
                      className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    >
                      <RotateCcw size={24} className="text-white" />
                    </Button>

                    <button
                      onClick={handleUsePhoto}
                      className="w-20 h-20 rounded-full bg-white border-4 border-white/50 hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center shadow-lg"
                    >
                      <Check size={32} className="text-default-900" />
                    </button>

                    <div className="w-14 h-14"></div>
                  </>
                ) : (
                  // Capture Controls
                  <>
                    {/* Switch Camera Button - Only show if device has multiple cameras */}
                    <Button
                      isIconOnly
                      size="lg"
                      variant="flat"
                      color="default"
                      onPress={switchCamera}
                      className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    >
                      <RotateCcw size={24} className="text-white" />
                    </Button>

                    {/* Capture Button */}
                    <button
                      onClick={capturePhoto}
                      disabled={isCapturing}
                      className={`w-20 h-20 rounded-full bg-white border-4 border-white/50 flex items-center justify-center shadow-lg transition-all duration-200 ${
                        isCapturing
                          ? 'scale-95 opacity-70'
                          : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-full border-2 border-default-400 transition-all duration-200 ${
                        isCapturing ? 'scale-90 border-primary-500' : ''
                      }`}></div>
                    </button>

                    {/* Close Button */}
                    <Button
                      isIconOnly
                      size="lg"
                      variant="flat"
                      color="default"
                      onPress={handleClose}
                      className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    >
                      <X size={24} className="text-white" />
                    </Button>
                  </>
                )}
              </div>

              {/* Helper Text */}
              {!capturedImage && !isLoading && (
                <p className="text-center text-white/70 text-xs mt-4 font-medium">
                  Tap the center button to capture
                </p>
              )}
            </div>

            {/* Top Close Button (for captured state) */}
            {capturedImage && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            )}
          </div>

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
};

export default CameraView;
