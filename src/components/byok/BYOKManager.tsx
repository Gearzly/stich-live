import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  Activity,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { APIKey, AIProvider } from './types';
import { PROVIDER_CONFIGS, validateAPIKeyFormat, getKeyPreview, generateKeyId } from './config';

interface BYOKManagerProps {
  className?: string;
  onKeyChange?: (keys: APIKey[]) => void;
}

const BYOKManager: React.FC<BYOKManagerProps> = ({
  className,
  onKeyChange
}) => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validatingKeys, setValidatingKeys] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('stich_api_keys');
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys).map((key: any) => ({
          ...key,
          createdAt: new Date(key.createdAt),
          lastUsed: key.lastUsed ? new Date(key.lastUsed) : undefined,
          validatedAt: key.validatedAt ? new Date(key.validatedAt) : undefined
        }));
        setApiKeys(keys);
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    }
  }, []);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('stich_api_keys', JSON.stringify(apiKeys));
    onKeyChange?.(apiKeys);
  }, [apiKeys, onKeyChange]);

  const handleAddKey = async () => {
    // Validate form
    if (!keyName.trim()) {
      setErrors({ name: 'Key name is required' });
      return;
    }
    if (!keyValue.trim()) {
      setErrors({ key: 'API key is required' });
      return;
    }
    if (!validateAPIKeyFormat(selectedProvider, keyValue)) {
      setErrors({ key: 'Invalid API key format for this provider' });
      return;
    }

    // Check for duplicate names
    if (apiKeys.some(key => key.name.toLowerCase() === keyName.toLowerCase())) {
      setErrors({ name: 'A key with this name already exists' });
      return;
    }

    setErrors({});

    const newKey: APIKey = {
      id: generateKeyId(),
      provider: selectedProvider,
      name: keyName.trim(),
      keyPreview: getKeyPreview(keyValue),
      isActive: true,
      createdAt: new Date(),
      usageCount: 0,
      isValid: false // Will be validated
    };

    setApiKeys(prev => [...prev, newKey]);

    // Validate the key
    await validateKey(newKey.id, keyValue);

    // Reset form
    setKeyName('');
    setKeyValue('');
    setShowAddModal(false);
  };

  const validateKey = async (keyId: string, _key: string) => {
    setValidatingKeys(prev => new Set([...prev, keyId]));

    try {
      // Mock validation - in real app, this would call the provider's API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate validation result
      const isValid = Math.random() > 0.3; // 70% success rate for demo
      
      setApiKeys(prev => prev.map(apiKey => 
        apiKey.id === keyId 
          ? {
              ...apiKey,
              isValid,
              validatedAt: new Date(),
              ...(isValid ? {} : { errorMessage: 'Invalid API key or insufficient permissions' })
            }
          : apiKey
      ));
    } catch (error) {
      setApiKeys(prev => prev.map(apiKey => 
        apiKey.id === keyId 
          ? {
              ...apiKey,
              isValid: false,
              validatedAt: new Date(),
              errorMessage: 'Failed to validate key'
            }
          : apiKey
      ));
    } finally {
      setValidatingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const handleToggleKey = (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, isActive: !key.isActive } : key
    ));
  };

  const getProviderIcon = (provider: AIProvider) => {
    return PROVIDER_CONFIGS[provider].icon;
  };

  const getStatusBadge = (key: APIKey) => {
    if (validatingKeys.has(key.id)) {
      return <Badge variant="secondary">Validating...</Badge>;
    }
    if (!key.isValid && key.validatedAt) {
      return <Badge variant="destructive">Invalid</Badge>;
    }
    if (key.isValid && !key.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (key.isValid && key.isActive) {
      return <Badge variant="default" className="bg-green-600">Active</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const activeKeys = apiKeys.filter(key => key.isActive && key.isValid);
  const totalKeys = apiKeys.length;
  const validKeys = apiKeys.filter(key => key.isValid).length;

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
            <Badge variant="outline" className="ml-2">
              {activeKeys.length} Active
            </Badge>
          </CardTitle>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Key
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalKeys}</div>
            <div className="text-sm text-muted-foreground">Total Keys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{validKeys}</div>
            <div className="text-sm text-muted-foreground">Valid Keys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeKeys.length}</div>
            <div className="text-sm text-muted-foreground">Active Keys</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="keys" className="h-full flex flex-col">
          <TabsList className="mx-4 mb-2">
            <TabsTrigger value="keys" className="flex items-center gap-1">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="flex-1 mx-4 mb-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <Card key={key.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getProviderIcon(key.provider)}</span>
                          <div>
                            <h3 className="font-medium">{key.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {PROVIDER_CONFIGS[key.provider].name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(key)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleKey(key.id)}
                            disabled={!key.isValid}
                          >
                            {key.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Key Preview:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {key.keyPreview}
                          </code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Created:</span>
                          <span>{key.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Usage Count:</span>
                          <span>{key.usageCount}</span>
                        </div>
                        {key.errorMessage && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                            <AlertTriangle className="h-4 w-4" />
                            {key.errorMessage}
                          </div>
                        )}
                        {validatingKeys.has(key.id) && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Validating API key...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {apiKeys.length === 0 && (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No API Keys</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first API key to start using AI providers
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add API Key
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="providers" className="flex-1 mx-4 mb-4">
            <ScrollArea className="h-[500px]">
              <div className="grid gap-4">
                {Object.values(PROVIDER_CONFIGS).map((config) => (
                  <Card key={config.provider} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium">{config.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={config.websiteUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={config.apiDocsUrl} target="_blank" rel="noopener noreferrer">
                              Docs
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant={
                            apiKeys.some(k => k.provider === config.provider && k.isValid && k.isActive)
                              ? "default" 
                              : "secondary"
                          }>
                            {apiKeys.some(k => k.provider === config.provider && k.isValid && k.isActive)
                              ? "Connected" 
                              : "Not Connected"
                            }
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Key Format:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {config.keyExample}
                          </code>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Supported Models:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {config.supportedModels.slice(0, 3).map((model) => (
                              <Badge key={model} variant="outline" className="text-xs">
                                {model}
                              </Badge>
                            ))}
                            {config.supportedModels.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{config.supportedModels.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="usage" className="flex-1 mx-4 mb-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.values(PROVIDER_CONFIGS).map((config) => {
                        const providerKeys = apiKeys.filter(k => k.provider === config.provider);
                        const totalUsage = providerKeys.reduce((sum, k) => sum + k.usageCount, 0);
                        const maxUsage = Math.max(...apiKeys.map(k => k.usageCount), 1);
                        
                        return (
                          <div key={config.provider} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{config.icon}</span>
                                <span className="text-sm font-medium">{config.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {totalUsage} requests
                              </span>
                            </div>
                            <Progress 
                              value={(totalUsage / maxUsage) * 100} 
                              className="h-2"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {apiKeys
                        .filter(k => k.lastUsed)
                        .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
                        .slice(0, 5)
                        .map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <span>{getProviderIcon(key.provider)}</span>
                              <span className="text-sm font-medium">{key.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {key.lastUsed?.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      {apiKeys.filter(k => k.lastUsed).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {Object.values(PROVIDER_CONFIGS).map((config) => (
                    <option key={config.provider} value={config.provider}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My OpenAI Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key">API Key</Label>
                <div className="relative">
                  <Input
                    id="key"
                    type={showKey ? 'text' : 'password'}
                    placeholder={PROVIDER_CONFIGS[selectedProvider].keyExample}
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.key && (
                  <p className="text-sm text-red-600">{errors.key}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: {PROVIDER_CONFIGS[selectedProvider].keyExample}
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddKey}>
                  Add Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default BYOKManager;