import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseUpload } from '@/hooks/use-supabase-upload';
import { trackSelfieUploadEvent } from '@/utils/event-tracking';
import { uploadSelfieWithUserId, upsertSelfie } from '@/utils/selfies.client';

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SelfieUploadProps {
  userId: string;
  contactId: number;
  eventId: number;
  onComplete: () => void;
  className?: string;
}

export function SelfieUpload({
  userId,
  contactId,
  eventId,
  onComplete,
  className,
}: SelfieUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if device is mobile
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Setup Supabase upload hook
  const uploadOptions = useSupabaseUpload({
    bucketName: 'face_id_images',
    path: '',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    allowedMimeTypes: ['image/*'],
    onSuccess: () => {
      // Show success message
      toast.success('Selfie uploaded successfully');
    },
  });

  // Go back to selection screen
  const handleRetake = () => {
    setShowPreview(false);
    // Clear the current file
    uploadOptions.setFiles([]);
    setPreviewUrl(null);
  };

  // Handle file selection (from dropzone or camera)
  // No longer needed for Dropzone, keep for camera/manual
  const handleFileSelect = (file: File) => {
    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file),
      errors: [],
    });
    setPreviewUrl(fileWithPreview.preview);
    uploadOptions.setFiles([fileWithPreview]);
    setShowPreview(true);
  };

  // Sync preview with Dropzone file selection
  useEffect(() => {
    const file = uploadOptions.files[0];
    if (file) {
      if (!file.preview) {
        file.preview = URL.createObjectURL(file);
      }
      setPreviewUrl(file.preview);
      setShowPreview(true);
    } else {
      setPreviewUrl(null);
      setShowPreview(false);
    }
    return () => {
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    };
  }, [uploadOptions.files]);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle selfie upload after confirmation
  const handleSelfieUpload = async () => {
    if (uploadOptions.files.length === 0) {
      setError('Please select a photo to upload');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the file to upload
      const selfieFile = uploadOptions.files[0];

      console.log('Uploading selfie with user ID:', userId);
      console.log('File type:', selfieFile.type);

      // Upload the file to Supabase storage using the uploadSelfieWithUserId function
      // This will use the user ID as the filename (e.g., user123.jpg)
      const selfiePath = await uploadSelfieWithUserId(selfieFile, userId);

      console.log('Selfie uploaded successfully, path:', selfiePath);

      // Use shared selfie utilities for upsert
      await upsertSelfie({
        contact_id: contactId,
        user_id: userId,
        path: selfiePath,
        offset_x: offset.x,
        offset_y: offset.y,
        scale: scale,
      });

      console.log('Selfie record upserted successfully');

      // Track the selfie upload event
      await trackSelfieUploadEvent(contactId, eventId, userId);

      // Set success state
      setSuccess(true);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user', 'withRoles'] });
    } catch (error: any) {
      console.error('Error uploading selfie:', error);
      setError(error.message || 'An error occurred while uploading your selfie');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle camera capture on mobile
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Set capture attribute for front camera
    input.setAttribute('capture', 'user');

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    input.click();
  };

  // --- Selfie Drag State ---
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });

  // --- Selfie Scale State ---
  const [scale, setScale] = useState(1);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.lastX = offset.x;
    dragState.current.lastY = offset.y;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.lastX + dx,
      y: dragState.current.lastY + dy,
    });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            {showPreview ? 'Confirm Your Selfie' : 'Upload Your Selfie'}
          </CardTitle>
          <CardDescription className="text-foreground">
            {showPreview
              ? 'Make sure your face is clearly visible'
              : 'This helps us identify you in your graduation photos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-foreground">
                Your selfie has been uploaded successfully! You'll now be able to find your photos
                easily.
              </p>
            </div>
          ) : showPreview ? (
            <div className="flex flex-col gap-6">
              <div className="flex justify-center">
                {showPreview && previewUrl ? (
                  <div
                    ref={dragRef}
                    className="relative w-64 h-64 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center touch-none select-none"
                    style={{ cursor: 'grab' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    <img
                      src={previewUrl}
                      alt="Selfie preview"
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transition: 'transform 0.1s',
                      }}
                    />
                  </div>
                ) : (
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="bg-muted">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {/* Scale controls */}
              {showPreview && (
                <div className="flex gap-2 justify-center mt-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                    disabled={scale <= 0.5}
                  >
                    -
                  </Button>
                  <span className="w-16 text-center">{Math.round(scale * 100)}%</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setScale((s) => Math.min(2, s + 0.1))}
                    disabled={scale >= 2}
                  >
                    +
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  {uploadOptions.files[0]?.preview ? (
                    <AvatarImage src={uploadOptions.files[0].preview} alt="Preview" />
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div className="space-y-4">
                {isMobile && (
                  <Button className="w-full" onClick={handleCameraCapture} disabled={isLoading}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Selfie
                  </Button>
                )}

                <Dropzone {...uploadOptions} className="w-full">
                  <DropzoneContent />
                  <DropzoneEmptyState />
                </Dropzone>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className={cn('flex gap-2', showPreview && 'flex-col')}>
          {success && (
            <Button
              className="w-full bg-primary hover:bg-primary/70 text-primary-foreground font-medium py-3 rounded-lg"
              onClick={onComplete}
            >
              Continue to App
            </Button>
          )}

          {!success && !showPreview && (
            <>
              <Button
                className="w-full flex-1 bg-primary hover:bg-primary/70 text-primary-foreground font-medium py-3 rounded-lg"
                onClick={() => setShowPreview(true)}
                disabled={isLoading || uploadOptions.files.length === 0}
              >
                Continue
              </Button>
              <Button
                variant="ghost"
                className="w-full flex-1"
                onClick={onComplete}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </>
          )}

          {!success && showPreview && (
            <>
              <Button
                className="w-full bg-primary hover:bg-primary/70 text-primary-foreground font-medium py-3 rounded-lg"
                onClick={handleSelfieUpload}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Confirm & Upload'}
              </Button>
              <Button
                variant="outline"
                className="w-full flex-1"
                onClick={handleRetake}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake Photo
              </Button>
              <Button
                variant="ghost"
                className="w-full flex-1"
                onClick={onComplete}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
