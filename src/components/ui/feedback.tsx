/**
 * User Feedback Components
 * Components for user feedback like empty states, error states, and success messages
 */

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Search, 
  Inbox, 
  FileX, 
  WifiOff,
  RefreshCw,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

// Base feedback component
interface FeedbackProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string | undefined;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

function BaseFeedback({ 
  icon: Icon, 
  title, 
  description, 
  actions, 
  className, 
  variant = 'default' 
}: FeedbackProps) {
  const variantStyles = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className={cn('w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100', 
        variant === 'success' && 'bg-green-100',
        variant === 'warning' && 'bg-yellow-100',
        variant === 'error' && 'bg-red-100',
        variant === 'info' && 'bg-blue-100'
      )}>
        <Icon className={cn('w-8 h-8', variantStyles[variant])} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {actions && <div className="flex flex-wrap gap-2 justify-center">{actions}</div>}
    </div>
  );
}

// Empty state components
export function EmptyState({ 
  title = 'No items found', 
  description = 'There are no items to display at the moment.',
  action,
  className 
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={Inbox}
      title={title}
      description={description}
      actions={action}
      {...(className && { className })}
    />
  );
}

export function SearchEmptyState({ 
  query,
  onClear,
  className 
}: {
  query?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={Search}
      title="No results found"
      description={query ? `No results found for "${query}". Try adjusting your search terms.` : 'Try searching for something else.'}
      actions={
        onClear && (
          <Button variant="outline" onClick={onClear}>
            Clear Search
          </Button>
        )
      }
      {...(className && { className })}
    />
  );
}

export function NoFilesState({ 
  onUpload,
  canUpload = true,
  className 
}: {
  onUpload?: () => void;
  canUpload?: boolean;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={FileX}
      title="No files yet"
      description="Upload your first file to get started with your project."
      actions={
        canUpload && onUpload && (
          <Button onClick={onUpload}>
            <Plus className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        )
      }
      {...(className && { className })}
    />
  );
}

// Error state components
export function ErrorState({ 
  title = 'Something went wrong',
  description = 'An error occurred while loading this content.',
  onRetry,
  onGoBack,
  showDetails = false,
  error,
  className 
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showDetails?: boolean;
  error?: Error;
  className?: string;
}) {
  return (
    <div className={cn('text-center p-8', className)}>
      <BaseFeedback
        icon={AlertCircle}
        title={title}
        description={description}
        variant="error"
        actions={
          <div className="space-x-2">
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button variant="outline" onClick={onGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>
        }
      />
      
      {showDetails && error && (
        <details className="mt-6 text-left max-w-md mx-auto">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Show technical details
          </summary>
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono">
            {error.message}
          </div>
        </details>
      )}
    </div>
  );
}

export function NetworkErrorState({ 
  onRetry,
  className 
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={WifiOff}
      title="Connection problem"
      description="Please check your internet connection and try again."
      variant="warning"
      actions={
        onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )
      }
      className={className}
    />
  );
}

// Success state components
export function SuccessState({ 
  title = 'Success!',
  description = 'Your action was completed successfully.',
  action,
  className 
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={CheckCircle}
      title={title}
      description={description}
      variant="success"
      actions={action}
      className={className}
    />
  );
}

// Info state components
export function InfoState({ 
  title,
  description,
  action,
  className 
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={Info}
      title={title}
      description={description}
      variant="info"
      actions={action}
      className={className}
    />
  );
}

// Warning state components
export function WarningState({ 
  title,
  description,
  action,
  className 
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseFeedback
      icon={AlertTriangle}
      title={title}
      description={description}
      variant="warning"
      actions={action}
      className={className}
    />
  );
}

// Inline feedback components for smaller spaces
export function InlineError({ 
  message,
  onDismiss,
  className 
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3', className)}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="h-auto p-1 text-red-600 hover:text-red-700"
        >
          ×
        </Button>
      )}
    </div>
  );
}

export function InlineSuccess({ 
  message,
  onDismiss,
  className 
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3', className)}>
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="h-auto p-1 text-green-600 hover:text-green-700"
        >
          ×
        </Button>
      )}
    </div>
  );
}

export function InlineWarning({ 
  message,
  onDismiss,
  className 
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-3', className)}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="h-auto p-1 text-yellow-600 hover:text-yellow-700"
        >
          ×
        </Button>
      )}
    </div>
  );
}

// Card-based feedback components
export function FeedbackCard({ 
  title,
  description,
  variant = 'default',
  actions,
  className 
}: {
  title: string;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  actions?: React.ReactNode;
  className?: string;
}) {
  const variantStyles = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {actions && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        </CardContent>
      )}
    </Card>
  );
}