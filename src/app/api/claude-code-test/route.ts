import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if we can import the SDK
    const sdk = await import('@anthropic-ai/claude-code')
    
    // Check environment
    const hasApiKey = !!globalThis.process?.env?.ANTHROPIC_API_KEY
    const apiKeyStart = globalThis.process?.env?.ANTHROPIC_API_KEY?.substring(0, 15)
    
    return NextResponse.json({
      success: true,
      hasApiKey,
      apiKeyStart,
      sdkLoaded: !!sdk,
      hasQuery: !!sdk.query,
      nodeVersion: globalThis.process?.version,
      cwd: globalThis.process?.cwd?.(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}