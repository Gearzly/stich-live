import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const loadingVariants = cva(
  'animate-spin',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-muted-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        destructive: 'text-destructive',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string;
}

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <Loader2 className={cn(loadingVariants({ size, variant }))} />
        {text && (
          <span className={cn(
            'text-sm',
            variant === 'primary' && 'text-primary',
            variant === 'secondary' && 'text-secondary-foreground',
            variant === 'destructive' && 'text-destructive',
            variant === 'default' && 'text-muted-foreground'
          )}>
            {text}
          </span>
        )}
      </div>
    );
  }
);
LoadingSpinner.displayName = 'LoadingSpinner';

// Full page loading component
export interface PageLoadingProps {
  text?: string;
  className?: string;
}

const PageLoading = ({ text = 'Loading...', className }: PageLoadingProps) => {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-background',
      className
    )}>
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
};

// Section loading component
export interface SectionLoadingProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SectionLoading = ({ 
  text = 'Loading...', 
  className,
  size = 'md' 
}: SectionLoadingProps) => {
  return (
    <div className={cn(
      'flex items-center justify-center p-8',
      className
    )}>
      <LoadingSpinner size={size} text={text} />
    </div>
  );
};

export { LoadingSpinner, PageLoading, SectionLoading };