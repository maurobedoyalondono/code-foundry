import { NextResponse } from 'next/server'

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const apiKeyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...'
  
  return NextResponse.json({
    hasApiKey,
    apiKeyPrefix: hasApiKey ? apiKeyPrefix : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    processExists: typeof process !== 'undefined',
    envKeys: Object.keys(process.env).filter(key => key.includes('ANTHROPIC'))
  })
}