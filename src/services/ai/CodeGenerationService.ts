import { BaseService } from '../core/BaseService';
import { AIService, type AIRequest, type AIResponse } from './AIService';
import { PromptTemplateService } from './PromptTemplateService';

export interface CodeGenerationRequest {
  template: string;
  variables: Record<string, string>;
  framework?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'cerebras';
  model?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    includeTests?: boolean;
    includeDocumentation?: boolean;
    codeStyle?: 'typescript' | 'javascript' | 'functional' | 'object-oriented';
  };
}

export interface CodeGenerationResult {
  code: string;
  tests?: string;
  documentation?: string;
  blueprint?: string;
  metadata: {
    template: string;
    framework?: string;
    provider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    generatedAt: Date;
  };
}

export interface GenerationPhase {
  name: string;
  description: string;
  templateId: string;
  dependsOn?: string[];
  outputType: 'code' | 'documentation' | 'blueprint' | 'test' | 'configuration';
}

export interface ProjectGenerationPlan {
  id: string;
  name: string;
  description: string;
  framework: string;
  phases: GenerationPhase[];
  estimatedCost: number;
  estimatedTime: number; // in minutes
}

// Code Generation Service
export class CodeGenerationService extends BaseService {
  private aiService: AIService;
  private promptService: PromptTemplateService;

  constructor() {
    super();
    this.aiService = new AIService();
    this.promptService = new PromptTemplateService();
  }

  // Generate code from template and variables
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    try {
      // Validate template and variables
      const template = this.promptService.getTemplate(request.template);
      if (!template) {
        throw new Error(`Template not found: ${request.template}`);
      }

      const validation = this.promptService.validateTemplateVariables(request.template, request.variables);
      if (!validation.valid) {
        throw new Error(`Missing required variables: ${validation.missingVariables.join(', ')}`);
      }

      // Render the prompt
      const renderedPrompt = this.promptService.renderTemplate(request.template, request.variables);
      if (!renderedPrompt) {
        throw new Error('Failed to render template');
      }

      // Prepare AI request
      const provider = request.provider || 'openai';
      const model = request.model || 'gpt-4o';
      const aiRequest: AIRequest = {
        messages: [
          { role: 'system', content: renderedPrompt.systemPrompt },
          { role: 'user', content: renderedPrompt.userPrompt },
        ],
        provider,
        model,
        temperature: request.options?.temperature || 0.3, // Lower temperature for code generation
        maxTokens: request.options?.maxTokens || 6000,
      };

      // Generate main code
      const codeResponse = await this.aiService.sendRequest(aiRequest);
      
      let testsResponse: AIResponse | undefined;
      let docsResponse: AIResponse | undefined;
      let totalCost = codeResponse.cost || 0;
      let totalTokens = codeResponse.usage.totalTokens;

      // Generate tests if requested
      if (request.options?.includeTests) {
        const testTemplate = this.promptService.getTemplate('test-generator');
        if (testTemplate) {
          const testPrompt = this.promptService.renderTemplate('test-generator', {
            subject: request.variables.componentName || request.variables.endpointName || 'Generated Code',
            language: request.framework === 'react' ? 'typescript' : 'typescript',
            code: codeResponse.content,
            testTypes: 'unit, integration',
            testFramework: request.framework === 'react' ? 'Jest, React Testing Library' : 'Jest',
            coverageFocus: 'functionality, edge cases, error handling',
            edgeCases: 'null values, invalid inputs, boundary conditions',
            additionalRequirements: 'accessibility testing for UI components',
          });

          if (testPrompt) {
            testsResponse = await this.aiService.sendRequest({
              messages: [
                { role: 'system', content: testPrompt.systemPrompt },
                { role: 'user', content: testPrompt.userPrompt },
              ],
              provider,
              model,
              temperature: 0.3,
              maxTokens: 4000,
            });

            totalCost += testsResponse.cost || 0;
            totalTokens += testsResponse.usage.totalTokens;
          }
        }
      }

      // Generate documentation if requested
      if (request.options?.includeDocumentation) {
        const docTemplate = this.promptService.getTemplate('documentation');
        if (docTemplate) {
          const docPrompt = this.promptService.renderTemplate('documentation', {
            subject: request.variables.componentName || request.variables.endpointName || 'Generated Code',
            documentationType: 'API Reference and Usage Guide',
            audience: 'developers',
            language: request.framework === 'react' ? 'typescript' : 'typescript',
            code: codeResponse.content,
            includeItems: 'installation, usage examples, API reference, troubleshooting',
            focusAreas: 'practical examples, common use cases',
            format: 'markdown',
          });

          if (docPrompt) {
            docsResponse = await this.aiService.sendRequest({
              messages: [
                { role: 'system', content: docPrompt.systemPrompt },
                { role: 'user', content: docPrompt.userPrompt },
              ],
              provider,
              model,
              temperature: 0.4,
              maxTokens: 3000,
            });

            totalCost += docsResponse.cost || 0;
            totalTokens += docsResponse.usage.totalTokens;
          }
        }
      }

      return {
        code: codeResponse.content,
        tests: testsResponse?.content || '',
        documentation: docsResponse?.content || '',
        metadata: {
          template: request.template,
          framework: request.framework || 'react',
          provider: codeResponse.provider,
          model: codeResponse.model,
          tokensUsed: totalTokens,
          cost: totalCost,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      this.handleError(error, 'generateCode');
    }
  }

  // Generate application blueprint
  async generateBlueprint(
    description: string,
    framework: string,
    features: string[],
    targetUsers: string,
    scale: string = 'medium',
    specialRequirements: string = ''
  ): Promise<CodeGenerationResult> {
    const request: CodeGenerationRequest = {
      template: 'app-blueprint',
      variables: {
        description,
        framework,
        features: features.join(', '),
        targetUsers,
        scale,
        specialRequirements,
      },
      framework,
      options: {
        temperature: 0.7, // Higher for creative blueprint generation
        maxTokens: 8000,
        includeDocumentation: true,
      },
    };

    return this.generateCode(request);
  }

  // Generate multi-phase project
  async generateProject(plan: ProjectGenerationPlan, variables: Record<string, string>): Promise<{
    phases: Array<{
      phase: GenerationPhase;
      result: CodeGenerationResult;
    }>;
    totalCost: number;
    totalTime: number;
  }> {
    const results: Array<{
      phase: GenerationPhase;
      result: CodeGenerationResult;
    }> = [];
    
    let totalCost = 0;
    const startTime = Date.now();

    // Execute phases in dependency order
    const executedPhases = new Set<string>();
    
    for (const phase of plan.phases) {
      // Check if dependencies are met
      if (phase.dependsOn) {
        const missingDeps = phase.dependsOn.filter(dep => !executedPhases.has(dep));
        if (missingDeps.length > 0) {
          throw new Error(`Phase ${phase.name} depends on unexecuted phases: ${missingDeps.join(', ')}`);
        }
      }

      // Enhance variables with previous phase results
      const enhancedVariables = { ...variables };
      
      // Add outputs from previous phases as context
      if (results.length > 0) {
        const previousCode = results.map(r => r.result.code).join('\n\n---\n\n');
        enhancedVariables.previousCode = previousCode;
      }

      const request: CodeGenerationRequest = {
        template: phase.templateId,
        variables: enhancedVariables,
        framework: plan.framework,
        options: {
          temperature: phase.outputType === 'blueprint' ? 0.7 : 0.3,
          maxTokens: phase.outputType === 'blueprint' ? 8000 : 6000,
          includeTests: phase.outputType === 'code',
          includeDocumentation: phase.outputType === 'code',
        },
      };

      const result = await this.generateCode(request);
      results.push({ phase, result });
      
      totalCost += result.metadata.cost;
      executedPhases.add(phase.name);

      // Add a small delay between phases to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const totalTime = (Date.now() - startTime) / 1000 / 60; // in minutes

    return {
      phases: results,
      totalCost,
      totalTime,
    };
  }

  // Create generation plans for common project types
  createProjectPlan(type: 'react-app' | 'api-server' | 'fullstack' | 'component-library', name: string): ProjectGenerationPlan {
    const plans: Record<string, ProjectGenerationPlan> = {
      'react-app': {
        id: crypto.randomUUID(),
        name: `${name} - React Application`,
        description: 'Complete React application with components, routing, and state management',
        framework: 'react',
        estimatedCost: 0.50,
        estimatedTime: 15,
        phases: [
          {
            name: 'blueprint',
            description: 'Generate application architecture and component structure',
            templateId: 'app-blueprint',
            outputType: 'blueprint',
          },
          {
            name: 'main-components',
            description: 'Generate main application components',
            templateId: 'react-component',
            dependsOn: ['blueprint'],
            outputType: 'code',
          },
          {
            name: 'routing',
            description: 'Generate routing configuration',
            templateId: 'react-component',
            dependsOn: ['main-components'],
            outputType: 'configuration',
          },
          {
            name: 'state-management',
            description: 'Generate state management setup',
            templateId: 'react-component',
            dependsOn: ['main-components'],
            outputType: 'code',
          },
        ],
      },
      'api-server': {
        id: crypto.randomUUID(),
        name: `${name} - API Server`,
        description: 'Complete API server with endpoints, validation, and database integration',
        framework: 'node',
        estimatedCost: 0.60,
        estimatedTime: 20,
        phases: [
          {
            name: 'blueprint',
            description: 'Generate API architecture and endpoint structure',
            templateId: 'app-blueprint',
            outputType: 'blueprint',
          },
          {
            name: 'database-schema',
            description: 'Generate database schema and models',
            templateId: 'database-schema',
            dependsOn: ['blueprint'],
            outputType: 'code',
          },
          {
            name: 'api-endpoints',
            description: 'Generate API endpoints and controllers',
            templateId: 'api-endpoint',
            dependsOn: ['database-schema'],
            outputType: 'code',
          },
          {
            name: 'middleware',
            description: 'Generate authentication and validation middleware',
            templateId: 'api-endpoint',
            dependsOn: ['api-endpoints'],
            outputType: 'code',
          },
        ],
      },
      'fullstack': {
        id: crypto.randomUUID(),
        name: `${name} - Full Stack Application`,
        description: 'Complete full-stack application with frontend, backend, and database',
        framework: 'fullstack',
        estimatedCost: 1.20,
        estimatedTime: 35,
        phases: [
          {
            name: 'blueprint',
            description: 'Generate full-stack architecture',
            templateId: 'app-blueprint',
            outputType: 'blueprint',
          },
          {
            name: 'database-schema',
            description: 'Generate database schema',
            templateId: 'database-schema',
            dependsOn: ['blueprint'],
            outputType: 'code',
          },
          {
            name: 'api-endpoints',
            description: 'Generate backend API',
            templateId: 'api-endpoint',
            dependsOn: ['database-schema'],
            outputType: 'code',
          },
          {
            name: 'frontend-components',
            description: 'Generate frontend components',
            templateId: 'react-component',
            dependsOn: ['api-endpoints'],
            outputType: 'code',
          },
          {
            name: 'integration',
            description: 'Generate API integration layer',
            templateId: 'react-component',
            dependsOn: ['frontend-components'],
            outputType: 'code',
          },
        ],
      },
      'component-library': {
        id: crypto.randomUUID(),
        name: `${name} - Component Library`,
        description: 'Reusable component library with documentation and tests',
        framework: 'react',
        estimatedCost: 0.40,
        estimatedTime: 12,
        phases: [
          {
            name: 'blueprint',
            description: 'Generate component library structure',
            templateId: 'app-blueprint',
            outputType: 'blueprint',
          },
          {
            name: 'base-components',
            description: 'Generate base UI components',
            templateId: 'react-component',
            dependsOn: ['blueprint'],
            outputType: 'code',
          },
          {
            name: 'composite-components',
            description: 'Generate composite components',
            templateId: 'react-component',
            dependsOn: ['base-components'],
            outputType: 'code',
          },
          {
            name: 'documentation',
            description: 'Generate component documentation',
            templateId: 'documentation',
            dependsOn: ['composite-components'],
            outputType: 'documentation',
          },
        ],
      },
    };

    const plan = plans[type];
    if (!plan) {
      throw new Error(`No generation plan found for type: ${type}`);
    }
    return plan;
  }

  // Estimate generation cost
  estimateGenerationCost(request: CodeGenerationRequest): number {
    const template = this.promptService.getTemplate(request.template);
    if (!template) return 0;

    // Estimate tokens based on template complexity and variables
    const baseTokens = 2000; // Base prompt tokens
    const variableTokens = Object.values(request.variables).join(' ').length / 4;
    const responseTokens = request.options?.maxTokens || 4000;
    
    const totalTokens = baseTokens + variableTokens + responseTokens;
    
    // Get estimated cost from AI service
    const provider = request.provider || 'openai';
    const estimation = this.aiService.estimateRequestCost({
      messages: [{ role: 'user', content: 'test' }],
      provider,
      maxTokens: totalTokens,
    });

    let multiplier = 1;
    if (request.options?.includeTests) multiplier += 0.6;
    if (request.options?.includeDocumentation) multiplier += 0.4;

    return estimation.estimatedCost * multiplier;
  }

  // Get generation history
  async getGenerationHistory(_userId: string, _limit: number = 20): Promise<CodeGenerationResult[]> {
    try {
      // This would typically query the database
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      return this.handleError(error, 'getGenerationHistory') as never;
    }
  }

  // Save generation result
  async saveGenerationResult(_userId: string, _result: CodeGenerationResult): Promise<string> {
    try {
      // This would typically save to database
      // For now, return a UUID as placeholder
      return crypto.randomUUID();
    } catch (error) {
      return this.handleError(error, 'saveGenerationResult') as never;
    }
  }
}