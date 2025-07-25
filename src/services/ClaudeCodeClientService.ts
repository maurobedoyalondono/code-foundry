export interface ClaudeCodeRequest {
  prompt: string
  maxTurns?: number
  mode?: 'conversation' | 'feature' | 'debug'
  context?: {
    projectType?: string
    currentFile?: string
    selectedCode?: string
    projectPath?: string
  }
}

export interface ClaudeCodeResponse {
  messages: Array<{ type: string; text?: string }>
  finalMessage?: string
  codeBlocks?: Array<{ language: string; code: string }>
  suggestions?: string[]
  error?: string
}

/**
 * Client-side service for calling the Claude Code SDK API
 */
export class ClaudeCodeClientService {
  private baseUrl: string

  constructor() {
    this.baseUrl = typeof globalThis.window !== 'undefined' ? globalThis.window.location.origin : ''
  }

  /**
   * Send a message to Claude Code SDK via API
   */
  async sendMessage(
    prompt: string,
    options?: {
      maxTurns?: number
      mode?: 'conversation' | 'feature' | 'debug'
      context?: ClaudeCodeRequest['context']
      onProgress?: (chunk: string) => void
    }
  ): Promise<ClaudeCodeResponse> {
    try {
      const request: ClaudeCodeRequest = {
        prompt,
        maxTurns: options?.maxTurns || 5,
        mode: options?.mode || 'conversation',
        context: options?.context
      }

      const response = await globalThis.fetch(`${this.baseUrl}/api/claude-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'API request failed')
      }

      const result: ClaudeCodeResponse = await response.json()
      
      // Simulate progressive updates if callback provided
      if (options?.onProgress && result.finalMessage) {
        const words = result.finalMessage.split(' ')
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => globalThis.setTimeout(resolve, 50))
          options.onProgress(words.slice(0, i + 1).join(' ') + ' ')
        }
      }

      return result

    } catch (error) {
      return {
        messages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Generate code using Claude Code SDK
   */
  async generateCode(
    description: string,
    language: string = 'st',
    context?: ClaudeCodeRequest['context'],
    onProgress?: (chunk: string) => void
  ): Promise<ClaudeCodeResponse> {
    const prompt = `Generate clean, well-commented ${language.toUpperCase()} code for industrial automation.

Requirements:
- Follow IEC 61131-3 standards for Structured Text
- Include proper variable declarations
- Add comprehensive comments
- Use appropriate data types
- Follow industrial automation best practices

Task: ${description}`

    return this.sendMessage(prompt, {
      mode: 'feature',
      context,
      onProgress
    })
  }

  /**
   * Analyze code using Claude Code SDK
   */
  async analyzeCode(
    code: string,
    language: string = 'st',
    context?: ClaudeCodeRequest['context'],
    onProgress?: (chunk: string) => void
  ): Promise<ClaudeCodeResponse> {
    const prompt = `Analyze this ${language.toUpperCase()} industrial automation code and provide:

1. Code review with suggestions for improvement
2. Potential bugs or issues
3. Performance optimizations
4. Best practice recommendations
5. Safety considerations

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Please provide a detailed analysis with actionable recommendations.`

    return this.sendMessage(prompt, {
      mode: 'conversation',
      context: {
        ...context,
        selectedCode: code
      },
      onProgress
    })
  }

  /**
   * Debug code issues using Claude Code SDK
   */
  async debugCode(
    code: string,
    errorDescription: string,
    language: string = 'st',
    context?: ClaudeCodeRequest['context'],
    onProgress?: (chunk: string) => void
  ): Promise<ClaudeCodeResponse> {
    const prompt = `Help debug this ${language.toUpperCase()} industrial automation code.

Problem Description: ${errorDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Please:
1. Identify the likely cause of the issue
2. Provide a corrected version of the code
3. Explain what was wrong and why
4. Suggest prevention strategies for similar issues`

    return this.sendMessage(prompt, {
      mode: 'debug',
      context: {
        ...context,
        selectedCode: code
      },
      onProgress
    })
  }

  /**
   * Create a complete feature using Claude Code SDK
   */
  async createFeature(
    specification: string,
    context?: ClaudeCodeRequest['context'],
    onProgress?: (chunk: string) => void
  ): Promise<ClaudeCodeResponse> {
    const prompt = `Create a complete industrial automation feature based on this specification:

${specification}

Please provide:
1. Complete Structured Text (ST) code implementation
2. Comprehensive documentation
3. Test scenarios
4. Integration instructions
5. Safety considerations

Requirements:
- Follow IEC 61131-3 standards
- Include error handling
- Add safety interlocks where appropriate
- Use proper variable naming conventions
- Include comprehensive comments`

    return this.sendMessage(prompt, {
      mode: 'feature',
      context,
      onProgress
    })
  }

  /**
   * Execute slash commands
   */
  async executeCommand(
    command: string,
    context?: ClaudeCodeRequest['context'],
    onProgress?: (chunk: string) => void
  ): Promise<ClaudeCodeResponse> {
    // Handle special commands
    if (command.startsWith('/')) {
      const [cmd, ...args] = command.split(' ')
      
      switch (cmd) {
        case '/analyze':
          if (context?.currentFile) {
            return this.sendMessage(`Analyze the current project structure and files. Focus on the file: ${context.currentFile}`, {
              mode: 'conversation',
              context,
              onProgress
            })
          }
          return this.sendMessage('Analyze the current project structure and provide insights.', {
            mode: 'conversation',
            context,
            onProgress
          })
          
        case '/generate':
          return this.generateCode(args.join(' '), 'st', context, onProgress)
          
        case '/debug':
          if (context?.selectedCode) {
            return this.debugCode(context.selectedCode, args.join(' '), 'st', context, onProgress)
          }
          return this.sendMessage(`Help debug this issue: ${args.join(' ')}`, {
            mode: 'debug',
            context,
            onProgress
          })
          
        case '/test':
          return this.sendMessage(`Generate comprehensive tests for: ${args.join(' ')}`, {
            mode: 'conversation',
            context,
            onProgress
          })
          
        case '/docs':
          return this.sendMessage(`Generate documentation for: ${args.join(' ')}`, {
            mode: 'conversation',
            context,
            onProgress
          })
          
        default:
          return this.sendMessage(command, {
            mode: 'conversation',
            context,
            onProgress
          })
      }
    }
    
    return this.sendMessage(command, {
      mode: 'conversation',
      context,
      onProgress
    })
  }
}

// Export singleton instance
export const claudeCodeClient = new ClaudeCodeClientService()