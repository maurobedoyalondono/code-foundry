export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

export function getFileName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1]
}

export function getDirectory(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

export function joinPath(...parts: string[]): string {
  return parts
    .filter(part => part)
    .join('/')
    .replace(/\/+/g, '/')
}

export function isValidFileName(name: string): boolean {
  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/
  return !invalidChars.test(name) && name.length > 0 && name.length < 256
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'st': 'text/x-structured-text',
    'ld': 'application/x-ladder-logic',
    'fbd': 'application/x-function-block',
    'sfc': 'application/x-sequential-function',
    'il': 'text/x-instruction-list',
    'udt': 'application/x-user-defined-type',
    'json': 'application/json',
    'md': 'text/markdown',
    'txt': 'text/plain',
  }
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

export function sortFileNodes<T extends { name: string; type: string }>(nodes: T[]): T[] {
  return [...nodes].sort((a, b) => {
    // Folders first
    if (a.type !== b.type) {
      if (a.type === 'folder' || a.type === 'solution' || a.type === 'project') return -1
      if (b.type === 'folder' || b.type === 'solution' || b.type === 'project') return 1
    }
    
    // Then alphabetically
    return a.name.localeCompare(b.name)
  })
}