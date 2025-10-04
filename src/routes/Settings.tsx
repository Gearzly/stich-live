/**
 * Settings Page
 * Comprehensive settings and preferences interface
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Settings, 
  Palette, 
  Globe, 
  Code, 
  Brain, 
  Shield, 
  Zap, 
  User, 
  Download, 
  Upload, 
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Bell,
  BellOff
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSetting, updateSettings, resetSettings, exportSettings, importSettings, loading } = useSettings();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExportSettings = () => {
    const settingsData = exportSettings();
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stich-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Settings Exported', 'Your settings have been downloaded.');
  };

  const handleImportSettings = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      await importSettings(text);
      setImportFile(null);
    } catch (error) {
      showError('Import Failed', 'Failed to read the settings file.');
    }
  };

  const handleResetSettings = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all settings to defaults? This action cannot be undone.'
    );
    if (confirmed) {
      await resetSettings();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings & Preferences</h1>
        <p className="text-muted-foreground">
          Customize your Stich experience and manage your account preferences.
        </p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Development
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value: string) => updateSetting('theme', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value: string) => updateSetting('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select value={settings.fontSize} onValueChange={(value: string) => updateSetting('fontSize', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reducedMotion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions for better accessibility.
                  </p>
                </div>
                <Switch
                  id="reducedMotion"
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked: boolean) => updateSetting('reducedMotion', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editor Settings */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Code Editor
              </CardTitle>
              <CardDescription>
                Configure your code editing experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="editorTheme">Editor Theme</Label>
                <Select value={settings.editorTheme} onValueChange={(value: string) => updateSetting('editorTheme', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vs-light">Light</SelectItem>
                    <SelectItem value="vs-dark">Dark</SelectItem>
                    <SelectItem value="hc-black">High Contrast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editorFontSize">Font Size: {settings.editorFontSize}px</Label>
                <Slider
                  value={[settings.editorFontSize]}
                  onValueChange={([value]: number[]) => updateSetting('editorFontSize', value)}
                  min={10}
                  max={24}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editorTabSize">Tab Size: {settings.editorTabSize} spaces</Label>
                <Slider
                  value={[settings.editorTabSize]}
                  onValueChange={([value]: number[]) => updateSetting('editorTabSize', value)}
                  min={2}
                  max={8}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="editorWordWrap">Word Wrap</Label>
                  <p className="text-sm text-muted-foreground">
                    Wrap long lines in the editor.
                  </p>
                </div>
                <Switch
                  id="editorWordWrap"
                  checked={settings.editorWordWrap}
                  onCheckedChange={(checked: boolean) => updateSetting('editorWordWrap', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="editorMinimap">Minimap</Label>
                  <p className="text-sm text-muted-foreground">
                    Show minimap overview of the file.
                  </p>
                </div>
                <Switch
                  id="editorMinimap"
                  checked={settings.editorMinimap}
                  onCheckedChange={(checked: boolean) => updateSetting('editorMinimap', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Preferences
              </CardTitle>
              <CardDescription>
                Configure AI behavior and code generation preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="aiProvider">Preferred AI Provider</Label>
                <Select value={settings.preferredAIProvider} onValueChange={(value: string) => updateSetting('preferredAIProvider', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        OpenAI <Badge variant="secondary">GPT-4</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="anthropic">
                      <div className="flex items-center gap-2">
                        Anthropic <Badge variant="secondary">Claude</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="google">
                      <div className="flex items-center gap-2">
                        Google <Badge variant="secondary">Gemini</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="cerebras">
                      <div className="flex items-center gap-2">
                        Cerebras <Badge variant="secondary">Fast</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creativityLevel">Creativity Level: {Math.round(settings.creativityLevel * 100)}%</Label>
                <Slider
                  value={[settings.creativityLevel]}
                  onValueChange={([value]: number[]) => updateSetting('creativityLevel', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">
                  Higher values produce more creative but potentially less predictable results.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codeStyle">Code Style</Label>
                <Select value={settings.codeStyle} onValueChange={(value: string) => updateSetting('codeStyle', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean - Minimal comments, focus on clarity</SelectItem>
                    <SelectItem value="documented">Documented - Comprehensive comments and docs</SelectItem>
                    <SelectItem value="minimal">Minimal - Concise code, fewer abstractions</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive - Full error handling and validation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control how your data is collected and used.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve the product by sharing anonymous usage analytics.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.analytics}
                  onCheckedChange={(checked: boolean) => updateSetting('analytics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="crashReporting">Crash Reporting</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send crash reports to help fix bugs.
                  </p>
                </div>
                <Switch
                  id="crashReporting"
                  checked={settings.crashReporting}
                  onCheckedChange={(checked: boolean) => updateSetting('crashReporting', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="usageData">Usage Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Share feature usage data to improve user experience.
                  </p>
                </div>
                <Switch
                  id="usageData"
                  checked={settings.usageData}
                  onCheckedChange={(checked: boolean) => updateSetting('usageData', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and product news.
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked: boolean) => updateSetting('marketingEmails', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Settings */}
        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Development
              </CardTitle>
              <CardDescription>
                Configure development workflow and productivity features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes as you type.
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.autoSave}
                  onCheckedChange={(checked: boolean) => updateSetting('autoSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPreview">Auto Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically update preview when code changes.
                  </p>
                </div>
                <Switch
                  id="autoPreview"
                  checked={settings.autoPreview}
                  onCheckedChange={(checked: boolean) => updateSetting('autoPreview', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showLineNumbers">Line Numbers</Label>
                  <p className="text-sm text-muted-foreground">
                    Show line numbers in code editor.
                  </p>
                </div>
                <Switch
                  id="showLineNumbers"
                  checked={settings.showLineNumbers}
                  onCheckedChange={(checked: boolean) => updateSetting('showLineNumbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableLinting">Code Linting</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time code quality checks and suggestions.
                  </p>
                </div>
                <Switch
                  id="enableLinting"
                  checked={settings.enableLinting}
                  onCheckedChange={(checked: boolean) => updateSetting('enableLinting', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Preferences
              </CardTitle>
              <CardDescription>
                Manage your account settings and regional preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value: string) => updateSetting('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai (UTC+8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(value: string) => updateSetting('dateFormat', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select value={settings.timeFormat} onValueChange={(value: string) => updateSetting('timeFormat', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settings Management */}
          <Card>
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
              <CardDescription>
                Export, import, or reset your settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExportSettings} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="import-settings"
                  />
                  <Button
                    onClick={() => document.getElementById('import-settings')?.click()}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                  
                  {importFile && (
                    <Button onClick={handleImportSettings}>
                      Import Settings
                    </Button>
                  )}
                </div>
                
                <Button onClick={handleResetSettings} variant="destructive">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
              
              {importFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {importFile.name}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}