import { memo } from 'react';
import { User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface MessageProps {
  content: string;
  timestamp: Date;
  className?: string;
}

export const UserMessage = memo(({ content, timestamp, className }: MessageProps) => {
  return (
    <div className={cn('flex justify-end mb-6', className)}>
      <div className="flex flex-col items-end max-w-[80%]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">
            {format(timestamp, 'HH:mm')}
          </span>
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-4 py-3">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
});

UserMessage.displayName = 'UserMessage';

interface AIMessageProps extends MessageProps {
  isStreaming?: boolean;
  phase?: string;
  model?: string;
}

export const AIMessage = memo(({ 
  content, 
  timestamp, 
  isStreaming = false, 
  phase,
  model,
  className 
}: AIMessageProps) => {
  return (
    <div className={cn('flex justify-start mb-6', className)}>
      <div className="flex flex-col items-start max-w-[80%]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(timestamp, 'HH:mm')}
          </span>
          {model && (
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {model}
            </span>
          )}
          {phase && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {phase}
            </span>
          )}
        </div>
        <div className="bg-muted rounded-lg rounded-tl-none px-4 py-3 relative">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </div>
          {isStreaming && (
            <div className="absolute bottom-2 right-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AIMessage.displayName = 'AIMessage';

interface SystemMessageProps {
  content: string;
  timestamp: Date;
  type?: 'info' | 'warning' | 'error' | 'success';
  className?: string;
}

export const SystemMessage = memo(({ 
  content, 
  timestamp, 
  type = 'info',
  className 
}: SystemMessageProps) => {
  const typeStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  };

  const typeIcons = {
    info: Clock,
    warning: Clock,
    error: Clock,
    success: Clock
  };

  const Icon = typeIcons[type];

  return (
    <div className={cn('flex justify-center mb-4', className)}>
      <div className={cn(
        'px-3 py-2 rounded-lg border text-sm flex items-center gap-2 max-w-fit',
        typeStyles[type]
      )}>
        <Icon className="w-3 h-3" />
        <span>{content}</span>
        <span className="text-xs opacity-70">
          {format(timestamp, 'HH:mm')}
        </span>
      </div>
    </div>
  );
});

SystemMessage.displayName = 'SystemMessage';