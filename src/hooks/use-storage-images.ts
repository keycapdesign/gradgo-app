import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ImageFile {
  name: string;
  path: string;
  url: string;
  isFolder: boolean;
  id?: string;
}

interface UseStorageImagesProps {
  bucketName: string;
  folderPath: string;
  pageSize?: number;
}

interface UseStorageImagesReturn {
  images: ImageFile[];
  folders: string[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  deleteImage: (path: string) => Promise<void>;
}

export function useStorageImages({
  bucketName,
  folderPath,
  pageSize = 12
}: UseStorageImagesProps): UseStorageImagesReturn {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const supabase = createClient();

  // Function to load images and folders
  const loadImagesAndFolders = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine the path to list
      const path = folderPath ? `${folderPath}/` : '';
      
      // If reset, start from the beginning
      const currentOffset = reset ? 0 : offset;
      
      // List all objects in the bucket with the specified path
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .list(path, {
          sortBy: { column: 'name', order: 'asc' },
          limit: pageSize,
          offset: currentOffset
        });

      if (error) {
        throw error;
      }

      // Process the data
      const folderList: string[] = [];
      const imageList: ImageFile[] = [];

      // Process folders and files
      data?.forEach(item => {
        if (item.id === null) {
          // This is a folder
          folderList.push(item.name);
        } else {
          // This is a file
          const filePath = folderPath ? `${folderPath}/${item.name}` : item.name;
          const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
          
          imageList.push({
            name: item.name,
            path: filePath,
            url,
            isFolder: false,
            id: item.id
          });
        }
      });

      // Update state
      if (reset) {
        setFolders(folderList);
        setImages(imageList);
        setOffset(imageList.length);
      } else {
        setFolders(prev => [...prev, ...folderList.filter(f => !prev.includes(f))]);
        setImages(prev => [...prev, ...imageList.filter(img => !prev.some(p => p.path === img.path))]);
        setOffset(prev => prev + imageList.length);
      }
      
      // Check if there might be more images
      setHasMore(data?.length === pageSize);
    } catch (error: any) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, folderPath, offset, pageSize, supabase]);

  // Load initial data when component mounts or bucket/folder changes
  useEffect(() => {
    setOffset(0);
    loadImagesAndFolders(true);
  }, [bucketName, folderPath]);

  // Function to load more images
  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadImagesAndFolders();
    }
  }, [isLoading, hasMore, loadImagesAndFolders]);

  // Function to refresh the images
  const refresh = useCallback(async () => {
    setOffset(0);
    await loadImagesAndFolders(true);
  }, [loadImagesAndFolders]);

  // Function to delete an image
  const deleteImage = useCallback(async (path: string) => {
    try {
      const { error } = await supabase
        .storage
        .from(bucketName)
        .remove([path]);
      
      if (error) {
        throw error;
      }
      
      // Remove the deleted image from the state
      setImages(prev => prev.filter(img => img.path !== path));
    } catch (error: any) {
      setError(error);
      throw error;
    }
  }, [bucketName, supabase]);

  return {
    images,
    folders,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    deleteImage
  };
}
