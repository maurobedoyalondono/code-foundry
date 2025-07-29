import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface SaveSpecRequest {
  featureName: string
  filename: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveSpecRequest = await request.json()
    const { featureName, filename, content } = body

    // Validate inputs
    if (!featureName || !filename || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sanitize folder name
    const sanitizedFolderName = featureName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    // Create specs directory path
    const specsBasePath = '/home/negrito/src/projects/code-foundry/specs'
    const featurePath = path.join(specsBasePath, sanitizedFolderName)

    // Create directory if it doesn't exist
    await fs.mkdir(featurePath, { recursive: true })

    // Write file
    const filePath = path.join(featurePath, filename)
    await fs.writeFile(filePath, content, 'utf-8')

    return NextResponse.json({
      success: true,
      path: featurePath,
      file: filePath
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to save spec file',
        success: false
      },
      { status: 500 }
    )
  }
}