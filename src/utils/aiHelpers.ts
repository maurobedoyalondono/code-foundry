import { AIMessage } from '@/store/AIStore'

/**
 * Parse code blocks from AI response
 */
export function parseCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const codeBlocks: Array<{ language: string; code: string }> = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    })
  }

  return codeBlocks
}

/**
 * Extract suggestions from AI response
 */
export function extractSuggestions(content: string): string[] {
  const suggestions: string[] = []
  const lines = content.split('\n')
  
  let inSuggestionList = false
  for (const line of lines) {
    if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('recommend')) {
      inSuggestionList = true
      continue
    }
    
    if (inSuggestionList && line.trim().startsWith('-')) {
      suggestions.push(line.trim().substring(1).trim())
    } else if (inSuggestionList && line.trim() === '') {
      inSuggestionList = false
    }
  }
  
  return suggestions
}

/**
 * Format AI message for display
 */
export function formatAIMessage(message: AIMessage): string {
  let formatted = message.content
  
  // Add timestamp
  const time = new Date(message.timestamp).toLocaleTimeString()
  formatted = `[${time}] ${formatted}`
  
  // Add role indicator
  if (message.role === 'assistant') {
    formatted = `🤖 ${formatted}`
  } else if (message.role === 'user') {
    formatted = `👤 ${formatted}`
  }
  
  return formatted
}

/**
 * Generate context prompt from current state
 */
export function generateContextPrompt(context: {
  projectType?: string
  currentFile?: string
  selectedCode?: string
  language?: string
}): string {
  let prompt = 'Context:\n'
  
  if (context.projectType) {
    prompt += `- Project Type: ${context.projectType}\n`
  }
  
  if (context.currentFile) {
    prompt += `- Current File: ${context.currentFile}\n`
  }
  
  if (context.language) {
    prompt += `- Language: ${context.language}\n`
  }
  
  if (context.selectedCode) {
    prompt += `\nSelected Code:\n\`\`\`${context.language || 'st'}\n${context.selectedCode}\n\`\`\`\n`
  }
  
  return prompt
}

/**
 * Validate AI response for safety
 */
export function validateAIResponse(response: string): { valid: boolean; reason?: string } {
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /system\s*\(/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /require\s*\(['"]child_process['"]\)/i,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(response)) {
      return {
        valid: false,
        reason: 'Response contains potentially dangerous code patterns'
      }
    }
  }
  
  // Check response length
  if (response.length > 50000) {
    return {
      valid: false,
      reason: 'Response is too long'
    }
  }
  
  return { valid: true }
}

/**
 * Create a streaming text processor
 */
export function createStreamProcessor(onChunk: (chunk: string) => void) {
  let buffer = ''
  
  return {
    process: (chunk: string) => {
      buffer += chunk
      
      // Process complete words
      const words = buffer.split(' ')
      if (words.length > 1) {
        const completeWords = words.slice(0, -1).join(' ') + ' '
        buffer = words[words.length - 1]
        onChunk(completeWords)
      }
    },
    
    flush: () => {
      if (buffer) {
        onChunk(buffer)
        buffer = ''
      }
    }
  }
}

/**
 * Convert natural language to ST code patterns
 */
export function nlToSTPatterns(description: string): string | null {
  const patterns: Record<string, string> = {
    'timer': 'TON(IN := Start, PT := T#5s)',
    'counter': 'CTU(CU := Count, R := Reset, PV := 100)',
    'motor control': 'IF Start AND NOT Stop THEN\n    Motor := TRUE;\nELSE\n    Motor := FALSE;\nEND_IF;',
    'emergency stop': 'IF E_Stop THEN\n    // Stop all outputs\n    Motor := FALSE;\n    Conveyor := FALSE;\n    Alarm := TRUE;\nEND_IF;',
    'state machine': 'CASE State OF\n    0: // Idle\n        IF Start THEN State := 1; END_IF;\n    1: // Running\n        IF Stop THEN State := 0; END_IF;\n    ELSE\n        State := 0;\nEND_CASE;',
  }
  
  const lowerDesc = description.toLowerCase()
  for (const [key, pattern] of Object.entries(patterns)) {
    if (lowerDesc.includes(key)) {
      return pattern
    }
  }
  
  return null
}

/**
 * Generate variable name from description
 */
export function generateVariableName(description: string): string {
  // Remove special characters and convert to PascalCase
  const words = description
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  
  return words.join('_')
}

/**
 * Estimate token count for API limits
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}