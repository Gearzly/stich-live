import { useState, useCallback } from 'react';
import { 
  Sparkles, 
  Wand2, 
  FileText, 
  Code, 
  Download,
  Share,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BlueprintEditor, type Blueprint, blueprintUtils } from './BlueprintEditor';

interface BlueprintIntegrationProps {
  onBlueprintGenerate?: (blueprint: Blueprint) => void;
  onCodeGenerate?: (blueprint: Blueprint) => void;
  onBlueprintShare?: (blueprint: Blueprint) => void;
  currentBlueprint?: Blueprint;
  className?: string;
}

export function BlueprintIntegration({
  onBlueprintGenerate,
  onCodeGenerate,
  onBlueprintShare,
  currentBlueprint,
  className
}: BlueprintIntegrationProps) {
  const [blueprint, setBlueprint] = useState<Blueprint | undefined>(currentBlueprint);
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('design');

  const handleAIGenerate = useCallback(async () => {
    if (!aiDescription.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI generation - in real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedBlueprint = blueprintUtils.generateFromDescription(aiDescription);
      const newBlueprint: Blueprint = {
        id: Math.random().toString(36).substring(2, 9),
        title: generatedBlueprint.title || 'AI Generated Blueprint',
        description: generatedBlueprint.description || aiDescription,
        nodes: generatedBlueprint.nodes || [
          {
            id: 'frontend-1',
            type: 'frontend',
            title: 'React Frontend',
            description: 'Modern React application with TypeScript',
            position: { x: 100, y: 100 },
            size: { width: 150, height: 100 },
            technologies: ['React', 'TypeScript', 'Vite']
          },
          {
            id: 'backend-1',
            type: 'backend',
            title: 'Node.js API',
            description: 'RESTful API with Express.js',
            position: { x: 400, y: 100 },
            size: { width: 150, height: 100 },
            technologies: ['Node.js', 'Express', 'TypeScript']
          },
          {
            id: 'database-1',
            type: 'database',
            title: 'PostgreSQL',
            description: 'Relational database for data storage',
            position: { x: 400, y: 250 },
            size: { width: 150, height: 100 },
            technologies: ['PostgreSQL', 'Prisma']
          }
        ],
        connections: generatedBlueprint.connections || [
          {
            id: 'conn-1',
            sourceId: 'frontend-1',
            targetId: 'backend-1',
            type: 'api',
            label: 'HTTP Requests'
          },
          {
            id: 'conn-2',
            sourceId: 'backend-1',
            targetId: 'database-1',
            type: 'data',
            label: 'Database Queries'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };
      
      setBlueprint(newBlueprint);
      setActiveTab('design');
      onBlueprintGenerate?.(newBlueprint);
      
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [aiDescription, onBlueprintGenerate]);

  const handleBlueprintSave = useCallback((updatedBlueprint: Blueprint) => {
    setBlueprint(updatedBlueprint);
  }, []);

  const handleBlueprintExport = useCallback((blueprintToExport: Blueprint) => {
    const markdown = blueprintUtils.exportToMarkdown(blueprintToExport);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprintToExport.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleGenerateCode = useCallback(() => {
    if (!blueprint) return;
    onCodeGenerate?.(blueprint);
  }, [blueprint, onCodeGenerate]);

  const handleShareBlueprint = useCallback(() => {
    if (!blueprint) return;
    onBlueprintShare?.(blueprint);
  }, [blueprint, onBlueprintShare]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-muted/30 px-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="generate" className="h-full m-0 p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                  <Wand2 className="w-6 h-6" />
                  AI Blueprint Generator
                </h2>
                <p className="text-muted-foreground">
                  Describe your application and let AI create a visual blueprint for you
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-description">
                      Describe the application you want to build
                    </Label>
                    <Textarea
                      id="ai-description"
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="Example: Build a social media platform with user authentication, posts, comments, real-time notifications, and image uploads. Use React for frontend, Node.js for backend, and MongoDB for database..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      🎯 Be specific about features
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      🛠️ Mention preferred technologies
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      📊 Include data requirements
                    </Badge>
                  </div>

                  <Button
                    onClick={handleAIGenerate}
                    disabled={!aiDescription.trim() || isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating Blueprint...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Blueprint
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {blueprint && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Generated Blueprint: {blueprint.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {blueprint.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span>{blueprint.nodes.length} components</span>
                        <span>{blueprint.connections.length} connections</span>
                        <span>Version {blueprint.version}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('design')}
                        >
                          <Layers className="w-4 h-4 mr-2" />
                          View & Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateCode}
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Generate Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="design" className="h-full m-0">
            {blueprint ? (
              <BlueprintEditor
                blueprint={blueprint}
                onSave={handleBlueprintSave}
                onExport={handleBlueprintExport}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Blueprint Yet</h3>
                  <p className="text-sm mb-4">
                    Generate a blueprint with AI or create one manually
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('generate')}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start with AI
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="h-full m-0 p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                  <FileText className="w-6 h-6" />
                  Export & Share
                </h2>
                <p className="text-muted-foreground">
                  Export your blueprint or share it with others
                </p>
              </div>

              {blueprint ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{blueprint.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold">{blueprint.nodes.length}</div>
                            <div className="text-sm text-muted-foreground">Components</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{blueprint.connections.length}</div>
                            <div className="text-sm text-muted-foreground">Connections</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">v{blueprint.version}</div>
                            <div className="text-sm text-muted-foreground">Version</div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleBlueprintExport(blueprint)}
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Markdown
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={handleShareBlueprint}
                            className="w-full"
                          >
                            <Share className="w-4 h-4 mr-2" />
                            Share Blueprint
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={handleGenerateCode}
                            className="w-full"
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Generate Code from Blueprint
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Blueprint to Export</h3>
                  <p className="text-sm">
                    Create a blueprint first to export and share it
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}