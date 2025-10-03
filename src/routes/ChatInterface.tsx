import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Upload, 
  X, 
  Sparkles, 
  Code, 
  Eye, 
  Settings, 
  Download,
  Play,
  Pause,
  RotateCcw,
  Save,
  Share2,
  FileText,
  Image,
  Zap,
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { AIService } from '../services/ai/AIService';
import { ApplicationService, type Application } from '../services/application/ApplicationService';
import { StorageService } from '../services/storage/StorageService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'file' | 'image' | 'error' | 'success';
  metadata?: {
    fileName?: string;
    fileType?: string;
    codeLanguage?: string;
    generationStep?: string;
  };
}

interface GenerationProgress {
  step: string;
  progress: number;
  description: string;
  isComplete: boolean;
}

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewMode, setPreviewMode] = useState<'chat' | 'preview' | 'split'>('split');
  const [aiProvider, setAIProvider] = useState<'openai' | 'anthropic' | 'google' | 'cerebras'>('openai');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const aiService = new AIService();
  const applicationService = new ApplicationService();
  const storageService = new StorageService();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: 'Welcome to Stich Production! I\'m your AI assistant ready to help you build amazing web applications. Describe what you\'d like to create, and I\'ll generate it for you step by step.',
        type: 'text'
      });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;
    if (!user) return;

    // Add user message
    addMessage({
      role: 'user',
      content: inputMessage,
      type: 'text'
    });

    const userPrompt = inputMessage;
    setInputMessage('');
    setIsGenerating(true);

    try {
      // Add files to context if any
      let fileContext = '';
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileContent = await readFileContent(file);
          fileContext += `\n\nFile: ${file.name}\n${fileContent}`;
        }
        setSelectedFiles([]);
      }

      const fullPrompt = userPrompt + fileContext;

      // Start AI generation
      await generateApplication(fullPrompt);
      
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateApplication = async (prompt: string) => {
    if (!user) return;

    try {
      // Initialize generation progress
      const steps: GenerationProgress[] = [
        { step: 'analyze', progress: 0, description: 'Analyzing your requirements...', isComplete: false },
        { step: 'blueprint', progress: 0, description: 'Creating application blueprint...', isComplete: false },
        { step: 'files', progress: 0, description: 'Generating code files...', isComplete: false },
        { step: 'review', progress: 0, description: 'Reviewing and optimizing...', isComplete: false },
        { step: 'deploy', progress: 0, description: 'Preparing for deployment...', isComplete: false }
      ];
      
      setGenerationProgress(steps);

      // Step 1: Analyze requirements
      addMessage({
        role: 'assistant',
        content: 'Let me analyze your requirements and create a plan for your application...',
        type: 'text',
        metadata: { generationStep: 'analyze' }
      });

      updateProgress('analyze', 50, true);

      // Step 2: Generate blueprint
      addMessage({
        role: 'assistant',
        content: 'Creating application blueprint with architecture and technology stack...',
        type: 'text',
        metadata: { generationStep: 'blueprint' }
      });

      updateProgress('blueprint', 100, true);

      // Create new application
      const appData = {
        name: extractAppName(prompt) || 'My AI App',
        description: prompt.substring(0, 200),
        category: 'web-app',
        framework: 'react' as const,
        isPublic: false,
        isFavorite: false,
        tags: extractTags(prompt),
        generationSettings: {
          aiProvider,
          model: getModelForProvider(aiProvider),
          prompt,
          additionalInstructions: ''
        }
      };

      const newApp = await applicationService.createApplication(appData);
      setCurrentApp(newApp);

      // Step 3: Generate files
      addMessage({
        role: 'assistant',
        content: `🎉 Successfully created "${newApp.name}"! Now generating the code files...`,
        type: 'success',
        metadata: { generationStep: 'files' }
      });

      updateProgress('files', 25, false);

      // Simulate AI code generation (in real app, this would call the AI service)
      const generatedFiles = await simulateCodeGeneration(prompt, aiProvider);
      
      // Add generated files to messages
      for (const file of generatedFiles) {
        addMessage({
          role: 'assistant',
          content: file.content,
          type: 'code',
          metadata: {
            fileName: file.name,
            codeLanguage: file.language,
            generationStep: 'files'
          }
        });
        
        // Update progress incrementally
        updateProgress('files', Math.min(100, 25 + (generatedFiles.indexOf(file) + 1) * 15), false);
      }

      updateProgress('files', 100, true);

      // Step 4: Review and optimize
      addMessage({
        role: 'assistant',
        content: 'Reviewing the generated code and optimizing for best practices...',
        type: 'text',
        metadata: { generationStep: 'review' }
      });

      updateProgress('review', 100, true);

      // Step 5: Finalize
      addMessage({
        role: 'assistant',
        content: 'Your application is ready! You can preview it, make modifications, or deploy it directly.',
        type: 'success',
        metadata: { generationStep: 'deploy' }
      });

      updateProgress('deploy', 100, true);

      // Update application status
      await applicationService.updateApplication(newApp.id, { status: 'deployed' });

    } catch (error) {
      console.error('Error generating application:', error);
      addMessage({
        role: 'assistant',
        content: 'I encountered an error while generating your application. Please try again with a different approach.',
        type: 'error'
      });
    }
  };

  const updateProgress = (step: string, progress: number, isComplete: boolean) => {
    setGenerationProgress(prev => 
      prev.map(p => p.step === step ? { ...p, progress, isComplete } : p)
    );
  };

  const extractAppName = (prompt: string): string | null => {
    // Simple extraction - in real app, AI would help with this
    const nameMatch = prompt.match(/(?:create|build|make)\s+(?:a|an)?\s*(\w+(?:\s+\w+)*)/i);
    return nameMatch ? nameMatch[1] : null;
  };

  const extractTags = (prompt: string): string[] => {
    // Simple tag extraction - in real app, AI would analyze better
    const tags = [];
    if (prompt.toLowerCase().includes('react')) tags.push('react');
    if (prompt.toLowerCase().includes('vue')) tags.push('vue');
    if (prompt.toLowerCase().includes('angular')) tags.push('angular');
    if (prompt.toLowerCase().includes('ecommerce')) tags.push('ecommerce');
    if (prompt.toLowerCase().includes('dashboard')) tags.push('dashboard');
    if (prompt.toLowerCase().includes('blog')) tags.push('blog');
    return tags;
  };

  const getModelForProvider = (provider: string): string => {
    switch (provider) {
      case 'openai': return 'gpt-4o';
      case 'anthropic': return 'claude-3-5-sonnet';
      case 'google': return 'gemini-pro';
      case 'cerebras': return 'llama3.1-8b';
      default: return 'gpt-4o';
    }
  };

  const simulateCodeGeneration = async (prompt: string, provider: string): Promise<Array<{name: string, content: string, language: string}>> => {
    // Simulate realistic generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return [
      {
        name: 'App.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import About from './components/About';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`
      },
      {
        name: 'HomePage.tsx',
        language: 'typescript',
        content: `import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Your AI-Generated App
        </h1>
        <p className="text-lg text-center text-gray-600">
          This application was generated by AI based on your requirements.
        </p>
      </div>
    </div>
  );
};

export default HomePage;`
      },
      {
        name: 'package.json',
        language: 'json',
        content: `{
  "name": "ai-generated-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "tailwindcss": "^3.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`
      }
    ];
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              AI Code Generator
            </h1>
            {currentApp && (
              <Badge variant="secondary">
                {currentApp.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* AI Provider Selector */}
            <select
              value={aiProvider}
              onChange={(e) => setAIProvider(e.target.value as any)}
              className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              disabled={isGenerating}
            >
              <option value="openai">OpenAI GPT-4</option>
              <option value="anthropic">Claude 3.5</option>
              <option value="google">Google Gemini</option>
              <option value="cerebras">Cerebras Llama</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
              <Button
                variant={previewMode === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('chat')}
                className="rounded-r-none"
              >
                Chat
              </Button>
              <Button
                variant={previewMode === 'split' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('split')}
                className="rounded-none"
              >
                Split
              </Button>
              <Button
                variant={previewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('preview')}
                className="rounded-l-none"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className={`${previewMode === 'preview' ? 'hidden' : previewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col border-r border-slate-200 dark:border-slate-700`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : message.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  } rounded-lg p-4 shadow-sm`}>
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        {getMessageIcon(message.type || 'text')}
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          AI Assistant
                        </span>
                        {message.metadata?.fileName && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.fileName}
                          </Badge>
                        )}
                      </div>
                    )}

                    {message.type === 'code' ? (
                      <div className="bg-slate-900 rounded-md p-4 overflow-x-auto">
                        <pre className="text-sm text-green-400">
                          <code>{message.content}</code>
                        </pre>
                      </div>
                    ) : (
                      <p className={`text-sm ${
                        message.role === 'user' 
                          ? 'text-white' 
                          : message.type === 'error'
                          ? 'text-red-700 dark:text-red-300'
                          : message.type === 'success'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {message.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${
                        message.role === 'user' 
                          ? 'text-blue-200' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                      
                      {message.type === 'code' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Save className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Generation Progress */}
            {isGenerating && generationProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Generating your application...
                  </span>
                </div>
                
                <div className="space-y-2">
                  {generationProgress.map((step) => (
                    <div key={step.step} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.isComplete 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : step.progress > 0
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {step.isComplete ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : step.progress > 0 ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {step.description}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {step.progress}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-md px-3 py-1">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="h-4 w-4 p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Describe what you want to build... (e.g., 'Create a modern e-commerce site with React')"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isGenerating}
                  className="pr-12"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.js,.ts,.jsx,.tsx,.css,.html,.json,.md"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={isGenerating || (!inputMessage.trim() && selectedFiles.length === 0)}
                className="px-6"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {(previewMode === 'preview' || previewMode === 'split') && (
          <div className="flex-1 bg-white dark:bg-slate-800">
            <div className="h-full flex flex-col">
              <div className="border-b border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Live Preview
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Deploy
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                {currentApp ? (
                  <div className="h-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white">
                    <iframe
                      src="/api/preview/placeholder"
                      className="w-full h-full rounded-lg"
                      title={`Preview of ${currentApp.name}`}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <div className="text-center">
                      <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        No Preview Available
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        Start chatting with AI to generate an application and see the live preview here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;