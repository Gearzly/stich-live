import React from 'react';

export interface SeparatorProps {
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({ className = '' }) => (
  <div className={`h-px bg-muted ${className}`} />
);

export default Separator;
