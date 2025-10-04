/**
 * Search Filters Component
 * Reusable filtering interface for search functionality
 */

// import React from 'react';
import { X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { SearchFilters } from '../../contexts/SearchContext';

interface SearchFiltersComponentProps {
  filters: SearchFilters;
  tempFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function SearchFiltersComponent({
  filters: _filters,
  tempFilters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  onClose,
  showCloseButton = false,
}: SearchFiltersComponentProps) {
  const updateTempFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...tempFilters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = (tempFilters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateTempFilter(key, newArray);
  };

  const getActiveFiltersCount = () => {
    return Object.values(tempFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return true;
      return value !== undefined && value !== 'relevance' && value !== 'desc';
    }).length;
  };

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="destructive" className="text-xs px-1 min-w-[1.25rem] h-5">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          {showCloseButton && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Type */}
        <FilterSection
          title="Content Type"
          options={[
            { value: 'app', label: 'Apps' },
            { value: 'template', label: 'Templates' },
            { value: 'user', label: 'Users' },
            { value: 'documentation', label: 'Documentation' },
          ]}
          selectedValues={tempFilters.type || []}
          onToggle={(value) => toggleArrayFilter('type', value)}
        />

        {/* Category */}
        <FilterSection
          title="Category"
          options={[
            { value: 'Business', label: 'Business' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Communication', label: 'Communication' },
            { value: 'Productivity', label: 'Productivity' },
            { value: 'Entertainment', label: 'Entertainment' },
            { value: 'Education', label: 'Education' },
            { value: 'Finance', label: 'Finance' },
          ]}
          selectedValues={tempFilters.category || []}
          onToggle={(value) => toggleArrayFilter('category', value)}
        />

        {/* Framework */}
        <FilterSection
          title="Framework"
          options={[
            { value: 'React', label: 'React' },
            { value: 'Next.js', label: 'Next.js' },
            { value: 'Vue.js', label: 'Vue.js' },
            { value: 'Angular', label: 'Angular' },
            { value: 'Svelte', label: 'Svelte' },
            { value: 'Nuxt.js', label: 'Nuxt.js' },
          ]}
          selectedValues={tempFilters.framework || []}
          onToggle={(value) => toggleArrayFilter('framework', value)}
        />

        {/* Language */}
        <FilterSection
          title="Language"
          options={[
            { value: 'TypeScript', label: 'TypeScript' },
            { value: 'JavaScript', label: 'JavaScript' },
            { value: 'Python', label: 'Python' },
            { value: 'Java', label: 'Java' },
            { value: 'Go', label: 'Go' },
            { value: 'Rust', label: 'Rust' },
          ]}
          selectedValues={tempFilters.language || []}
          onToggle={(value) => toggleArrayFilter('language', value)}
        />

        {/* Difficulty */}
        <FilterSection
          title="Difficulty"
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
          selectedValues={tempFilters.difficulty || []}
          onToggle={(value) => toggleArrayFilter('difficulty', value)}
        />

        {/* Filter Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onApplyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={onClearFilters}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterSectionProps {
  title: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

function FilterSection({ title, options, selectedValues, onToggle }: FilterSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
            />
            <Label htmlFor={option.value} className="text-sm">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}