
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Code,
  FileText,
  Package,
  Rocket,
  Brain,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PhaseStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  duration?: number; // in milliseconds
  startTime?: Date;
  endTime?: Date;
  progress?: number; // 0-100
  output?: string;
  error?: string;
  icon?: 'brain' | 'code' | 'file' | 'package' | 'database' | 'rocket' | 'zap';
}

export interface GenerationPhase {
  id: string;
  name: string;
  description: string;
  steps: PhaseStep[];
  status: 'pending' | 'running' | 'completed' | 'error' | 'paused';
  estimatedDuration?: number;
  actualDuration?: number;
  startTime?: Date;
  endTime?: Date;
}

interface PhaseTimelineProps {
  phases: GenerationPhase[];
  currentPhaseId?: string;
  currentStepId?: string;
  onPhaseStart?: (phaseId: string) => void;
  onPhasePause?: (phaseId: string) => void;
  onPhaseRetry?: (phaseId: string) => void;
  onStepRetry?: (phaseId: string, stepId: string) => void;
  showControls?: boolean;
  compact?: boolean;
  className?: string;
}

const stepIcons = {
  brain: Brain,
  code: Code,
  file: FileText,
  package: Package,
  database: Database,
  rocket: Rocket,
  zap: Zap
};

const statusColors = {
  pending: 'text-muted-foreground',
  running: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500',
  skipped: 'text-gray-400',
  paused: 'text-orange-500'
};

const statusBgColors = {
  pending: 'bg-muted',
  running: 'bg-blue-100 dark:bg-blue-900/20',
  completed: 'bg-green-100 dark:bg-green-900/20',
  error: 'bg-red-100 dark:bg-red-900/20',
  skipped: 'bg-gray-100 dark:bg-gray-900/20',
  paused: 'bg-orange-100 dark:bg-orange-900/20'
};

function formatDuration(ms?: number): string {
  if (!ms) return '--';
  
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function getStatusIcon(status: PhaseStep['status'] | GenerationPhase['status']) {
  switch (status) {
    case 'pending':
      return Clock;
    case 'running':
      return Play;
    case 'completed':
      return CheckCircle;
    case 'error':
      return XCircle;
    case 'skipped':
      return AlertCircle;
    case 'paused':
      return Pause;
    default:
      return Clock;
  }
}

interface PhaseStepItemProps {
  step: PhaseStep;
  isActive: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

function PhaseStepItem({ step, isActive, onRetry, compact = false }: PhaseStepItemProps) {
  const StatusIcon = getStatusIcon(step.status);
  const StepIcon = step.icon ? stepIcons[step.icon] : Code;
  
  const duration = step.endTime && step.startTime 
    ? step.endTime.getTime() - step.startTime.getTime()
    : step.duration;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg transition-all',
      isActive && 'ring-2 ring-primary/20',
      statusBgColors[step.status]
    )}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={cn('p-1.5 rounded-full', statusColors[step.status])}>
          <StatusIcon className="w-4 h-4" />
        </div>
        <div className={cn('p-1.5 rounded-full bg-background', statusColors[step.status])}>
          <StepIcon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm truncate">
            {step.name}
          </h4>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {step.status === 'running' && step.progress !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {step.progress}%
              </Badge>
            )}
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {step.description}
          </p>
        )}

        {step.status === 'running' && step.progress !== undefined && (
          <Progress value={step.progress} className="h-1.5 mb-2" />
        )}

        {step.status === 'error' && step.error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-2 mb-2">
            <p className="text-xs text-red-700 dark:text-red-300">
              {step.error}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-1 h-6 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}

        {step.output && step.status === 'completed' && !compact && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded p-2">
            <p className="text-xs text-green-700 dark:text-green-300 line-clamp-2">
              {step.output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface PhaseCardProps {
  phase: GenerationPhase;
  isActive: boolean;
  currentStepId?: string;
  onStart?: () => void;
  onPause?: () => void;
  onRetry?: () => void;
  onStepRetry?: (stepId: string) => void;
  showControls?: boolean;
  compact?: boolean;
}

function PhaseCard({ 
  phase, 
  isActive, 
  currentStepId,
  onStart,
  onPause,
  onRetry,
  onStepRetry,
  showControls = false,
  compact = false
}: PhaseCardProps) {
  const completedSteps = phase.steps.filter(step => step.status === 'completed').length;
  const totalSteps = phase.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const duration = phase.endTime && phase.startTime 
    ? phase.endTime.getTime() - phase.startTime.getTime()
    : phase.actualDuration;

  return (
    <Card className={cn(
      'transition-all',
      isActive && 'ring-2 ring-primary shadow-lg',
      statusBgColors[phase.status]
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-full', statusColors[phase.status])}>
              {getStatusIcon(phase.status)({ className: 'w-5 h-5' })}
            </div>
            <div>
              <CardTitle className="text-base">{phase.name}</CardTitle>
              {!compact && (
                <p className="text-sm text-muted-foreground mt-1">
                  {phase.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {completedSteps}/{totalSteps}
            </Badge>
            {showControls && (
              <div className="flex gap-1">
                {phase.status === 'pending' && onStart && (
                  <Button variant="outline" size="sm" onClick={onStart}>
                    <Play className="w-3 h-3" />
                  </Button>
                )}
                {phase.status === 'running' && onPause && (
                  <Button variant="outline" size="sm" onClick={onPause}>
                    <Pause className="w-3 h-3" />
                  </Button>
                )}
                {(phase.status === 'error' || phase.status === 'paused') && onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress: {progress.toFixed(0)}%</span>
            <span>Duration: {formatDuration(duration)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {phase.steps.map((step) => (
            <PhaseStepItem
              key={step.id}
              step={step}
              isActive={step.id === currentStepId}
              {...(onStepRetry && { onRetry: () => onStepRetry(step.id) })}
              compact={compact}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PhaseTimeline({
  phases,
  currentPhaseId,
  currentStepId,
  onPhaseStart,
  onPhasePause,
  onPhaseRetry,
  onStepRetry,
  showControls = false,
  compact = false,
  className
}: PhaseTimelineProps) {
  const totalPhases = phases.length;
  const completedPhases = phases.filter(phase => phase.status === 'completed').length;
  const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  const totalSteps = phases.reduce((acc, phase) => acc + phase.steps.length, 0);
  const completedSteps = phases.reduce((acc, phase) => 
    acc + phase.steps.filter(step => step.status === 'completed').length, 0
  );
  const stepProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  if (phases.length === 0) {
    return (
      <div className={cn('p-6 text-center text-muted-foreground', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No generation phases yet</p>
        <p className="text-xs">Start a conversation to see progress</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Generation Progress</h3>
              <Badge variant="secondary">
                {completedPhases}/{totalPhases} phases
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Step Progress</span>
                <span>{completedSteps}/{totalSteps} steps</span>
              </div>
              <Progress value={stepProgress} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Cards */}
      <div className="space-y-3">
        {phases.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            isActive={phase.id === currentPhaseId}
            {...(currentStepId && { currentStepId })}
            {...(onPhaseStart && { onStart: () => onPhaseStart(phase.id) })}
            {...(onPhasePause && { onPause: () => onPhasePause(phase.id) })}
            {...(onPhaseRetry && { onRetry: () => onPhaseRetry(phase.id) })}
            {...(onStepRetry && { onStepRetry: (stepId) => onStepRetry(phase.id, stepId) })}
            showControls={showControls}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}