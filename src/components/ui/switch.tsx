/**
 * Switch Component
 * Toggle switch for boolean settings
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({ 
  checked, 
  defaultChecked = false, 
  onCheckedChange, 
  disabled = false, 
  className,
  id 
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;
  
  const handleToggle = () => {
    const newChecked = !currentChecked;
    
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    
    onCheckedChange?.(newChecked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={currentChecked}
      disabled={disabled}
      onClick={handleToggle}
      id={id}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        currentChecked ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}