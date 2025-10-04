/**
 * Global Search Component
 * Provides global search functionality with suggestions and quick results
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, /* Filter, */ ArrowRight } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { useSearch, SearchResult } from '../../contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showFullInterface?: boolean;
}

export function GlobalSearch({ 
  className, 
  placeholder = "Search apps, templates, users...",
  showFullInterface = false 
}: GlobalSearchProps) {
  const navigate = useNavigate();
  const {
    query,
    search,
    clearSearch,
    getSuggestions,
    quickSearch,
    recentSearches,
    popularSearches,
    loading,
  } = useSearch();

  const [localQuery, setLocalQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [quickResults, setQuickResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (localQuery.trim().length > 0) {
      debounceRef.current = setTimeout(async () => {
        try {
          const [suggestionsData, quickData] = await Promise.all([
            getSuggestions(localQuery),
            quickSearch(localQuery),
          ]);
          setSuggestions(suggestionsData);
          setQuickResults(quickData);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setQuickResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localQuery, getSuggestions, quickSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    await search(searchQuery);
    setIsOpen(false);
    setActiveIndex(-1);
    
    // Navigate to search results page if not in full interface mode
    if (!showFullInterface) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(localQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleQuickResultClick = (result: SearchResult) => {
    setIsOpen(false);
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allItems = [
      ...suggestions,
      ...quickResults.map(r => r.title),
    ];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allItems.length) {
        const selectedItem = allItems[activeIndex];
        if (activeIndex < suggestions.length) {
          // It's a suggestion
          handleSuggestionClick(selectedItem);
        } else {
          // It's a quick result
          const resultIndex = activeIndex - suggestions.length;
          handleQuickResultClick(quickResults[resultIndex]);
        }
      } else {
        handleSearch(localQuery);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    clearSearch();
    setSuggestions([]);
    setQuickResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (
    localQuery.length > 0 || 
    recentSearches.length > 0 || 
    popularSearches.length > 0
  );

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={localQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {(localQuery || loading) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              {localQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleClearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {showFullInterface && (
          <Button type="submit" className="ml-2">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        )}
      </form>

      {/* Search Dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {/* Quick Results */}
              {quickResults.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quick Results
                  </div>
                  {quickResults.map((result, index) => {
                    const itemIndex = suggestions.length + index;
                    return (
                      <button
                        key={result.id}
                        className={cn(
                          'w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between group',
                          activeIndex === itemIndex && 'bg-muted'
                        )}
                        onClick={() => handleQuickResultClick(result)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {result.thumbnail ? (
                            <img 
                              src={result.thumbnail} 
                              alt={result.title}
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      className={cn(
                        'w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3',
                        activeIndex === index && 'bg-muted'
                      )}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {localQuery.length === 0 && recentSearches.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recent Searches
                  </div>
                  {recentSearches.slice(0, 5).map((recent) => (
                    <button
                      key={recent}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3"
                      onClick={() => handleSuggestionClick(recent)}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{recent}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {localQuery.length === 0 && popularSearches.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Popular Searches
                  </div>
                  {popularSearches.slice(0, 5).map((popular) => (
                    <button
                      key={popular}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3"
                      onClick={() => handleSuggestionClick(popular)}
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{popular}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {localQuery.length > 0 && suggestions.length === 0 && quickResults.length === 0 && !loading && (
                <div className="px-3 py-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No suggestions found</p>
                  <p className="text-xs">Press Enter to search anyway</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}