import { Clock, CheckCircle, Play, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { GenerationPhase } from './PhaseTimeline';

interface CompactPhaseDisplayProps {
  phases: GenerationPhase[];
  currentPhase?: string;
  className?: string;
}

export function CompactPhaseDisplay({ phases, currentPhase, className }: CompactPhaseDisplayProps) {
  if (phases.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground p-2', className)}>
        <Clock className="w-4 h-4 mx-auto mb-1" />
        <p className="text-xs">Ready to generate</p>
      </div>
    );
  }

  const currentPhaseData = phases.find(p => p.id === currentPhase);
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalSteps = phases.reduce((acc, phase) => acc + phase.steps.length, 0);
  const completedSteps = phases.reduce((acc, phase) => 
    acc + phase.steps.filter(step => step.status === 'completed').length, 0
  );
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Phase {completedPhases + 1}/{phases.length}
        </span>
        <Badge variant="secondary" className="text-xs">
          {completedSteps}/{totalSteps} steps
        </Badge>
      </div>
      
      <Progress value={progress} className="h-1.5" />
      
      {currentPhaseData && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {currentPhaseData.status === 'running' && <Play className="w-3 h-3 text-blue-500" />}
            {currentPhaseData.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
            {currentPhaseData.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
            {currentPhaseData.status === 'pending' && <Clock className="w-3 h-3 text-muted-foreground" />}
          </div>
          <span className="text-xs font-medium truncate">
            {currentPhaseData.name}
          </span>
        </div>
      )}
    </div>
  );
}

// Mock data generator for testing
export function createMockPhases(): GenerationPhase[] {
  return [
    {
      id: 'analysis',
      name: 'Requirements Analysis',
      description: 'Analyzing user requirements and project scope',
      status: 'completed',
      startTime: new Date(Date.now() - 5000),
      endTime: new Date(Date.now() - 3000),
      steps: [
        {
          id: 'parse-input',
          name: 'Parse Input',
          description: 'Processing user input and extracting requirements',
          status: 'completed',
          icon: 'brain',
          startTime: new Date(Date.now() - 5000),
          endTime: new Date(Date.now() - 4000),
          output: 'Successfully parsed user requirements'
        },
        {
          id: 'analyze-scope',
          name: 'Analyze Scope',
          description: 'Determining project scope and complexity',
          status: 'completed',
          icon: 'brain',
          startTime: new Date(Date.now() - 4000),
          endTime: new Date(Date.now() - 3000),
          output: 'Project scope determined: Medium complexity web application'
        }
      ]
    },
    {
      id: 'planning',
      name: 'Architecture Planning',
      description: 'Creating system architecture and component design',
      status: 'running',
      startTime: new Date(Date.now() - 3000),
      steps: [
        {
          id: 'design-architecture',
          name: 'Design Architecture',
          description: 'Creating overall system architecture',
          status: 'completed',
          icon: 'package',
          startTime: new Date(Date.now() - 3000),
          endTime: new Date(Date.now() - 2000),
          output: 'Architecture designed with microservices pattern'
        },
        {
          id: 'select-technologies',
          name: 'Select Technologies',
          description: 'Choosing appropriate technology stack',
          status: 'running',
          icon: 'zap',
          startTime: new Date(Date.now() - 2000),
          progress: 75
        },
        {
          id: 'plan-components',
          name: 'Plan Components',
          description: 'Planning individual component structure',
          status: 'pending',
          icon: 'package'
        }
      ]
    },
    {
      id: 'generation',
      name: 'Code Generation',
      description: 'Generating application code and files',
      status: 'pending',
      steps: [
        {
          id: 'generate-backend',
          name: 'Generate Backend',
          description: 'Creating backend API and services',
          status: 'pending',
          icon: 'code'
        },
        {
          id: 'generate-frontend',
          name: 'Generate Frontend',
          description: 'Creating user interface components',
          status: 'pending',
          icon: 'code'
        },
        {
          id: 'generate-database',
          name: 'Generate Database',
          description: 'Creating database schema and migrations',
          status: 'pending',
          icon: 'database'
        }
      ]
    },
    {
      id: 'deployment',
      name: 'Deployment Setup',
      description: 'Setting up deployment configuration',
      status: 'pending',
      steps: [
        {
          id: 'create-config',
          name: 'Create Config',
          description: 'Creating deployment configuration files',
          status: 'pending',
          icon: 'file'
        },
        {
          id: 'setup-ci-cd',
          name: 'Setup CI/CD',
          description: 'Configuring continuous integration',
          status: 'pending',
          icon: 'rocket'
        }
      ]
    }
  ];
}