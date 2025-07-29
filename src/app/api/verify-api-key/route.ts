import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found in environment variables'
      })
    }

    // Try to initialize the client and make a simple request
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // Make a minimal test request
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: 'Hi'
      }]
    })

    return NextResponse.json({
      success: true,
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 15) + '...',
      testResponse: response.content[0].type === 'text' ? 'API call successful' : 'API call failed'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
      apiKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
      apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15) + '...' || 'N/A'
    })
  }
}