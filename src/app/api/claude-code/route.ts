import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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
  messages: Array<unknown>
  finalMessage?: string
  codeBlocks?: Array<{ language: string; code: string }>
  suggestions?: string[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaudeCodeRequest = await request.json()
    const { prompt, mode = 'conversation', context } = body

    // Validate API key
    const apiKey = globalThis.process?.env?.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Log API key info for debugging (only in development)
    if (globalThis.process?.env?.NODE_ENV === 'development') {
      globalThis.console?.log('API Key present:', !!apiKey)
      globalThis.console?.log('API Key length:', apiKey.length)
      globalThis.console?.log('API Key prefix:', apiKey.substring(0, 15) + '...')
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // Build contextual prompt
    const systemPrompt = buildSystemPrompt(mode, context)
    
    // Make API call to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract text content
    let finalMessage = ''
    const codeBlocks: Array<{ language: string; code: string }> = []
    
    for (const content of response.content) {
      if (content.type === 'text') {
        finalMessage += content.text
        
        // Extract code blocks
        const codeMatches = content.text.match(/```(\w+)?\n([\s\S]*?)```/g)
        if (codeMatches) {
          for (const match of codeMatches) {
            const [, language = 'text', code] = match.match(/```(\w+)?\n([\s\S]*?)```/) || []
            if (code) {
              codeBlocks.push({ language, code: code.trim() })
            }
          }
        }
      }
    }

    return NextResponse.json({
      messages: [],  // Empty array to avoid duplicate display
      finalMessage: finalMessage.trim(),
      codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
    })

  } catch (error) {
    globalThis.console?.error('Claude API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        messages: []
      },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(mode: string, context?: ClaudeCodeRequest['context']): string {
  let prompt = `You are an expert industrial automation engineer working with PLC programming and SCADA systems.

Project Context:
- Project Type: ${context?.projectType?.toUpperCase() || 'GENERIC'}
- Working Directory: /home/negrito/src/projects/code-foundry/workspace
- Programming Language: Structured Text (IEC 61131-3)
- Mode: ${mode.toUpperCase()}

You are working within a project that contains industrial automation solutions with Rockwell and Siemens PLC programs.
The workspace directory contains:
- solutions/ - Contains industrial automation solutions
  - demo-factory/ - A demo factory solution
    - conveyor-control/ - Conveyor control project
      - programs/ - Contains ST program files
        - Main.st - Main program file

IMPORTANT: When asked to modify or add code, focus on the Main.st file or create new .st files as needed.`

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
2. Variable declarations (VAR blocks)
3. Implementation logic
4. Comments explaining the code
5. Safety considerations if applicable

Follow IEC 61131-3 standards and industrial best practices.`
      break

    case 'debug':
      prompt += `\n\nYou are in DEBUG mode. Help the user debug their industrial automation code:
1. Identify the issue
2. Provide a corrected version
3. Explain what was wrong
4. Suggest prevention strategies`
      break

    default:
      prompt += `\n\nYou are in CONVERSATION mode. Provide helpful, accurate information about industrial automation programming. When generating code, ensure it follows IEC 61131-3 standards.`
  }

  return prompt
}