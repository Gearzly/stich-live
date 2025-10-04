import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown, 
  Code, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2, 
  Split, 
  RotateCcw, 
  RotateCw, 
  GitBranch, 
  Clock, 
  Users, 
  Lock, 
  Unlock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Settings,
  Zap,
  RefreshCw,
  ExternalLink,
  Share2,
  Bookmark,
  Tag,
  AlertTriangle,
  CheckCircle,
  Info,
  Terminal
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/auth-context';
import { toast } from 'sonner';

type FileType = 'file' | 'folder';
type ViewMode = 'tree' | 'list' | 'grid';
type EditorTheme = 'light' | 'dark';

interface FileNode {
  id: string;
  name: string;
  type: FileType;
  path: string;
  size?: number;
  lastModified: Date;
  content?: string;
  language?: string;
  isEditable: boolean;
  isLocked: boolean;
  children?: FileNode[];
  metadata?: {
    author: string;
    version: string;
    description?: string;
    tags: string[];
  };
}

interface FileManagerProps {
  appId: string;
  readOnly?: boolean;
  height?: string;
  showToolbar?: boolean;
  initialFiles?: FileNode[];
}

const FileManager: React.FC<FileManagerProps> = ({ 
  appId, 
  readOnly = false, 
  height = '600px',
  showToolbar = true,
  initialFiles = [] 
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editingFile, setEditingFile] = useState<FileNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [fileChanges, setFileChanges] = useState<Map<string, string>>(new Map());
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; avatar?: string; online: boolean }>>();

  // File type detection
  const getFileIcon = (fileName: string, isFolder: boolean) => {
    if (isFolder) return <Folder className="w-4 h-4" />;
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'vue':
      case 'svelte':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'html':
      case 'htm':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return <FileText className="w-4 h-4 text-yellow-500" />;
      case 'md':
      case 'mdx':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music className="w-4 h-4 text-pink-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'jsx';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'vue': return 'vue';
      case 'svelte': return 'svelte';
      default: return 'text';
    }
  };

  useEffect(() => {
    loadFiles();
  }, [appId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would fetch from the backend
      // For demo, create a mock file structure
      const mockFiles: FileNode[] = [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          path: '/src',
          lastModified: new Date(),
          isEditable: false,
          isLocked: false,
          children: [
            {
              id: 'src/App.tsx',
              name: 'App.tsx',
              type: 'file',
              path: '/src/App.tsx',
              size: 2048,
              lastModified: new Date(),
              content: `import React from 'react';\nimport { BrowserRouter as Router, Routes, Route } from 'react-router-dom';\nimport HomePage from './components/HomePage';\nimport './App.css';\n\nfunction App() {\n  return (\n    <Router>\n      <div className="App">\n        <Routes>\n          <Route path="/" element={<HomePage />} />\n        </Routes>\n      </div>\n    </Router>\n  );\n}\n\nexport default App;`,
              language: 'tsx',
              isEditable: true,
              isLocked: false,
              metadata: {
                author: 'AI Generator',
                version: '1.0.0',
                description: 'Main application component',
                tags: ['react', 'typescript', 'main']
              }
            },
            {
              id: 'src/components',
              name: 'components',
              type: 'folder',
              path: '/src/components',
              lastModified: new Date(),
              isEditable: false,
              isLocked: false,
              children: [
                {
                  id: 'src/components/HomePage.tsx',
                  name: 'HomePage.tsx',
                  type: 'file',
                  path: '/src/components/HomePage.tsx',
                  size: 1536,
                  lastModified: new Date(),
                  content: `import React from 'react';\nimport './HomePage.css';\n\nconst HomePage: React.FC = () => {\n  return (\n    <div className="homepage">\n      <header className="hero">\n        <h1>Welcome to Your AI-Generated App</h1>\n        <p>This is a modern React application built with TypeScript</p>\n        <button className="cta-button">Get Started</button>\n      </header>\n    </div>\n  );\n};\n\nexport default HomePage;`,
                  language: 'tsx',
                  isEditable: true,
                  isLocked: false,
                  metadata: {
                    author: 'AI Generator',
                    version: '1.0.0',
                    description: 'Homepage component',
                    tags: ['react', 'component', 'homepage']
                  }
                },
                {
                  id: 'src/components/HomePage.css',
                  name: 'HomePage.css',
                  type: 'file',
                  path: '/src/components/HomePage.css',
                  size: 512,
                  lastModified: new Date(),
                  content: `.homepage {\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  text-align: center;\n}\n\n.hero h1 {\n  font-size: 3rem;\n  margin-bottom: 1rem;\n  font-weight: 700;\n}\n\n.hero p {\n  font-size: 1.2rem;\n  margin-bottom: 2rem;\n  opacity: 0.9;\n}\n\n.cta-button {\n  padding: 1rem 2rem;\n  font-size: 1.1rem;\n  background: rgba(255, 255, 255, 0.2);\n  border: 2px solid white;\n  color: white;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n}\n\n.cta-button:hover {\n  background: white;\n  color: #667eea;\n}`,
                  language: 'css',
                  isEditable: true,
                  isLocked: false,
                  metadata: {
                    author: 'AI Generator',
                    version: '1.0.0',
                    description: 'Homepage styles',
                    tags: ['css', 'styles', 'homepage']
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'public',
          name: 'public',
          type: 'folder',
          path: '/public',
          lastModified: new Date(),
          isEditable: false,
          isLocked: false,
          children: [
            {
              id: 'public/index.html',
              name: 'index.html',
              type: 'file',
              path: '/public/index.html',
              size: 1024,
              lastModified: new Date(),
              content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>AI Generated App</title>\n  <meta name="description" content="A modern web application built with AI">\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`,
              language: 'html',
              isEditable: true,
              isLocked: false,
              metadata: {
                author: 'AI Generator',
                version: '1.0.0',
                description: 'Main HTML template',
                tags: ['html', 'template']
              }
            }
          ]
        },
        {
          id: 'package.json',
          name: 'package.json',
          type: 'file',
          path: '/package.json',
          size: 768,
          lastModified: new Date(),
          content: `{\n  "name": "ai-generated-app",\n  "version": "1.0.0",\n  "description": "An AI-generated React application",\n  "main": "src/index.tsx",\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test",\n    "eject": "react-scripts eject"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-router-dom": "^6.8.0",\n    "typescript": "^4.9.0"\n  },\n  "devDependencies": {\n    "@types/react": "^18.0.0",\n    "@types/react-dom": "^18.0.0",\n    "react-scripts": "5.0.1"\n  },\n  "browserslist": {\n    "production": [\n      ">0.2%",\n      "not dead",\n      "not op_mini all"\n    ],\n    "development": [\n      "last 1 chrome version",\n      "last 1 firefox version",\n      "last 1 safari version"\n    ]\n  }\n}`,
          language: 'json',
          isEditable: true,
          isLocked: false,
          metadata: {
            author: 'AI Generator',
            version: '1.0.0',
            description: 'Package configuration',
            tags: ['npm', 'config', 'dependencies']
          }
        },
        {
          id: 'README.md',
          name: 'README.md',
          type: 'file',
          path: '/README.md',
          size: 1280,
          lastModified: new Date(),
          content: `# AI Generated Application

This is a modern React application generated using AI technology.

## Features

- React 18 with TypeScript
- Modern CSS with gradients
- Responsive design
- Hot reload development
- Optimized build process

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Building for Production

\`\`\`bash
npm run build
\`\`\`

Builds the app for production to the \`build\` folder.

## Generated with Stich AI

This application was generated using [Stich AI](https://stich.app) - the intelligent web application generator.

## License

MIT`,
          language: 'markdown',
          isEditable: true,
          isLocked: false,
          metadata: {
            author: 'AI Generator',
            version: '1.0.0',
            description: 'Project documentation',
            tags: ['documentation', 'readme', 'markdown']
          }
        }
      ];

      setFiles(mockFiles);
      setExpandedFolders(new Set(['src', 'src/components', 'public'])); // Auto-expand some folders
      
      // Simulate collaborative users
      setCollaborators([
        { id: 'user1', name: 'Sarah Chen', online: true },
        { id: 'user2', name: 'Mike Johnson', online: false },
        { id: 'user3', name: 'Alex Rivera', online: true }
      ]);
      
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load project files');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      if (!readOnly) {
        setEditingFile(null); // Exit edit mode when selecting different file
      }
    } else {
      toggleFolder(file.id);
    }
  };

  const startEditing = (file: FileNode) => {
    if (readOnly || !file.isEditable) {
      toast.error('This file is not editable');
      return;
    }
    if (file.isLocked) {
      toast.error('This file is currently locked by another user');
      return;
    }
    setEditingFile(file);
  };

  const saveFile = async (file: FileNode, content: string) => {
    try {
      // In a real app, this would save to the backend
      toast.success(`Saved ${file.name}`);
      
      // Update local state
      const updatedChanges = new Map(fileChanges);
      updatedChanges.set(file.id, content);
      setFileChanges(updatedChanges);
      
      setEditingFile(null);
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error(`Failed to save ${file.name}`);
    }
  };

  const createNewFile = async (parentPath: string, name: string, type: FileType) => {
    try {
      const newFile: FileNode = {
        id: `${parentPath}/${name}`,
        name,
        type,
        path: `${parentPath}/${name}`,
        lastModified: new Date(),
        isEditable: type === 'file',
        isLocked: false,
        content: type === 'file' ? '' : undefined,
        language: type === 'file' ? getLanguageFromFileName(name) : undefined,
        children: type === 'folder' ? [] : undefined,
        metadata: {
          author: user?.email || 'Unknown',
          version: '1.0.0',
          tags: []
        }
      };

      // In a real app, this would create the file on the backend
      toast.success(`Created ${type} "${name}"`);
      
      // For demo, just add to local state (this would need proper tree updates)
      
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error(`Failed to create ${type}`);
    }
  };

  const deleteFile = async (file: FileNode) => {
    try {
      // In a real app, this would delete from the backend
      toast.success(`Deleted ${file.name}`);
      
      // Update local state
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
      if (editingFile?.id === file.id) {
        setEditingFile(null);
      }
      
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Failed to delete ${file.name}`);
    }
  };

  const downloadFile = async (file: FileNode) => {
    try {
      const content = fileChanges.get(file.id) || file.content || '';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className={`
            flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded
            ${selectedFile?.id === node.id ? 'bg-blue-100 dark:bg-blue-900/20' : ''}
            ${editingFile?.id === node.id ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => selectFile(node)}
        >
          {node.type === 'folder' && (
            <div onClick={(e) => { e.stopPropagation(); toggleFolder(node.id); }}>
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
          
          {node.type === 'folder' ? (
            expandedFolders.has(node.id) ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )
          ) : (
            getFileIcon(node.name, false)
          )}
          
          <span className="flex-1 text-sm">{node.name}</span>
          
          {node.type === 'file' && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {node.isLocked && <Lock className="w-3 h-3" />}
              {node.size && <span>{formatFileSize(node.size)}</span>}
            </div>
          )}
          
          {!readOnly && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.type === 'file') {
                    startEditing(node);
                  }
                }}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              {node.type === 'file' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(node);
                  }}
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </motion.div>
        
        {node.type === 'folder' && expandedFolders.has(node.id) && node.children && (
          <div className="group">
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderFileEditor = () => {
    if (!selectedFile || selectedFile.type !== 'file') {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <div className="text-center">
            <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a file to view or edit</p>
          </div>
        </div>
      );
    }

    const currentContent = fileChanges.get(selectedFile.id) || selectedFile.content || '';
    const isEditing = editingFile?.id === selectedFile.id;

    return (
      <div className="flex-1 flex flex-col">
        {/* File Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(selectedFile.name, false)}
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedFile.path} • {selectedFile.size && formatFileSize(selectedFile.size)} • 
                  Modified {selectedFile.lastModified.toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!readOnly && selectedFile.isEditable && !selectedFile.isLocked && (
                <>
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => saveFile(selectedFile, currentContent)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFile(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(selectedFile)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentContent)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(selectedFile)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* File Metadata */}
          {selectedFile.metadata && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFile.metadata.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                v{selectedFile.metadata.version}
              </Badge>
            </div>
          )}
        </div>

        {/* File Content */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <Textarea
              value={currentContent}
              onChange={(e) => {
                const updatedChanges = new Map(fileChanges);
                updatedChanges.set(selectedFile.id, e.target.value);
                setFileChanges(updatedChanges);
              }}
              className="w-full h-full resize-none border-0 rounded-none font-mono text-sm focus:ring-0"
              placeholder="Enter your code here..."
            />
          ) : (
            <div className="h-full overflow-auto">
              <pre className="p-4 text-sm font-mono leading-relaxed">
                <code className={`language-${selectedFile.language}`}>
                  {currentContent}
                </code>
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ height }} 
      className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="border-b border-slate-200 dark:border-slate-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 rounded">
                <Button
                  variant={viewMode === 'tree' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                  className="rounded-r-none"
                >
                  <GitBranch className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 w-48"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {collaborators && collaborators.length > 0 && (
                <div className="flex items-center gap-1 mr-3">
                  {collaborators.slice(0, 3).map((collab) => (
                    <div
                      key={collab.id}
                      className={`w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium ${
                        collab.online ? 'ring-2 ring-green-400' : 'opacity-50'
                      }`}
                      title={`${collab.name} (${collab.online ? 'online' : 'offline'})`}
                    >
                      {collab.name.charAt(0)}
                    </div>
                  ))}
                  {collaborators.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{collaborators.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSplitView(!splitView)}
              >
                <Split className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadFiles}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Project Files
              </h3>
              {!readOnly && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            {renderFileTree(files)}
          </div>
          
          {/* Status Bar */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>{files.length} items</span>
              <div className="flex items-center gap-2">
                {selectedFile && (
                  <span>{selectedFile.language}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Editor */}
        {renderFileEditor()}
      </div>
    </div>
  );
};

export default FileManager;