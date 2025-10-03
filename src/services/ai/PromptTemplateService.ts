// AI Prompt Templates for Code Generation

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  category: 'blueprint' | 'implementation' | 'debugging' | 'optimization' | 'documentation';
  framework?: string;
}

export class PromptTemplateService {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Blueprint Generation Template
    this.addTemplate({
      id: 'app-blueprint',
      name: 'Application Blueprint Generator',
      description: 'Generate a complete application architecture blueprint',
      category: 'blueprint',
      systemPrompt: `You are an expert software architect specializing in modern web application development. 
      
Your task is to create comprehensive application blueprints that include:
- Architecture overview and design patterns
- Technology stack recommendations
- Component structure and relationships
- Database schema and data flow
- API endpoints and integration points
- Security considerations
- Performance optimization strategies
- Deployment and scaling recommendations

Always provide practical, production-ready solutions that follow current best practices and industry standards.`,
      userPromptTemplate: `Create a detailed application blueprint for: {description}

Requirements:
- Framework: {framework}
- Features: {features}
- Target Users: {targetUsers}
- Scale: {scale}
- Special Requirements: {specialRequirements}

Please provide a comprehensive blueprint including architecture, technology choices, component structure, and implementation roadmap.`,
      variables: ['description', 'framework', 'features', 'targetUsers', 'scale', 'specialRequirements'],
    });

    // React Component Generator
    this.addTemplate({
      id: 'react-component',
      name: 'React Component Generator',
      description: 'Generate React components with TypeScript and modern patterns',
      category: 'implementation',
      framework: 'react',
      systemPrompt: `You are an expert React developer who creates high-quality, production-ready components.

Your components should:
- Use TypeScript with proper type definitions
- Follow React best practices and hooks patterns
- Include proper prop validation and documentation
- Be accessible and follow ARIA guidelines
- Use modern CSS patterns (CSS Modules, Styled Components, or Tailwind)
- Include error boundaries where appropriate
- Be optimized for performance (memo, useMemo, useCallback when needed)
- Follow the component composition pattern
- Include proper testing considerations

Always write clean, maintainable, and reusable code.`,
      userPromptTemplate: `Create a React component for: {componentName}

Requirements:
- Purpose: {purpose}
- Props: {props}
- Styling: {styling}
- Functionality: {functionality}
- Additional Requirements: {additionalRequirements}

Please provide the complete component code with TypeScript types, proper styling, and usage examples.`,
      variables: ['componentName', 'purpose', 'props', 'styling', 'functionality', 'additionalRequirements'],
    });

    // API Endpoint Generator
    this.addTemplate({
      id: 'api-endpoint',
      name: 'API Endpoint Generator',
      description: 'Generate RESTful API endpoints with validation and error handling',
      category: 'implementation',
      systemPrompt: `You are an expert backend developer who creates robust, secure API endpoints.

Your endpoints should:
- Follow RESTful conventions and HTTP standards
- Include comprehensive input validation
- Implement proper error handling and status codes
- Use middleware for authentication and authorization
- Include proper logging and monitoring
- Follow security best practices (rate limiting, sanitization)
- Include OpenAPI/Swagger documentation
- Handle edge cases gracefully
- Be optimized for performance
- Include proper testing strategies

Always consider scalability, security, and maintainability.`,
      userPromptTemplate: `Create an API endpoint for: {endpointName}

Requirements:
- HTTP Method: {method}
- Purpose: {purpose}
- Input Parameters: {inputParams}
- Response Format: {responseFormat}
- Authentication: {authentication}
- Validation Rules: {validation}
- Error Handling: {errorHandling}

Please provide the complete endpoint implementation with validation, error handling, and documentation.`,
      variables: ['endpointName', 'method', 'purpose', 'inputParams', 'responseFormat', 'authentication', 'validation', 'errorHandling'],
    });

    // Database Schema Generator
    this.addTemplate({
      id: 'database-schema',
      name: 'Database Schema Generator',
      description: 'Generate database schemas with relationships and constraints',
      category: 'implementation',
      systemPrompt: `You are an expert database architect who designs efficient, scalable database schemas.

Your schemas should:
- Follow database normalization principles
- Include proper indexing strategies
- Define clear relationships and constraints
- Consider performance and query optimization
- Include data validation and integrity checks
- Plan for scalability and partitioning
- Consider security and access patterns
- Include migration scripts
- Document relationships and business rules
- Consider backup and recovery strategies

Always design for both current needs and future growth.`,
      userPromptTemplate: `Design a database schema for: {applicationName}

Requirements:
- Database Type: {databaseType}
- Entities: {entities}
- Relationships: {relationships}
- Access Patterns: {accessPatterns}
- Scale Requirements: {scaleRequirements}
- Special Constraints: {constraints}

Please provide the complete schema with tables, relationships, indexes, and migration scripts.`,
      variables: ['applicationName', 'databaseType', 'entities', 'relationships', 'accessPatterns', 'scaleRequirements', 'constraints'],
    });

    // Code Review and Optimization
    this.addTemplate({
      id: 'code-review',
      name: 'Code Review and Optimization',
      description: 'Review and optimize existing code for performance and best practices',
      category: 'optimization',
      systemPrompt: `You are an expert code reviewer who provides detailed, actionable feedback.

Your reviews should cover:
- Code quality and maintainability
- Performance optimization opportunities
- Security vulnerabilities and fixes
- Best practices and design patterns
- Accessibility and UX considerations
- Testing coverage and strategies
- Documentation and comments
- Refactoring suggestions
- Scalability considerations
- Framework-specific optimizations

Always provide specific, actionable suggestions with examples.`,
      userPromptTemplate: `Review and optimize this code:

\`\`\`{language}
{code}
\`\`\`

Focus Areas:
- Performance: {performanceFocus}
- Security: {securityFocus}
- Maintainability: {maintainabilityFocus}
- Best Practices: {bestPracticesFocus}

Please provide detailed feedback with specific improvements and refactored code examples.`,
      variables: ['language', 'code', 'performanceFocus', 'securityFocus', 'maintainabilityFocus', 'bestPracticesFocus'],
    });

    // Bug Debugging Assistant
    this.addTemplate({
      id: 'bug-debugger',
      name: 'Bug Debugging Assistant',
      description: 'Analyze and debug code issues with systematic troubleshooting',
      category: 'debugging',
      systemPrompt: `You are an expert debugging specialist who systematically identifies and resolves code issues.

Your debugging approach should:
- Analyze symptoms and error messages carefully
- Identify root causes, not just symptoms
- Provide step-by-step debugging strategies
- Suggest multiple potential solutions
- Include prevention strategies for similar issues
- Consider environment and configuration factors
- Provide testing strategies to verify fixes
- Include monitoring and logging improvements
- Consider performance implications of fixes
- Document the debugging process for future reference

Always be thorough and methodical in your analysis.`,
      userPromptTemplate: `Help debug this issue:

Problem Description: {problemDescription}
Error Messages: {errorMessages}
Code Context:
\`\`\`{language}
{code}
\`\`\`

Environment:
- Framework: {framework}
- Version: {version}
- Browser/Runtime: {environment}
- Additional Context: {additionalContext}

Please provide a systematic debugging approach with potential solutions and prevention strategies.`,
      variables: ['problemDescription', 'errorMessages', 'language', 'code', 'framework', 'version', 'environment', 'additionalContext'],
    });

    // Documentation Generator
    this.addTemplate({
      id: 'documentation',
      name: 'Documentation Generator',
      description: 'Generate comprehensive documentation for code and APIs',
      category: 'documentation',
      systemPrompt: `You are an expert technical writer who creates clear, comprehensive documentation.

Your documentation should:
- Be clear and accessible to the target audience
- Include practical examples and use cases
- Cover all important features and edge cases
- Follow documentation best practices
- Include proper code formatting and syntax highlighting
- Provide troubleshooting guides
- Include API references with parameter details
- Cover installation and setup procedures
- Include performance considerations
- Provide migration guides when applicable

Always write for clarity and usefulness.`,
      userPromptTemplate: `Create documentation for: {subject}

Type: {documentationType}
Audience: {audience}
Code/API to Document:
\`\`\`{language}
{code}
\`\`\`

Requirements:
- Include: {includeItems}
- Focus Areas: {focusAreas}
- Format: {format}

Please provide comprehensive documentation with examples and clear explanations.`,
      variables: ['subject', 'documentationType', 'audience', 'language', 'code', 'includeItems', 'focusAreas', 'format'],
    });

    // Test Generator
    this.addTemplate({
      id: 'test-generator',
      name: 'Test Generator',
      description: 'Generate comprehensive test suites for code and components',
      category: 'implementation',
      systemPrompt: `You are an expert in test-driven development who creates comprehensive test suites.

Your tests should:
- Cover all important functionality and edge cases
- Follow testing best practices and patterns
- Include unit, integration, and end-to-end tests as appropriate
- Use proper mocking and stubbing strategies
- Include performance and security tests when relevant
- Follow the testing pyramid principles
- Include accessibility testing for UI components
- Use appropriate testing frameworks and utilities
- Include setup and teardown procedures
- Provide clear test descriptions and assertions

Always aim for high coverage and meaningful tests.`,
      userPromptTemplate: `Generate tests for: {subject}

Code to Test:
\`\`\`{language}
{code}
\`\`\`

Test Requirements:
- Test Types: {testTypes}
- Framework: {testFramework}
- Coverage Focus: {coverageFocus}
- Edge Cases: {edgeCases}
- Additional Requirements: {additionalRequirements}

Please provide a comprehensive test suite with clear descriptions and good coverage.`,
      variables: ['subject', 'language', 'code', 'testTypes', 'testFramework', 'coverageFocus', 'edgeCases', 'additionalRequirements'],
    });
  }

  private addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  // Get template by ID
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  // Get all templates
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get templates by category
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  // Get templates by framework
  getTemplatesByFramework(framework: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      template.framework === framework || !template.framework
    );
  }

  // Render template with variables
  renderTemplate(templateId: string, variables: Record<string, string>): {
    systemPrompt: string;
    userPrompt: string;
  } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    let userPrompt = template.userPromptTemplate;
    
    // Replace variables in the user prompt
    template.variables.forEach(variable => {
      const value = variables[variable] || `[${variable}]`;
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      userPrompt = userPrompt.replace(regex, value);
    });

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
    };
  }

  // Validate template variables
  validateTemplateVariables(templateId: string, variables: Record<string, string>): {
    valid: boolean;
    missingVariables: string[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, missingVariables: [] };
    }

    const missingVariables = template.variables.filter(variable => 
      !variables[variable] || variables[variable].trim() === ''
    );

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    };
  }

  // Create custom template
  createCustomTemplate(template: PromptTemplate): void {
    this.addTemplate(template);
  }

  // Search templates
  searchTemplates(query: string): PromptTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.category.toLowerCase().includes(lowercaseQuery)
    );
  }
}

// Export singleton instance
export const promptTemplateService = new PromptTemplateService();