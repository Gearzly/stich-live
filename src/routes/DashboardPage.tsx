import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List, Star, Calendar, User, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isFavorite: boolean;
  deploymentUrl?: string;
  status: 'draft' | 'building' | 'deployed' | 'failed';
  thumbnail?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Apps' },
    { value: 'web', label: 'Web Apps' },
    { value: 'mobile', label: 'Mobile Apps' },
    { value: 'api', label: 'APIs' },
    { value: 'tool', label: 'Tools' },
    { value: 'game', label: 'Games' }
  ];

  useEffect(() => {
    // TODO: Fetch apps from API
    const mockApps: App[] = [
      {
        id: '1',
        name: 'Task Manager Pro',
        description: 'A modern task management application with team collaboration features',
        category: 'web',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        isPublic: true,
        isFavorite: true,
        deploymentUrl: 'https://task-manager-pro.vercel.app',
        status: 'deployed',
        thumbnail: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Task+Manager'
      },
      {
        id: '2',
        name: 'E-commerce API',
        description: 'RESTful API for e-commerce applications with payment integration',
        category: 'api',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        isPublic: false,
        isFavorite: false,
        status: 'building'
      },
      {
        id: '3',
        name: 'Weather Dashboard',
        description: 'Real-time weather monitoring dashboard with beautiful visualizations',
        category: 'web',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-15'),
        isPublic: true,
        isFavorite: true,
        deploymentUrl: 'https://weather-dash.vercel.app',
        status: 'deployed',
        thumbnail: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Weather+App'
      }
    ];

    setTimeout(() => {
      setApps(mockApps);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: App['status']) => {
    switch (status) {
      case 'deployed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'building':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: App['status']) => {
    switch (status) {
      case 'deployed':
        return <Zap className="w-3 h-3" />;
      case 'building':
        return <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <div className="w-3 h-3 bg-current rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-current rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-6">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Apps</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.displayName || user?.email}
              </p>
            </div>
            <Link to="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-input bg-background rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex border border-input rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-muted' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Apps Grid/List */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No apps found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first app'
              }
            </p>
            <Link to="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First App
              </Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredApps.map(app => (
              <div
                key={app.id}
                className={`border border-border rounded-lg hover:shadow-md transition-all duration-200 ${
                  viewMode === 'grid' ? 'p-6' : 'p-4 flex items-center gap-4'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {app.thumbnail && (
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={app.thumbnail} 
                          alt={app.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate">{app.name}</h3>
                      {app.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {app.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {app.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{app.name}</h3>
                        {app.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {app.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {app.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {app.deploymentUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={app.deploymentUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}