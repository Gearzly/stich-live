import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Input } from './input';

// Form field wrapper component
const formFieldVariants = cva(
  'space-y-2',
  {
    variants: {
      orientation: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row items-center gap-4',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  }
);

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className, 
    orientation, 
    label, 
    description, 
    error, 
    required, 
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ orientation, className }))}
        {...props}
      >
        {label && (
          <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
        )}
        {children}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

// Enhanced Input with validation states
const inputVariants = cva(
  'flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus-visible:ring-ring',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-8 text-xs',
        md: 'h-9 text-sm',
        lg: 'h-10 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, variant, size, label, description, error, ...props }, ref) => {
    const inputVariant = error ? 'error' : variant;
    
    return (
      <FormField label={label} description={description} error={error}>
        <Input
          ref={ref}
          className={cn(inputVariants({ variant: inputVariant, size, className }))}
          {...props}
        />
      </FormField>
    );
  }
);
FormInput.displayName = 'FormInput';

// Controlled Input for react-hook-form
export interface ControlledInputProps extends FormInputProps {
  name: string;
  control?: any;
}

const ControlledInput = ({ name, control, ...props }: ControlledInputProps) => {
  const { control: contextControl, formState: { errors } } = useFormContext() || {};
  const finalControl = control || contextControl;
  const error = errors?.[name]?.message as string;

  return (
    <Controller
      name={name}
      control={finalControl}
      render={({ field }) => (
        <FormInput
          {...props}
          {...field}
          error={error}
        />
      )}
    />
  );
};

// Textarea component
export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <FormField label={label} description={description} error={error}>
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
      </FormField>
    );
  }
);
FormTextarea.displayName = 'FormTextarea';

// Controlled Textarea
export interface ControlledTextareaProps extends FormTextareaProps {
  name: string;
  control?: any;
}

const ControlledTextarea = ({ name, control, ...props }: ControlledTextareaProps) => {
  const { control: contextControl, formState: { errors } } = useFormContext() || {};
  const finalControl = control || contextControl;
  const error = errors?.[name]?.message as string;

  return (
    <Controller
      name={name}
      control={finalControl}
      render={({ field }) => (
        <FormTextarea
          {...props}
          {...field}
          error={error}
        />
      )}
    />
  );
};

export {
  FormField,
  FormInput,
  ControlledInput,
  FormTextarea,
  ControlledTextarea,
};