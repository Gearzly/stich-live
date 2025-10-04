import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Eye, 
  Heart, 
  Share2,
  Play, 
  ChevronDown,
  X,
  ExternalLink,
  Bookmark,
  Shuffle,
  Award,
  GitFork,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { type Application } from '../services/application/ApplicationService';
import { toast } from '../lib/toast';

type ViewMode = 'grid' | 'list';
type SortBy = 'featured' | 'newest' | 'popular' | 'trending' | 'rating';
type FilterCategory = 'all' | 'ecommerce' | 'dashboard' | 'blog' | 'portfolio' | 'business' | 'entertainment';

interface AppGalleryFilters {
  category: FilterCategory;
  framework: string;
  tags: string[];
  featured: boolean;
  hasDemo: boolean;
}

interface AppCardProps {
  app: Application;
  viewMode: ViewMode;
  onPreview: (app: Application) => void;
  onLike: (appId: string) => void;
  onBookmark: (appId: string) => void;
  onShare: (app: Application) => void;
}

const AppGallery: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AppGalleryFilters>({
    category: 'all',
    framework: 'all',
    tags: [],
    featured: false,
    hasDemo: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [likedApps, setLikedApps] = useState<Set<string>>(new Set());
  const [bookmarkedApps, setBookmarkedApps] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [appsPerPage] = useState(12);

  // const applicationService = new ApplicationService(); // Not currently used

  const categories = [
    { id: 'all', label: 'All Categories', count: 0 },
    { id: 'ecommerce', label: 'E-commerce', count: 0 },
    { id: 'dashboard', label: 'Dashboard', count: 0 },
    { id: 'blog', label: 'Blog', count: 0 },
    { id: 'portfolio', label: 'Portfolio', count: 0 },
    { id: 'business', label: 'Business', count: 0 },
    { id: 'entertainment', label: 'Entertainment', count: 0 }
  ];

  const frameworks = [
    { id: 'all', label: 'All Frameworks' },
    { id: 'react', label: 'React' },
    { id: 'vue', label: 'Vue.js' },
    { id: 'svelte', label: 'Svelte' },
    { id: 'vanilla', label: 'Vanilla JS' },
    { id: 'node', label: 'Node.js' }
  ];

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [apps, searchTerm, filters, sortBy]);

  const loadApps = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would load public apps
      // const publicApps = await applicationService.getPublicApplications?.() || [];
      
      // Simulate gallery apps for demo
      const mockApps: Application[] = Array.from({ length: 24 }, (_, i) => ({
        id: `app-${i + 1}`,
        name: `${['E-commerce Store', 'Admin Dashboard', 'Portfolio Site', 'Blog Platform', 'Business Landing', 'Social App'][i % 6]} ${i + 1}`,
        description: `A modern ${['e-commerce solution', 'admin interface', 'portfolio showcase', 'blogging platform', 'business website', 'social platform'][i % 6]} built with AI.`,
        category: ['ecommerce', 'dashboard', 'portfolio', 'blog', 'business', 'entertainment'][i % 6],
        framework: ['react', 'vue', 'svelte', 'vanilla', 'node'][i % 5] as any,
        status: 'deployed' as any,
        isPublic: true,
        isFavorite: Math.random() > 0.7,
        tags: [
          ['ecommerce', 'shopping', 'payment'],
          ['admin', 'dashboard', 'analytics'],
          ['portfolio', 'showcase', 'creative'],
          ['blog', 'cms', 'content'],
          ['business', 'landing', 'marketing'],
          ['social', 'community', 'chat']
        ][i % 6],
        deploymentUrl: `https://app-${i + 1}.stich.app`,
        previewUrl: `https://preview.stich.app/app-${i + 1}`,
        analytics: {
          views: Math.floor(Math.random() * 10000) + 100,
          likes: Math.floor(Math.random() * 500) + 10,
          forks: Math.floor(Math.random() * 100) + 1,
          shares: Math.floor(Math.random() * 200) + 5
        },
        generationSettings: {
          aiProvider: ['openai', 'anthropic', 'google', 'cerebras'][i % 4] as any,
          model: 'gpt-4o',
          prompt: 'Generated with AI',
          additionalInstructions: ''
        },
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        createdBy: `user-${i % 5 + 1}`,
        updatedBy: `user-${i % 5 + 1}`
      }));

      setApps(mockApps);
    } catch (error) {
      console.error('Error loading apps:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...apps];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(app => app.category === filters.category);
    }

    // Framework filter
    if (filters.framework !== 'all') {
      filtered = filtered.filter(app => app.framework === filters.framework);
    }

    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter(app => app.isFavorite);
    }

    // Has demo filter
    if (filters.hasDemo) {
      filtered = filtered.filter(app => app.deploymentUrl || app.previewUrl);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(app => 
        filters.tags.some(tag => app.tags.includes(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0));
        break;
      case 'trending':
        filtered.sort((a, b) => (b.analytics?.likes || 0) - (a.analytics?.likes || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.analytics?.likes || 0) - (a.analytics?.likes || 0));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return (b.analytics?.views || 0) - (a.analytics?.views || 0);
        });
        break;
    }

    setFilteredApps(filtered);
    setCurrentPage(1);
  };

  const handleLike = async (appId: string) => {
    if (!user) {
      toast.error('Please sign in to like applications');
      return;
    }

    const newLikedApps = new Set(likedApps);
    if (likedApps.has(appId)) {
      newLikedApps.delete(appId);
      toast.success('Removed from likes');
    } else {
      newLikedApps.add(appId);
      toast.success('Added to likes');
    }
    setLikedApps(newLikedApps);
  };

  const handleBookmark = async (appId: string) => {
    if (!user) {
      toast.error('Please sign in to bookmark applications');
      return;
    }

    const newBookmarkedApps = new Set(bookmarkedApps);
    if (bookmarkedApps.has(appId)) {
      newBookmarkedApps.delete(appId);
      toast.success('Removed from bookmarks');
    } else {
      newBookmarkedApps.add(appId);
      toast.success('Added to bookmarks');
    }
    setBookmarkedApps(newBookmarkedApps);
  };

  const handleShare = async (app: Application) => {
    try {
      const shareUrl = app.deploymentUrl || window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy share URL');
    }
  };

  const handlePreview = (app: Application) => {
    if (app.deploymentUrl) {
      window.open(app.deploymentUrl, '_blank');
    } else {
      toast.info('Preview not available for this application');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en').format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const AppCard: React.FC<AppCardProps> = ({ app, viewMode, onPreview, onLike, onBookmark, onShare }) => {
    const isLiked = likedApps.has(app.id);
    const isBookmarked = bookmarkedApps.has(app.id);

    if (viewMode === 'list') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-6">
              {/* App Icon/Preview */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {app.name.charAt(0)}
              </div>

              {/* App Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {app.name}
                  </h3>
                  <div className="flex items-center gap-2 ml-4">
                    {app.isFavorite && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        <Award className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {app.framework}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                  {app.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {app.analytics?.views?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {app.analytics?.likes?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="w-4 h-4" />
                    {app.analytics?.forks?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(new Date(app.createdAt))}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {app.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {app.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{app.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreview(app)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(app.id)}
                  className={isLiked ? 'text-red-500 hover:text-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBookmark(app.id)}
                  className={isBookmarked ? 'text-blue-500 hover:text-blue-600' : ''}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare(app)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
          {/* App Preview/Image */}
          <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-300 text-2xl font-bold">
                {app.name.charAt(0)}
              </div>
            </div>
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={() => onPreview(app)}
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
              {app.deploymentUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(app.deploymentUrl, '_blank')}
                  className="border-white text-white hover:bg-white hover:text-slate-900"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Featured Badge */}
            {app.isFavorite && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-yellow-500 text-white">
                  <Award className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Framework Badge */}
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 text-slate-700">
                {app.framework}
              </Badge>
            </div>
          </div>

          {/* App Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {app.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBookmark(app.id)}
                className={`ml-2 ${isBookmarked ? 'text-blue-500' : ''}`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">
              {app.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {app.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {app.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{app.tags.length - 2}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {app.analytics?.views?.toLocaleString() || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {app.analytics?.likes?.toLocaleString() || 0}
                </div>
              </div>
              <span>{formatDate(new Date(app.createdAt))}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview(app)}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(app.id)}
                className={isLiked ? 'text-red-500 hover:text-red-600' : ''}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(app)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / appsPerPage);
  const startIndex = (currentPage - 1) * appsPerPage;
  const currentApps = filteredApps.slice(startIndex, startIndex + appsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              App Gallery
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Discover amazing applications built with AI. Get inspired, preview live demos, and find your next project template.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search applications, tags, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
                <option value="rating">Highest Rated</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6"
              >
                <Card className="p-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Category</Label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as FilterCategory }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Framework Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Framework</Label>
                      <select
                        value={filters.framework}
                        onChange={(e) => setFilters(prev => ({ ...prev, framework: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                      >
                        {frameworks.map(fw => (
                          <option key={fw.id} value={fw.id}>{fw.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Toggle Filters */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Options</Label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.featured}
                            onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm">Featured only</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.hasDemo}
                            onChange={(e) => setFilters(prev => ({ ...prev, hasDemo: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm">Has live demo</span>
                        </label>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => setFilters({
                          category: 'all',
                          framework: 'all',
                          tags: [],
                          featured: false,
                          hasDemo: false
                        })}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-6 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredApps.length} Applications
            </h2>
            {searchTerm && (
              <p className="text-slate-600 dark:text-slate-300">
                Results for "{searchTerm}"
              </p>
            )}
          </div>

          <Button variant="outline">
            <Shuffle className="w-4 h-4 mr-2" />
            Surprise Me
          </Button>
        </div>

        {/* Apps Grid/List */}
        {filteredApps.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No applications found
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setFilters({
                category: 'all',
                framework: 'all',
                tags: [],
                featured: false,
                hasDemo: false
              });
            }}>
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <>
            <div className={
              viewMode === 'grid' 
                ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
            }>
              {currentApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  viewMode={viewMode}
                  onPreview={handlePreview}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-slate-400">...</span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppGallery;