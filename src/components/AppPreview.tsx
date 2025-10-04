import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Settings, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Download,
  Share2,
  ExternalLink,
  Code,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit3,
  Save,
  X,
  ArrowLeft,
  ArrowRight,
  Zap,
  Globe,
  GitBranch,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { ApplicationService, type Application } from '../services/application/ApplicationService';
import { StorageService } from '../services/storage/StorageService';
import { toast } from '../lib/toast';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'preview' | 'code' | 'split';

interface AppPreviewProps {
  applicationId: string;
  onClose?: () => void;
  initialMode?: PreviewMode;
  showToolbar?: boolean;
  allowEditing?: boolean;
}

interface PreviewSettings {
  showGrid?: boolean;
  showRulers?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  darkMode?: boolean;
  showConsole?: boolean;
}

const AppPreview: React.FC<AppPreviewProps> = ({
  applicationId,
  onClose,
  initialMode = 'desktop',
  showToolbar = true,
  allowEditing = true
}) => {
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(initialMode);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [settings, setSettings] = useState<PreviewSettings>({
    showGrid: false,
    showRulers: false,
    autoRefresh: true,
    refreshInterval: 5000,
    darkMode: false,
    showConsole: false
  });
  const [editMode, setEditMode] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<Array<{type: 'log' | 'error' | 'warn', message: string, timestamp: Date}>>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  const applicationService = new ApplicationService();
  const storageService = new StorageService();

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  useEffect(() => {
    if (settings.autoRefresh && application) {
      refreshIntervalRef.current = setInterval(() => {
        refreshPreview();
      }, settings.refreshInterval);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [settings.autoRefresh, settings.refreshInterval, application]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'F5' || (e.key === 'r' && e.ctrlKey)) {
        e.preventDefault();
        refreshPreview();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const loadApplication = async () => {
    try {
      setIsLoading(true);
      const app = await applicationService.getApplication(applicationId);
      setApplication(app);
      
      if (app.previewUrl) {
        setPreviewUrl(app.previewUrl);
      } else if (app.deploymentUrl) {
        setPreviewUrl(app.deploymentUrl);
      } else {
        // Generate preview URL for sandbox environment
        setPreviewUrl(`/api/preview/${applicationId}`);
      }
      
      setLastUpdated(app.updatedAt.toDate ? app.updatedAt.toDate() : new Date(app.updatedAt));
    } catch (error) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application preview');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPreview = async () => {
    if (!application) return;
    
    setIsRefreshing(true);
    try {
      // Reload the iframe
      if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = '';
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = currentSrc + '?t=' + Date.now();
          }
        }, 100);
      }
      
      // Reload application data
      await loadApplication();
      toast.success('Preview refreshed successfully');
    } catch (error) {
      console.error('Error refreshing preview:', error);
      toast.error('Failed to refresh preview');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: 375, height: 667, label: 'iPhone SE' };
      case 'tablet':
        return { width: 768, height: 1024, label: 'iPad' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%', label: 'Desktop' };
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Set up console capture for iframe
    if (iframeRef.current && settings.showConsole) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          // Capture console logs from iframe (sandbox environment only)
          const originalLog = iframeWindow.console.log;
          const originalError = iframeWindow.console.error;
          const originalWarn = iframeWindow.console.warn;

          iframeWindow.console.log = (...args) => {
            originalLog.apply(iframeWindow.console, args);
            setConsoleOutput(prev => [...prev, {
              type: 'log',
              message: args.join(' '),
              timestamp: new Date()
            }]);
          };

          iframeWindow.console.error = (...args) => {
            originalError.apply(iframeWindow.console, args);
            setConsoleOutput(prev => [...prev, {
              type: 'error',
              message: args.join(' '),
              timestamp: new Date()
            }]);
          };

          iframeWindow.console.warn = (...args) => {
            originalWarn.apply(iframeWindow.console, args);
            setConsoleOutput(prev => [...prev, {
              type: 'warn',
              message: args.join(' '),
              timestamp: new Date()
            }]);
          };
        }
      } catch (error) {
        console.log('Console capture not available (cross-origin)');
      }
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    // In a real app, this would open a code editor
    toast.info('Edit mode activated. Code editor would open here.');
  };

  const handleSave = async () => {
    try {
      // In a real app, this would save the edited code
      toast.success('Changes saved successfully');
      setEditMode(false);
      await refreshPreview();
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleDeploy = async () => {
    if (!application) return;
    
    try {
      toast.info('Deploying application...');
      // In a real app, this would trigger deployment
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deployment
      toast.success('Application deployed successfully!');
    } catch (error) {
      toast.error('Deployment failed');
    }
  };

  const handleShare = async () => {
    if (!application) return;
    
    try {
      const shareUrl = application.deploymentUrl || application.previewUrl || window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy share URL');
    }
  };

  const handleDownload = async () => {
    if (!application) return;
    
    try {
      // In a real app, this would generate and download a zip file
      toast.info('Generating download package...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Download package ready! Check your downloads folder.');
    } catch (error) {
      toast.error('Failed to generate download package');
    }
  };

  const dimensions = getPreviewDimensions();

  if (isLoading && !application) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Application Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            The requested application could not be loaded.
          </p>
          {onClose && (
            <Button onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} bg-slate-50 dark:bg-slate-900 flex flex-col`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {application.name}
                </h1>
                <Badge className={
                  application.status === 'deployed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  application.status === 'generating' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }>
                  {application.status}
                </Badge>
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Device Mode Selector */}
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="rounded-r-none"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="rounded-none"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="rounded-l-none"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              {/* View Mode Selector */}
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className="rounded-r-none"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'split' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                  className="rounded-none"
                >
                  Split
                </Button>
                <Button
                  variant={viewMode === 'code' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('code')}
                  className="rounded-l-none"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPreview}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>

              {allowEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={editMode ? handleSave : handleEdit}
                >
                  {editMode ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              <Button size="sm" onClick={handleDeploy}>
                <Zap className="w-4 h-4 mr-2" />
                Deploy
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            {/* Preview Info Bar */}
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {dimensions.label} - {typeof dimensions.width === 'number' ? `${dimensions.width}x${dimensions.height}` : 'Responsive'}
                  </span>
                  
                  {application.deploymentUrl && (
                    <a
                      href={application.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in new tab
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                    className={settings.showGrid ? 'bg-slate-200 dark:bg-slate-700' : ''}
                  >
                    Grid
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, showConsole: !prev.showConsole }))}
                    className={settings.showConsole ? 'bg-slate-200 dark:bg-slate-700' : ''}
                  >
                    Console
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Container */}
            <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 overflow-auto">
              <div 
                ref={containerRef}
                className="h-full flex items-center justify-center"
                style={{
                  backgroundImage: settings.showGrid ? 
                    'radial-gradient(circle, #e2e8f0 1px, transparent 1px)' : 'none',
                  backgroundSize: settings.showGrid ? '20px 20px' : 'auto'
                }}
              >
                <div 
                  className="bg-white dark:bg-slate-900 shadow-xl rounded-lg overflow-hidden relative"
                  style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  {isLoading && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-300">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={`Preview of ${application.name}`}
                    onLoad={handleIframeLoad}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
              </div>
            </div>

            {/* Console Panel */}
            <AnimatePresence>
              {settings.showConsole && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 200 }}
                  exit={{ height: 0 }}
                  className="bg-slate-900 border-t border-slate-700 overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">Console</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConsoleOutput([])}
                      className="text-slate-400 hover:text-white"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="h-40 overflow-y-auto p-3 space-y-1">
                    {consoleOutput.map((log, index) => (
                      <div key={index} className={`text-xs font-mono ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warn' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        <span className="text-slate-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {' '}
                        <span className={
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warn' ? 'text-yellow-400' :
                          'text-white'
                        }>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    {consoleOutput.length === 0 && (
                      <div className="text-slate-500 text-xs font-mono">
                        Console output will appear here...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Code Panel */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 border-l border-slate-200 dark:border-slate-700' : 'w-full'} bg-slate-900 text-white flex flex-col`}>
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-medium">Source Code</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <GitBranch className="w-4 h-4 mr-2" />
                  main
                </Button>
                {editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <div className="text-center py-12">
                <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  Code Editor
                </h3>
                <p className="text-slate-500 mb-4">
                  {editMode 
                    ? 'Edit mode is active. In a real app, Monaco Editor would be integrated here.'
                    : 'Code editor would be integrated here with Monaco Editor for syntax highlighting and editing.'
                  }
                </p>
                {!editMode && (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Enable Editing
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppPreview;