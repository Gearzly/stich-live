/**
 * Checkbox Component
 * A customizable checkbox input with proper accessibility
 */

// import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-sm border border-gray-300 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'bg-blue-600 border-blue-600 text-white',
        'hover:border-gray-400 transition-colors',
        className
      )}
      onClick={() => !disabled && onCheckedChange(!checked)}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}