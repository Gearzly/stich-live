import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Layers,
  Database,
  Globe,
  Server,
  Cloud,
  Monitor,
  Package,
  Settings,
  Edit3,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface BlueprintNode {
  id: string;
  type: 'frontend' | 'backend' | 'database' | 'api' | 'service' | 'component' | 'custom';
  title: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: string;
  connections?: string[]; // IDs of connected nodes
  technologies?: string[];
  properties?: Record<string, any>;
}

export interface BlueprintConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'api' | 'data' | 'dependency' | 'communication';
  label?: string;
}

interface BlueprintCanvasProps {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  onNodeAdd: (node: Omit<BlueprintNode, 'id'>) => void;
  onNodeUpdate: (id: string, updates: Partial<BlueprintNode>) => void;
  onNodeDelete: (id: string) => void;
  onConnectionAdd: (connection: Omit<BlueprintConnection, 'id'>) => void;
  onConnectionDelete: (id: string) => void;
  onNodeSelect?: (node: BlueprintNode | null) => void;
  selectedNodeId?: string | null;
  readOnly?: boolean;
  className?: string;
}

const nodeTypeConfig = {
  frontend: { 
    icon: Monitor, 
    color: 'bg-blue-500', 
    label: 'Frontend' 
  },
  backend: { 
    icon: Server, 
    color: 'bg-green-500', 
    label: 'Backend' 
  },
  database: { 
    icon: Database, 
    color: 'bg-purple-500', 
    label: 'Database' 
  },
  api: { 
    icon: Globe, 
    color: 'bg-orange-500', 
    label: 'API' 
  },
  service: { 
    icon: Cloud, 
    color: 'bg-cyan-500', 
    label: 'Service' 
  },
  component: { 
    icon: Package, 
    color: 'bg-yellow-500', 
    label: 'Component' 
  },
  custom: { 
    icon: Settings, 
    color: 'bg-gray-500', 
    label: 'Custom' 
  }
};

interface CanvasNodeProps {
  node: BlueprintNode;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BlueprintNode>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

function CanvasNode({ 
  node, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  readOnly = false 
}: CanvasNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const config = nodeTypeConfig[node.type];
  const Icon = config.icon;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || isEditing) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
    onSelect();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    onUpdate({
      position: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
    });
  }, [isDragging, dragStart, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSaveEdit = () => {
    onUpdate({ title: editTitle });
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(node.title);
      setIsEditing(false);
    }
  };

  return (
    <Card
      className={cn(
        'absolute cursor-move select-none transition-all duration-200',
        isSelected && 'ring-2 ring-primary shadow-lg',
        isDragging && 'opacity-80 scale-105',
        'group hover:shadow-md'
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        backgroundColor: node.color
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-3 h-full flex flex-col">
        {/* Node Header */}
        <div className="flex items-center justify-between mb-2">
          <div className={cn('p-1 rounded', config.color)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          
          {!readOnly && (
            <div className="hidden group-hover:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Node Title */}
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            className="text-sm font-medium mb-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h4 className="text-sm font-medium mb-1 truncate">
            {node.title}
          </h4>
        )}

        {/* Node Description */}
        {node.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {node.description}
          </p>
        )}

        {/* Technologies */}
        {node.technologies && node.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {node.technologies.slice(0, 3).map((tech, index) => (
              <span
                key={index}
                className="text-xs px-1 py-0.5 bg-background/50 rounded"
              >
                {tech}
              </span>
            ))}
            {node.technologies.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{node.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function BlueprintCanvas({
  nodes,
  connections,
  onNodeAdd,
  onNodeUpdate,
  onNodeDelete,
  onNodeSelect,
  selectedNodeId,
  readOnly = false,
  className
}: BlueprintCanvasProps) {
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [draggedNodeType, setDraggedNodeType] = useState<BlueprintNode['type'] | null>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect?.(null);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || readOnly) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 75; // Center the node
    const y = e.clientY - rect.top - 50;

    const newNode: Omit<BlueprintNode, 'id'> = {
      type: draggedNodeType,
      title: `New ${nodeTypeConfig[draggedNodeType].label}`,
      position: { x, y },
      size: { width: 150, height: 100 },
      technologies: []
    };

    onNodeAdd(newNode);
    setDraggedNodeType(null);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Render connections between nodes
  const connectionElements = useMemo(() => {
    return connections.map(connection => {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (!sourceNode || !targetNode) return null;

      const sourceCenter = {
        x: sourceNode.position.x + sourceNode.size.width / 2,
        y: sourceNode.position.y + sourceNode.size.height / 2
      };
      
      const targetCenter = {
        x: targetNode.position.x + targetNode.size.width / 2,
        y: targetNode.position.y + targetNode.size.height / 2
      };

      return (
        <svg
          key={connection.id}
          className="absolute inset-0 pointer-events-none"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          <defs>
            <marker
              id={`arrowhead-${connection.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
          <line
            x1={sourceCenter.x}
            y1={sourceCenter.y}
            x2={targetCenter.x}
            y2={targetCenter.y}
            stroke="#6b7280"
            strokeWidth="2"
            markerEnd={`url(#arrowhead-${connection.id})`}
          />
          {connection.label && (
            <text
              x={(sourceCenter.x + targetCenter.x) / 2}
              y={(sourceCenter.y + targetCenter.y) / 2}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {connection.label}
            </text>
          )}
        </svg>
      );
    });
  }, [connections, nodes, canvasSize]);

  return (
    <div className={cn('flex h-full bg-background', className)}>
      {/* Node Palette */}
      {!readOnly && (
        <div className="w-48 border-r bg-muted/30 p-3 overflow-y-auto">
          <h3 className="font-medium text-sm mb-3">Components</h3>
          <div className="space-y-2">
            {Object.entries(nodeTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={() => setDraggedNodeType(type as BlueprintNode['type'])}
                  className="flex items-center gap-2 p-2 rounded cursor-move hover:bg-accent transition-colors"
                >
                  <div className={cn('p-1 rounded', config.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="w-full h-full relative bg-grid-pattern"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0),
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)
            `,
            backgroundSize: '20px 20px, 60px 60px'
          }}
          onClick={handleCanvasClick}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {/* Render connections */}
          {connectionElements}

          {/* Render nodes */}
          {nodes.map(node => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              onSelect={() => onNodeSelect?.(node)}
              onUpdate={(updates) => onNodeUpdate(node.id, updates)}
              onDelete={() => onNodeDelete(node.id)}
              readOnly={readOnly}
            />
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Empty Blueprint</h3>
                <p className="text-sm">
                  {readOnly 
                    ? 'No components in this blueprint yet'
                    : 'Drag components from the palette to start designing'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}