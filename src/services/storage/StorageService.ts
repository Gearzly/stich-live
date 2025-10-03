import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata,
  updateMetadata,
  FullMetadata,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { BaseService } from '../core/BaseService';

// Storage types
export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (downloadURL: string) => void;
  metadata?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
  };
}

export interface FileInfo {
  name: string;
  fullPath: string;
  size: number;
  contentType: string;
  downloadURL: string;
  timeCreated: string;
  updated: string;
  customMetadata?: Record<string, string>;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

// Storage Service
export class StorageService extends BaseService {
  private storage = storage;

  // Upload file with progress tracking
  async uploadFile(
    file: File,
    path: string,
    options: FileUploadOptions = {}
  ): Promise<FileInfo> {
    try {
      const userId = this.getCurrentUserId();
      const fileRef = ref(storage, `${userId}/${path}`);
      
      // Set default metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          ...options.metadata?.customMetadata,
        },
        ...options.metadata,
      };

      if (options.onProgress || options.onError || options.onComplete) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(fileRef, file, metadata);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              options.onProgress?.(progress);
            },
            (error) => {
              options.onError?.(error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const metadata = await getMetadata(uploadTask.snapshot.ref);
                
                const fileInfo: FileInfo = {
                  name: metadata.name,
                  fullPath: metadata.fullPath,
                  size: metadata.size,
                  contentType: metadata.contentType || 'application/octet-stream',
                  downloadURL,
                  timeCreated: metadata.timeCreated,
                  updated: metadata.updated,
                  customMetadata: metadata.customMetadata || {},
                };
                
                options.onComplete?.(downloadURL);
                resolve(fileInfo);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Simple upload without progress tracking
        const snapshot = await uploadBytes(fileRef, file, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        const metadataInfo = await getMetadata(snapshot.ref);
        
        return {
          name: metadataInfo.name,
          fullPath: metadataInfo.fullPath,
          size: metadataInfo.size,
          contentType: metadataInfo.contentType || 'application/octet-stream',
          downloadURL,
          timeCreated: metadataInfo.timeCreated,
          updated: metadataInfo.updated,
          customMetadata: metadataInfo.customMetadata || {},
        };
      }
    } catch (error) {
      this.handleError(error, 'uploadFile');
    }
  }

  // Upload multiple files
  async uploadFiles(
    files: File[],
    basePath: string,
    options: FileUploadOptions = {}
  ): Promise<Array<{ file: File; downloadURL: string; error?: string }>> {
    const results: Array<{ file: File; downloadURL: string; error?: string }> = [];
    
    for (const file of files) {
      try {
        const path = `${basePath}/${file.name}`;
        const fileInfo = await this.uploadFile(file, path, {
          ...options,
          onProgress: (progress) => {
            // You can customize this to track overall progress
            options.onProgress?.(progress);
          },
        });
        
        results.push({ file, downloadURL: fileInfo.downloadURL });
      } catch (error) {
        results.push({ 
          file, 
          downloadURL: '', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }
    
    return results;
  }

  // Upload user avatar
  async uploadAvatar(file: File): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Avatar must be an image file');
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Avatar file size must be less than 5MB');
      }
      
      const path = `avatars/${userId}`;
      return await this.uploadFile(file, path, {
        metadata: {
          contentType: file.type,
          customMetadata: {
            type: 'avatar',
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'uploadAvatar');
    }
  }

  // Upload application assets
  async uploadApplicationAsset(
    file: File,
    applicationId: string,
    assetType: 'thumbnail' | 'screenshot' | 'asset' | 'source'
  ): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const path = `applications/${applicationId}/${assetType}/${timestamp}.${fileExtension}`;
      
      return await this.uploadFile(file, path, {
        metadata: {
          contentType: file.type,
          customMetadata: {
            applicationId,
            assetType,
            uploadedBy: userId,
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'uploadApplicationAsset');
    }
  }

  // Get file info
  async getFileInfo(path: string): Promise<FileInfo | null> {
    try {
      const userId = this.getCurrentUserId();
      const fileRef = ref(storage, `${userId}/${path}`);
      
      const metadata = await getMetadata(fileRef);
      const downloadURL = await getDownloadURL(fileRef);
      
      return {
        name: metadata.name,
        fullPath: metadata.fullPath,
        size: metadata.size,
        contentType: metadata.contentType || 'unknown',
        downloadURL,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        customMetadata: metadata.customMetadata,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('object-not-found')) {
        return null;
      }
      this.handleError(error, 'getFileInfo');
    }
  }

  // List files in a directory
  async listFiles(path: string = ''): Promise<FileInfo[]> {
    try {
      const userId = this.getCurrentUserId();
      const folderRef = ref(storage, `${userId}/${path}`);
      
      const result = await listAll(folderRef);
      const fileInfos: FileInfo[] = [];
      
      for (const fileRef of result.items) {
        try {
          const metadata = await getMetadata(fileRef);
          const downloadURL = await getDownloadURL(fileRef);
          
          fileInfos.push({
            name: metadata.name,
            fullPath: metadata.fullPath,
            size: metadata.size,
            contentType: metadata.contentType || 'unknown',
            downloadURL,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            customMetadata: metadata.customMetadata,
          });
        } catch (error) {
          console.warn(`Failed to get metadata for ${fileRef.fullPath}:`, error);
        }
      }
      
      return fileInfos.sort((a, b) => 
        new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime()
      );
    } catch (error) {
      this.handleError(error, 'listFiles');
    }
  }

  // Delete file
  async deleteFile(path: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const fileRef = ref(storage, `${userId}/${path}`);
      await deleteObject(fileRef);
    } catch (error) {
      if (error instanceof Error && error.message.includes('object-not-found')) {
        // File doesn't exist, consider it deleted
        return;
      }
      this.handleError(error, 'deleteFile');
    }
  }

  // Delete multiple files
  async deleteFiles(paths: string[]): Promise<Array<{ path: string; success: boolean; error?: string }>> {
    const results: Array<{ path: string; success: boolean; error?: string }> = [];
    
    for (const path of paths) {
      try {
        await this.deleteFile(path);
        results.push({ path, success: true });
      } catch (error) {
        results.push({ 
          path, 
          success: false, 
          error: error instanceof Error ? error.message : 'Delete failed' 
        });
      }
    }
    
    return results;
  }

  // Update file metadata
  async updateFileMetadata(
    path: string,
    metadata: { customMetadata?: Record<string, string> }
  ): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const fileRef = ref(storage, `${userId}/${path}`);
      await updateMetadata(fileRef, metadata);
    } catch (error) {
      this.handleError(error, 'updateFileMetadata');
    }
  }

  // Get storage usage for user
  async getStorageUsage(): Promise<{ totalSize: number; fileCount: number }> {
    try {
      const files = await this.listFiles();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      return {
        totalSize,
        fileCount: files.length,
      };
    } catch (error) {
      this.handleError(error, 'getStorageUsage');
    }
  }

  // Helper: Validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
  }

  // Copy file
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // Get the source file
      const sourceRef = ref(this.storage, sourcePath);
      const downloadURL = await getDownloadURL(sourceRef);
      
      // Fetch the file content
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      
      // Upload to destination
      const destRef = ref(this.storage, destinationPath);
      await uploadBytes(destRef, blob);
    } catch (error) {
      this.handleError(error, 'copyFile');
    }
  }

  // Get download URL
  async getDownloadURL(path: string): Promise<string> {
    try {
      const fileRef = ref(this.storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      this.handleError(error, 'getDownloadURL');
    }
  }

  // Helper: Format file size
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Helper: Generate unique file name
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_${timestamp}.${extension}`;
  }
}