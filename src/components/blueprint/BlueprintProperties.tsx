import { useState } from 'react';
import { 
  Settings,
  Code,
  Database,
  Server,
  Globe,
  Layers,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BlueprintNode, BlueprintConnection } from './BlueprintCanvas';

interface BlueprintPropertiesProps {
  selectedNode: BlueprintNode | null;
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  onNodeUpdate: (id: string, updates: Partial<BlueprintNode>) => void;
  onConnectionAdd: (connection: Omit<BlueprintConnection, 'id'>) => void;
  onConnectionDelete: (id: string) => void;
  className?: string;
}

const nodeTypeOptions = [
  { value: 'frontend', label: 'Frontend', icon: Globe },
  { value: 'backend', label: 'Backend', icon: Server },
  { value: 'database', label: 'Database', icon: Database },
  { value: 'api', label: 'API', icon: Globe },
  { value: 'service', label: 'Service', icon: Settings },
  { value: 'component', label: 'Component', icon: Layers },
  { value: 'custom', label: 'Custom', icon: Code }
];

const connectionTypeOptions = [
  { value: 'api', label: 'API Call', color: 'bg-blue-500' },
  { value: 'data', label: 'Data Flow', color: 'bg-green-500' },
  { value: 'dependency', label: 'Dependency', color: 'bg-orange-500' },
  { value: 'communication', label: 'Communication', color: 'bg-purple-500' }
];

const commonTechnologies = {
  frontend: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Vite', 'TypeScript'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'Ruby', 'Express', 'FastAPI'],
  database: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'SQLite', 'Firestore', 'DynamoDB'],
  api: ['REST', 'GraphQL', 'gRPC', 'WebSocket', 'OpenAPI', 'Swagger'],
  service: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Vercel', 'Netlify'],
  component: ['UI Library', 'Chart.js', 'D3.js', 'Three.js', 'Material-UI', 'Tailwind'],
  custom: []
};

export function BlueprintProperties({
  selectedNode,
  nodes,
  connections,
  onNodeUpdate,
  onConnectionAdd,
  onConnectionDelete,
  className
}: BlueprintPropertiesProps) {
  const [newTech, setNewTech] = useState('');
  const [newConnection, setNewConnection] = useState({
    targetId: '',
    type: 'api' as BlueprintConnection['type'],
    label: ''
  });

  if (!selectedNode) {
    return (
      <div className={cn('w-80 border-l bg-muted/30 p-4 flex items-center justify-center', className)}>
        <div className="text-center text-muted-foreground">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a component to edit properties</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<BlueprintNode>) => {
    onNodeUpdate(selectedNode.id, updates);
  };

  const handleAddTechnology = () => {
    if (!newTech.trim()) return;
    
    const currentTechs = selectedNode.technologies || [];
    if (!currentTechs.includes(newTech.trim())) {
      handleUpdate({
        technologies: [...currentTechs, newTech.trim()]
      });
    }
    setNewTech('');
  };

  const handleRemoveTechnology = (tech: string) => {
    const currentTechs = selectedNode.technologies || [];
    handleUpdate({
      technologies: currentTechs.filter(t => t !== tech)
    });
  };

  const handleAddConnection = () => {
    if (!newConnection.targetId) return;
    
    const connectionData: Omit<BlueprintConnection, 'id'> = {
      sourceId: selectedNode.id,
      targetId: newConnection.targetId,
      type: newConnection.type
    };
    
    if (newConnection.label.trim()) {
      connectionData.label = newConnection.label.trim();
    }
    
    onConnectionAdd(connectionData);
    
    setNewConnection({
      targetId: '',
      type: 'api',
      label: ''
    });
  };

  const nodeConnections = connections.filter(
    conn => conn.sourceId === selectedNode.id || conn.targetId === selectedNode.id
  );

  const availableTargets = nodes.filter(node => 
    node.id !== selectedNode.id && 
    !connections.some(conn => 
      conn.sourceId === selectedNode.id && conn.targetId === node.id
    )
  );

  return (
    <div className={cn('w-80 border-l bg-muted/30 flex flex-col', className)}>
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Component Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full mx-4 mt-4">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="connections" className="flex-1">Connections</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-4 space-y-4">
            {/* Basic Properties */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="node-title">Title</Label>
                <Input
                  id="node-title"
                  value={selectedNode.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  placeholder="Component title"
                />
              </div>

              <div>
                <Label htmlFor="node-type">Type</Label>
                <Select
                  value={selectedNode.type}
                  onValueChange={(value) => handleUpdate({ type: value as BlueprintNode['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTypeOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="node-description">Description</Label>
                <Textarea
                  id="node-description"
                  value={selectedNode.description || ''}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  placeholder="Component description"
                  rows={3}
                />
              </div>
            </div>

            {/* Technologies */}
            <div>
              <Label>Technologies</Label>
              <div className="space-y-2">
                {/* Current Technologies */}
                <div className="flex flex-wrap gap-1">
                  {selectedNode.technologies?.map((tech, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {tech}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTechnology(tech)}
                        className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* Add Technology */}
                <div className="flex gap-2">
                  <Input
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="Add technology"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTechnology()}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTechnology}
                    disabled={!newTech.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Suggested Technologies */}
                {commonTechnologies[selectedNode.type]?.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Suggestions</Label>
                    <div className="flex flex-wrap gap-1">
                      {commonTechnologies[selectedNode.type]
                        .filter(tech => !selectedNode.technologies?.includes(tech))
                        .slice(0, 6)
                        .map(tech => (
                          <Button
                            key={tech}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentTechs = selectedNode.technologies || [];
                              handleUpdate({
                                technologies: [...currentTechs, tech]
                              });
                            }}
                            className="h-6 text-xs"
                          >
                            {tech}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Position and Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X Position</Label>
                <Input
                  type="number"
                  value={selectedNode.position.x}
                  onChange={(e) => handleUpdate({
                    position: { ...selectedNode.position, x: parseInt(e.target.value) || 0 }
                  })}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Y Position</Label>
                <Input
                  type="number"
                  value={selectedNode.position.y}
                  onChange={(e) => handleUpdate({
                    position: { ...selectedNode.position, y: parseInt(e.target.value) || 0 }
                  })}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Width</Label>
                <Input
                  type="number"
                  value={selectedNode.size.width}
                  onChange={(e) => handleUpdate({
                    size: { ...selectedNode.size, width: parseInt(e.target.value) || 150 }
                  })}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Height</Label>
                <Input
                  type="number"
                  value={selectedNode.size.height}
                  onChange={(e) => handleUpdate({
                    size: { ...selectedNode.size, height: parseInt(e.target.value) || 100 }
                  })}
                  className="text-xs"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="p-4 space-y-4">
            {/* Existing Connections */}
            <div>
              <Label>Current Connections</Label>
              {nodeConnections.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {nodeConnections.map(connection => {
                    const isOutgoing = connection.sourceId === selectedNode.id;
                    const otherNode = nodes.find(n => 
                      n.id === (isOutgoing ? connection.targetId : connection.sourceId)
                    );
                    const connectionType = connectionTypeOptions.find(t => t.value === connection.type);
                    
                    return (
                      <Card key={connection.id} className="p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', connectionType?.color)} />
                            <span className="text-sm">
                              {isOutgoing ? '→' : '←'} {otherNode?.title || 'Unknown'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConnectionDelete(connection.id)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {connection.label && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {connection.label}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  No connections yet
                </p>
              )}
            </div>

            {/* Add New Connection */}
            {availableTargets.length > 0 && (
              <div>
                <Label>Add Connection</Label>
                <div className="space-y-2 mt-2">
                  <Select
                    value={newConnection.targetId}
                    onValueChange={(value) => setNewConnection(prev => ({ ...prev, targetId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target component" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargets.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={newConnection.type}
                    onValueChange={(value) => setNewConnection(prev => ({ 
                      ...prev, 
                      type: value as BlueprintConnection['type'] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {connectionTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={newConnection.label}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Connection label (optional)"
                  />

                  <Button
                    onClick={handleAddConnection}
                    disabled={!newConnection.targetId}
                    className="w-full"
                  >
                    Add Connection
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}