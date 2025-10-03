import { useState, useEffect } from 'react';
import { User, Mail, Lock, Globe, Shield, Bell, Trash2, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { formatError } from '@/lib/utils';

interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  website: string;
  location: string;
  joinedAt: Date;
  isEmailVerified: boolean;
}

export default function ProfilePage() {
  const { user, updateUserProfile, deleteAccount } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    photoURL: '',
    bio: '',
    website: '',
    location: '',
    joinedAt: new Date(),
    isEmailVerified: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfile({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        bio: '',
        website: '',
        location: '',
        joinedAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        isEmailVerified: user.emailVerified
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      if (profile.displayName) {
        updateData.displayName = profile.displayName;
      }
      
      if (profile.photoURL) {
        updateData.photoURL = profile.photoURL;
      }
      
      await updateUserProfile(updateData);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(formatError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteAccount();
    } catch (error) {
      setError(formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-md p-3 text-sm">
                {success}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {profile.photoURL ? (
                            <img 
                              src={profile.photoURL} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <button
                          type="button"
                          className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-medium">Profile Photo</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload a new photo or change your existing one
                        </p>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                        Display Name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Enter your display name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="flex-1 px-3 py-2 border border-input bg-muted rounded-md"
                        />
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                          profile.isEmailVerified 
                            ? 'text-green-600 bg-green-50 border-green-200'
                            : 'text-yellow-600 bg-yellow-50 border-yellow-200'
                        }`}>
                          <Mail className="w-3 h-3" />
                          {profile.isEmailVerified ? 'Verified' : 'Unverified'}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium mb-2">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        placeholder="Tell us about yourself..."
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {profile.bio?.length || 0}/160 characters
                      </p>
                    </div>

                    {/* Website */}
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium mb-2">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          id="website"
                          type="url"
                          value={profile.website}
                          onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium mb-2">
                        Location
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Account Info */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Information</h3>
                  <div className="text-sm">
                    <p>Member since {profile.joinedAt.toLocaleDateString()}</p>
                    <p className="text-muted-foreground">User ID: {user?.uid}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Password</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Change your password to keep your account secure
                      </p>
                      <Button variant="outline">Change Password</Button>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Active Sessions</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage your active sessions across devices
                      </p>
                      <Button variant="outline">View Sessions</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { id: 'push', label: 'Push Notifications', description: 'Receive push notifications in your browser' },
                      { id: 'deployment', label: 'Deployment Updates', description: 'Get notified when your apps are deployed' },
                      { id: 'security', label: 'Security Alerts', description: 'Important security notifications' }
                    ].map(notification => (
                      <div key={notification.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <h3 className="font-medium">{notification.label}</h3>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                          defaultChecked
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Profile Visibility</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Control who can see your profile information
                      </p>
                      <select className="border border-input bg-background rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="friends">Friends only</option>
                      </select>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Data Export</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download a copy of your data
                      </p>
                      <Button variant="outline">Export Data</Button>
                    </div>

                    <div className="border border-destructive/20 rounded-lg p-4">
                      <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {loading ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}