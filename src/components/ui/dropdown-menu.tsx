import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) } as any);
          }
          if (child.type === DropdownMenuContent) {
            return isOpen ? child : null;
          }
        }
        return child;
      })}
    </div>
  );
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

export function DropdownMenuTrigger({ children, asChild, onClick }: DropdownMenuTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick } as any);
  }
  
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  forceMount?: boolean;
}

export function DropdownMenuContent({ children, align = 'start', className }: DropdownMenuContentProps) {
  const alignClass = align === 'end' ? 'right-0' : 'left-0';
  
  return (
    <div className={cn(
      'absolute top-full mt-1 z-50 min-w-[8rem] bg-popover border border-border rounded-md shadow-md',
      alignClass,
      className
    )}>
      {children}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  return (
    <div 
      className={cn(
        'flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border my-1" />;
}

// Simplified sub-menu components
export function DropdownMenuSub({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function DropdownMenuSubTrigger({ children }: { children: ReactNode }) {
  return <div className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent">{children}</div>;
}

export function DropdownMenuSubContent({ children }: { children: ReactNode }) {
  return <div className="absolute left-full top-0 ml-1 bg-popover border border-border rounded-md shadow-md">{children}</div>;
}