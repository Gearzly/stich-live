/**
 * Tutorials Page
 * Step-by-step guides and learning resources
 */

// import React, { useState } from 'react';
import { useState } from 'react';
import { 
  Play, 
  // BookOpen, 
  // Code, 
  // Zap, 
  Clock, 
  User, 
  CheckCircle,
  ChevronRight,
  Star,
  Download,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  category: string;
  videoUrl?: string;
  steps: TutorialStep[];
  tags: string[];
  rating: number;
  completions: number;
  lastUpdated: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
}

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  code?: string;
  image?: string;
  type: 'text' | 'code' | 'video' | 'interactive';
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  tutorials: string[];
  difficulty: string;
  estimatedTime: string;
  completionRate: number;
}

export default function TutorialsPage() {
  const { showSuccess } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', name: 'All Tutorials', count: 24 },
    { id: 'getting-started', name: 'Getting Started', count: 6 },
    { id: 'app-creation', name: 'App Creation', count: 8 },
    { id: 'customization', name: 'Customization', count: 5 },
    { id: 'deployment', name: 'Deployment', count: 3 },
    { id: 'api', name: 'API Integration', count: 2 },
  ];

  const learningPaths: LearningPath[] = [
    {
      id: 'beginner-path',
      title: 'Complete Beginner\'s Journey',
      description: 'Start from scratch and build your first AI-generated application',
      tutorials: ['getting-started', 'first-app', 'customization-basics'],
      difficulty: 'Beginner',
      estimatedTime: '2 hours',
      completionRate: 85
    },
    {
      id: 'developer-path',
      title: 'Developer Integration Path',
      description: 'Learn to integrate Stich into your development workflow',
      tutorials: ['api-basics', 'advanced-features', 'deployment-strategies'],
      difficulty: 'Intermediate',
      estimatedTime: '4 hours',
      completionRate: 65
    },
    {
      id: 'advanced-path',
      title: 'Advanced Customization',
      description: 'Master advanced features and customization techniques',
      tutorials: ['custom-templates', 'complex-integrations', 'optimization'],
      difficulty: 'Advanced',
      estimatedTime: '6 hours',
      completionRate: 40
    }
  ];

  const tutorials: Tutorial[] = [
    {
      id: 'getting-started',
      title: 'Getting Started with Stich',
      description: 'Learn the basics of creating your first AI-generated application',
      difficulty: 'Beginner',
      duration: '15 min',
      category: 'getting-started',
      videoUrl: 'https://youtube.com/watch?v=example',
      tags: ['basics', 'introduction', 'first-time'],
      rating: 4.8,
      completions: 12543,
      lastUpdated: '2024-10-01',
      author: {
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        role: 'Developer Advocate'
      },
      steps: [
        {
          id: 'step-1',
          title: 'Create Your Account',
          content: 'Sign up for a free Stich account to get started with AI-powered app generation.',
          type: 'text'
        },
        {
          id: 'step-2',
          title: 'Describe Your App',
          content: 'Use natural language to describe what kind of application you want to create.',
          type: 'text'
        },
        {
          id: 'step-3',
          title: 'Review Generated Code',
          content: 'Examine the AI-generated code and make any necessary adjustments.',
          type: 'code',
          code: `// Example generated component
import React from 'react';

export default function MyApp() {
  return (
    <div className="app">
      <h1>Welcome to My App</h1>
      <p>Built with Stich AI</p>
    </div>
  );
}`
        },
        {
          id: 'step-4',
          title: 'Deploy Your App',
          content: 'Deploy your application with one click to start sharing with users.',
          type: 'text'
        }
      ]
    },
    {
      id: 'first-app',
      title: 'Building Your First App',
      description: 'Step-by-step guide to creating a complete application from scratch',
      difficulty: 'Beginner',
      duration: '30 min',
      category: 'app-creation',
      tags: ['tutorial', 'hands-on', 'project'],
      rating: 4.9,
      completions: 8765,
      lastUpdated: '2024-09-28',
      author: {
        name: 'Alex Rodriguez',
        avatar: '/avatars/alex.jpg',
        role: 'Senior Engineer'
      },
      steps: [
        {
          id: 'app-step-1',
          title: 'Choose Your Framework',
          content: 'Select the best framework for your project needs (React, Vue, Angular, etc.)',
          type: 'text'
        },
        {
          id: 'app-step-2',
          title: 'Define Features',
          content: 'List the key features and functionality you want in your application.',
          type: 'text'
        },
        {
          id: 'app-step-3',
          title: 'Generate and Customize',
          content: 'Let AI generate your app and customize it to match your vision.',
          type: 'interactive'
        }
      ]
    },
    {
      id: 'api-integration',
      title: 'API Integration Guide',
      description: 'Learn how to integrate external APIs into your AI-generated applications',
      difficulty: 'Intermediate',
      duration: '45 min',
      category: 'api',
      tags: ['api', 'integration', 'backend'],
      rating: 4.7,
      completions: 3421,
      lastUpdated: '2024-10-03',
      author: {
        name: 'Michael Kim',
        avatar: '/avatars/michael.jpg',
        role: 'Backend Specialist'
      },
      steps: [
        {
          id: 'api-step-1',
          title: 'Understanding APIs',
          content: 'Learn the fundamentals of REST APIs and how they work with your application.',
          type: 'text'
        },
        {
          id: 'api-step-2',
          title: 'Adding API Calls',
          content: 'Implement API integration using modern JavaScript patterns.',
          type: 'code',
          code: `// Example API integration
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}`
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const categoryMatch = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || tutorial.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      showSuccess('Step completed!', 'Great progress on your learning journey');
    }
    setCompletedSteps(newCompleted);
  };

  const renderTutorialGrid = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Difficulty:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => (
          <Card key={tutorial.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{tutorial.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{tutorial.description}</p>
                </div>
                {tutorial.videoUrl && (
                  <Play className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge className={cn('text-white text-xs', getDifficultyColor(tutorial.difficulty))}>
                  {tutorial.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {tutorial.duration}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {tutorial.rating}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {tutorial.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {tutorial.author.name}
                  </div>
                  <span>{tutorial.completions.toLocaleString()} completed</span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  Start Tutorial
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLearningPaths = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Learning Paths</h2>
        <p className="text-muted-foreground">
          Structured learning journeys to master different aspects of Stich
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {learningPaths.map((path) => (
          <Card key={path.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {path.title}
                <Badge variant="outline">{path.difficulty}</Badge>
              </CardTitle>
              <p className="text-muted-foreground">{path.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {path.estimatedTime}
                </div>
                <span className="text-muted-foreground">
                  {path.completionRate}% completion rate
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{path.completionRate}%</span>
                </div>
                <Progress value={path.completionRate} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Includes {path.tutorials.length} tutorials:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {path.tutorials.slice(0, 3).map((tutorialId, index) => (
                    <li key={tutorialId} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Tutorial {index + 1}
                    </li>
                  ))}
                  {path.tutorials.length > 3 && (
                    <li className="text-xs">+ {path.tutorials.length - 3} more tutorials</li>
                  )}
                </ul>
              </div>
              
              <Button className="w-full">
                Start Learning Path
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTutorialDetail = (tutorial: Tutorial) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedTutorial(null)}
        >
          ← Back to Tutorials
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-white', getDifficultyColor(tutorial.difficulty))}>
            {tutorial.difficulty}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {tutorial.duration}
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">{tutorial.title}</h1>
        <p className="text-muted-foreground text-lg">{tutorial.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img 
              src={tutorial.author.avatar} 
              alt={tutorial.author.name}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${tutorial.author.name}&background=random`;
              }}
            />
            <div>
              <div className="text-sm font-medium">{tutorial.author.name}</div>
              <div className="text-xs text-muted-foreground">{tutorial.author.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {tutorial.rating} ({tutorial.completions.toLocaleString()} completions)
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {tutorial.videoUrl && (
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Watch Video
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tutorial Steps</h2>
        <div className="space-y-4">
          {tutorial.steps.map((step, index) => (
            <Card key={step.id} className={cn(
              "transition-all",
              completedSteps.has(step.id) && "border-green-500 bg-green-50"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      completedSteps.has(step.id) 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {completedSteps.has(step.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {step.title}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStepCompletion(step.id)}
                  >
                    {completedSteps.has(step.id) ? 'Mark Incomplete' : 'Mark Complete'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{step.content}</p>
                
                {step.code && (
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{step.code}</pre>
                  </div>
                )}
                
                {step.type === 'interactive' && (
                  <div className="mt-4">
                    <Button>
                      Try Interactive Demo
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {selectedTutorial ? (
        renderTutorialDetail(selectedTutorial)
      ) : (
        <Tabs defaultValue="tutorials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tutorials">All Tutorials</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tutorials" className="mt-6">
            {renderTutorialGrid()}
          </TabsContent>
          
          <TabsContent value="paths" className="mt-6">
            {renderLearningPaths()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}