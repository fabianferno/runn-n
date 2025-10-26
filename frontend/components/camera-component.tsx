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
  const [showUpload, setShowUpload] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle close button - stop camera
  const handleClose = () => {
    stopCamera();
    onClose();
  };

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
            facingMode: 'environment'
          }
        });
        console.log('Back camera accessed successfully');
      } catch (backCameraError) {
        console.log('Back camera not available, trying default camera');
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('Default camera accessed successfully');
        } catch (defaultError) {
          console.error('Default camera also failed:', defaultError);
          throw defaultError;
        }
      }
      
      console.log('Stream obtained:', stream);
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks());
      
      if (videoRef.current) {
        console.log('Setting video srcObject');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);

        // Safety timeout - mark as ready after 5 seconds regardless
        const timeoutId = setTimeout(() => {
          console.log('Safety timeout - marking camera as ready');
          setIsCameraReady(true);
        }, 5000);

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeoutId); // Clear the safety timeout
          console.log('Camera metadata loaded, video ready');
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          videoRef.current?.play().then(() => {
            console.log('Video started playing');
            setIsCameraReady(true);
          }).catch(err => {
            console.error('Error playing video:', err);
            // Mark as ready even if play fails (stream might still work)
            setTimeout(() => setIsCameraReady(true), 500);
          });
        };

        videoRef.current.oncanplay = () => {
          console.log('Camera can play, fully ready');
        };

        videoRef.current.onloadeddata = () => {
          console.log('Camera data loaded');
        };

        videoRef.current.onplay = () => {
          console.log('Video is playing');
          clearTimeout(timeoutId); // Clear timeout if video starts playing
          setIsCameraReady(true);
        };

        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
        };

        // Force play attempt
        setTimeout(() => {
          if (videoRef.current && !isCameraReady) {
            videoRef.current.play().then(() => {
              console.log('Forced play successful');
              clearTimeout(timeoutId);
              setIsCameraReady(true);
            }).catch(console.error);
          }
        }, 100);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedPhoto(result);
        setShowUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" style={{ touchAction: 'manipulation' }}>
      <GlassCard className="w-full max-w-lg p-6 flex flex-col gap-4" style={{ touchAction: 'manipulation' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              📸 {quest.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {quest.location}
            </p>
          </div>
          <button
            onClick={handleClose}
            onTouchEnd={(e: React.TouchEvent) => {
              e.preventDefault();
              handleClose();
            }}
            className="neumorphic-button px-3 py-2 text-white"
            style={{ touchAction: 'manipulation' }}
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-sm mb-3">{error}</p>
            <button
              onClick={startCamera}
              onTouchEnd={(e: React.TouchEvent) => {
                e.preventDefault();
                startCamera();
              }}
              className="neumorphic-button text-red-300"
              style={{ touchAction: 'manipulation' }}
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Camera/Main Content */}
        <div className="flex flex-col gap-3">
          {!capturedPhoto ? (
            <>
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpload(false)}
                  onTouchEnd={(e: React.TouchEvent) => {
                    e.preventDefault();
                    setShowUpload(false);
                  }}
                  className={`flex-1 neumorphic-button text-sm transition-colors min-h-[44px] touch-manipulation ${
                    !showUpload 
                      ? 'text-white' 
                      : 'text-gray-400'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  📷 Camera
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  onTouchEnd={(e: React.TouchEvent) => {
                    e.preventDefault();
                    setShowUpload(true);
                  }}
                  className={`flex-1 neumorphic-button text-sm transition-colors min-h-[44px] touch-manipulation ${
                    showUpload 
                      ? 'text-white' 
                      : 'text-gray-400'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  📁 Upload
                </button>
              </div>

              {!showUpload ? (
                <>
                  {/* Camera Preview */}
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-64 object-cover transition-opacity duration-300 ${!isCameraReady ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {!isCameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2 animate-pulse">📷</div>
                          <p className="text-sm">{isStreaming ? "Loading..." : "Starting..."}</p>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Camera Controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      onTouchEnd={(e: React.TouchEvent) => {
                        e.preventDefault();
                        handleClose();
                      }}
                      className="flex-1 neumorphic-button text-gray-300"
                      style={{ touchAction: 'manipulation' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      onTouchEnd={(e: React.TouchEvent) => {
                        e.preventDefault();
                        capturePhoto();
                      }}
                      disabled={!isCameraReady}
                      className="flex-1 neumorphic-button text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ touchAction: 'manipulation' }}
                    >
                      {isCameraReady ? "📸 Capture" : "Loading..."}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-500/30 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose an image from your device
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      onTouchEnd={(e: React.TouchEvent) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                      className="neumorphic-button text-white min-h-[44px] min-w-[120px]"
                      style={{ touchAction: 'manipulation' }}
                    >
                      Choose File
                    </button>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      onTouchEnd={(e: React.TouchEvent) => {
                        e.preventDefault();
                        handleClose();
                      }}
                      className="flex-1 neumorphic-button text-gray-300"
                      style={{ touchAction: 'manipulation' }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-3">
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
                  onTouchEnd={(e: React.TouchEvent) => {
                    e.preventDefault();
                    retakePhoto();
                  }}
                  className="flex-1 neumorphic-button text-gray-300"
                  style={{ touchAction: 'manipulation' }}
                >
                  🔄 Retake
                </button>
                <button
                  onClick={confirmPhoto}
                  onTouchEnd={(e: React.TouchEvent) => {
                    e.preventDefault();
                    confirmPhoto();
                  }}
                  className="flex-1 neumorphic-button text-white"
                  style={{ touchAction: 'manipulation', background: 'rgba(34, 197, 94, 0.2)' }}
                >
                  ✓ Use Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quest Info */}
        <div className="p-3 bg-white/5 rounded-lg">
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