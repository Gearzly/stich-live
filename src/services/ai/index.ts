// AI services exports
export { AIService } from './AIService';
export { CodeGenerationService } from './CodeGenerationService';
export { PromptTemplateService, promptTemplateService } from './PromptTemplateService';

// Re-export AI types
export type {
  AIProvider,
  AIMessage,
  AIRequest,
  AIResponse,
  AIProviderConfig,
} from './AIService';

export type {
  CodeGenerationRequest,
  CodeGenerationResult,
  GenerationPhase,
  ProjectGenerationPlan,
} from './CodeGenerationService';

export type {
  PromptTemplate,
} from './PromptTemplateService';