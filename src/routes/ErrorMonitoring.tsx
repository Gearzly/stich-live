/**
 * Error Monitoring Dashboard
 * Comprehensive error tracking and monitoring interface
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  TrendingDown,
  Clock,
  Search,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Shield,
  Server
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'; // Unused
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface ErrorEntry {
  id: string;
  message: string;
  stack: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  environment: 'development' | 'staging' | 'production';
  timestamp: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'ignored';
}

interface ErrorMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

interface ServiceHealth {
  service: string;
  errorRate: number;
  responseTime: number;
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
  lastIncident: string;
}

export default function ErrorMonitoringDashboard() {
  const { showSuccess } = useNotifications();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const errorMetrics: ErrorMetric[] = [
    {
      title: 'Total Errors',
      value: '1,247',
      change: -12.5,
      trend: 'down',
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-red-500'
    },
    {
      title: 'Error Rate',
      value: '0.23%',
      change: -8.2,
      trend: 'down',
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-orange-500'
    },
    {
      title: 'Critical Errors',
      value: '23',
      change: -45.3,
      trend: 'down',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      title: 'Mean Time to Resolution',
      value: '2.4h',
      change: 15.7,
      trend: 'up',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-blue-500'
    }
  ];

  const errorTrendData = [
    { time: '00:00', errors: 45, critical: 2 },
    { time: '04:00', errors: 32, critical: 1 },
    { time: '08:00', errors: 78, critical: 5 },
    { time: '12:00', errors: 95, critical: 8 },
    { time: '16:00', errors: 67, critical: 3 },
    { time: '20:00', errors: 54, critical: 2 }
  ];

  const errorsByService = [
    { name: 'API Gateway', value: 145, color: '#EF4444' },
    { name: 'AI Generation', value: 89, color: '#F97316' },
    { name: 'Database', value: 67, color: '#EAB308' },
    { name: 'Authentication', value: 34, color: '#22C55E' },
    { name: 'File Storage', value: 23, color: '#3B82F6' }
  ];

  const serviceHealth: ServiceHealth[] = [
    {
      service: 'API Gateway',
      errorRate: 0.45,
      responseTime: 245,
      uptime: 99.8,
      status: 'healthy',
      lastIncident: '2 days ago'
    },
    {
      service: 'AI Generation Service',
      errorRate: 1.2,
      responseTime: 2300,
      uptime: 98.5,
      status: 'warning',
      lastIncident: '4 hours ago'
    },
    {
      service: 'Database Cluster',
      errorRate: 0.12,
      responseTime: 45,
      uptime: 99.95,
      status: 'healthy',
      lastIncident: '1 week ago'
    },
    {
      service: 'Authentication Service',
      errorRate: 0.08,
      responseTime: 95,
      uptime: 99.9,
      status: 'healthy',
      lastIncident: '3 days ago'
    },
    {
      service: 'File Storage',
      errorRate: 2.1,
      responseTime: 180,
      uptime: 97.2,
      status: 'critical',
      lastIncident: '30 minutes ago'
    }
  ];

  const recentErrors: ErrorEntry[] = [
    {
      id: 'error_1',
      message: 'Database connection timeout',
      stack: 'Error: Connection timeout\n  at Database.connect (db.js:45)\n  at UserService.findUser (user.service.js:23)',
      level: 'critical',
      service: 'Database',
      environment: 'production',
      timestamp: '2024-10-04 14:30:25',
      userId: 'user_123',
      url: '/api/users/profile',
      count: 15,
      firstSeen: '2024-10-04 14:25:00',
      lastSeen: '2024-10-04 14:30:25',
      status: 'new'
    },
    {
      id: 'error_2',
      message: 'AI generation service unavailable',
      stack: 'Error: Service unavailable\n  at AIService.generate (ai.service.js:67)\n  at GenerationController.create (generation.controller.js:34)',
      level: 'high',
      service: 'AI Generation',
      environment: 'production',
      timestamp: '2024-10-04 14:28:15',
      count: 8,
      firstSeen: '2024-10-04 14:20:00',
      lastSeen: '2024-10-04 14:28:15',
      status: 'acknowledged'
    },
    {
      id: 'error_3',
      message: 'Invalid authentication token',
      stack: 'Error: Invalid token\n  at AuthMiddleware.verify (auth.middleware.js:12)\n  at Router.use (app.js:23)',
      level: 'medium',
      service: 'Authentication',
      environment: 'production',
      timestamp: '2024-10-04 14:25:10',
      userId: 'user_456',
      count: 23,
      firstSeen: '2024-10-04 13:45:00',
      lastSeen: '2024-10-04 14:25:10',
      status: 'resolved'
    },
    {
      id: 'error_4',
      message: 'File upload size exceeded',
      stack: 'Error: File too large\n  at FileUpload.validate (upload.js:34)\n  at FileController.upload (file.controller.js:45)',
      level: 'low',
      service: 'File Storage',
      environment: 'production',
      timestamp: '2024-10-04 14:22:05',
      count: 5,
      firstSeen: '2024-10-04 14:15:00',
      lastSeen: '2024-10-04 14:22:05',
      status: 'ignored'
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-50';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50';
      case 'critical':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Shield className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const handleErrorAction = (action: string, errorId: string) => {
    const error = recentErrors.find(e => e.id === errorId);
    if (!error) return;

    switch (action) {
      case 'acknowledge':
        showSuccess('Error acknowledged', 'Error has been marked as acknowledged');
        break;
      case 'resolve':
        showSuccess('Error resolved', 'Error has been marked as resolved');
        break;
      case 'ignore':
        showSuccess('Error ignored', 'Error has been marked as ignored');
        break;
      default:
        break;
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Data refreshed', 'Error monitoring data has been updated');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportErrors = () => {
    showSuccess('Export started', 'Error report is being generated');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Monitoring</h1>
          <p className="text-muted-foreground">
            Track and resolve system errors and performance issues
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportErrors}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Details</TabsTrigger>
          <TabsTrigger value="services">Service Health</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Error Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {errorMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className={cn(
                      metric.change > 0 ? 'text-red-500' : 'text-green-500'
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span>from last period</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Trends (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={errorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Total Errors"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="critical" 
                      stroke="#DC2626" 
                      strokeWidth={2}
                      name="Critical Errors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errors by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorsByService}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {errorsByService.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Critical Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentErrors.filter(error => error.level === 'critical').map((error) => (
                  <div key={error.id} className="flex items-center gap-3 p-4 border rounded-lg bg-red-50">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-red-900">{error.message}</div>
                      <div className="text-sm text-red-700">
                        {error.service} • Count: {error.count} • {error.timestamp}
                      </div>
                    </div>
                    <Badge className={getStatusColor(error.status)}>
                      {error.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                className="pl-8"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="api">API Gateway</SelectItem>
                <SelectItem value="ai">AI Generation</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="storage">File Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error List */}
          <div className="space-y-4">
            {recentErrors.map((error) => (
              <Card key={error.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedError === error.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(error.level)}>
                          {error.level}
                        </Badge>
                        <Badge variant="outline">{error.service}</Badge>
                      </div>
                      <div>
                        <CardTitle className="text-base">{error.message}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          Count: {error.count} • First seen: {error.firstSeen} • Last seen: {error.lastSeen}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(error.status)}>
                        {error.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleErrorAction('acknowledge', error.id);
                        }}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedError === error.id && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Error Details</h4>
                          <div className="text-sm space-y-1">
                            <div><strong>Service:</strong> {error.service}</div>
                            <div><strong>Environment:</strong> {error.environment}</div>
                            <div><strong>Timestamp:</strong> {error.timestamp}</div>
                            {error.userId && <div><strong>User ID:</strong> {error.userId}</div>}
                            {error.url && <div><strong>URL:</strong> {error.url}</div>}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Actions</h4>
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleErrorAction('resolve', error.id)}
                            >
                              Mark as Resolved
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleErrorAction('ignore', error.id)}
                            >
                              Ignore Error
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Stack Trace</h4>
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                          {error.stack}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Service Health Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {serviceHealth.map((service) => (
              <Card key={service.service}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.service}</CardTitle>
                    <div className={cn('p-2 rounded-full', getServiceStatusColor(service.status))}>
                      {getServiceStatusIcon(service.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Error Rate</span>
                        <span>{service.errorRate}%</span>
                      </div>
                      <Progress 
                        value={service.errorRate * 20} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response Time</span>
                        <span>{service.responseTime}ms</span>
                      </div>
                      <Progress 
                        value={Math.min((service.responseTime / 3000) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uptime</span>
                        <span>{service.uptime}%</span>
                      </div>
                      <Progress 
                        value={service.uptime} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Last incident: {service.lastIncident}
                  </div>
                  
                  <Badge className={cn('w-full justify-center', getServiceStatusColor(service.status))}>
                    {service.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Service Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Service Error Rates Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={serviceHealth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="errorRate" fill="#EF4444" name="Error Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Trend Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={errorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Total Errors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Distribution by Level</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[
                    { level: 'Critical', count: 23, color: '#DC2626' },
                    { level: 'High', count: 89, color: '#EA580C' },
                    { level: 'Medium', count: 156, color: '#CA8A04' },
                    { level: 'Low', count: 234, color: '#2563EB' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">-23%</div>
                  <div className="text-sm text-muted-foreground">Error reduction this week</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">2.4h</div>
                  <div className="text-sm text-muted-foreground">Average resolution time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">94%</div>
                  <div className="text-sm text-muted-foreground">Errors auto-resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}