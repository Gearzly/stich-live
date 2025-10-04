import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  GitBranch,
  History,
  Save,
  X,
  Check,
  FileText,
  Image,
  Code,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId: string | null;
  content?: string;
  size?: number;
  createdAt: Date;
  modifiedAt: Date;
  version: number;
  isReadonly?: boolean;
  language?: string;
  children?: FileNode[];
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  content: string;
  message: string;
  timestamp: Date;
  author: string;
}

interface EnhancedFileManagerProps {
  className?: string;
  files: FileNode[];
  onFileSelect?: (file: FileNode) => void;
  onFileCreate?: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onFileSave?: (fileId: string, content: string) => void;
  onFileDownload?: (file: FileNode) => void;
  selectedFileId?: string;
  readOnly?: boolean;
}

const EnhancedFileManager: React.FC<EnhancedFileManagerProps> = ({
  className,
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileSave,
  onFileDownload,
  selectedFileId,
  readOnly = false
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createName, setCreateName] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [fileVersions, setFileVersions] = useState<FileVersion[]>([]);
  const [selectedVersionFile, setSelectedVersionFile] = useState<string | null>(null);

  // Build file tree structure
  const buildFileTree = (files: FileNode[]): FileNode[] => {
    const fileMap = new Map<string, FileNode>();
    const rootFiles: FileNode[] = [];

    // Create map of all files
    files.forEach(file => {
      fileMap.set(file.id, { ...file, children: [] });
    });

    // Build parent-child relationships
    files.forEach(file => {
      const fileNode = fileMap.get(file.id)!;
      if (file.parentId === null) {
        rootFiles.push(fileNode);
      } else {
        const parent = fileMap.get(file.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(fileNode);
        }
      }
    });

    return rootFiles;
  };

  const fileTree = buildFileTree(files);

  // Filter files based on search term
  const filterFiles = (files: FileNode[], searchTerm: string): FileNode[] => {
    if (!searchTerm) return files;
    
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChildren = file.children ? filterFiles(file.children, searchTerm).length > 0 : false;
      return matchesSearch || hasMatchingChildren;
    }).map(file => ({
      ...file,
      children: file.children ? filterFiles(file.children, searchTerm) : []
    }));
  };

  const filteredFiles = filterFiles(fileTree, searchTerm);

  const toggleFolder = (folderId: string) => {
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

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
    } else {
      onFileSelect?.(file);
      if (file.content !== undefined) {
        setEditingFile(file.id);
        setFileContent(file.content);
      }
    }
  };

  const handleCreateFile = () => {
    if (!createName.trim()) return;
    onFileCreate?.(createParentId, createName.trim(), createType);
    setCreateName('');
    setShowCreateModal(false);
  };

  const handleRename = (fileId: string) => {
    if (!renameValue.trim()) return;
    onFileRename?.(fileId, renameValue.trim());
    setRenamingFile(null);
    setRenameValue('');
  };

  const handleSaveFile = () => {
    if (editingFile) {
      onFileSave?.(editingFile, fileContent);
      
      // Add to version history (mock)
      const newVersion: FileVersion = {
        id: `version_${Date.now()}`,
        fileId: editingFile,
        version: fileVersions.filter(v => v.fileId === editingFile).length + 1,
        content: fileContent,
        message: 'File updated',
        timestamp: new Date(),
        author: 'Current User'
      };
      setFileVersions(prev => [...prev, newVersion]);
    }
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? 
        <FolderOpen className="h-4 w-4 text-blue-500" /> : 
        <Folder className="h-4 w-4 text-blue-500" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
        return <Code className="h-4 w-4 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-purple-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <Archive className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderFileNode = (file: FileNode, depth: number = 0) => {
    const isSelected = file.id === selectedFileId;
    const isExpanded = expandedFolders.has(file.id);
    const isRenaming = renamingFile === file.id;

    return (
      <div key={file.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-muted/50",
            isSelected && "bg-muted",
            depth > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getFileIcon(file)}
            {isRenaming ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="h-6 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(file.id);
                    if (e.key === 'Escape') setRenamingFile(null);
                  }}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={() => handleRename(file.id)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRenamingFile(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span 
                className="text-sm truncate flex-1" 
                onClick={() => handleFileClick(file)}
              >
                {file.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {file.type === 'file' && (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            )}
            {!readOnly && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingFile(file.id);
                    setRenameValue(file.name);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete?.(file.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {file.type === 'file' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileDownload?.(file);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVersionFile(file.id);
                      }}
                    >
                      <History className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            File Manager
            <Badge variant="outline">
              {files.filter(f => f.type === 'file').length} files
            </Badge>
          </CardTitle>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  setCreateParentId(null);
                  setCreateType('folder');
                  setShowCreateModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Folder
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  setCreateParentId(null);
                  setCreateType('file');
                  setShowCreateModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                File
              </Button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="tree" className="h-full flex flex-col">
          <TabsList className="mx-4 mb-2">
            <TabsTrigger value="tree" className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              Tree View
            </TabsTrigger>
            {editingFile && (
              <TabsTrigger value="editor" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Editor
              </TabsTrigger>
            )}
            <TabsTrigger value="versions" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              Versions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tree" className="flex-1 mx-4 mb-4">
            <ScrollArea className="h-[600px] border rounded-md">
              <div className="p-2">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map(file => renderFileNode(file))
                ) : searchTerm ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No files match your search
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No files yet</p>
                    {!readOnly && (
                      <Button 
                        className="mt-2" 
                        onClick={() => {
                          setCreateParentId(null);
                          setCreateType('file');
                          setShowCreateModal(true);
                        }}
                      >
                        Create your first file
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {editingFile && (
            <TabsContent value="editor" className="flex-1 mx-4 mb-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <span className="font-medium">
                        {files.find(f => f.id === editingFile)?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSaveFile}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none"
                    placeholder="Enter file content..."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="versions" className="flex-1 mx-4 mb-4">
            <ScrollArea className="h-[600px] border rounded-md">
              <div className="p-4">
                <div className="space-y-4">
                  {fileVersions
                    .filter(v => !selectedVersionFile || v.fileId === selectedVersionFile)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((version) => (
                      <Card key={version.id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4" />
                              <span className="font-medium">
                                v{version.version}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {files.find(f => f.id === version.fileId)?.name}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {version.timestamp.toLocaleString()}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm mb-2">{version.message}</p>
                          <p className="text-xs text-muted-foreground">
                            by {version.author}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  {fileVersions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No version history yet</p>
                      <p className="text-sm">Edit and save files to create versions</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Create File/Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                Create {createType === 'file' ? 'File' : 'Folder'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder={createType === 'file' ? 'filename.ext' : 'folder-name'}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFile();
                    if (e.key === 'Escape') setShowCreateModal(false);
                  }}
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFile}>
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default EnhancedFileManager;