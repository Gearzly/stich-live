/**
 * Loading Demo Component
 * Demonstrates various loading states and error handling
 */

import React, { useState } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  Download,
  Zap,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Loader, 
  LoadingOverlay, 
  AILoading, 
  LoadingButton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList,
  PageLoading,
  InlineLoading
} from '../ui/loading';
import { 
  EmptyState, 
  SearchEmptyState, 
  ErrorState, 
  NetworkErrorState, 
  SuccessState, 
  InlineError, 
  InlineSuccess, 
  InlineWarning,
  FeedbackCard
} from '../ui/feedback';
import { useAsyncOperation, useFormSubmission, useRetryableOperation } from '../../hooks/useError';
import { useLoadingState, useMultipleLoadingStates, useUploadProgress } from '../../hooks/useLoading';
import { ErrorBoundary } from '../error/ErrorBoundary';

export function LoadingAndErrorDemo() {
  const [currentDemo, setCurrentDemo] = useState<string>('loading');
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Hook examples
  const { execute, loading: asyncLoading, error: asyncError } = useAsyncOperation();
  const { submitForm, loading: formLoading, error: formError } = useFormSubmission();
  const { executeWithRetry, loading: retryLoading, retryCount } = useRetryableOperation(3);
  const loadingState = useLoadingState();
  const multipleLoading = useMultipleLoadingStates();
  const uploadProgress = useUploadProgress();

  // Demo functions
  const simulateAsyncOperation = async () => {
    await execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (Math.random() > 0.7) {
        throw new Error('Random error occurred');
      }
      return { success: true };
    });
  };

  const simulateFormSubmission = async () => {
    await submitForm(
      { name: 'Test', email: 'test@example.com' },
      async (data) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (Math.random() > 0.8) {
          throw new Error('Form submission failed');
        }
        return { id: '123', ...data };
      },
      {
        successMessage: 'Form submitted successfully!',
        errorMessage: 'Failed to submit form',
      }
    );
  };

  const simulateRetryOperation = async () => {
    await executeWithRetry(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Math.random() > 0.3) {
        throw new Error('Operation failed, will retry...');
      }
      return { success: true };
    });
  };

  const simulateProgressLoading = () => {
    loadingState.startLoading('Initializing...', 'setup');
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += 10;
      
      if (progress === 30) {
        loadingState.updateStage('processing', 'Processing data...');
      } else if (progress === 70) {
        loadingState.updateStage('finalizing', 'Almost done...');
      }
      
      loadingState.updateProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => loadingState.stopLoading(), 500);
      }
    }, 300);
  };

  const simulateFileUpload = () => {
    const fileId = `file_${Date.now()}`;
    const mockFile = new File([''], 'demo.txt', { type: 'text/plain' });
    
    uploadProgress.startUpload(fileId, mockFile);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress >= 100) {
        uploadProgress.completeUpload(fileId);
        clearInterval(interval);
      } else {
        uploadProgress.updateProgress(fileId, progress);
      }
    }, 200);
  };

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
    if (!showOverlay) {
      setTimeout(() => setShowOverlay(false), 3000);
    }
  };

  // Error component for testing error boundary
  const ErrorComponent = () => {
    const [shouldError, setShouldError] = useState(false);
    
    if (shouldError) {
      throw new Error('This is a test error for the error boundary');
    }
    
    return (
      <Button onClick={() => setShouldError(true)} variant="destructive">
        Trigger Error
      </Button>
    );
  };

  const demoSections = {
    loading: (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Loading Components</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Loaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Loader size="sm" />
                <Loader size="md" />
                <Loader size="lg" />
                <Loader size="xl" />
              </div>
              <Loader text="Loading data..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Loading</CardTitle>
            </CardHeader>
            <CardContent>
              <AILoading 
                stage="Generating your app..." 
                progress={loadingState.progress}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loading Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <LoadingButton 
                isLoading={asyncLoading} 
                onClick={simulateAsyncOperation}
                loadingText="Processing..."
              >
                Async Operation
              </LoadingButton>
              
              <LoadingButton 
                isLoading={formLoading} 
                onClick={simulateFormSubmission}
                variant="outline"
              >
                Submit Form
              </LoadingButton>
              
              <LoadingButton 
                isLoading={retryLoading} 
                onClick={simulateRetryOperation}
                variant="ghost"
                loadingText={`Retrying... (${retryCount}/3)`}
              >
                Retry Operation
              </LoadingButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress Loading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateProgressLoading} disabled={loadingState.isLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Progress Demo
              </Button>
              
              {loadingState.isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{loadingState.stage}</span>
                    <span>{loadingState.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingState.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{loadingState.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loading Overlay</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingOverlay isLoading={showOverlay} text="Processing request...">
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <Button onClick={toggleOverlay}>
                  Toggle Loading Overlay
                </Button>
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skeleton Card</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonCard />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skeleton List</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonList items={3} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skeleton Table</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonTable rows={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    ),

    feedback: (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Feedback States</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Empty States</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState 
                title="No projects yet"
                description="Create your first project to get started."
                action={
                  <Button>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Empty</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchEmptyState 
                query="non-existent-term"
                onClear={() => console.log('Clear search')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Error State</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorState 
                title="Failed to load"
                description="Unable to fetch project data."
                onRetry={() => console.log('Retry')}
                onGoBack={() => console.log('Go back')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Success State</CardTitle>
            </CardHeader>
            <CardContent>
              <SuccessState 
                title="Project Created"
                description="Your new project has been successfully created."
                action={
                  <Button>
                    View Project
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Inline Feedback</h4>
          <InlineError message="This is an error message" />
          <InlineSuccess message="Operation completed successfully" />
          <InlineWarning message="This is a warning message" />
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Async Operation Results</h4>
          {asyncError && (
            <InlineError message={asyncError.message} />
          )}
          {formError && (
            <InlineError message={formError.message} />
          )}
        </div>
      </div>
    ),

    errors: (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Error Handling</h3>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Boundary Test</CardTitle>
            <CardDescription>
              Click the button below to trigger an error and see the error boundary in action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary showDetails={true}>
              <ErrorComponent />
            </ErrorBoundary>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Network Error</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkErrorState onRetry={() => console.log('Retry network')} />
          </CardContent>
        </Card>

        <FeedbackCard
          title="Upload Progress"
          description="Monitor file upload progress with error handling"
          actions={
            <div className="space-y-4 w-full">
              <Button onClick={simulateFileUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Simulate Upload
              </Button>
              
              {Object.entries(uploadProgress.uploads).map(([fileId, upload]) => (
                <div key={fileId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{upload.file.name}</span>
                    <span className="capitalize">{upload.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        upload.status === 'error' ? 'bg-red-500' :
                        upload.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>
    ),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Loading States & Error Handling Demo</span>
          </CardTitle>
          <CardDescription>
            Comprehensive examples of loading indicators, error boundaries, and user feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            {Object.keys(demoSections).map((section) => (
              <Button
                key={section}
                variant={currentDemo === section ? 'default' : 'outline'}
                onClick={() => setCurrentDemo(section)}
                className="capitalize"
              >
                {section}
              </Button>
            ))}
          </div>
          
          {demoSections[currentDemo as keyof typeof demoSections]}
        </CardContent>
      </Card>
    </div>
  );
}