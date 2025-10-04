import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Trash2,
  Plus,
  Download,
  Camera,
  Star,
  Crown,
  Zap,
  BarChart,
  Target,
  TrendingUp,
  Eye,
  AlertCircle,
  CreditCard,
  Key,
  Bell,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { UserService, type UserProfile } from '../services/user/UserService';
import { ApplicationService } from '../services/application/ApplicationService';
import { toast } from '../lib/toast';

interface ProfileSection {
  id: string;
  title: string;
  icon: React.ElementType;
  component: React.ReactNode;
}

interface UsageStats {
  totalApps: number;
  activeApps: number;
  totalViews: number;
  apiCalls: number;
  storageUsed: number;
  storageLimit: number;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

const Profile: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalApps: 0,
    activeApps: 0,
    totalViews: 0,
    apiCalls: 0,
    storageUsed: 0,
    storageLimit: 5000 // 5GB default
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    company: '',
    jobTitle: ''
  });
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    pushNotifications: true,
    weeklyReports: false,
    securityAlerts: true,
    productUpdates: true
  });
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 24,
    passwordLastChanged: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);

  const userService = new UserService();
  const applicationService = new ApplicationService();

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load user profile
      const userProfile = await userService.getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName || user.displayName || '',
          email: userProfile.email || user.email || '',
          phone: userProfile.phone || '',
          location: userProfile.location || '',
          bio: userProfile.bio || '',
          website: userProfile.website || '',
          github: userProfile.socialLinks?.github || '',
          twitter: userProfile.socialLinks?.twitter || '',
          linkedin: userProfile.socialLinks?.linkedin || '',
          company: userProfile.company || '',
          jobTitle: userProfile.jobTitle || ''
        });
      }

      // Load usage statistics
      const apps = await applicationService.getUserApplications(user.uid);
      const activeApps = apps.filter(app => app.status === 'deployed').length;
      const totalViews = apps.reduce((sum, app) => sum + (app.analytics?.views || 0), 0);

      setUsageStats(prev => ({
        ...prev,
        totalApps: apps.length,
        activeApps,
        totalViews,
        apiCalls: Math.floor(Math.random() * 10000), // Simulated
        storageUsed: Math.floor(Math.random() * 2000) // Simulated
      }));

      // Load API keys (simulated)
      setApiKeys([
        {
          id: '1',
          name: 'Production Key',
          key: 'sk_prod_' + Math.random().toString(36).substr(2, 24),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        {
          id: '2',
          name: 'Development Key',
          key: 'sk_dev_' + Math.random().toString(36).substr(2, 24),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ]);

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const updatedProfile = {
        displayName: formData.displayName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        website: formData.website,
        company: formData.company,
        jobTitle: formData.jobTitle,
        socialLinks: {
          github: formData.github,
          twitter: formData.twitter,
          linkedin: formData.linkedin
        }
      };

      await userService.updateUserProfile(user.uid, updatedProfile);
      
      // Update Firebase Auth profile
      if (formData.displayName !== user.displayName) {
        await updateUserProfile({ displayName: formData.displayName });
      }

      setIsEditing(false);
      toast.success('Profile updated successfully!');
      await loadProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const generateApiKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: `API Key ${apiKeys.length + 1}`,
      key: 'sk_' + Math.random().toString(36).substr(2, 32),
      createdAt: new Date(),
      isActive: true
    };
    setApiKeys(prev => [...prev, newKey]);
    toast.success('New API key generated successfully!');
  };

  const revokeApiKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
    toast.success('API key revoked successfully!');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSubscriptionBadge = () => {
    const subscription = profile?.subscription || 'free';
    switch (subscription) {
      case 'pro':
        return <Badge className="bg-blue-100 text-blue-800"><Crown className="w-3 h-3 mr-1" />Pro</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800"><Star className="w-3 h-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  // Section Components
  const GeneralSection = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          General Information
        </h2>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Picture */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          {isEditing && (
            <Button
              size="sm"
              className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
            >
              <Camera className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formData.displayName || 'User'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300">{formData.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {getSubscriptionBadge()}
            <Badge variant="outline" className="text-xs">
              Member since {new Date(user?.metadata?.creationTime || '').getFullYear()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleChange('company', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            disabled={!isEditing}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            value={formData.github}
            onChange={(e) => handleChange('github', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter</Label>
          <Input
            id="twitter"
            value={formData.twitter}
            onChange={(e) => handleChange('twitter', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            disabled={!isEditing}
          />
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSaveProfile}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </Card>
  );

  const UsageSection = () => (
    <div className="space-y-6">
      {/* Usage Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Usage Statistics
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {usageStats.totalApps}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Apps</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {usageStats.activeApps}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Active Apps</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {usageStats.totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Views</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {usageStats.apiCalls.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">API Calls</p>
          </div>
        </div>
      </Card>

      {/* Storage Usage */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Storage Usage
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">
              {formatBytes(usageStats.storageUsed * 1024 * 1024)} of {formatBytes(usageStats.storageLimit * 1024 * 1024)} used
            </span>
            <span className="text-sm text-slate-500">
              {Math.round((usageStats.storageUsed / usageStats.storageLimit) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((usageStats.storageUsed / usageStats.storageLimit) * 100, 100)}%` }}
            />
          </div>
          {usageStats.storageUsed / usageStats.storageLimit > 0.8 && (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Storage is almost full. Consider upgrading your plan.
            </div>
          )}
        </div>
      </Card>

      {/* Subscription Info */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Subscription Plan
          </h3>
          {getSubscriptionBadge()}
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Plan Type</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {profile?.subscription || 'Free'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Billing Cycle</span>
            <span className="text-slate-900 dark:text-slate-100">Monthly</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Next Billing</span>
            <span className="text-slate-900 dark:text-slate-100">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing History
          </Button>
          <Button className="flex-1">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </Card>
    </div>
  );

  const ApiKeysSection = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          API Keys
        </h2>
        <Button onClick={generateApiKey}>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  {apiKey.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Created {apiKey.createdAt.toLocaleDateString()}
                  {apiKey.lastUsed && (
                    <span> • Last used {apiKey.lastUsed.toLocaleDateString()}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                  {apiKey.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeApiKey(apiKey.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono">
                {apiKey.key.substring(0, 20)}...
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey.key)}
              >
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-8">
          <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No API Keys
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Generate your first API key to start integrating with our services.
          </p>
          <Button onClick={generateApiKey}>
            <Plus className="w-4 h-4 mr-2" />
            Generate API Key
          </Button>
        </div>
      )}
    </Card>
  );

  const NotificationsSection = () => (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Notification Preferences
      </h2>
      
      <div className="space-y-6">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {key === 'emailUpdates' && 'Receive email notifications about your account'}
                {key === 'pushNotifications' && 'Browser push notifications for important updates'}
                {key === 'weeklyReports' && 'Weekly summary of your app analytics'}
                {key === 'securityAlerts' && 'Security alerts and login notifications'}
                {key === 'productUpdates' && 'New features and product announcements'}
              </p>
            </div>
            <Button
              variant={value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleNotificationChange(key, !value)}
            >
              {value ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );

  const SecuritySection = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Security Settings
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant={security.twoFactorEnabled ? 'default' : 'outline'}>
              {security.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Change Password
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Last changed {security.passwordLastChanged.toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline">
              Update Password
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Session Timeout
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Automatically sign out after {security.sessionTimeout} hours of inactivity
              </p>
            </div>
            <select 
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
            >
              <option value={1}>1 hour</option>
              <option value={8}>8 hours</option>
              <option value={24}>24 hours</option>
              <option value={168}>1 week</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Account Actions
        </h3>
        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download Account Data
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );

  const sections: ProfileSection[] = [
    { id: 'general', title: 'General', icon: User, component: <GeneralSection /> },
    { id: 'usage', title: 'Usage & Billing', icon: BarChart, component: <UsageSection /> },
    { id: 'apikeys', title: 'API Keys', icon: Key, component: <ApiKeysSection /> },
    { id: 'notifications', title: 'Notifications', icon: Bell, component: <NotificationsSection /> },
    { id: 'security', title: 'Security', icon: Shield, component: <SecuritySection /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {sections.find(section => section.id === activeSection)?.component}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;