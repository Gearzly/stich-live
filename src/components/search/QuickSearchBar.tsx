/**
 * Quick Search Bar
 * Compact search component for navigation header
 */

import React from 'react';
import { Search } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';

interface QuickSearchBarProps {
  className?: string;
}

export function QuickSearchBar({ className }: QuickSearchBarProps) {
  return (
    <div className={className}>
      <GlobalSearch 
        placeholder="Quick search..."
        className="w-64"
      />
    </div>
  );
}