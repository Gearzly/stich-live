import { useState, useCallback, useRef } from 'react';
import { 
  StorageService,
  type UploadProgress,
  type UploadOptions,
  type FileMetadata
} from '@/services/StorageService';

// Custom hook for file uploads
export function useFileUpload() {
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const storageService = new StorageService();

  // Upload file
  const uploadFile = async (
    file: File,
    path: string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      setUploadedFile(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const result = await storageService.uploadFile(
        file,
        path,
        {
          ...options,
          onProgress: (progressData: UploadProgress) => {
            setProgress(progressData.percentage);
          },
          signal: abortControllerRef.current.signal,
        }
      );

      setUploadedFile(result);
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Upload cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
      throw err;
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  // Upload multiple files
  const uploadFiles = async (
    files: File[],
    basePath: string,
    options: UploadOptions = {}
  ): Promise<FileMetadata[]> => {
    const results: FileMetadata[] = [];
    const totalFiles = files.length;

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${basePath}/${file.name}`;

        const result = await storageService.uploadFile(file, filePath, {
          ...options,
          onProgress: (progressData: UploadProgress) => {
            const overallProgress = ((i / totalFiles) * 100) + 
              (progressData.percentage / totalFiles);
            setProgress(Math.round(overallProgress));
          },
        });

        results.push(result);
      }

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Reset state
  const reset = () => {
    setProgress(0);
    setUploading(false);
    setError(null);
    setUploadedFile(null);
  };

  return {
    progress,
    uploading,
    error,
    uploadedFile,
    uploadFile,
    uploadFiles,
    cancelUpload,
    reset,
  };
}

// Custom hook for file management
export function useFileManager() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageService = new StorageService();

  // List files in a directory
  const listFiles = async (path: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const fileList = await storageService.listFiles(path);
      setFiles(fileList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Get file metadata
  const getFileInfo = async (path: string): Promise<FileMetadata | null> => {
    try {
      setError(null);
      const metadata = await storageService.getFileMetadata(path);
      return metadata;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get file info');
      return null;
    }
  };

  // Delete file
  const deleteFile = async (path: string) => {
    try {
      setError(null);
      await storageService.deleteFile(path);
      
      // Update local state
      setFiles(prev => prev.filter(file => file.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      throw err;
    }
  };

  // Move/rename file
  const moveFile = async (oldPath: string, newPath: string) => {
    try {
      setError(null);
      await storageService.moveFile(oldPath, newPath);
      
      // Update local state
      setFiles(prev => prev.map(file => 
        file.path === oldPath 
          ? { ...file, path: newPath, name: newPath.split('/').pop() || newPath }
          : file
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move file');
      throw err;
    }
  };

  // Get download URL
  const getDownloadUrl = async (path: string): Promise<string> => {
    try {
      setError(null);
      const url = await storageService.getDownloadUrl(path);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL');
      throw err;
    }
  };

  return {
    files,
    loading,
    error,
    listFiles,
    getFileInfo,
    deleteFile,
    moveFile,
    getDownloadUrl,
  };
}

// Custom hook for image handling
export function useImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storageService = new StorageService();

  // Validate and preview image
  const selectImage = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return false;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return false;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setError(null);
    return true;
  };

  // Upload image with optimization
  const uploadImage = async (
    file: File,
    path: string,
    options: {
      resize?: { width?: number; height?: number; quality?: number };
      generateThumbnail?: boolean;
    } = {}
  ): Promise<FileMetadata> => {
    try {
      setUploading(true);
      setError(null);

      const result = await storageService.uploadImage(file, path, options);
      setUploadedImage(result);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Clear preview and reset state
  const clearImage = () => {
    setPreview(null);
    setUploadedImage(null);
    setError(null);
  };

  return {
    preview,
    uploading,
    uploadedImage,
    error,
    selectImage,
    uploadImage,
    clearImage,
  };
}

// Custom hook for batch operations
export function useBatchFileOperations() {
  const [operations, setOperations] = useState<Array<{
    id: string;
    type: 'upload' | 'delete' | 'move';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const storageService = new StorageService();

  // Add operation to queue
  const addOperation = (
    id: string,
    type: 'upload' | 'delete' | 'move'
  ) => {
    setOperations(prev => [...prev, {
      id,
      type,
      status: 'pending',
      progress: 0,
    }]);
  };

  // Process all operations
  const processOperations = async (
    operationHandlers: Record<string, () => Promise<void>>
  ) => {
    try {
      setIsProcessing(true);
      
      const totalOperations = operations.length;
      let completedOperations = 0;

      for (const operation of operations) {
        try {
          // Update operation status
          setOperations(prev => prev.map(op => 
            op.id === operation.id 
              ? { ...op, status: 'processing', progress: 0 }
              : op
          ));

          // Execute operation
          const handler = operationHandlers[operation.id];
          if (handler) {
            await handler();
          }

          // Mark as completed
          setOperations(prev => prev.map(op => 
            op.id === operation.id 
              ? { ...op, status: 'completed', progress: 100 }
              : op
          ));

          completedOperations++;
          setOverallProgress((completedOperations / totalOperations) * 100);

        } catch (err) {
          // Mark as failed
          setOperations(prev => prev.map(op => 
            op.id === operation.id 
              ? { 
                  ...op, 
                  status: 'failed', 
                  error: err instanceof Error ? err.message : 'Operation failed'
                }
              : op
          ));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear completed operations
  const clearCompleted = () => {
    setOperations(prev => prev.filter(op => op.status !== 'completed'));
  };

  // Reset all operations
  const resetOperations = () => {
    setOperations([]);
    setOverallProgress(0);
    setIsProcessing(false);
  };

  return {
    operations,
    overallProgress,
    isProcessing,
    addOperation,
    processOperations,
    clearCompleted,
    resetOperations,
  };
}