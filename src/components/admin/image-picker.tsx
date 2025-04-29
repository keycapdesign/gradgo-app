import { useState } from 'react';
import { Folder, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useStorageImages } from '@/hooks/use-storage-images';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  bucketName: 'features_images' | 'offers_images';
  currentPath?: string;
}

export function ImagePicker({
  open,
  onClose,
  onSelect,
  bucketName,
  currentPath,
}: ImagePickerProps) {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  // Use our custom hook to fetch images with pagination
  const { images, folders, isLoading, hasMore, loadMore, refresh, deleteImage } = useStorageImages({
    bucketName,
    folderPath: currentFolder,
    pageSize: 12,
  });

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    onDrop: handleFileDrop,
  });

  // Handle file drop for upload
  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = currentFolder ? `${currentFolder}/${fileName}` : fileName;

      // Upload the file
      const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      // Reload the images
      await refresh();

      // Select the newly uploaded image
      onSelect(filePath);

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  // Navigate to a folder
  function navigateToFolder(folderName: string) {
    const newPath = currentFolder ? `${currentFolder}/${folderName}` : folderName;
    setCurrentFolder(newPath);
  }

  // Navigate up one level
  function navigateUp() {
    if (!currentFolder) return;

    const parts = currentFolder.split('/');
    if (parts.length === 1) {
      setCurrentFolder('');
    } else {
      parts.pop();
      setCurrentFolder(parts.join('/'));
    }
  }

  // Handle image selection
  function handleImageSelect(path: string) {
    onSelect(path);
    onClose();
  }

  // Handle image deletion
  async function handleDeleteImage() {
    if (!imageToDelete) return;

    setIsDeleting(true);
    try {
      await deleteImage(imageToDelete);
      toast.success('Image deleted successfully');
      setImageToDelete(null);
    } catch (error: any) {
      toast.error(`Failed to delete image: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="browse">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Images</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFolder('')}
                  disabled={!currentFolder}
                >
                  Root
                </Button>

                {currentFolder && (
                  <>
                    {currentFolder.split('/').map((folder, index, array) => (
                      <div key={index} className="flex items-center">
                        <span>/</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (index < array.length - 1) {
                              setCurrentFolder(array.slice(0, index + 1).join('/'));
                            }
                          }}
                          disabled={index === array.length - 1}
                        >
                          {folder}
                        </Button>
                      </div>
                    ))}
                  </>
                )}

                {currentFolder && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={navigateUp}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Folders */}
              {folders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Folders</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {folders.map((folder) => (
                      <div
                        key={folder}
                        className="flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer hover:bg-accent"
                        onClick={() => navigateToFolder(folder)}
                      >
                        <Folder className="h-10 w-10 text-muted-foreground" />
                        <span className="mt-2 text-sm truncate w-full text-center">{folder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Images</h3>
                {isLoading && images.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : images.length === 0 ? (
                  <div className="flex justify-center p-8 text-muted-foreground">
                    <span>No images found in this location</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.path}
                        className="group relative aspect-square border rounded-md overflow-hidden cursor-pointer hover:border-primary"
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-full w-full object-cover"
                          onClick={() => handleImageSelect(image.path)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs truncate max-w-[90%]">
                            {image.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 text-white hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageToDelete(image.path);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load more button */}
                {hasMore && !isLoading && (
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm">
                    {isDragActive
                      ? 'Drop the image here...'
                      : 'Drag & drop an image here, or click to select'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPEG, PNG, GIF, WebP
                  </p>
                </div>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteImage();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
