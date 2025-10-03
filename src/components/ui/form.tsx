import * as React from "react"

// Utility function to merge class names
const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ')
}

// Basic form field props interface
export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

// Simple FormField component that accepts optional props
export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  description, 
  error, 
  children 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className={cn("text-sm font-medium", error && "text-red-600")}>
          {label}
        </label>
      )}
      {children}
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Export a basic Form component
export const Form = ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => {
  return <form {...props}>{children}</form>
}

// Basic form components for compatibility
export const FormItem = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
)

export const FormLabel = ({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium", className)} {...props}>
    {children}
  </label>
)

export const FormControl = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

export const FormDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-gray-600", className)} {...props}>
    {children}
  </p>
)

export const FormMessage = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-red-600", className)} {...props}>
    {children}
  </p>
)
