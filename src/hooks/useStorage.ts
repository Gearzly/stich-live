import { useState, useCallback } from 'react';
import { 
  StorageService, 
  type FileInfo, 
  type FileUploadOptions, 
  type UploadProgress 
} from '../services/storage/StorageService';

export interface UseStorageState {
  uploading: boolean;
  downloading: boolean;
  deleting: boolean;
  error: string | null;
  uploadProgress: UploadProgress | null;
}

export interface UseStorageOptions {
  basePath?: string;
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadComplete?: (fileInfo: FileInfo) => void;
  onUploadError?: (error: Error) => void;
}

export function useStorage(options: UseStorageOptions = {}) {
  const [state, setState] = useState<UseStorageState>({
    uploading: false,
    downloading: false,
    deleting: false,
    error: null,
    uploadProgress: null,
  });

  const [files, setFiles] = useState<FileInfo[]>([]);
  const storageService = new StorageService();

  // Upload single file
  const uploadFile = useCallback(async (
    file: File | undefined,
    customPath?: string
  ): Promise<FileInfo | null> => {
    if (!file) {
      setState(prev => ({ ...prev, error: 'No file provided' }));
      return null;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        uploading: true, 
        error: null, 
        uploadProgress: null 
      }));

      const basePath = options.basePath || 'uploads';
      const filePath = customPath || `${basePath}/${file.name}`;

      const uploadOptions: FileUploadOptions = {
        onProgress: (progress: number) => {
          const progressData: UploadProgress = {
            bytesTransferred: Math.round((progress / 100) * file.size),
            totalBytes: file.size,
            progress,
            state: 'running'
          };
          
          setState(prev => ({ ...prev, uploadProgress: progressData }));
          options.onUploadProgress?.(progressData);
        },
        onError: (error: Error) => {
          setState(prev => ({ 
            ...prev, 
            uploading: false, 
            error: error.message,
            uploadProgress: null 
          }));
          options.onUploadError?.(error);
        },
        onComplete: () => {
          setState(prev => ({ 
            ...prev, 
            uploading: false, 
            uploadProgress: null 
          }));
        },
      };

      const result = await storageService.uploadFile(file, filePath, uploadOptions);
      
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        uploadProgress: null 
      }));

      // Add to files list
      setFiles(prev => [...prev, result]);
      options.onUploadComplete?.(result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage,
        uploadProgress: null 
      }));
      options.onUploadError?.(error as Error);
      return null;
    }
  }, [options]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    fileList: FileList | File[]
  ): Promise<FileInfo[]> => {
    const results: FileInfo[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const result = await uploadFile(file);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }, [uploadFile]);

  // Download file by path
  const downloadFile = useCallback(async (path: string): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, downloading: true, error: null }));

      const url = await storageService.getDownloadURL(path);
      
      setState(prev => ({ ...prev, downloading: false }));
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setState(prev => ({ 
        ...prev, 
        downloading: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, []);

  // Delete file
  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, deleting: true, error: null }));

      await storageService.deleteFile(path);
      
      // Remove from files list
      setFiles(prev => prev.filter(file => file.fullPath !== path));
      
      setState(prev => ({ ...prev, deleting: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      setState(prev => ({ 
        ...prev, 
        deleting: false, 
        error: errorMessage 
      }));
      return false;
    }
  }, []);

  // List files in a folder
  const listFiles = useCallback(async (folderPath?: string): Promise<FileInfo[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const path = folderPath || options.basePath || 'uploads';
      const fileList = await storageService.listFiles(path);
      
      setFiles(fileList);
      return fileList;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'List files failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return [];
    }
  }, [options.basePath]);

  // Get file metadata
  const getFileMetadata = useCallback(async (path: string) => {
    try {
      return await storageService.getFileInfo(path);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Get metadata failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Clear files list
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    // State
    ...state,
    files,

    // Actions
    uploadFile,
    uploadFiles,
    downloadFile,
    deleteFile,
    listFiles,
    getFileMetadata,
    clearError,
    clearFiles,

    // Utilities
    isLoading: state.uploading || state.downloading || state.deleting,
  };
}

// Specialized hooks for common use cases
export function useFileUpload(basePath?: string) {
  return useStorage(basePath ? { basePath } : {});
}

export function useImageUpload() {
  return useStorage({ 
    basePath: 'images',
    onUploadComplete: (fileInfo) => {
      console.log('Image uploaded:', fileInfo.downloadURL);
    }
  });
}

export function useDocumentUpload() {
  return useStorage({ 
    basePath: 'documents'
  });
}
