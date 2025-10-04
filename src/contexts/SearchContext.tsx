/**
 * Search Context
 * Manages global search state and functionality
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNotifications } from './NotificationContext';

export interface SearchResult {
  id: string;
  type: 'app' | 'template' | 'user' | 'file' | 'chat' | 'documentation';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  tags: string[];
  category: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    framework?: string;
    language?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    rating?: number;
    downloads?: number;
    likes?: number;
  };
}

export interface SearchFilters {
  type?: string[];
  category?: string[];
  tags?: string[];
  framework?: string[];
  language?: string[];
  difficulty?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  rating?: {
    min: number;
    max: number;
  };
  sortBy?: 'relevance' | 'date' | 'rating' | 'downloads' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchOptions {
  filters: SearchFilters;
  page: number;
  limit: number;
  includeContent?: boolean;
  fuzzySearch?: boolean;
}

interface SearchContextType {
  // Search state
  query: string;
  results: SearchResult[];
  filters: SearchFilters;
  loading: boolean;
  hasMore: boolean;
  totalResults: number;
  
  // Recent searches
  recentSearches: string[];
  popularSearches: string[];
  
  // Search actions
  search: (query: string, options?: Partial<SearchOptions>) => Promise<void>;
  clearSearch: () => void;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  loadMore: () => Promise<void>;
  
  // Search suggestions
  getSuggestions: (query: string) => Promise<string[]>;
  
  // Recent searches management
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Quick search
  quickSearch: (query: string, type?: string) => Promise<SearchResult[]>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

interface SearchProviderProps {
  children: React.ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { showError } = useNotifications();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
    
    // Load popular searches
    loadPopularSearches();
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('recent-searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const loadPopularSearches = async () => {
    try {
      // TODO: Replace with actual API call
      const mockPopular = [
        'React components',
        'E-commerce template',
        'Dashboard app',
        'Landing page',
        'Portfolio website',
        'Blog template',
        'Chat application',
        'Authentication',
      ];
      setPopularSearches(mockPopular);
    } catch (error) {
      console.error('Failed to load popular searches:', error);
    }
  };

  const search = useCallback(async (searchQuery: string, options: Partial<SearchOptions> = {}) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setQuery(searchQuery);
    
    const searchOptions: SearchOptions = {
      filters: { ...filters, ...options.filters },
      page: options.page || 1,
      limit: options.limit || 20,
      includeContent: options.includeContent || false,
      fuzzySearch: options.fuzzySearch !== false,
    };

    try {
      // TODO: Replace with actual API call
      const mockResults = await mockSearchAPI(searchQuery, searchOptions);
      
      if (searchOptions.page === 1) {
        setResults(mockResults.results);
        setCurrentPage(1);
      } else {
        setResults(prev => [...prev, ...mockResults.results]);
        setCurrentPage(searchOptions.page);
      }
      
      setTotalResults(mockResults.total);
      setHasMore(mockResults.hasMore);
      
      // Add to recent searches
      addRecentSearch(searchQuery);
      
    } catch (error) {
      console.error('Search failed:', error);
      showError('Search Error', 'Failed to perform search. Please try again.');
      setResults([]);
      setTotalResults(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalResults(0);
    setHasMore(false);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // Re-search with new filters if there's an active query
    if (query) {
      search(query, { filters: newFilters, page: 1 });
    }
  }, [query, search]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !query) return;
    
    await search(query, { page: currentPage + 1 });
  }, [hasMore, loading, query, currentPage, search]);

  const getSuggestions = useCallback(async (searchQuery: string): Promise<string[]> => {
    if (!searchQuery.trim()) return [];
    
    try {
      // TODO: Replace with actual API call
      const suggestions = await mockSuggestionsAPI(searchQuery);
      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, []);

  const addRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed);
      return [trimmed, ...filtered].slice(0, 10); // Keep only 10 recent searches
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const quickSearch = useCallback(async (searchQuery: string, type?: string): Promise<SearchResult[]> => {
    try {
      const searchOptions: SearchOptions = {
        filters: type ? { type: [type] } : {},
        page: 1,
        limit: 5,
        fuzzySearch: true,
      };
      
      // TODO: Replace with actual API call
      const mockResults = await mockSearchAPI(searchQuery, searchOptions);
      return mockResults.results;
    } catch (error) {
      console.error('Quick search failed:', error);
      return [];
    }
  }, []);

  const value = {
    // Search state
    query,
    results,
    filters,
    loading,
    hasMore,
    totalResults,
    
    // Recent searches
    recentSearches,
    popularSearches,
    
    // Search actions
    search,
    clearSearch,
    updateFilters,
    loadMore,
    
    // Search suggestions
    getSuggestions,
    
    // Recent searches management
    addRecentSearch,
    clearRecentSearches,
    
    // Quick search
    quickSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

// Mock API functions (replace with actual API calls)
async function mockSearchAPI(query: string, options: SearchOptions) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'app',
      title: 'E-commerce Dashboard',
      description: 'Modern React e-commerce dashboard with analytics and inventory management',
      url: '/apps/ecommerce-dashboard',
      thumbnail: '/thumbnails/ecommerce-dashboard.jpg',
      tags: ['react', 'ecommerce', 'dashboard', 'analytics'],
      category: 'Business',
      author: {
        id: 'user1',
        name: 'John Doe',
        avatar: '/avatars/john-doe.jpg',
      },
      createdAt: new Date('2024-10-01'),
      updatedAt: new Date('2024-10-03'),
      metadata: {
        framework: 'React',
        language: 'TypeScript',
        difficulty: 'intermediate',
        rating: 4.8,
        downloads: 1234,
        likes: 89,
      },
    },
    {
      id: '2',
      type: 'template',
      title: 'Landing Page Template',
      description: 'Beautiful responsive landing page template with animations',
      url: '/templates/landing-page',
      thumbnail: '/thumbnails/landing-page.jpg',
      tags: ['landing', 'template', 'responsive', 'animations'],
      category: 'Marketing',
      author: {
        id: 'user2',
        name: 'Jane Smith',
        avatar: '/avatars/jane-smith.jpg',
      },
      createdAt: new Date('2024-09-28'),
      updatedAt: new Date('2024-10-02'),
      metadata: {
        framework: 'Next.js',
        language: 'TypeScript',
        difficulty: 'beginner',
        rating: 4.6,
        downloads: 2156,
        likes: 145,
      },
    },
    {
      id: '3',
      type: 'app',
      title: 'Chat Application',
      description: 'Real-time chat application with file sharing and emoji support',
      url: '/apps/chat-app',
      thumbnail: '/thumbnails/chat-app.jpg',
      tags: ['chat', 'realtime', 'messaging', 'file-sharing'],
      category: 'Communication',
      author: {
        id: 'user3',
        name: 'Mike Johnson',
        avatar: '/avatars/mike-johnson.jpg',
      },
      createdAt: new Date('2024-09-25'),
      updatedAt: new Date('2024-10-01'),
      metadata: {
        framework: 'React',
        language: 'JavaScript',
        difficulty: 'advanced',
        rating: 4.9,
        downloads: 987,
        likes: 203,
      },
    },
  ];

  // Filter results based on query and options
  const filteredResults = mockResults.filter(result => {
    const queryMatch = result.title.toLowerCase().includes(query.toLowerCase()) ||
                     result.description.toLowerCase().includes(query.toLowerCase()) ||
                     result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    
    if (!queryMatch) return false;
    
    // Apply filters
    if (options.filters.type && !options.filters.type.includes(result.type)) return false;
    if (options.filters.category && !options.filters.category.includes(result.category)) return false;
    if (options.filters.framework && result.metadata?.framework && 
        !options.filters.framework.includes(result.metadata.framework)) return false;
    
    return true;
  });

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    const { sortBy = 'relevance', sortOrder = 'desc' } = options.filters;
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'date':
        return (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) * multiplier;
      case 'rating':
        return ((b.metadata?.rating || 0) - (a.metadata?.rating || 0)) * multiplier;
      case 'downloads':
        return ((b.metadata?.downloads || 0) - (a.metadata?.downloads || 0)) * multiplier;
      case 'alphabetical':
        return a.title.localeCompare(b.title) * multiplier;
      default: // relevance
        return 0;
    }
  });

  // Paginate results
  const startIndex = (options.page - 1) * options.limit;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + options.limit);
  
  return {
    results: paginatedResults,
    total: sortedResults.length,
    hasMore: startIndex + options.limit < sortedResults.length,
  };
}

async function mockSuggestionsAPI(query: string): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const suggestions = [
    'React components',
    'React dashboard',
    'React e-commerce',
    'React authentication',
    'React charts',
    'Next.js template',
    'Next.js blog',
    'Next.js landing page',
    'TypeScript app',
    'TypeScript components',
  ];
  
  return suggestions
    .filter(s => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6);
}