/**
 * API Documentation Page
 * Comprehensive API reference with interactive examples
 */

// import React, { useState } from 'react';
import { useState } from 'react';
import { 
  Code, 
  Copy, 
  ExternalLink, 
  // Play, 
  BookOpen, 
  Key, 
  Shield, 
  Zap,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  category: string;
  authentication: boolean;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Response[];
  example: {
    request: string;
    response: string;
  };
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface RequestBody {
  type: string;
  description: string;
  schema: string;
}

interface Response {
  status: number;
  description: string;
  schema?: string;
}

export default function APIDocumentationPage() {
  const { showSuccess } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categories = [
    { id: 'overview', name: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'authentication', name: 'Authentication', icon: <Key className="h-4 w-4" /> },
    { id: 'apps', name: 'Apps', icon: <Zap className="h-4 w-4" /> },
    { id: 'templates', name: 'Templates', icon: <Code className="h-4 w-4" /> },
    { id: 'deployments', name: 'Deployments', icon: <Shield className="h-4 w-4" /> },
  ];

  const endpoints: APIEndpoint[] = [
    {
      id: 'list-apps',
      method: 'GET',
      path: '/api/v1/apps',
      title: 'List Apps',
      description: 'Retrieve a list of all apps associated with your account',
      category: 'apps',
      authentication: true,
      parameters: [
        {
          name: 'limit',
          type: 'integer',
          required: false,
          description: 'Number of apps to return (max 100)',
          example: '10'
        },
        {
          name: 'offset',
          type: 'integer',
          required: false,
          description: 'Number of apps to skip',
          example: '0'
        },
        {
          name: 'status',
          type: 'string',
          required: false,
          description: 'Filter by app status',
          example: 'deployed'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: '{ "apps": [App], "total": number, "hasMore": boolean }'
        },
        {
          status: 401,
          description: 'Unauthorized - Invalid or missing API key'
        }
      ],
      example: {
        request: `curl -X GET "https://api.stich.com/v1/apps?limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
        response: `{
  "apps": [
    {
      "id": "app_123",
      "name": "My Portfolio",
      "status": "deployed",
      "url": "https://my-portfolio.stich.app",
      "framework": "React",
      "createdAt": "2024-10-01T12:00:00Z",
      "updatedAt": "2024-10-03T15:30:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}`
      }
    },
    {
      id: 'create-app',
      method: 'POST',
      path: '/api/v1/apps',
      title: 'Create App',
      description: 'Create a new app using AI generation',
      category: 'apps',
      authentication: true,
      requestBody: {
        type: 'application/json',
        description: 'App creation parameters',
        schema: '{ "name": string, "description": string, "framework": string, "template"?: string }'
      },
      responses: [
        {
          status: 201,
          description: 'App created successfully',
          schema: '{ "app": App, "generationId": string }'
        },
        {
          status: 400,
          description: 'Bad request - Invalid parameters'
        },
        {
          status: 401,
          description: 'Unauthorized - Invalid or missing API key'
        }
      ],
      example: {
        request: `curl -X POST "https://api.stich.com/v1/apps" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My E-commerce Store",
    "description": "A modern e-commerce store with shopping cart and payments",
    "framework": "Next.js"
  }'`,
        response: `{
  "app": {
    "id": "app_456",
    "name": "My E-commerce Store",
    "status": "generating",
    "framework": "Next.js",
    "createdAt": "2024-10-04T10:00:00Z"
  },
  "generationId": "gen_789"
}`
      }
    }
  ];

  const toggleEndpoint = (endpointId: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointId)) {
      newExpanded.delete(endpointId);
    } else {
      newExpanded.add(endpointId);
    }
    setExpandedEndpoints(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      showSuccess('Copied!', 'Code copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      showSuccess('Copy failed', 'Please try selecting and copying manually');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Stich API Reference</h2>
        <p className="text-muted-foreground text-lg">
          The Stich API allows you to programmatically create, manage, and deploy applications. 
          Build powerful integrations and automate your workflow with our RESTful API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono">
            https://api.stich.com/v1
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Get your API key</h4>
            <p className="text-muted-foreground text-sm">
              Generate an API key from your account settings to authenticate requests.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Make your first request</h4>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
              <pre className="whitespace-pre-wrap">
{`curl -X GET "https://api.stich.com/v1/apps" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`curl -X GET "https://api.stich.com/v1/apps" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`, 'quick-start')}
              >
                {copiedCode === 'quick-start' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-medium mb-2">Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Secure API access with bearer tokens
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-medium mb-2">Rate Limits</h3>
            <p className="text-sm text-muted-foreground">
              1000 requests per hour for free plans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <h3 className="font-medium mb-2">Webhooks</h3>
            <p className="text-sm text-muted-foreground">
              Real-time notifications for events
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAuthentication = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p className="text-muted-foreground">
          The Stich API uses API keys for authentication. Include your API key in the Authorization header.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Key Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Include your API key in the Authorization header as a Bearer token:
          </p>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
            <pre>Authorization: Bearer YOUR_API_KEY</pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth-header')}
            >
              {copiedCode === 'auth-header' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Getting Your API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Go to your Account Settings</li>
            <li>Navigate to the "API Keys" section</li>
            <li>Click "Generate New Key"</li>
            <li>Copy and securely store your API key</li>
          </ol>
          <div className="mt-4">
            <Button variant="outline">
              Go to API Keys
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEndpoints = () => {
    const categoryEndpoints = endpoints.filter(endpoint => endpoint.category === selectedCategory);
    
    return (
      <div className="space-y-6">
        {categoryEndpoints.map((endpoint) => (
          <Card key={endpoint.id}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleEndpoint(endpoint.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={cn('text-white', getMethodColor(endpoint.method))}>
                    {endpoint.method}
                  </Badge>
                  <div>
                    <CardTitle className="text-lg">{endpoint.title}</CardTitle>
                    <code className="text-sm text-muted-foreground">{endpoint.path}</code>
                  </div>
                </div>
                {expandedEndpoints.has(endpoint.id) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>
              <p className="text-muted-foreground">{endpoint.description}</p>
            </CardHeader>

            {expandedEndpoints.has(endpoint.id) && (
              <CardContent className="pt-0">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="example">Example</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    {endpoint.authentication && (
                      <div className="flex items-center gap-2 text-sm">
                        <Key className="h-4 w-4 text-yellow-500" />
                        <span>Requires authentication</span>
                      </div>
                    )}

                    {endpoint.parameters && (
                      <div>
                        <h4 className="font-medium mb-3">Parameters</h4>
                        <div className="space-y-2">
                          {endpoint.parameters.map((param) => (
                            <div key={param.name} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono">{param.name}</code>
                                <Badge variant={param.required ? 'destructive' : 'secondary'} className="text-xs">
                                  {param.required ? 'required' : 'optional'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {param.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{param.description}</p>
                              {param.example && (
                                <code className="text-xs text-muted-foreground">
                                  Example: {param.example}
                                </code>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.requestBody && (
                      <div>
                        <h4 className="font-medium mb-3">Request Body</h4>
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {endpoint.requestBody.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {endpoint.requestBody.description}
                          </p>
                          <code className="text-xs text-muted-foreground">
                            {endpoint.requestBody.schema}
                          </code>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="example">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Request</h4>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
                          <pre className="whitespace-pre-wrap">{endpoint.example.request}</pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(endpoint.example.request, `${endpoint.id}-request`)}
                          >
                            {copiedCode === `${endpoint.id}-request` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Response</h4>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
                          <pre className="whitespace-pre-wrap">{endpoint.example.response}</pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(endpoint.example.response, `${endpoint.id}-response`)}
                          >
                            {copiedCode === `${endpoint.id}-response` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="response">
                    <div className="space-y-3">
                      <h4 className="font-medium">Response Codes</h4>
                      {endpoint.responses.map((response) => (
                        <div key={response.status} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={response.status < 300 ? 'secondary' : 'destructive'}>
                              {response.status}
                            </Badge>
                            <span className="text-sm font-medium">{response.description}</span>
                          </div>
                          {response.schema && (
                            <code className="text-xs text-muted-foreground">{response.schema}</code>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="space-y-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedCategory === 'overview' && renderOverview()}
          {selectedCategory === 'authentication' && renderAuthentication()}
          {selectedCategory !== 'overview' && selectedCategory !== 'authentication' && renderEndpoints()}
        </div>
      </div>
    </div>
  );
}