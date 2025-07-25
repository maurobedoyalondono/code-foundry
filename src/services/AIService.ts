
export interface AIServiceConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface AIContext {
  projectType: 'rockwell' | 'siemens' | 'generic'
  currentFile?: string
  selectedCode?: string
  activeRoutines?: string[]
  tags?: Array<{
    name: string
    dataType: string
    value?: unknown
  }>
}

export interface AIResponse {
  message: string
  code?: string
  suggestions?: string[]
  error?: string
}

export class AIService {
  private config: AIServiceConfig
  private context: AIContext = { projectType: 'generic' }
  private abortController?: globalThis.AbortController

  constructor(config?: AIServiceConfig) {
    this.config = {
      apiKey: config?.apiKey || (typeof globalThis.process !== 'undefined' ? globalThis.process?.env?.NEXT_PUBLIC_CLAUDE_API_KEY : undefined),
      baseUrl: config?.baseUrl || 'https://api.anthropic.com/v1',
      model: config?.model || 'claude-3-opus-20240229',
      maxTokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 0.7,
    }
  }

  /**
   * Update the AI context with project information
   */
  updateContext(context: Partial<AIContext>): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(message: string, streamCallback?: (chunk: string) => void): Promise<AIResponse> {
    try {
      // For now, return a mock response
      // In production, this would call the Claude API
      const response = await this.mockAIResponse(message, streamCallback)
      return response
    } catch (error) {
      return {
        message: '',
        error: error instanceof Error ? error.message : 'An error occurred'
      }
    }
  }

  /**
   * Generate code based on natural language description
   */
  async generateCode(description: string, language: string = 'st'): Promise<AIResponse> {
    const prompt = this.buildCodeGenerationPrompt(description, language)
    return this.sendMessage(prompt)
  }

  /**
   * Analyze code and provide suggestions
   */
  async analyzeCode(code: string, language: string = 'st'): Promise<AIResponse> {
    const prompt = `Analyze this ${language.toUpperCase()} code and provide suggestions for improvement:\n\n${code}`
    return this.sendMessage(prompt)
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(code: string, language: string = 'st'): Promise<AIResponse> {
    const prompt = `Generate comprehensive documentation for this ${language.toUpperCase()} code:\n\n${code}`
    return this.sendMessage(prompt)
  }

  /**
   * Convert code between different PLC languages
   */
  async convertCode(code: string, fromLang: string, toLang: string): Promise<AIResponse> {
    const prompt = `Convert this ${fromLang.toUpperCase()} code to ${toLang.toUpperCase()}:\n\n${code}`
    return this.sendMessage(prompt)
  }

  /**
   * Cancel the current request
   */
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }
  }

  private buildCodeGenerationPrompt(description: string, language: string): string {
    let prompt = `Generate ${language.toUpperCase()} code for an industrial automation system.\n\n`
    
    // Add context
    if (this.context.projectType !== 'generic') {
      prompt += `Project Type: ${this.context.projectType}\n`
    }
    
    if (this.context.tags && this.context.tags.length > 0) {
      prompt += `Available Tags:\n`
      this.context.tags.forEach(tag => {
        prompt += `- ${tag.name}: ${tag.dataType}\n`
      })
      prompt += '\n'
    }
    
    prompt += `Description: ${description}\n\n`
    prompt += `Generate clean, well-commented ${language.toUpperCase()} code following IEC 61131-3 standards.`
    
    return prompt
  }

  /**
   * Mock AI response for development
   */
  private async mockAIResponse(message: string, streamCallback?: (chunk: string) => void): Promise<AIResponse> {
    // Simulate streaming response
    if (streamCallback) {
      const words = message.split(' ')
      const responseWords = [
        'I', 'understand', 'you', 'want', 'to', 
        ...words.slice(0, 5), 
        '.', 'Let', 'me', 'help', 'you', 'with', 'that', '.'
      ]
      
      for (const word of responseWords) {
        await new Promise(resolve => {
          if (typeof globalThis.setTimeout !== 'undefined') {
            globalThis.setTimeout(resolve, 100)
          } else {
            resolve(undefined)
          }
        })
        streamCallback(word + ' ')
      }
    }

    // Generate mock code if requested
    let code: string | undefined
    if (message.toLowerCase().includes('generate') || message.toLowerCase().includes('create')) {
      code = this.generateMockCode(message)
    }

    // Generate suggestions
    const suggestions = [
      'Consider adding error handling',
      'You might want to implement a state machine',
      'Remember to test edge cases'
    ]

    return {
      message: `I understand you want to ${message}. Let me help you with that.`,
      code,
      suggestions
    }
  }

  private generateMockCode(message: string): string {
    if (message.toLowerCase().includes('motor')) {
      return `FUNCTION_BLOCK MotorControl
VAR_INPUT
    Start : BOOL;
    Stop : BOOL;
    Speed_SP : INT; // Speed setpoint 0-100%
END_VAR

VAR_OUTPUT
    Running : BOOL;
    Speed_PV : INT; // Actual speed
    Fault : BOOL;
END_VAR

VAR
    StartupTimer : TON;
    FaultTimer : TOF;
END_VAR

// Motor control logic
IF Stop OR Fault THEN
    Running := FALSE;
    Speed_PV := 0;
ELSIF Start AND NOT Fault THEN
    StartupTimer(IN := TRUE, PT := T#3s);
    IF StartupTimer.Q THEN
        Running := TRUE;
        Speed_PV := Speed_SP;
    END_IF;
ELSE
    StartupTimer(IN := FALSE);
END_IF;

// Fault detection
FaultTimer(IN := Running AND (Speed_PV < 10), PT := T#5s);
Fault := FaultTimer.Q;

END_FUNCTION_BLOCK`
    }

    if (message.toLowerCase().includes('timer')) {
      return `PROGRAM TimerExample
VAR
    StartButton : BOOL;
    StopButton : BOOL;
    DelayTimer : TON;
    Output : BOOL;
END_VAR

// Simple timer logic
DelayTimer(IN := StartButton AND NOT StopButton, PT := T#5s);
Output := DelayTimer.Q;

END_PROGRAM`
    }

    // Default conveyor example
    return `PROGRAM ConveyorControl
VAR
    Start_PB : BOOL;
    Stop_PB : BOOL;
    EStop : BOOL;
    PhotoEye : BOOL;
    
    Motor_Run : BOOL;
    Alarm : BOOL;
    
    RunLatch : BOOL;
    AlarmTimer : TON;
END_VAR

// Latching logic for start/stop
IF Start_PB AND NOT EStop THEN
    RunLatch := TRUE;
ELSIF Stop_PB OR EStop THEN
    RunLatch := FALSE;
END_IF;

// Motor control
Motor_Run := RunLatch AND NOT Alarm;

// Alarm logic
AlarmTimer(IN := Motor_Run AND NOT PhotoEye, PT := T#10s);
Alarm := AlarmTimer.Q;

END_PROGRAM`
  }
}

// Export singleton instance
export const aiService = new AIService()