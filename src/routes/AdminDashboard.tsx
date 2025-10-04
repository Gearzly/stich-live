/**
 * Admin Dashboard
 * Comprehensive admin interface for system management and business metrics
 */

// import React, { useState } from 'react';
import { useState } from 'react';
import { 
  // Users, 
  Settings, 
  // Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  // Clock,
  Eye,
  // Edit,
  Trash2,
  MoreHorizontal,
  // Filter,
  Search,
  Download,
  UserCheck,
  UserX,
  Mail,
  // Calendar,
  // Globe,
  // Smartphone,
  // Monitor,
  // TrendingUp,
  DollarSign,
  CreditCard,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  appsCreated: number;
  lastActive: string;
  registeredDate: string;
  totalSpent: number;
}

interface Application {
  id: string;
  name: string;
  owner: string;
  framework: string;
  status: 'deployed' | 'generating' | 'failed' | 'draft';
  createdDate: string;
  lastModified: string;
  views: number;
  size: string;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  service: string;
  userId?: string;
}

interface BusinessMetric {
  title: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Sample data - In production, this would come from admin APIs
  const businessMetrics: BusinessMetric[] = [
    {
      title: 'Monthly Revenue',
      value: '$45,230',
      change: 12.5,
      period: 'vs last month',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-500'
    },
    {
      title: 'New Subscriptions',
      value: '156',
      change: 8.2,
      period: 'this month',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'text-blue-500'
    },
    {
      title: 'Churn Rate',
      value: '2.1%',
      change: -15.3,
      period: 'improvement',
      icon: <UserX className="h-5 w-5" />,
      color: 'text-red-500'
    },
    {
      title: 'Support Tickets',
      value: '23',
      change: -5.7,
      period: 'open tickets',
      icon: <Mail className="h-5 w-5" />,
      color: 'text-purple-500'
    }
  ];

  const users: User[] = [
    {
      id: 'user_1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      status: 'active',
      plan: 'pro',
      appsCreated: 15,
      lastActive: '2 hours ago',
      registeredDate: '2024-01-15',
      totalSpent: 299.99
    },
    {
      id: 'user_2',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      status: 'active',
      plan: 'enterprise',
      appsCreated: 47,
      lastActive: '5 minutes ago',
      registeredDate: '2023-11-22',
      totalSpent: 1299.99
    },
    {
      id: 'user_3',
      name: 'Mike Chen',
      email: 'mike.chen@startup.io',
      status: 'inactive',
      plan: 'free',
      appsCreated: 3,
      lastActive: '3 days ago',
      registeredDate: '2024-09-10',
      totalSpent: 0
    },
    {
      id: 'user_4',
      name: 'Emma Wilson',
      email: 'emma.wilson@agency.com',
      status: 'suspended',
      plan: 'pro',
      appsCreated: 8,
      lastActive: '1 week ago',
      registeredDate: '2024-03-05',
      totalSpent: 149.99
    }
  ];

  const applications: Application[] = [
    {
      id: 'app_1',
      name: 'E-commerce Store',
      owner: 'john.smith@example.com',
      framework: 'Next.js',
      status: 'deployed',
      createdDate: '2024-10-01',
      lastModified: '2024-10-03',
      views: 1247,
      size: '2.3 MB'
    },
    {
      id: 'app_2',
      name: 'Portfolio Site',
      owner: 'sarah.j@company.com',
      framework: 'React',
      status: 'generating',
      createdDate: '2024-10-04',
      lastModified: '2024-10-04',
      views: 0,
      size: 'Generating...'
    },
    {
      id: 'app_3',
      name: 'Dashboard App',
      owner: 'mike.chen@startup.io',
      framework: 'Vue.js',
      status: 'draft',
      createdDate: '2024-09-28',
      lastModified: '2024-09-30',
      views: 45,
      size: '1.8 MB'
    },
    {
      id: 'app_4',
      name: 'Landing Page',
      owner: 'emma.wilson@agency.com',
      framework: 'Angular',
      status: 'failed',
      createdDate: '2024-10-02',
      lastModified: '2024-10-02',
      views: 0,
      size: 'Failed'
    }
  ];

  const systemLogs: SystemLog[] = [
    {
      id: 'log_1',
      level: 'info',
      message: 'User authentication successful',
      timestamp: '2024-10-04 14:30:25',
      service: 'auth-service',
      userId: 'user_1'
    },
    {
      id: 'log_2',
      level: 'warning',
      message: 'High CPU usage detected on generation service',
      timestamp: '2024-10-04 14:25:15',
      service: 'ai-generation',
    },
    {
      id: 'log_3',
      level: 'error',
      message: 'Failed to deploy application: timeout',
      timestamp: '2024-10-04 14:20:10',
      service: 'deployment',
      userId: 'user_4'
    },
    {
      id: 'log_4',
      level: 'critical',
      message: 'Database connection pool exhausted',
      timestamp: '2024-10-04 14:15:05',
      service: 'database',
    },
    {
      id: 'log_5',
      level: 'info',
      message: 'Application generated successfully',
      timestamp: '2024-10-04 14:10:30',
      service: 'ai-generation',
      userId: 'user_2'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'critical':
        return 'text-red-600 font-bold';
      default:
        return 'text-gray-500';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'suspend':
        showSuccess('User suspended', `${user.name} has been suspended`);
        break;
      case 'activate':
        showSuccess('User activated', `${user.name} has been activated`);
        break;
      case 'delete':
        showError('User deleted', `${user.name} has been deleted`);
        break;
      case 'email':
        showSuccess('Email sent', `Email sent to ${user.name}`);
        break;
      default:
        break;
    }
  };

  const handleAppAction = (action: string, appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    switch (action) {
      case 'delete':
        showError('App deleted', `${app.name} has been deleted`);
        break;
      case 'redeploy':
        showSuccess('Redeployment started', `${app.name} is being redeployed`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, applications, and monitor system health
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="apps">Applications</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Business Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessMetrics.map((metric, index) => (
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
                      metric.change > 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span>{metric.period}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Users</span>
                  <span className="font-medium">12,543</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Today</span>
                  <span className="font-medium">3,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">New This Week</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Retention Rate</span>
                  <span className="font-medium">87.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Apps</span>
                  <span className="font-medium">8,923</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Generated Today</span>
                  <span className="font-medium">247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Currently Deployed</span>
                  <span className="font-medium">7,651</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-medium">98.7%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Status</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Service</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={getLogLevelColor(log.level)}>
                      {getLogLevelIcon(log.level)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{log.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.service} • {log.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Management Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Apps Created</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanColor(user.plan)}>
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.appsCreated}</TableCell>
                      <TableCell>${user.totalSpent}</TableCell>
                      <TableCell>{user.lastActive}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserAction('email', user.id)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction('suspend', user.id)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUserAction('delete', user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="space-y-6">
          {/* Application Management Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Application Management</h2>
              <p className="text-muted-foreground">Monitor and manage user applications</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  className="pl-8 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Applications Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium">{app.name}</div>
                      </TableCell>
                      <TableCell>{app.owner}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.framework}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.views.toLocaleString()}</TableCell>
                      <TableCell>{app.size}</TableCell>
                      <TableCell>{app.createdDate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAppAction('redeploy', app.id)}>
                              <Package className="h-4 w-4 mr-2" />
                              Redeploy
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAppAction('delete', app.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* System Logs Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">System Logs</h2>
              <p className="text-muted-foreground">Monitor system events and errors</p>
            </div>
            <div className="flex items-center gap-3">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="auth-service">Auth Service</SelectItem>
                  <SelectItem value="ai-generation">AI Generation</SelectItem>
                  <SelectItem value="deployment">Deployment</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>

          {/* System Logs Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className={cn('flex items-center gap-2', getLogLevelColor(log.level))}>
                          {getLogLevelIcon(log.level)}
                          <span className="capitalize font-medium">{log.level}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">{log.message}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.service}</Badge>
                      </TableCell>
                      <TableCell>{log.userId || '-'}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* System Settings */}
          <div>
            <h2 className="text-2xl font-bold mb-6">System Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">
                        Require 2FA for admin accounts
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Session Timeout</div>
                      <div className="text-sm text-muted-foreground">
                        Auto logout after inactivity
                      </div>
                    </div>
                    <span className="text-sm">30 minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Failed Login Attempts</div>
                      <div className="text-sm text-muted-foreground">
                        Lock account after failed attempts
                      </div>
                    </div>
                    <span className="text-sm">5 attempts</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">API Rate Limit</div>
                      <div className="text-sm text-muted-foreground">
                        Requests per hour per user
                      </div>
                    </div>
                    <span className="text-sm">1000/hour</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Generation Queue Limit</div>
                      <div className="text-sm text-muted-foreground">
                        Maximum queued generations
                      </div>
                    </div>
                    <span className="text-sm">100 jobs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">File Upload Limit</div>
                      <div className="text-sm text-muted-foreground">
                        Maximum file size per upload
                      </div>
                    </div>
                    <span className="text-sm">50 MB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Maintenance Status</div>
                      <div className="text-sm text-muted-foreground">
                        System maintenance mode
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Maintenance Window
                    </Button>
                    <Button variant="outline" className="w-full">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Enable Emergency Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Recovery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Last Backup</div>
                      <div className="text-sm text-muted-foreground">
                        Most recent system backup
                      </div>
                    </div>
                    <span className="text-sm">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Backup Frequency</div>
                      <div className="text-sm text-muted-foreground">
                        Automatic backup schedule
                      </div>
                    </div>
                    <span className="text-sm">Every 6 hours</span>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      Create Manual Backup
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}