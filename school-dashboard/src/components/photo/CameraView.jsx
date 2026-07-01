import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";
import { RotateCcw, Check, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


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
  const { t } = useTranslation();
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // 'user' or 'environment'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // Hold the active MediaStream in a ref so cleanup always sees the current
  // stream. A state value closed over by the mount effect goes stale (MEM-03):
  // it snapshots `stream === null` from the first render, so unmount cleanup
  // no-ops and the camera tracks stay live forever.
  const streamRef = useRef(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop any existing stream (e.g. when switching cameras) so we never
      // leave the previous camera live alongside the new one.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
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
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
        };
      }
    } catch (err) {
      logger.error("Error accessing camera:", err);
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
  }, [facingMode]);

  // Stop camera — reads the live stream from the ref so it is never a stale
  // no-op, even when called from a cleanup closure captured at first render.
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start the camera on mount and restart it whenever the facing mode changes
  // (startCamera's identity changes only with facingMode). The cleanup runs on
  // every re-run and on unmount, and stopCamera releases the live stream from
  // the ref — so the camera tracks are always stopped instead of leaking
  // (MEM-03). switchCamera is only reachable from the live view, so this never
  // restarts while a captured image is being previewed.
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Revoke the captured image's object URL when it is replaced or on unmount,
  // so blob URLs do not accumulate across capture/retake cycles.
  useEffect(() => {
    const url = capturedImage?.url;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [capturedImage]);

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

  // Retake photo — the previous object URL is revoked by the capturedImage
  // cleanup effect when capturedImage transitions back to null.
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

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

  // Handle close — the captured image's object URL is revoked by its cleanup
  // effect when CameraView unmounts.
  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

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
            <p className="text-white text-sm font-medium">{t('components.startingCamera')}</p>
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
                      aria-label="Retake photo"
                      onPress={handleRetake}
                      className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    >
                      <RotateCcw size={24} className="text-white" />
                    </Button>

                    <button
                      aria-label="Use photo"
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
                      aria-label="Switch camera"
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
                      aria-label="Close camera"
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
                type="button"
                onClick={handleClose}
                aria-label="Close camera"
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
