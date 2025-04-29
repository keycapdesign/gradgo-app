import { useEffect, useState } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, Camera, HelpCircle, Info, Mail, Phone, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { CustomDropzoneContent } from './custom-dropzone-content';
import { CustomDropzoneEmptyState } from './custom-dropzone-empty-state';
import { EditProfileDialog } from './edit-profile-dialog';
import { SupportDialog } from './support-dialog';
import { useSupabaseUpload } from '@/hooks/use-supabase-upload';
import { useIsMobile } from '@/hooks/useMobile';
import type { SelfieRecord } from '@/utils/selfies.types';
import { uploadSelfieWithUserId, upsertSelfie } from '@/utils/selfies.client';
import { selfieQueryOptions } from '@/utils/selfies.server';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import { getSignedUrl } from '@/utils/supabase/get-signed-url-client';

import { Dropzone } from '@/components/dropzone';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SelfiePreview } from '@/components/selfie/selfie-preview';
import { useSelfieManipulation } from '@/components/selfie/use-selfie-manipulation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function StudentProfile() {
  const navigate = useNavigate();

  // State for dialogs and popovers
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState('');
  const [pendingSelfieFile, setPendingSelfieFile] = useState<File | null>(null);

  // Check if on mobile device
  const isMobileDevice = useIsMobile();

  // Fetch user and contact data using suspense queries
  // These will never suspend here because they're already loaded in the route loader
  const { data: userData } = useSuspenseQuery(userWithRolesQueryOptions());
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());
  const queryClient = useQueryClient();

  // Get contact details from contact data or use fallbacks
  const contactDetails = {
    email: userData?.email || contactData?.email || 'student@example.com',
    phone: contactData?.phone || '+44 7700 900123',
  };

  // --- Fetch selfie record using new helper ---
  const { data: selfieData } = useSuspenseQuery(selfieQueryOptions(contactData?.contact_id)) as {
    data: SelfieRecord | null;
  };

  // --- Selfie manipulation state (for uploading new selfie) ---
  // Initialize with default values to avoid circular dependencies
  const {
    offset,
    setOffset,
    scale,
    setScale,
    dragRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSelfieManipulation({ x: 0, y: 0 }, 1);

  // This effect runs when selfieData changes
  useEffect(() => {
    if (selfieData) {
      const selfie = selfieData;
      (async () => {
        try {
          // Get the signed URL for the selfie image
          const url = selfie?.path
            ? await getSignedUrl('face_id_images', selfie.path, 60 * 60)
            : '';
          setSelfieUrl(url || '');

          // Always update offset and scale from selfie data to ensure consistency
          if (selfie.offset_x !== undefined && selfie.offset_y !== undefined) {
            setOffset({ x: selfie.offset_x, y: selfie.offset_y });
          } else {
            setOffset({ x: 0, y: 0 });
          }
          if (selfie.scale !== undefined) {
            setScale(selfie.scale);
          } else {
            setScale(1);
          }
        } catch (err) {
          setSelfieUrl('');
        }
      })();
    } else {
      setOffset({ x: 0, y: 0 });
      setScale(1);
      setSelfieUrl('');
    }
  }, [selfieData, setOffset, setScale]);

  // Setup Supabase upload hook for profile picture
  const uploadOptions = useSupabaseUpload({
    bucketName: 'face_id_images',
    path: '',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    allowedMimeTypes: ['image/*'],
    onSuccess: () => {
      // Close the popover after successful upload
      setShowProfilePopover(false);

      // Show success message
      toast.success('Profile picture uploaded successfully');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['student', 'contact'] });
    },
  });

  // --- Upload and update logic for selfies ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle uploading a new selfie
  const handleSelfieUpload = async () => {
    if (uploadOptions.files.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!userData?.id) {
      toast.error('User ID is required');
      return;
    }

    if (!contactData?.contact_id) {
      toast.error('Contact ID is required');
      return;
    }

    const file = uploadOptions.files[0];
    console.log('Setting pending selfie file:', file.name);

    // Set the pending file but DON'T reset the selfie URL
    // This ensures the avatar image is preserved until the new image is saved
    setPendingSelfieFile(file);

    // Reset position and scale for the new image
    setOffset({ x: 0, y: 0 });
    setScale(1);

    setShowProfilePopover(false);
    setShowEditDialog(true);
  };

  // Handle saving the edited selfie (after crop/adjust)
  const handleSaveEditedSelfie = async (newOffset: { x: number; y: number }, newScale: number) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!pendingSelfieFile && !selfieData?.path) {
        throw new Error('No selfie file to save');
      }

      let selfiePath = selfieData?.path;
      let newSelfieUrl = '';

      // If we have a new file, upload it
      if (pendingSelfieFile) {
        console.log('Uploading new selfie file:', pendingSelfieFile.name);
        selfiePath = await uploadSelfieWithUserId(pendingSelfieFile, userData?.id!);

        // Get a signed URL for the new selfie immediately
        const signedUrl = await getSignedUrl('face_id_images', selfiePath, 60 * 60);
        if (signedUrl) {
          newSelfieUrl = signedUrl;
          console.log('Got signed URL for new selfie: URL obtained');
        } else {
          console.log('No URL obtained for new selfie');
        }
      }

      console.log('Upserting selfie with path:', selfiePath);

      // Upsert the selfie record with the new path and position/scale
      await upsertSelfie({
        contact_id: contactData?.contact_id,
        user_id: userData?.id,
        path: selfiePath!,
        offset_x: newOffset.x,
        offset_y: newOffset.y,
        scale: newScale,
      });

      // Update the selfie URL immediately if we have a new one
      if (newSelfieUrl) {
        console.log('Updating selfie URL immediately to:', newSelfieUrl);
        setSelfieUrl(newSelfieUrl);
      }

      // Clean up
      setShowEditDialog(false);
      setPendingSelfieFile(null);
      uploadOptions.setFiles([]);

      // Update the offset and scale in the UI immediately
      setOffset(newOffset);
      setScale(newScale);

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({
        queryKey: ['selfie', contactData?.contact_id],
      });

      // Force an immediate refetch using queryClient
      await queryClient.refetchQueries({
        queryKey: ['selfie', contactData?.contact_id],
        exact: true,
      });

      toast.success('Profile picture updated successfully');
    } catch (err: any) {
      console.error('Failed to save selfie:', err);
      setError(err.message || 'Failed to save selfie');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Make profile image clickable for editing ---
  const handleImageClick = () => {
    if (selfieUrl) {
      // If we have an existing selfie, make sure we load its position and scale
      if (selfieData) {
        const selfie = selfieData;

        // Always update offset and scale to ensure consistency
        if (selfie.offset_x !== undefined && selfie.offset_y !== undefined) {
          setOffset({ x: selfie.offset_x, y: selfie.offset_y });
        }

        if (selfie.scale !== undefined) {
          setScale(selfie.scale);
        }

        console.log('Opening edit dialog with selfie data:', {
          offset_x: selfie.offset_x,
          offset_y: selfie.offset_y,
          scale: selfie.scale,
          current_offset: offset,
          current_scale: scale,
        });
      }

      // Small delay to ensure state updates before opening dialog
      setTimeout(() => {
        setShowEditDialog(true);
      }, 50);
    } else {
      setShowProfilePopover(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">My Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <Avatar className="w-32 h-32">
                {selfieUrl ? (
                  <AvatarImage
                    src={selfieUrl}
                    alt="Profile selfie"
                    className="object-cover"
                    onClick={handleImageClick}
                    style={{
                      cursor: 'pointer',
                      transform: selfieUrl
                        ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                        : 'none',
                      transition: 'transform 0.1s',
                    }}
                    key={`avatar-image-${offset.x}-${offset.y}-${scale}`} // Force re-render when values change
                  />
                ) : (
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              {/* Upload/Capture Popover or Sheet */}
              {isMobileDevice ? (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background shadow hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setShowProfilePopover(true)}
                    aria-label="Change profile picture"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Change profile picture</span>
                  </Button>

                  <Sheet open={showProfilePopover} onOpenChange={setShowProfilePopover}>
                    <SheetContent side="bottom" className="p-4">
                      <SheetHeader className="pb-4">
                        <SheetTitle>Update Profile Picture</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4">
                        <Button
                          className="w-full"
                          onClick={() => {
                            // This will open the device camera directly for taking a photo
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            // Set capture attribute to force using the front-facing camera
                            input.setAttribute('capture', 'user');

                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                uploadOptions.setFiles([
                                  Object.assign(file, {
                                    preview: URL.createObjectURL(file),
                                    errors: [],
                                  }),
                                ]);

                                // Use the handleSelfieUpload function
                                handleSelfieUpload();
                              }
                            };

                            input.click();
                          }}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Take Photo
                        </Button>

                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            // This will open the file picker without camera
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            // Explicitly NOT setting capture attribute to allow choosing from gallery

                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                uploadOptions.setFiles([
                                  Object.assign(file, {
                                    preview: URL.createObjectURL(file),
                                    errors: [],
                                  }),
                                ]);

                                // Use the handleSelfieUpload function
                                handleSelfieUpload();
                              }
                            };

                            input.click();
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose from Gallery
                        </Button>
                      </div>
                      <SheetFooter className="mt-6">
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full">
                            Cancel
                          </Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <Popover open={showProfilePopover} onOpenChange={setShowProfilePopover}>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background shadow hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Change profile picture"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Change profile picture</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Update Profile Picture</h4>

                      <Dropzone {...uploadOptions} className="w-full">
                        <CustomDropzoneContent
                          onFileSelected={() => {
                            handleSelfieUpload();
                          }}
                        />
                        <CustomDropzoneEmptyState />
                      </Dropzone>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h3 className="text-xl font-semibold">
                  {userData?.user_metadata?.first_name || 'First'}{' '}
                  {userData?.user_metadata?.last_name || 'Last'}
                </h3>
                <div className="flex flex-col items-center gap-2 mt-2 sm:items-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{contactDetails.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{contactDetails.phone}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setShowEditProfileDialog(true)}>
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support and About Us Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Support Card */}
        <Card className="cursor-pointer" onClick={() => setShowSupportDialog(true)}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Support</h3>
                <p className="text-sm text-muted-foreground">Get help with your account</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Us Card */}
        <Card
          className="cursor-pointer"
          onClick={() => window.open('https://evess.co/pages/about', '_blank')}
        >
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">About Us</h3>
                <p className="text-sm text-muted-foreground">Learn more about Evess</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Button variant="default" className="w-full h-12" onClick={() => navigate({ to: '/logout' })}>
        Log out
      </Button>

      {/* Support Dialog */}
      <SupportDialog
        open={showSupportDialog}
        onOpenChange={setShowSupportDialog}
        contactId={contactData?.contact_id}
        selfieData={selfieData}
        userData={userData}
      />

      {/* Edit Dialog for cropping/adjusting selfie */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            // Clean up when dialog is closed
            console.log('Edit dialog closed, cleaning up');

            // If we have a pending file but didn't save, clean it up
            if (pendingSelfieFile) {
              console.log('Cleaning up pending selfie file');
              setPendingSelfieFile(null);
              uploadOptions.setFiles([]);
            }

            // If we were editing an existing selfie, restore the original values
            if (selfieData && !pendingSelfieFile) {
              console.log('Restoring original selfie position and scale');
              if (selfieData.offset_x !== undefined && selfieData.offset_y !== undefined) {
                setOffset({ x: selfieData.offset_x, y: selfieData.offset_y });
              }

              if (selfieData.scale !== undefined) {
                setScale(selfieData.scale);
              }
            }

            // Clear any errors
            setError(null);

            // Update the state
            setShowEditDialog(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div
              ref={dragRef}
              className="touch-none select-none"
              style={{ cursor: 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Always show the pending selfie if available */}
              {pendingSelfieFile ? (
                <SelfiePreview
                  src={URL.createObjectURL(pendingSelfieFile)}
                  offset={offset}
                  scale={scale}
                  key={`pending-selfie-${pendingSelfieFile.name}-${offset.x}-${offset.y}-${scale}`}
                />
              ) : selfieUrl ? (
                <SelfiePreview
                  src={selfieUrl}
                  offset={offset}
                  scale={scale}
                  key={`existing-selfie-${selfieUrl}-${offset.x}-${offset.y}-${scale}`}
                />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-full" />
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Drag to position and use the controls below to adjust the size
            </p>
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
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm w-full">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              className="w-full sm:w-auto"
              onClick={() => handleSaveEditedSelfie(offset, scale)}
              disabled={isLoading || (!pendingSelfieFile && !selfieUrl)}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">
                    <LoadingSpinner />
                  </span>
                  Saving...
                </>
              ) : (
                'Save Profile Picture'
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                // Explicitly close the dialog and trigger the cleanup
                setShowEditDialog(false);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={showEditProfileDialog}
        onOpenChange={setShowEditProfileDialog}
        currentEmail={userData?.email || ''}
        onSuccess={() => {
          // Invalidate queries to refresh user data
          queryClient.invalidateQueries({ queryKey: ['user'] });
        }}
      />
    </div>
  );
}
