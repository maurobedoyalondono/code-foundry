// Solution entity
export interface Solution {
  id: string
  name: string
  description?: string
  projects: Project[]
  createdAt: Date
  updatedAt: Date
  metadata: {
    author: string
    version: string
    tags: string[]
  }
}

// Project entity
export interface Project {
  id: string
  solutionId: string
  name: string
  vendor: 'rockwell' | 'siemens' | 'generic'
  vendorVersion?: string
  programs: Program[]
  routines: Routine[]
  dataTypes: DataType[]
  tags: Tag[]
  specifications: Specification[]
  createdAt: Date
  updatedAt: Date
}

// Program entity
export interface Program {
  id: string
  projectId: string
  name: string
  type: 'main' | 'safety' | 'motion' | 'process'
  content: string // ST code
  language: 'ST' | 'FBD' | 'LD' | 'SFC' | 'IL'
  routines: string[] // routine IDs
  tags: string[] // tag IDs
  metadata: {
    author: string
    lastModified: Date
    version: string
    description?: string
  }
}

// Routine entity
export interface Routine {
  id: string
  projectId: string
  name: string
  type: 'function' | 'function_block' | 'procedure'
  content: string // ST code
  parameters: Parameter[]
  returnType?: string
  local: Variable[]
  description?: string
}

// Parameter type
export interface Parameter {
  name: string
  dataType: string
  direction: 'input' | 'output' | 'inout'
  defaultValue?: unknown
  description?: string
}

// Variable type
export interface Variable {
  name: string
  dataType: string
  initialValue?: unknown
  description?: string
}

// Data Type entity
export interface DataType {
  id: string
  projectId: string
  name: string
  type: 'struct' | 'enum' | 'alias'
  definition: DataTypeDefinition
  description?: string
}

// Data type definition
export interface DataTypeDefinition {
  fields?: DataTypeField[] // for struct
  values?: string[] // for enum
  baseType?: string // for alias
}

export interface DataTypeField {
  name: string
  dataType: string
  description?: string
}

// Tag entity
export interface Tag {
  id: string
  projectId: string
  name: string
  dataType: string
  scope: 'controller' | 'program' | 'local'
  address?: string // Physical I/O address
  initial?: unknown
  description?: string
  attributes: {
    min?: number
    max?: number
    units?: string
    alarmConfig?: AlarmConfig
  }
}

// Alarm configuration
export interface AlarmConfig {
  enabled: boolean
  highHigh?: number
  high?: number
  low?: number
  lowLow?: number
  deadband?: number
}

// Specification documents
export interface Specification {
  id: string
  projectId: string
  type: 'idea' | 'user-stories' | 'design' | 'plan'
  content: string // Markdown
  createdAt: Date
  updatedAt: Date
}

// File node for tree view
export interface FileNode {
  id: string
  name: string
  type: 'solution' | 'project' | 'folder' | 'file'
  path: string
  children?: FileNode[]
  icon?: string
  expanded?: boolean
  metadata?: {
    vendor?: string
    [key: string]: unknown
  }
}