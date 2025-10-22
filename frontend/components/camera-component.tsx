"use client";

import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/glass-card";

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "available" | "in_progress" | "completed";
  photo?: string;
}

interface CameraComponentProps {
  quest: Quest;
  onPhotoTaken: (photoData: string) => void;
  onClose: () => void;
}

export function CameraComponent({ quest, onPhotoTaken, onClose }: CameraComponentProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // Try back camera first, then fallback to any camera
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (backCameraError) {
        console.log('Back camera not available, trying default camera');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera metadata loaded, video ready');
          setIsCameraReady(true);
        };

        videoRef.current.oncanplay = () => {
          console.log('Camera can play, fully ready');
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera permissions and try again.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else if (err.name === 'NotSupportedError') {
          setError("Camera not supported on this device.");
        } else {
          setError("Unable to access camera. Please check permissions.");
        }
      } else {
        setError("Unable to access camera. Please check permissions.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      console.log('Camera not ready for capture');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to data URL
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoData);
    stopCamera();
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setIsCameraReady(false);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">
            📸 {quest.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Take a photo at: {quest.location}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={startCamera}
              className="mt-2 px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 transition-colors"
            >
              Retry Camera
            </button>
          </div>
        )}

        {!capturedPhoto ? (
          <div className="space-y-4">
            {/* Camera Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              {isStreaming && isCameraReady ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p>{isStreaming ? "Camera loading..." : "Starting camera..."}</p>
                    {!isCameraReady && isStreaming && (
                      <p className="text-xs mt-2 opacity-75">Please wait for camera to initialize</p>
                    )}
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={!isCameraReady}
                className="flex-1 px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCameraReady ? "Capture Photo" : "Camera Loading..."}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Captured Photo Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={capturedPhoto}
                alt="Captured photo"
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Photo Actions */}
            <div className="flex gap-3">
              <button
                onClick={retakePhoto}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={confirmPhoto}
                className="flex-1 px-4 py-2 bg-green-500/80 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                Use Photo
              </button>
            </div>
          </div>
        )}

        {/* Quest Info */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Reward:</span>
            <span className="text-primary font-medium">{quest.reward}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Difficulty:</span>
            <span className="text-foreground">{quest.difficulty}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}