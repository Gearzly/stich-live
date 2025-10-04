/**
 * Analytics Dashboard
 * Comprehensive analytics and monitoring interface for admin users
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Zap,
  Globe,
  Server,
  Database,
  Shield,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface AnalyticsMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  users?: number;
  apps?: number;
  revenue?: number;
  errors?: number;
  timestamp?: string;
  color?: string; // For pie chart entries
}

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  responseTime: number;
  lastCheck: string;
}

interface UserEngagement {
  metric: string;
  current: number;
  previous: number;
  change: number;
  unit: string;
}

export default function AnalyticsDashboard() {
  const { showSuccess } = useNotifications();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Sample data - In production, this would come from analytics APIs
  const keyMetrics: AnalyticsMetric[] = [
    {
      id: 'total-users',
      title: 'Total Users',
      value: '12,543',
      change: 12.5,
      trend: 'up',
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-500',
      description: 'Active registered users'
    },
    {
      id: 'apps-generated',
      title: 'Apps Generated',
      value: '3,847',
      change: 8.2,
      trend: 'up',
      icon: <Code className="h-5 w-5" />,
      color: 'text-green-500',
      description: 'Total applications created'
    },
    {
      id: 'response-time',
      title: 'Avg Response Time',
      value: '245ms',
      change: -5.3,
      trend: 'up',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-yellow-500',
      description: 'Average API response time'
    },
    {
      id: 'error-rate',
      title: 'Error Rate',
      value: '0.12%',
      change: -15.7,
      trend: 'up',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-500',
      description: 'System error percentage'
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '$45,230',
      change: 22.1,
      trend: 'up',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-500',
      description: 'Current month revenue'
    },
    {
      id: 'uptime',
      title: 'System Uptime',
      value: '99.97%',
      change: 0.02,
      trend: 'stable',
      icon: <Server className="h-5 w-5" />,
      color: 'text-teal-500',
      description: 'Last 30 days uptime'
    }
  ];

  const userActivityData: ChartData[] = [
    { name: 'Mon', value: 1200, users: 1200, apps: 340, revenue: 4200 },
    { name: 'Tue', value: 1350, users: 1350, apps: 380, revenue: 4800 },
    { name: 'Wed', value: 1180, users: 1180, apps: 320, revenue: 3900 },
    { name: 'Thu', value: 1420, users: 1420, apps: 410, revenue: 5200 },
    { name: 'Fri', value: 1380, users: 1380, apps: 390, revenue: 4900 },
    { name: 'Sat', value: 980, users: 980, apps: 280, revenue: 3400 },
    { name: 'Sun', value: 1100, users: 1100, apps: 310, revenue: 3800 }
  ];

  const appTypeDistribution: ChartData[] = [
    { name: 'React Apps', value: 45, color: '#3B82F6' },
    { name: 'Vue Apps', value: 25, color: '#10B981' },
    { name: 'Angular Apps', value: 15, color: '#F59E0B' },
    { name: 'Next.js Apps', value: 10, color: '#8B5CF6' },
    { name: 'Other', value: 5, color: '#6B7280' }
  ];

  const systemHealth: SystemHealth[] = [
    {
      component: 'API Gateway',
      status: 'healthy',
      uptime: '99.98%',
      responseTime: 120,
      lastCheck: '2 minutes ago'
    },
    {
      component: 'Database',
      status: 'healthy',
      uptime: '99.95%',
      responseTime: 45,
      lastCheck: '1 minute ago'
    },
    {
      component: 'AI Generation Service',
      status: 'warning',
      uptime: '99.85%',
      responseTime: 2300,
      lastCheck: '30 seconds ago'
    },
    {
      component: 'File Storage',
      status: 'healthy',
      uptime: '99.99%',
      responseTime: 80,
      lastCheck: '1 minute ago'
    },
    {
      component: 'Authentication',
      status: 'healthy',
      uptime: '99.97%',
      responseTime: 95,
      lastCheck: '45 seconds ago'
    }
  ];

  const userEngagement: UserEngagement[] = [
    {
      metric: 'Daily Active Users',
      current: 3542,
      previous: 3201,
      change: 10.7,
      unit: 'users'
    },
    {
      metric: 'Session Duration',
      current: 24.5,
      previous: 22.1,
      change: 10.9,
      unit: 'minutes'
    },
    {
      metric: 'Page Views',
      current: 45623,
      previous: 41234,
      change: 10.6,
      unit: 'views'
    },
    {
      metric: 'Bounce Rate',
      current: 32.1,
      previous: 35.8,
      change: -10.3,
      unit: '%'
    }
  ];

  const realtimeData: ChartData[] = [
    { name: '12:00', value: 120 },
    { name: '12:05', value: 135 },
    { name: '12:10', value: 145 },
    { name: '12:15', value: 160 },
    { name: '12:20', value: 155 },
    { name: '12:25', value: 170 },
    { name: '12:30', value: 165 }
  ];

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
      showSuccess('Data refreshed', 'Analytics data has been updated');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    showSuccess('Export started', 'Your analytics report is being prepared');
    // Simulate export process
    setTimeout(() => {
      showSuccess('Export complete', 'Report downloaded successfully');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-50';
      case 'warning': return 'text-yellow-500 bg-yellow-50';
      case 'critical': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Shield className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'stable') return null;
    
    const isPositive = change > 0;
    const IconComponent = isPositive ? TrendingUp : TrendingUp;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    
    return <IconComponent className={cn('h-4 w-4', colorClass)} />;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance and user engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="apps">Apps</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyMetrics.map((metric) => (
              <Card key={metric.id}>
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
                    {getTrendIcon(metric.trend, metric.change)}
                    <span className={cn(
                      metric.change > 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span>from last period</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>App Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appTypeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {appTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((component) => (
                  <div key={component.component} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-full', getStatusColor(component.status))}>
                        {getStatusIcon(component.status)}
                      </div>
                      <div>
                        <div className="font-medium">{component.component}</div>
                        <div className="text-sm text-muted-foreground">
                          Last checked: {component.lastCheck}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{component.uptime} uptime</div>
                      <div className="text-sm text-muted-foreground">
                        {component.responseTime}ms avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userEngagement.map((engagement) => (
              <Card key={engagement.metric}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {engagement.metric}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {engagement.current.toLocaleString()}{engagement.unit !== 'users' && engagement.unit !== 'views' ? engagement.unit : ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={cn(
                      engagement.change > 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {engagement.change > 0 ? '+' : ''}{engagement.change}%
                    </span>
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="space-y-6">
          {/* App Generation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Apps Generated Today</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground">
                  +12% from yesterday
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Generation Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2s</div>
                <p className="text-xs text-muted-foreground">
                  -0.3s improvement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.7%</div>
                <p className="text-xs text-muted-foreground">
                  +0.2% this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* App Generation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>App Generation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="apps" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245ms</div>
                <Progress value={75} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;300ms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.12%</div>
                <Progress value={5} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;1%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2k/min</div>
                <Progress value={85} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Peak: 1.5k/min
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.97%</div>
                <Progress value={99} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  SLA: 99.9%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemHealth.map((component) => (
                    <div key={component.component} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={component.status === 'healthy' ? 'secondary' : 'destructive'}
                          className="capitalize"
                        >
                          {component.status}
                        </Badge>
                        <span className="font-medium">{component.component}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {component.responseTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,341</div>
                <p className="text-xs text-muted-foreground">
                  API requests
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generation Queue</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">
                  Pending generations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <Progress value={67} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Real-time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}