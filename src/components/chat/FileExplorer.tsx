import { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileText, 
  FileCode, 
  FileImage, 
  ChevronRight, 
  ChevronDown,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  size?: number;
  modified?: Date;
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect?: (file: FileNode) => void;
  onFileEdit?: (file: FileNode) => void;
  onFileDownload?: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
  selectedFileId?: string;
  className?: string;
}

function getFileIcon(fileName: string, isOpen?: boolean) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (isOpen !== undefined) {
    return isOpen ? FolderOpen : Folder;
  }
  
  switch (extension) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
      return FileCode;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return FileImage;
    case 'md':
    case 'txt':
    case 'doc':
    case 'docx':
      return FileText;
    default:
      return File;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  onFileSelect?: (file: FileNode) => void;
  onFileEdit?: (file: FileNode) => void;
  onFileDownload?: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
  selectedFileId?: string;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
}

function FileTreeNode({
  node,
  level,
  onFileSelect,
  onFileEdit,
  onFileDownload,
  onFileDelete,
  selectedFileId,
  expandedFolders,
  onToggleFolder
}: FileTreeNodeProps) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = node.id === selectedFileId;
  const Icon = getFileIcon(node.name, isFolder ? isExpanded : undefined);

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.id);
    } else {
      onFileSelect?.(node);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-accent/50 transition-colors',
          isSelected && 'bg-accent',
          'group'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFolder(node.id);
            }}
            className="flex items-center justify-center w-4 h-4"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        
        <span className="flex-1 text-sm truncate">
          {node.name}
        </span>
        
        {!isFolder && (
          <>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(node.size)}
            </span>
            
            <div className="hidden group-hover:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect?.(node);
                }}
                className="h-6 w-6 p-0"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileEdit?.(node);
                }}
                className="h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDownload?.(node);
                }}
                className="h-6 w-6 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete?.(node);
                }}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
      
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect || undefined}
              onFileEdit={onFileEdit || undefined}
              onFileDownload={onFileDownload || undefined}
              onFileDelete={onFileDelete || undefined}
              selectedFileId={selectedFileId}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({
  files,
  onFileSelect,
  onFileEdit,
  onFileDownload,
  onFileDelete,
  selectedFileId,
  className
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const fileStats = useMemo(() => {
    let fileCount = 0;
    let folderCount = 0;
    
    const countNodes = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file') {
          fileCount++;
        } else {
          folderCount++;
          if (node.children) {
            countNodes(node.children);
          }
        }
      });
    };
    
    countNodes(files);
    return { fileCount, folderCount };
  }, [files]);

  if (files.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files generated yet</p>
        <p className="text-xs">Start a conversation to generate code</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-medium text-sm">Generated Files</h3>
        <p className="text-xs text-muted-foreground">
          {fileStats.fileCount} files, {fileStats.folderCount} folders
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {files.map((file) => (
          <FileTreeNode
            key={file.id}
            node={file}
            level={0}
            onFileSelect={onFileSelect || undefined}
            onFileEdit={onFileEdit || undefined}
            onFileDownload={onFileDownload || undefined}
            onFileDelete={onFileDelete || undefined}
            selectedFileId={selectedFileId}
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
          />
        ))}
      </div>
    </div>
  );
}