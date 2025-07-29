import { NextResponse } from 'next/server'

export async function GET() {
  const hasApiKey = !!globalThis.process?.env?.ANTHROPIC_API_KEY
  const apiKeyPrefix = globalThis.process?.env?.ANTHROPIC_API_KEY?.substring(0, 10) + '...'
  
  return NextResponse.json({
    hasApiKey,
    apiKeyPrefix: hasApiKey ? apiKeyPrefix : 'NOT SET',
    nodeEnv: globalThis.process?.env?.NODE_ENV,
    processExists: typeof globalThis.process !== 'undefined',
    envKeys: Object.keys(globalThis.process?.env || {}).filter(key => key.includes('ANTHROPIC'))
  })
}