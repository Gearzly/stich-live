/**
 * Privacy Settings Page
 * Comprehensive privacy controls and GDPR compliance interface
 */

import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle,
  Info,
  Globe,
  Database,
  Cookie,
  Mail,
  UserCheck,
  Settings,
  FileText,
  Share2,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  category: 'data' | 'communication' | 'analytics' | 'sharing';
  enabled: boolean;
  required: boolean;
  impact: 'low' | 'medium' | 'high';
  icon: React.ReactNode;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  retention: string;
  purpose: string;
  canDelete: boolean;
  size: string;
}

interface PrivacyRight {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  status: 'available' | 'processing' | 'completed';
  lastUsed?: string;
}

export default function PrivacySettingsPage() {
  const { showSuccess } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'analytics',
      title: 'Usage Analytics',
      description: 'Allow collection of anonymous usage data to improve our services',
      category: 'analytics',
      enabled: true,
      required: false,
      impact: 'low',
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive emails about new features, updates, and promotional content',
      category: 'communication',
      enabled: false,
      required: false,
      impact: 'low',
      icon: <Mail className="h-4 w-4" />
    },
    {
      id: 'functional-cookies',
      title: 'Functional Cookies',
      description: 'Essential cookies required for the application to function properly',
      category: 'data',
      enabled: true,
      required: true,
      impact: 'high',
      icon: <Cookie className="h-4 w-4" />
    },
    {
      id: 'performance-tracking',
      title: 'Performance Tracking',
      description: 'Track application performance and error reporting for improvements',
      category: 'analytics',
      enabled: true,
      required: false,
      impact: 'medium',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing with Partners',
      description: 'Share anonymized data with trusted partners for service enhancement',
      category: 'sharing',
      enabled: false,
      required: false,
      impact: 'medium',
      icon: <Share2 className="h-4 w-4" />
    },
    {
      id: 'location-data',
      title: 'Location Data',
      description: 'Use location data to provide region-specific features and content',
      category: 'data',
      enabled: false,
      required: false,
      impact: 'medium',
      icon: <Globe className="h-4 w-4" />
    }
  ]);

  const dataCategories: DataCategory[] = [
    {
      id: 'profile',
      name: 'Profile Information',
      description: 'Basic account information including name, email, and preferences',
      dataTypes: ['Name', 'Email', 'Profile picture', 'Account preferences'],
      retention: '7 years after account deletion',
      purpose: 'Account management and personalization',
      canDelete: false,
      size: '2.3 KB'
    },
    {
      id: 'usage',
      name: 'Usage Data',
      description: 'Information about how you use our application and services',
      dataTypes: ['Page views', 'Feature usage', 'Session duration', 'Click patterns'],
      retention: '2 years',
      purpose: 'Service improvement and analytics',
      canDelete: true,
      size: '45.7 KB'
    },
    {
      id: 'generated-content',
      name: 'Generated Applications',
      description: 'Applications and content created using our AI generation service',
      dataTypes: ['App code', 'Configurations', 'Templates', 'Deployment history'],
      retention: 'Until manually deleted',
      purpose: 'Service delivery and version control',
      canDelete: true,
      size: '12.4 MB'
    },
    {
      id: 'communication',
      name: 'Communication History',
      description: 'Chat history and support conversations',
      dataTypes: ['Chat messages', 'Support tickets', 'Feedback submissions'],
      retention: '3 years',
      purpose: 'Customer support and service improvement',
      canDelete: true,
      size: '156.2 KB'
    },
    {
      id: 'technical',
      name: 'Technical Data',
      description: 'Technical information for application functionality',
      dataTypes: ['IP address', 'Browser info', 'Device data', 'Error logs'],
      retention: '90 days',
      purpose: 'Security, debugging, and performance optimization',
      canDelete: false,
      size: '8.9 KB'
    }
  ];

  const privacyRights: PrivacyRight[] = [
    {
      id: 'data-export',
      title: 'Export My Data',
      description: 'Download a copy of all your personal data in a portable format',
      action: 'Download Data',
      icon: <Download className="h-4 w-4" />,
      status: 'available'
    },
    {
      id: 'data-correction',
      title: 'Correct My Data',
      description: 'Request corrections to inaccurate or incomplete personal data',
      action: 'Request Correction',
      icon: <FileText className="h-4 w-4" />,
      status: 'available'
    },
    {
      id: 'data-deletion',
      title: 'Delete My Data',
      description: 'Request deletion of your personal data (subject to legal requirements)',
      action: 'Request Deletion',
      icon: <Trash2 className="h-4 w-4" />,
      status: 'available'
    },
    {
      id: 'processing-restriction',
      title: 'Restrict Processing',
      description: 'Limit how we process your personal data in certain circumstances',
      action: 'Request Restriction',
      icon: <Lock className="h-4 w-4" />,
      status: 'available'
    },
    {
      id: 'data-portability',
      title: 'Data Portability',
      description: 'Transfer your data to another service provider',
      action: 'Initiate Transfer',
      icon: <Share2 className="h-4 w-4" />,
      status: 'available'
    }
  ];

  const handleSettingChange = (settingId: string, enabled: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, enabled }
        : setting
    ));
    
    const setting = settings.find(s => s.id === settingId);
    if (setting) {
      showSuccess(
        'Setting updated',
        `${setting.title} has been ${enabled ? 'enabled' : 'disabled'}`
      );
    }
  };

  const handleDataExport = () => {
    showSuccess('Export initiated', 'Your data export is being prepared. You will receive an email when ready.');
  };

  const handleDataDeletion = (categoryId: string) => {
    const category = dataCategories.find(c => c.id === categoryId);
    if (category) {
      showSuccess('Deletion requested', `${category.name} deletion has been requested and will be processed within 30 days.`);
    }
  };

  const handlePrivacyRightAction = (rightId: string) => {
    const right = privacyRights.find(r => r.id === rightId);
    if (right) {
      showSuccess('Request submitted', `Your ${right.title.toLowerCase()} request has been submitted and will be processed within 30 days.`);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'communication':
        return <Mail className="h-4 w-4" />;
      case 'analytics':
        return <Eye className="h-4 w-4" />;
      case 'sharing':
        return <Share2 className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Privacy & Data Protection</h1>
        <p className="text-muted-foreground">
          Manage your privacy settings and control how your data is used
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
          <TabsTrigger value="data">My Data</TabsTrigger>
          <TabsTrigger value="rights">Your Rights</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Privacy Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Privacy Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">95%</div>
                  <div className="text-sm text-muted-foreground">Privacy Score</div>
                  <Progress value={95} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">6</div>
                  <div className="text-sm text-muted-foreground">Active Settings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">12.6 MB</div>
                  <div className="text-sm text-muted-foreground">Total Data Stored</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleDataExport}>
              <CardContent className="p-4 text-center">
                <Download className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-medium mb-1">Export Data</h3>
                <p className="text-sm text-muted-foreground">Download your data</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-medium mb-1">Privacy Settings</h3>
                <p className="text-sm text-muted-foreground">Manage preferences</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium mb-1">View Data</h3>
                <p className="text-sm text-muted-foreground">See stored data</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <UserCheck className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-medium mb-1">Your Rights</h3>
                <p className="text-sm text-muted-foreground">GDPR rights</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Privacy Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium">Privacy settings updated</div>
                    <div className="text-sm text-muted-foreground">Marketing communications disabled</div>
                  </div>
                  <div className="text-sm text-muted-foreground">2 hours ago</div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Download className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">Data export completed</div>
                    <div className="text-sm text-muted-foreground">Your data package is ready for download</div>
                  </div>
                  <div className="text-sm text-muted-foreground">1 day ago</div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <div className="font-medium">Privacy policy updated</div>
                    <div className="text-sm text-muted-foreground">New privacy policy version 2.1 accepted</div>
                  </div>
                  <div className="text-sm text-muted-foreground">3 days ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Privacy Settings */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These settings control how your data is processed and used. Changes take effect immediately.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {settings.map((setting) => (
              <Card key={setting.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-muted rounded-lg">
                        {setting.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{setting.title}</h3>
                          {setting.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          <Badge className={cn('text-xs', getImpactColor(setting.impact))}>
                            {setting.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="text-xs text-muted-foreground">Category:</div>
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(setting.category)}
                            <span className="text-xs capitalize">{setting.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={(enabled) => handleSettingChange(setting.id, enabled)}
                      disabled={setting.required}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Global Privacy Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Do Not Track</div>
                  <div className="text-sm text-muted-foreground">
                    Honor browser Do Not Track settings
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Minimal Data Collection</div>
                  <div className="text-sm text-muted-foreground">
                    Only collect essential data for service functionality
                  </div>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Anonymous Analytics</div>
                  <div className="text-sm text-muted-foreground">
                    Remove personal identifiers from analytics data
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data Categories */}
          <div className="space-y-4">
            {dataCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{category.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.size}</Badge>
                      {category.canDelete && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDataDeletion(category.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Data Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.dataTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Details</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Purpose:</strong> {category.purpose}</div>
                        <div><strong>Retention:</strong> {category.retention}</div>
                        <div><strong>Can Delete:</strong> {category.canDelete ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Data Usage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-sm text-muted-foreground">Data Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">12.6 MB</div>
                  <div className="text-sm text-muted-foreground">Total Storage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">18 months</div>
                  <div className="text-sm text-muted-foreground">Average Retention</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Deletable Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rights" className="space-y-6">
          {/* GDPR Rights */}
          <Alert>
            <UserCheck className="h-4 w-4" />
            <AlertDescription>
              Under GDPR and other privacy laws, you have specific rights regarding your personal data. 
              Click any action below to exercise your rights.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {privacyRights.map((right) => (
              <Card key={right.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {right.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{right.title}</CardTitle>
                      <Badge className={getStatusColor(right.status)}>
                        {right.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{right.description}</p>
                  
                  {right.lastUsed && (
                    <div className="text-sm text-muted-foreground mb-4">
                      Last used: {right.lastUsed}
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    onClick={() => handlePrivacyRightAction(right.id)}
                    disabled={right.status === 'processing'}
                  >
                    {right.status === 'processing' ? 'Processing...' : right.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Response Time</h4>
                <p className="text-sm text-muted-foreground">
                  We will respond to your privacy rights requests within 30 days as required by law.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Verification Process</h4>
                <p className="text-sm text-muted-foreground">
                  To protect your privacy, we may need to verify your identity before processing certain requests.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Appeals Process</h4>
                <p className="text-sm text-muted-foreground">
                  If you're not satisfied with our response, you can file a complaint with your local data protection authority.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-medium mb-2">GDPR Compliant</h3>
                  <p className="text-sm text-muted-foreground">
                    Full compliance with EU data protection regulations
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-medium mb-2">CCPA Compliant</h3>
                  <p className="text-sm text-muted-foreground">
                    California Consumer Privacy Act compliance
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-medium mb-2">SOC 2 Type II</h3>
                  <p className="text-sm text-muted-foreground">
                    Security and availability controls certification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Privacy Policy</div>
                    <div className="text-sm text-muted-foreground">Version 2.1 • Updated Oct 1, 2024</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Cookie className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium">Cookie Policy</div>
                    <div className="text-sm text-muted-foreground">Version 1.3 • Updated Sep 15, 2024</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Data Processing Agreement</div>
                    <div className="text-sm text-muted-foreground">Version 1.0 • Updated Aug 20, 2024</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Data Protection Officer</h4>
                  <p className="text-sm text-muted-foreground">
                    Email: dpo@stich.com<br />
                    Phone: +1 (555) 123-4567<br />
                    Address: 123 Privacy Street, Data City, DC 12345
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">EU Representative</h4>
                  <p className="text-sm text-muted-foreground">
                    Email: eu-rep@stich.com<br />
                    Address: 456 GDPR Avenue, Brussels, Belgium 1000
                  </p>
                </div>
                
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Privacy Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}