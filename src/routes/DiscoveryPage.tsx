/**
 * App Discovery Component
 * Displays trending, featured, and recommended apps
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Flame, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useSearch, SearchResult } from '../contexts/SearchContext';
import { useNavigate } from 'react-router-dom';

interface DiscoverySection {
  title: string;
  icon: React.ReactNode;
  description: string;
  results: SearchResult[];
}

export default function AppDiscovery() {
  const navigate = useNavigate();
  const { quickSearch } = useSearch();
  const [sections, setSections] = useState<DiscoverySection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const [trending, featured, recommended] = await Promise.all([
        quickSearch('trending'),
        quickSearch('featured'),
        quickSearch('recommended'),
      ]);

      setSections([
        {
          title: 'Trending Apps',
          icon: <TrendingUp className="h-5 w-5" />,
          description: 'Most popular apps this week',
          results: trending.slice(0, 6),
        },
        {
          title: 'Featured Templates',
          icon: <Star className="h-5 w-5" />,
          description: 'Hand-picked by our team',
          results: featured.slice(0, 6),
        },
        {
          title: 'Hot This Month',
          icon: <Flame className="h-5 w-5" />,
          description: 'Rising stars in the community',
          results: recommended.slice(0, 6),
        },
      ]);
    } catch (error) {
      console.error('Failed to load discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleSectionViewAll = (sectionTitle: string) => {
    const query = sectionTitle.toLowerCase().includes('trending') ? 'trending' :
                  sectionTitle.toLowerCase().includes('featured') ? 'featured' :
                  'recommended';
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-48 h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="space-y-3">
                    <div className="aspect-video bg-muted rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
                      <div className="w-full h-3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-3xl font-bold">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          Discover Amazing Apps
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore trending applications, featured templates, and community favorites. 
          Find inspiration for your next project or discover tools to boost your productivity.
        </p>
        <Button onClick={loadDiscoveryData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Recommendations
        </Button>
      </div>

      {/* Discovery Sections */}
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {section.icon}
                <div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => handleSectionViewAll(section.title)}
                className="gap-2"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {section.results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {section.title.toLowerCase()} found at the moment.</p>
                <p className="text-sm">Check back later for updates!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.results.map((result) => (
                  <DiscoveryCard
                    key={result.id}
                    result={result}
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Browse by Category</CardTitle>
          <p className="text-sm text-muted-foreground">
            Explore apps organized by use case and industry
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Business', color: 'bg-blue-500', count: 234 },
              { name: 'E-commerce', color: 'bg-green-500', count: 156 },
              { name: 'Portfolio', color: 'bg-purple-500', count: 189 },
              { name: 'Blog', color: 'bg-orange-500', count: 142 },
              { name: 'Dashboard', color: 'bg-red-500', count: 98 },
              { name: 'Landing Page', color: 'bg-indigo-500', count: 267 },
              { name: 'Chat Apps', color: 'bg-pink-500', count: 76 },
              { name: 'Games', color: 'bg-yellow-500', count: 45 },
              { name: 'Productivity', color: 'bg-cyan-500', count: 134 },
              { name: 'Social', color: 'bg-emerald-500', count: 112 },
              { name: 'Education', color: 'bg-violet-500', count: 89 },
              { name: 'Finance', color: 'bg-slate-500', count: 67 },
            ].map((category) => (
              <Button
                key={category.name}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
              >
                <div className={`w-8 h-8 rounded-full ${category.color}`} />
                <div className="text-center">
                  <div className="font-medium text-sm">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.count} apps</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DiscoveryCardProps {
  result: SearchResult;
  onClick: () => void;
}

function DiscoveryCard({ result, onClick }: DiscoveryCardProps) {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        {result.thumbnail ? (
          <img
            src={result.thumbnail}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
        
        {/* Rating Badge */}
        {result.metadata?.rating && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            {result.metadata.rating}
          </div>
        )}
      </div>
      
      <CardContent className="p-4" onClick={onClick}>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {result.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {result.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {result.author && (
                <span>{result.author.name}</span>
              )}
              {result.metadata?.downloads && (
                <span>{result.metadata.downloads} downloads</span>
              )}
            </div>
            
            <Badge variant="secondary" className="text-xs">
              {result.type}
            </Badge>
          </div>
          
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{result.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}