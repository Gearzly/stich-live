/**
 * Help Center Main Page
 * Central hub for all help and documentation resources
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Video, 
  Code, 
  Search, 
  ArrowRight, 
  Star, 
  Users, 
  Zap,
  HelpCircle,
  FileText,
  Play,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  articles: number;
  featured?: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

interface PopularArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  views: number;
  rating: number;
}

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of Stich and create your first app',
      icon: <Play className="h-6 w-6" />,
      color: 'bg-green-500',
      articles: 12,
      featured: true,
    },
    {
      id: 'tutorials',
      title: 'Tutorials',
      description: 'Step-by-step guides for building different types of apps',
      icon: <Video className="h-6 w-6" />,
      color: 'bg-blue-500',
      articles: 25,
      featured: true,
    },
    {
      id: 'api-docs',
      title: 'API Documentation',
      description: 'Complete reference for Stich API and SDKs',
      icon: <Code className="h-6 w-6" />,
      color: 'bg-purple-500',
      articles: 45,
    },
    {
      id: 'faqs',
      title: 'FAQs',
      description: 'Frequently asked questions and answers',
      icon: <HelpCircle className="h-6 w-6" />,
      color: 'bg-orange-500',
      articles: 28,
    },
    {
      id: 'templates',
      title: 'Template Guide',
      description: 'How to use and customize our template library',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-pink-500',
      articles: 18,
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Solutions to common problems and error messages',
      icon: <Zap className="h-6 w-6" />,
      color: 'bg-red-500',
      articles: 22,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: <MessageCircle className="h-5 w-5" />,
      action: () => navigate('/support'),
      color: 'bg-blue-500',
    },
    {
      title: 'Community Forum',
      description: 'Ask questions and share knowledge',
      icon: <Users className="h-5 w-5" />,
      action: () => window.open('https://community.stich.com', '_blank'),
      color: 'bg-green-500',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: <Video className="h-5 w-5" />,
      action: () => navigate('/help/tutorials'),
      color: 'bg-purple-500',
    },
    {
      title: 'API Reference',
      description: 'Explore our complete API documentation',
      icon: <Code className="h-5 w-5" />,
      action: () => navigate('/help/api'),
      color: 'bg-orange-500',
    },
  ];

  const popularArticles: PopularArticle[] = [
    {
      id: '1',
      title: 'How to create your first app with AI',
      category: 'Getting Started',
      readTime: '5 min read',
      views: 15420,
      rating: 4.8,
    },
    {
      id: '2',
      title: 'Understanding Stich Templates',
      category: 'Templates',
      readTime: '8 min read',
      views: 12850,
      rating: 4.7,
    },
    {
      id: '3',
      title: 'Deploying your app to production',
      category: 'Tutorials',
      readTime: '12 min read',
      views: 11200,
      rating: 4.9,
    },
    {
      id: '4',
      title: 'API Authentication Guide',
      category: 'API Documentation',
      readTime: '6 min read',
      views: 9800,
      rating: 4.6,
    },
    {
      id: '5',
      title: 'Troubleshooting build errors',
      category: 'Troubleshooting',
      readTime: '4 min read',
      views: 8900,
      rating: 4.5,
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'tutorials') {
      navigate('/help/tutorials');
    } else if (categoryId === 'api-docs') {
      navigate('/help/api');
    } else if (categoryId === 'faqs') {
      navigate('/help/faqs');
    } else {
      navigate(`/help/${categoryId}`);
    }
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/help/article/${articleId}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-6 mb-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Help Center</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using Stich to build amazing applications with AI
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
            <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow group">
              <CardContent className="p-6" onClick={action.action}>
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg text-white', action.color)}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Browse by Category</h2>
          <Button variant="outline" onClick={() => navigate('/help/all')}>
            View All Articles
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className={cn(
                'cursor-pointer hover:shadow-lg transition-all duration-200 group',
                category.featured && 'ring-2 ring-primary/20'
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-3 rounded-lg text-white', category.color)}>
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.title}
                      </CardTitle>
                      {category.featured && (
                        <Badge variant="secondary" className="mt-1">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  {category.description}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {category.articles} articles
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Popular Articles</h2>
          <Button variant="outline" onClick={() => navigate('/help/popular')}>
            View All Popular
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {popularArticles.map((article, index) => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => handleArticleClick(article.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-muted-foreground/50">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{article.readTime}</span>
                      <span>{article.views.toLocaleString()} views</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        {article.rating}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Resources */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <Video className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Video Library</h3>
            <p className="text-muted-foreground mb-4">
              Watch comprehensive video tutorials and walkthroughs
            </p>
            <Button variant="outline" onClick={() => navigate('/help/videos')}>
              Watch Videos
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Card>

          <Card className="text-center p-6">
            <Users className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium mb-2">Community</h3>
            <p className="text-muted-foreground mb-4">
              Connect with other developers and share knowledge
            </p>
            <Button variant="outline" onClick={() => window.open('https://community.stich.com', '_blank')}>
              Join Community
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Card>

          <Card className="text-center p-6">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-lg font-medium mb-2">Contact Support</h3>
            <p className="text-muted-foreground mb-4">
              Get personalized help from our support team
            </p>
            <Button variant="outline" onClick={() => navigate('/support')}>
              Contact Us
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Status Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-medium">All Systems Operational</h3>
                <p className="text-sm text-muted-foreground">
                  Stich services are running smoothly
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/status')}>
              View Status Page
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}