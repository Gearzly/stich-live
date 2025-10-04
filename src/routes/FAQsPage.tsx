/**
 * FAQs Page
 * Frequently Asked Questions with search and categories
 */

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  lastUpdated: Date;
}

interface FAQCategory {
  id: string;
  name: string;
  count: number;
}

export default function FAQsPage() {
  const { showSuccess } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories: FAQCategory[] = [
    { id: 'all', name: 'All Categories', count: 42 },
    { id: 'getting-started', name: 'Getting Started', count: 8 },
    { id: 'account', name: 'Account & Billing', count: 6 },
    { id: 'app-creation', name: 'App Creation', count: 12 },
    { id: 'deployment', name: 'Deployment', count: 5 },
    { id: 'api', name: 'API & Integration', count: 7 },
    { id: 'troubleshooting', name: 'Troubleshooting', count: 4 },
  ];

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I create my first app with Stich?',
      answer: 'Creating your first app is simple! Start by signing up for a Stich account, then click "New App" in your dashboard. Describe what you want to build using natural language, and our AI will generate a complete application for you. You can then customize the design, add features, and deploy it with one click.',
      category: 'getting-started',
      tags: ['app creation', 'tutorial', 'beginner'],
      helpful: 145,
      notHelpful: 3,
      lastUpdated: new Date('2024-10-01'),
    },
    {
      id: '2',
      question: 'What programming languages does Stich support?',
      answer: 'Stich primarily generates modern web applications using React, Next.js, Vue.js, and Angular. The backend can be built with Node.js, Python (FastAPI/Django), or Go. We also support TypeScript for enhanced type safety and better development experience.',
      category: 'app-creation',
      tags: ['languages', 'frameworks', 'technical'],
      helpful: 89,
      notHelpful: 2,
      lastUpdated: new Date('2024-09-28'),
    },
    {
      id: '3',
      question: 'How much does Stich cost?',
      answer: 'Stich offers several pricing tiers: Free (up to 3 apps), Pro ($19/month for unlimited apps), and Enterprise (custom pricing for teams). All plans include hosting, SSL certificates, and basic support. Pro and Enterprise plans include advanced features like custom domains and priority support.',
      category: 'account',
      tags: ['pricing', 'billing', 'plans'],
      helpful: 234,
      notHelpful: 8,
      lastUpdated: new Date('2024-10-02'),
    },
    {
      id: '4',
      question: 'Can I use my own domain name?',
      answer: 'Yes! Pro and Enterprise users can connect custom domains to their apps. Simply go to your app settings, click "Custom Domain," and follow the instructions to configure your DNS settings. SSL certificates are automatically provisioned for all custom domains.',
      category: 'deployment',
      tags: ['custom domain', 'DNS', 'SSL'],
      helpful: 156,
      notHelpful: 4,
      lastUpdated: new Date('2024-09-30'),
    },
    {
      id: '5',
      question: 'How do I integrate external APIs?',
      answer: 'Stich makes API integration easy. In the app editor, go to "Integrations" and either select from popular pre-built connectors (like Stripe, Twilio, SendGrid) or add custom API endpoints. Our AI can help generate the integration code based on the API documentation you provide.',
      category: 'api',
      tags: ['API', 'integration', 'webhooks'],
      helpful: 78,
      notHelpful: 5,
      lastUpdated: new Date('2024-09-25'),
    },
    {
      id: '6',
      question: 'What happens to my data if I cancel my subscription?',
      answer: 'Your apps will continue to run for 30 days after cancellation. During this grace period, you can export your code and data. After 30 days, apps are taken offline but your data is preserved for an additional 60 days in case you want to reactivate your account.',
      category: 'account',
      tags: ['cancellation', 'data export', 'backup'],
      helpful: 67,
      notHelpful: 1,
      lastUpdated: new Date('2024-09-20'),
    },
    {
      id: '7',
      question: 'Can I collaborate with my team?',
      answer: 'Absolutely! Pro and Enterprise plans support team collaboration. You can invite team members, set permissions (viewer, editor, admin), and work together in real-time. Changes are automatically synced and versioned for easy rollbacks.',
      category: 'account',
      tags: ['collaboration', 'teams', 'permissions'],
      helpful: 123,
      notHelpful: 2,
      lastUpdated: new Date('2024-09-18'),
    },
    {
      id: '8',
      question: 'My app is loading slowly. How can I fix this?',
      answer: 'Slow loading can be caused by several factors: large images (compress them), too many external requests (optimize API calls), or complex animations (reduce them). Use our built-in performance analyzer in the app settings to identify bottlenecks. Consider upgrading to a higher-tier plan for better performance.',
      category: 'troubleshooting',
      tags: ['performance', 'optimization', 'debugging'],
      helpful: 92,
      notHelpful: 6,
      lastUpdated: new Date('2024-09-15'),
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedItems(newExpanded);
  };

  const handleFeedback = (faqId: string, helpful: boolean) => {
    showSuccess(
      'Thank you!', 
      helpful ? 'Glad this was helpful!' : 'We\'ll work on improving this answer.'
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find quick answers to the most common questions about using Stich.
          Can't find what you're looking for? Contact our support team.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="text-sm"
          >
            {category.name}
            <Badge variant="secondary" className="ml-2 text-xs">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Results Summary */}
      {searchQuery && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found for "{searchQuery}"
          </p>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or browse a different category.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((faq) => (
            <Card key={faq.id} className="transition-shadow hover:shadow-md">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleExpanded(faq.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-left pr-4">
                      {faq.question}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.id === faq.category)?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(faq.lastUpdated)}
                      </span>
                    </div>
                  </div>
                  {expandedItems.has(faq.id) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              
              {expandedItems.has(faq.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                    
                    {/* Tags */}
                    {faq.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {faq.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Feedback */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{faq.helpful} found this helpful</span>
                        {faq.notHelpful > 0 && (
                          <span>{faq.notHelpful} didn't find this helpful</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Was this helpful?</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(faq.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(faq.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Contact Support */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-medium mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <Button>
            Contact Support
            <MessageCircle className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}