/**
 * Search Results Page
 * Displays search results with filtering and pagination
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  Star, 
  Download, 
  Heart, 
  Calendar,
  User,
  Tag,
  ChevronDown,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { GlobalSearch } from '../components/search/GlobalSearch';
import { useSearch, SearchResult, SearchFilters } from '../contexts/SearchContext';
import { useNotifications } from '../contexts/NotificationContext';
import { EmptyState } from '../components/ui/feedback';
import { Loader } from '../components/ui/loading';

type ViewMode = 'grid' | 'list';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess } = useNotifications();
  
  const {
    query,
    results,
    filters,
    loading,
    hasMore,
    totalResults,
    search,
    updateFilters,
    loadMore,
  } = useSearch();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<SearchFilters>(filters);

  // Initialize search from URL params
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam !== query) {
      search(queryParam);
    }
  }, [searchParams, search, query]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    }
  }, [query, setSearchParams]);

  const handleApplyFilters = () => {
    updateFilters(tempFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setTempFilters(clearedFilters);
    updateFilters(clearedFilters);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleLikeResult = (resultId: string) => {
    // TODO: Implement like functionality
    showSuccess('Liked!', 'Added to your favorites');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const activeFiltersCount = Object.values(tempFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    return value !== undefined && value !== 'relevance' && value !== 'desc';
  }).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Search</h1>
        
        {/* Search Bar */}
        <GlobalSearch showFullInterface className="max-w-2xl" />
        
        {/* Results Summary & Controls */}
        {query && (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                {loading ? 'Searching...' : `${totalResults} results for "${query}"`}
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs px-1 min-w-[1.25rem] h-5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Select 
                value={filters.sortBy || 'relevance'} 
                onValueChange={(value: string) => updateFilters({ sortBy: value as any })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <Card className="w-80 h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Content Type</Label>
                <div className="space-y-2">
                  {['app', 'template', 'user', 'documentation'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={tempFilters.type?.includes(type) || false}
                        onCheckedChange={(checked: boolean) => {
                          const currentTypes = tempFilters.type || [];
                          const newTypes = checked
                            ? [...currentTypes, type]
                            : currentTypes.filter(t => t !== type);
                          setTempFilters({ ...tempFilters, type: newTypes });
                        }}
                      />
                      <Label htmlFor={type} className="text-sm capitalize">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Category</Label>
                <div className="space-y-2">
                  {['Business', 'Marketing', 'Communication', 'Productivity', 'Entertainment'].map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={tempFilters.category?.includes(category) || false}
                        onCheckedChange={(checked: boolean) => {
                          const currentCategories = tempFilters.category || [];
                          const newCategories = checked
                            ? [...currentCategories, category]
                            : currentCategories.filter(c => c !== category);
                          setTempFilters({ ...tempFilters, category: newCategories });
                        }}
                      />
                      <Label htmlFor={category} className="text-sm">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Framework */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Framework</Label>
                <div className="space-y-2">
                  {['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte'].map((framework) => (
                    <div key={framework} className="flex items-center space-x-2">
                      <Checkbox
                        id={framework}
                        checked={tempFilters.framework?.includes(framework) || false}
                        onCheckedChange={(checked: boolean) => {
                          const currentFrameworks = tempFilters.framework || [];
                          const newFrameworks = checked
                            ? [...currentFrameworks, framework]
                            : currentFrameworks.filter(f => f !== framework);
                          setTempFilters({ ...tempFilters, framework: newFrameworks });
                        }}
                      />
                      <Label htmlFor={framework} className="text-sm">
                        {framework}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Language</Label>
                <div className="space-y-2">
                  {['TypeScript', 'JavaScript', 'Python', 'Java', 'Go'].map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={tempFilters.language?.includes(language) || false}
                        onCheckedChange={(checked: boolean) => {
                          const currentLanguages = tempFilters.language || [];
                          const newLanguages = checked
                            ? [...currentLanguages, language]
                            : currentLanguages.filter(l => l !== language);
                          setTempFilters({ ...tempFilters, language: newLanguages });
                        }}
                      />
                      <Label htmlFor={language} className="text-sm">
                        {language}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Difficulty</Label>
                <div className="space-y-2">
                  {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
                    <div key={difficulty} className="flex items-center space-x-2">
                      <Checkbox
                        id={difficulty}
                        checked={tempFilters.difficulty?.includes(difficulty) || false}
                        onCheckedChange={(checked: boolean) => {
                          const currentDifficulty = tempFilters.difficulty || [];
                          const newDifficulty = checked
                            ? [...currentDifficulty, difficulty]
                            : currentDifficulty.filter(d => d !== difficulty);
                          setTempFilters({ ...tempFilters, difficulty: newDifficulty });
                        }}
                      />
                      <Label htmlFor={difficulty} className="text-sm capitalize">
                        {difficulty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="flex-1 space-y-6">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : results.length === 0 && query ? (
            <EmptyState
              title="No results found"
              description={`No results found for "${query}". Try adjusting your search terms or filters.`}
              action={
                <Button onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              {/* Results Grid/List */}
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }>
                {results.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    viewMode={viewMode}
                    onResultClick={handleResultClick}
                    onLikeResult={handleLikeResult}
                    formatDate={formatDate}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <Button onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResultCardProps {
  result: SearchResult;
  viewMode: ViewMode;
  onResultClick: (result: SearchResult) => void;
  onLikeResult: (id: string) => void;
  formatDate: (date: Date) => string;
}

function ResultCard({ result, viewMode, onResultClick, onLikeResult, formatDate }: ResultCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt={result.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 
                  className="font-semibold text-lg cursor-pointer hover:text-primary"
                  onClick={() => onResultClick(result)}
                >
                  {result.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {result.metadata?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{result.metadata.rating}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLikeResult(result.id)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {result.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {result.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {result.author.name}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(result.updatedAt)}
                  </div>
                  {result.metadata?.downloads && (
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {result.metadata.downloads}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{result.type}</Badge>
                  {result.metadata?.framework && (
                    <Badge variant="outline">{result.metadata.framework}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        {result.thumbnail ? (
          <img
            src={result.thumbnail}
            alt={result.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onLikeResult(result.id);
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 
              className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary line-clamp-1"
              onClick={() => onResultClick(result)}
            >
              {result.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {result.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.metadata?.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm">{result.metadata.rating}</span>
                </div>
              )}
              {result.metadata?.downloads && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-3 w-3" />
                  {result.metadata.downloads}
                </div>
              )}
            </div>
            
            <Badge variant="secondary">{result.type}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {result.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {result.author.name}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(result.updatedAt)}
            </div>
          </div>
          
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{result.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}