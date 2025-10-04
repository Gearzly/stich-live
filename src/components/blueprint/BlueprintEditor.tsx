import { useState, useCallback, useMemo } from 'react';
import { 
  Save,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BlueprintCanvas, type BlueprintNode, type BlueprintConnection } from './BlueprintCanvas';
import { BlueprintProperties } from './BlueprintProperties';

export interface Blueprint {
  id: string;
  title: string;
  description?: string;
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface BlueprintEditorProps {
  blueprint?: Blueprint;
  onSave?: (blueprint: Blueprint) => void;
  onExport?: (blueprint: Blueprint) => void;
  readOnly?: boolean;
  className?: string;
}

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export function BlueprintEditor({
  blueprint,
  onSave,
  onExport,
  readOnly = false,
  className
}: BlueprintEditorProps) {
  const [currentBlueprint, setCurrentBlueprint] = useState<Blueprint>(() => 
    blueprint || {
      id: generateId(),
      title: 'New Blueprint',
      description: '',
      nodes: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(currentBlueprint.title);

  // Update blueprint with new changes
  const updateBlueprint = useCallback((updates: Partial<Blueprint>) => {
    setCurrentBlueprint(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
      version: prev.version + 1
    }));
  }, []);

  // Node management functions
  const handleNodeAdd = useCallback((nodeData: Omit<BlueprintNode, 'id'>) => {
    const newNode: BlueprintNode = {
      ...nodeData,
      id: generateId()
    };
    
    updateBlueprint({
      nodes: [...currentBlueprint.nodes, newNode]
    });
  }, [currentBlueprint.nodes, updateBlueprint]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<BlueprintNode>) => {
    updateBlueprint({
      nodes: currentBlueprint.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    });
  }, [currentBlueprint.nodes, updateBlueprint]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    // Remove the node and all its connections
    updateBlueprint({
      nodes: currentBlueprint.nodes.filter(node => node.id !== nodeId),
      connections: currentBlueprint.connections.filter(
        conn => conn.sourceId !== nodeId && conn.targetId !== nodeId
      )
    });
    
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [currentBlueprint.nodes, currentBlueprint.connections, selectedNodeId, updateBlueprint]);

  // Connection management functions
  const handleConnectionAdd = useCallback((connectionData: Omit<BlueprintConnection, 'id'>) => {
    const newConnection: BlueprintConnection = {
      ...connectionData,
      id: generateId()
    };
    
    updateBlueprint({
      connections: [...currentBlueprint.connections, newConnection]
    });
  }, [currentBlueprint.connections, updateBlueprint]);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    updateBlueprint({
      connections: currentBlueprint.connections.filter(conn => conn.id !== connectionId)
    });
  }, [currentBlueprint.connections, updateBlueprint]);

  const handleNodeSelect = useCallback((node: BlueprintNode | null) => {
    setSelectedNodeId(node?.id || null);
  }, []);

  const selectedNode = useMemo(() => 
    currentBlueprint.nodes.find(node => node.id === selectedNodeId) || null
  , [currentBlueprint.nodes, selectedNodeId]);

  const handleSave = () => {
    onSave?.(currentBlueprint);
  };

  const handleExport = () => {
    onExport?.(currentBlueprint);
  };

  const handleTitleSave = () => {
    updateBlueprint({ title: editTitle });
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(currentBlueprint.title);
      setIsEditing(false);
    }
  };

  const stats = useMemo(() => {
    const nodesByType = currentBlueprint.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNodes: currentBlueprint.nodes.length,
      totalConnections: currentBlueprint.connections.length,
      nodesByType
    };
  }, [currentBlueprint.nodes, currentBlueprint.connections]);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyPress}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              <h1 
                className="text-lg font-semibold cursor-pointer hover:text-primary"
                onClick={() => !readOnly && setIsEditing(true)}
              >
                {currentBlueprint.title}
              </h1>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {stats.totalNodes} components, {stats.totalConnections} connections
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!onSave}
                title="Save Blueprint"
              >
                <Save className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-border" />
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!onExport}
            title="Export Blueprint"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProperties(!showProperties)}
            title={showProperties ? 'Hide Properties Panel' : 'Show Properties Panel'}
          >
            {showProperties ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1">
          <BlueprintCanvas
            nodes={currentBlueprint.nodes}
            connections={currentBlueprint.connections}
            onNodeAdd={handleNodeAdd}
            onNodeUpdate={handleNodeUpdate}
            onNodeDelete={handleNodeDelete}
            onConnectionAdd={handleConnectionAdd}
            onConnectionDelete={handleConnectionDelete}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
            readOnly={readOnly}
          />
        </div>

        {/* Properties Panel */}
        {showProperties && (
          <BlueprintProperties
            selectedNode={selectedNode}
            nodes={currentBlueprint.nodes}
            connections={currentBlueprint.connections}
            onNodeUpdate={handleNodeUpdate}
            onConnectionAdd={handleConnectionAdd}
            onConnectionDelete={handleConnectionDelete}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Version {currentBlueprint.version}</span>
          <span>Updated {currentBlueprint.updatedAt.toLocaleTimeString()}</span>
        </div>
        
        <div className="flex items-center gap-4">
          {Object.entries(stats.nodesByType).map(([type, count]) => (
            <span key={type} className="capitalize">
              {count} {type}{count !== 1 ? 's' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export utility functions for blueprint operations
export const blueprintUtils = {
  // Generate blueprint from text description
  generateFromDescription: (description: string): Partial<Blueprint> => {
    // This would integrate with AI to generate blueprint structure
    // For now, return empty blueprint
    return {
      title: 'AI Generated Blueprint',
      description,
      nodes: [],
      connections: []
    };
  },

  // Export blueprint to various formats
  exportToJSON: (blueprint: Blueprint): string => {
    return JSON.stringify(blueprint, null, 2);
  },

  exportToMarkdown: (blueprint: Blueprint): string => {
    let markdown = `# ${blueprint.title}\n\n`;
    
    if (blueprint.description) {
      markdown += `${blueprint.description}\n\n`;
    }

    markdown += `## Components (${blueprint.nodes.length})\n\n`;
    blueprint.nodes.forEach(node => {
      markdown += `### ${node.title}\n`;
      markdown += `- **Type**: ${node.type}\n`;
      if (node.description) {
        markdown += `- **Description**: ${node.description}\n`;
      }
      if (node.technologies?.length) {
        markdown += `- **Technologies**: ${node.technologies.join(', ')}\n`;
      }
      markdown += '\n';
    });

    if (blueprint.connections.length > 0) {
      markdown += `## Connections (${blueprint.connections.length})\n\n`;
      blueprint.connections.forEach(conn => {
        const source = blueprint.nodes.find(n => n.id === conn.sourceId);
        const target = blueprint.nodes.find(n => n.id === conn.targetId);
        markdown += `- **${source?.title}** → **${target?.title}** (${conn.type})`;
        if (conn.label) {
          markdown += ` - ${conn.label}`;
        }
        markdown += '\n';
      });
    }

    return markdown;
  },

  // Import blueprint from JSON
  importFromJSON: (jsonString: string): Blueprint => {
    return JSON.parse(jsonString);
  }
};