import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Download, 
  Trash2,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { UserMessage, AIMessage, SystemMessage } from './Messages';
import { ChatInput } from './ChatInput';
import { FileExplorer, FileNode } from './FileExplorer';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatPageProps {
  className?: string;
}

export default function AdvancedChat({ className }: ChatPageProps) {
  const { user } = useAuth();
  
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    session,
    isGenerating,
    currentPhase,
    streamingMessageId,
    error,
    sendMessage,
    stopGeneration,
    clearChat,
  } = useChat({
    onFileGenerated: (file) => {
      console.log('File generated:', file);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages, streamingMessageId]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    await sendMessage(content, files);
  };

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
  };

  const handleFileDownload = (file: FileNode) => {
    if (!file.content) return;
    
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportChat = () => {
    if (!session) return;
    
    const chatData = {
      title: session.title,
      messages: session.messages,
      files: session.files,
      createdAt: session.createdAt,
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in to start chatting</h3>
          <p className="text-muted-foreground">You need to be signed in to access the AI chat.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex h-screen bg-background',
      isFullscreen && 'fixed inset-0 z-50',
      className
    )}>
      {/* Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <div>
              <h1 className="font-semibold">
                {session?.title || 'New Chat'}
              </h1>
              {currentPhase && (
                <Badge variant="secondary" className="text-xs">
                  {currentPhase}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {session?.agentMode && (
              <Badge variant="outline">
                {session.agentMode}
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileExplorer(!showFileExplorer)}
            >
              {showFileExplorer ? <PanelRight /> : <PanelLeft />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportChat}
              disabled={!session?.messages.length}
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              disabled={!session?.messages.length}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-auto p-4 space-y-4"
        >
          <AnimatePresence>
            {session?.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {message.type === 'user' && (
                  <UserMessage
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                )}
                
                {message.type === 'ai' && (
                  <AIMessage
                    content={message.content}
                    timestamp={message.timestamp}
                    isStreaming={message.id === streamingMessageId}
                    {...(message.phase && { phase: message.phase })}
                    {...(message.model && { model: message.model })}
                  />
                )}
                
                {message.type === 'system' && (
                  <SystemMessage
                    content={message.content}
                    timestamp={message.timestamp}
                    type={message.content.toLowerCase().includes('error') ? 'error' : 'info'}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-800 text-sm">{error}</p>
            </motion.div>
          )}
          
          {/* Empty State */}
          {!session?.messages.length && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Stich AI</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Describe what you want to build and I'll help you create it. 
                I can generate code, suggest architectures, and guide you through implementation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Create a React todo app with TypeScript")}
                  className="text-left justify-start"
                >
                  🚀 Create a React todo app
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Build a REST API with authentication")}
                  className="text-left justify-start"
                >
                  🔐 Build a REST API
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Design a responsive landing page")}
                  className="text-left justify-start"
                >
                  🎨 Design a landing page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendMessage("Create a database schema for an e-commerce app")}
                  className="text-left justify-start"
                >
                  📊 Design a database
                </Button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={stopGeneration}
          disabled={!user}
        />
      </div>

      {/* File Explorer Sidebar */}
      <AnimatePresence>
        {showFileExplorer && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l bg-muted/30"
          >
            <FileExplorer
              files={session?.files || []}
              onFileSelect={handleFileSelect}
              onFileDownload={handleFileDownload}
              {...(selectedFile?.id && { selectedFileId: selectedFile.id })}
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}