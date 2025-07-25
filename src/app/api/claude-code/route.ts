import { NextRequest, NextResponse } from 'next/server'
import { query, type SDKMessage } from '@anthropic-ai/claude-code'

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
  messages: SDKMessage[]
  finalMessage?: string
  codeBlocks?: Array<{ language: string; code: string }>
  suggestions?: string[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaudeCodeRequest = await request.json()
    const { prompt, maxTurns = 5, mode = 'conversation', context } = body

    // Validate API key
    if (!globalThis.process?.env?.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Build contextual prompt
    let fullPrompt = buildContextualPrompt(prompt, mode, context)

    // Query Claude Code SDK
    const messages: SDKMessage[] = []
    const abortController = new globalThis.AbortController()

    for await (const message of query({
      prompt: fullPrompt,
      abortController,
      options: {
        maxTurns,
      },
    })) {
      messages.push(message)
    }

    // Process response
    const response = processResponse(messages)

    return NextResponse.json(response)

  } catch (error) {
    globalThis.console?.error('Claude Code SDK Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        messages: []
      },
      { status: 500 }
    )
  }
}

function buildContextualPrompt(
  userPrompt: string, 
  mode: string, 
  context?: ClaudeCodeRequest['context']
): string {
  let prompt = `You are an expert industrial automation engineer working with PLC programming and SCADA systems.

Project Context:
- Project Type: ${context?.projectType?.toUpperCase() || 'GENERIC'}
- Working Directory: ${context?.projectPath || 'Unknown'}
- Programming Language: Structured Text (IEC 61131-3)
- Mode: ${mode.toUpperCase()}`

  if (context?.currentFile) {
    prompt += `\n- Current File: ${context.currentFile}`
  }

  if (context?.selectedCode) {
    prompt += `\n- Selected Code:\n\`\`\`st\n${context.selectedCode}\n\`\`\``
  }

  // Mode-specific instructions
  switch (mode) {
    case 'feature':
      prompt += `\n\nYou are in FEATURE mode. The user wants you to create a complete industrial automation feature. Please provide:
1. Complete Structured Text (ST) code implementation
2. Comprehensive documentation
3. Test scenarios
4. Integration instructions
5. Safety considerations

Follow IEC 61131-3 standards and include proper error handling.`
      break

    case 'debug':
      prompt += `\n\nYou are in DEBUG mode. The user has an issue they need help resolving. Please:
1. Identify the likely cause of the issue
2. Provide a corrected version of the code if applicable
3. Explain what was wrong and why
4. Suggest prevention strategies for similar issues`
      break

    default:
      prompt += `\n\nYou are in CONVERSATION mode. Provide helpful, accurate information specific to industrial automation. When generating code, ensure it follows IEC 61131-3 standards and includes proper safety considerations.`
  }

  prompt += `\n\nUser Request: ${userPrompt}`

  return prompt
}

function processResponse(messages: SDKMessage[]): ClaudeCodeResponse {
  let finalMessage = ''
  const codeBlocks: Array<{ language: string; code: string }> = []
  const suggestions: string[] = []

  // Process all messages
  for (const message of messages) {
    // Handle different message types from Claude Code SDK
    if (message.type === 'assistant' && 'text' in message && message.text) {
      finalMessage += message.text + '\n'
    } else if (message.type === 'user' && 'text' in message && message.text) {
      // Skip user messages in final output
    } else if (message.type === 'result' && 'text' in message && message.text) {
      finalMessage += message.text + '\n'
    }
    
    // Extract code blocks from any message that has text
    const messageText = ('text' in message && typeof message.text === 'string') ? message.text : ''
    if (messageText) {
      const codeMatches = messageText.match(/```(\w+)?\n([\s\S]*?)```/g)
      if (codeMatches) {
        for (const match of codeMatches) {
          const [, language = 'text', code] = match.match(/```(\w+)?\n([\s\S]*?)```/) || []
          if (code) {
            codeBlocks.push({ language, code: code.trim() })
          }
        }
      }
      
      // Extract suggestions
      const suggestionMatches = messageText.match(/(?:suggestion|recommend)[s]?:?\s*([^\n]+)/gi)
      if (suggestionMatches) {
        suggestions.push(...suggestionMatches.map(s => s.replace(/(?:suggestion|recommend)[s]?:?\s*/i, '')))
      }
    }
  }

  return {
    messages,
    finalMessage: finalMessage.trim(),
    codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}