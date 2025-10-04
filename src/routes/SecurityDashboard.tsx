/**
 * Security Dashboard
 * Comprehensive security monitoring and management interface
 */

import React, { useState } from 'react';
import { 
  Shield, 
  // Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  // Clock,
  // Globe,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  // Settings,
  Activity,
  // UserCheck,
  Zap,
  Database,
  // Server,
  // Wifi,
  Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface SecurityMetric {
  id: string;
  title: string;
  value: string | number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  description: string;
  lastUpdated: string;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'failed_login' | 'permission_change' | 'data_access' | 'security_alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'active' | 'resolved' | 'investigating';
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  browser: string;
  lastActivity: string;
  isCurrent: boolean;
  trusted: boolean;
}

interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'authentication' | 'monitoring' | 'access' | 'notification';
  impact: 'low' | 'medium' | 'high';
  recommended: boolean;
}

export default function SecurityDashboard() {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const securityMetrics: SecurityMetric[] = [
    {
      id: 'security-score',
      title: 'Security Score',
      value: '94/100',
      status: 'good',
      icon: <Shield className="h-5 w-5" />,
      description: 'Overall security assessment',
      lastUpdated: '2 minutes ago'
    },
    {
      id: 'failed-logins',
      title: 'Failed Login Attempts',
      value: 3,
      status: 'warning',
      icon: <XCircle className="h-5 w-5" />,
      description: 'Failed attempts in last 24h',
      lastUpdated: '1 hour ago'
    },
    {
      id: 'active-sessions',
      title: 'Active Sessions',
      value: 2,
      status: 'good',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Currently logged in devices',
      lastUpdated: 'Just now'
    },
    {
      id: 'mfa-status',
      title: '2FA Status',
      value: 'Enabled',
      status: 'good',
      icon: <Key className="h-5 w-5" />,
      description: 'Multi-factor authentication',
      lastUpdated: '1 week ago'
    },
    {
      id: 'api-requests',
      title: 'API Requests Today',
      value: 1247,
      status: 'good',
      icon: <Activity className="h-5 w-5" />,
      description: 'API usage within limits',
      lastUpdated: '5 minutes ago'
    },
    {
      id: 'security-alerts',
      title: 'Security Alerts',
      value: 1,
      status: 'warning',
      icon: <AlertTriangle className="h-5 w-5" />,
      description: 'Unresolved security issues',
      lastUpdated: '3 hours ago'
    }
  ];

  const securityEvents: SecurityEvent[] = [
    {
      id: 'event_1',
      type: 'security_alert',
      title: 'Suspicious Login Attempt',
      description: 'Login attempt from unusual location detected and blocked',
      severity: 'high',
      timestamp: '2024-10-04 14:30:25',
      location: 'Moscow, Russia',
      ipAddress: '185.220.101.23',
      userAgent: 'Chrome 118.0.0.0',
      status: 'resolved'
    },
    {
      id: 'event_2',
      type: 'login',
      title: 'Successful Login',
      description: 'Account accessed from verified device',
      severity: 'low',
      timestamp: '2024-10-04 09:15:10',
      location: 'New York, US',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 118.0.0.0',
      status: 'active'
    },
    {
      id: 'event_3',
      type: 'failed_login',
      title: 'Failed Login Attempt',
      description: 'Incorrect password entered 3 times',
      severity: 'medium',
      timestamp: '2024-10-04 08:45:33',
      location: 'London, UK',
      ipAddress: '203.0.113.45',
      userAgent: 'Firefox 119.0',
      status: 'investigating'
    },
    {
      id: 'event_4',
      type: 'permission_change',
      title: 'API Key Generated',
      description: 'New API key created for account',
      severity: 'medium',
      timestamp: '2024-10-03 16:22:18',
      status: 'active'
    },
    {
      id: 'event_5',
      type: 'data_access',
      title: 'Data Export Requested',
      description: 'User requested data export under GDPR',
      severity: 'low',
      timestamp: '2024-10-03 11:30:00',
      status: 'resolved'
    }
  ];

  const activeSessions: ActiveSession[] = [
    {
      id: 'session_1',
      device: 'MacBook Pro',
      location: 'New York, US',
      ipAddress: '192.168.1.100',
      browser: 'Chrome 118.0.0.0',
      lastActivity: '5 minutes ago',
      isCurrent: true,
      trusted: true
    },
    {
      id: 'session_2',
      device: 'iPhone 15 Pro',
      location: 'New York, US',
      ipAddress: '192.168.1.102',
      browser: 'Safari 17.0',
      lastActivity: '2 hours ago',
      isCurrent: false,
      trusted: true
    },
    {
      id: 'session_3',
      device: 'Windows PC',
      location: 'London, UK',
      ipAddress: '203.0.113.45',
      browser: 'Edge 118.0.0.0',
      lastActivity: '1 day ago',
      isCurrent: false,
      trusted: false
    }
  ];

  const securitySettings: SecuritySetting[] = [
    {
      id: 'login-notifications',
      title: 'Login Notifications',
      description: 'Get notified when someone logs into your account',
      enabled: true,
      category: 'notification',
      impact: 'low',
      recommended: true
    },
    {
      id: 'suspicious-activity',
      title: 'Suspicious Activity Monitoring',
      description: 'Monitor and block suspicious account activity',
      enabled: true,
      category: 'monitoring',
      impact: 'high',
      recommended: true
    },
    {
      id: 'api-rate-limiting',
      title: 'API Rate Limiting',
      description: 'Limit API requests to prevent abuse',
      enabled: true,
      category: 'access',
      impact: 'medium',
      recommended: true
    },
    {
      id: 'session-timeout',
      title: 'Automatic Session Timeout',
      description: 'Automatically log out after period of inactivity',
      enabled: false,
      category: 'authentication',
      impact: 'medium',
      recommended: true
    },
    {
      id: 'device-tracking',
      title: 'Device Tracking',
      description: 'Track and remember trusted devices',
      enabled: true,
      category: 'monitoring',
      impact: 'low',
      recommended: false
    },
    {
      id: 'geo-blocking',
      title: 'Geographic Restrictions',
      description: 'Block access from specific countries or regions',
      enabled: false,
      category: 'access',
      impact: 'high',
      recommended: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-500 bg-green-50';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50';
      case 'critical':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed_login':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'security_alert':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'permission_change':
        return <Key className="h-4 w-4 text-blue-500" />;
      case 'data_access':
        return <Database className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes('iPhone') || device.includes('Android')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (device.includes('iPad') || device.includes('Tablet')) {
      return <Monitor className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  const handleSettingChange = (settingId: string, enabled: boolean) => {
    const setting = securitySettings.find(s => s.id === settingId);
    if (setting) {
      showSuccess(
        'Security setting updated',
        `${setting.title} has been ${enabled ? 'enabled' : 'disabled'}`
      );
    }
  };

  const handleSessionTermination = (sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (session) {
      showSuccess('Session terminated', `Session from ${session.device} has been terminated`);
    }
  };

  const handleGenerateApiKey = () => {
    showSuccess('API key generated', 'New API key has been generated successfully');
  };

  const handleRevokeApiKey = () => {
    showError('API key revoked', 'API key has been revoked and is no longer valid');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your account security settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          <TabsTrigger value="api">API Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <div className={cn('p-2 rounded-full', getStatusColor(metric.status))}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated {metric.lastUpdated}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Medium Priority:</strong> Enable automatic session timeout to improve account security.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Good:</strong> Two-factor authentication is enabled and working properly.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Review Required:</strong> Unusual login attempts detected from London, UK. Consider reviewing recent activity.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Key className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-medium mb-1">Change Password</h3>
                <p className="text-sm text-muted-foreground">Update account password</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Fingerprint className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-medium mb-1">2FA Settings</h3>
                <p className="text-sm text-muted-foreground">Manage authentication</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Monitor className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium mb-1">View Sessions</h3>
                <p className="text-sm text-muted-foreground">Manage active sessions</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGenerateApiKey}>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-medium mb-1">API Keys</h3>
                <p className="text-sm text-muted-foreground">Manage API access</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="failed_login">Failed Logins</SelectItem>
                <SelectItem value="security_alert">Security Alerts</SelectItem>
                <SelectItem value="permission_change">Permission Changes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Events
            </Button>
          </div>

          {/* Security Events */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.type)}
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.location || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{event.ipAddress || '-'}</TableCell>
                      <TableCell>{event.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'resolved' ? 'secondary' : 'outline'}>
                          {event.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{session.device}</span>
                          {session.isCurrent && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                          {session.trusted && (
                            <Badge variant="outline" className="text-xs">Trusted</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.location} • {session.ipAddress} • {session.browser}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last activity: {session.lastActivity}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!session.trusted && (
                        <Button size="sm" variant="outline">
                          Trust Device
                        </Button>
                      )}
                      {!session.isCurrent && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleSessionTermination(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Terminate All Other Sessions</div>
                  <div className="text-sm text-muted-foreground">
                    Sign out from all devices except this one
                  </div>
                </div>
                <Button variant="destructive">
                  Terminate All
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Session Timeout</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically log out after 30 minutes of inactivity
                  </div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Remember Trusted Devices</div>
                  <div className="text-sm text-muted-foreground">
                    Skip 2FA on trusted devices for 30 days
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Security Settings */}
          <div className="space-y-4">
            {securitySettings.map((setting) => (
              <Card key={setting.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{setting.title}</h3>
                        {setting.recommended && (
                          <Badge variant="outline" className="text-xs">Recommended</Badge>
                        )}
                        <Badge className={cn('text-xs', 
                          setting.impact === 'high' ? 'bg-red-100 text-red-800' :
                          setting.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        )}>
                          {setting.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">
                        Category: {setting.category}
                      </div>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={(enabled) => handleSettingChange(setting.id, enabled)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {/* API Security */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Production API Key</div>
                  <div className="text-sm text-muted-foreground">
                    Created on Oct 1, 2024 • Last used 2 hours ago
                  </div>
                  <div className="text-sm font-mono mt-1">
                    {showApiKey ? 'sk_live_1234567890abcdef...' : '••••••••••••••••••••'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleRevokeApiKey}>
                    Revoke
                  </Button>
                </div>
              </div>
              
              <Button onClick={handleGenerateApiKey}>
                <Key className="h-4 w-4 mr-2" />
                Generate New API Key
              </Button>
            </CardContent>
          </Card>

          {/* API Usage */}
          <Card>
            <CardHeader>
              <CardTitle>API Usage & Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Requests</span>
                    <span>1,247 / 10,000</span>
                  </div>
                  <Progress value={12.47} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Requests</span>
                    <span>23,456 / 100,000</span>
                  </div>
                  <Progress value={23.456} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Rate Limit (per minute)</span>
                    <span>45 / 60</span>
                  </div>
                  <Progress value={75} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IP Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>IP Restrictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable IP Restrictions</div>
                  <div className="text-sm text-muted-foreground">
                    Only allow API access from specific IP addresses
                  </div>
                </div>
                <Switch />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Allowed IP Addresses</label>
                <Input placeholder="192.168.1.0/24" />
                <Button size="sm" variant="outline">
                  Add IP Range
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Security */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Webhook Signature Verification</div>
                  <div className="text-sm text-muted-foreground">
                    Verify webhook signatures for security
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div>
                <label className="text-sm font-medium">Webhook Secret</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    type="password" 
                    value="••••••••••••••••••••" 
                    readOnly 
                  />
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}