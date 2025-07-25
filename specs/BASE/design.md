# Technical Design - Industrial Automation AI-First IDE

## Architecture Overview

### Frontend Architecture
Following the 7+1 Clean Architecture pattern from Museo corporate:

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components (atoms, molecules, organisms)
├── features/              # Feature-specific modules
├── shared/                # Shared utilities, types, constants
├── entities/              # Business entities and models
├── widgets/               # Complex UI widgets
├── pages/                 # Page components (if needed for specific logic)
├── styles/                # Global SCSS styles and design system
├── hooks/                 # Custom React hooks
├── services/              # API and external service integrations
├── store/                 # Zustand state management
├── lib/                   # Core libraries and configurations
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Data Models

### Core Entities

```typescript
// Solution entity
interface Solution {
  id: string;
  name: string;
  description?: string;
  projects: Project[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    author: string;
    version: string;
    tags: string[];
  };
}

// Project entity
interface Project {
  id: string;
  solutionId: string;
  name: string;
  vendor: 'rockwell' | 'siemens' | 'generic';
  vendorVersion?: string;
  programs: Program[];
  routines: Routine[];
  dataTypes: DataType[];
  tags: Tag[];
  specifications: Specification[];
  createdAt: Date;
  updatedAt: Date;
}

// Program entity
interface Program {
  id: string;
  projectId: string;
  name: string;
  type: 'main' | 'safety' | 'motion' | 'process';
  content: string; // ST code
  language: 'ST' | 'FBD' | 'LD' | 'SFC' | 'IL';
  routines: string[]; // routine IDs
  tags: string[]; // tag IDs
  metadata: {
    author: string;
    lastModified: Date;
    version: string;
    description?: string;
  };
}

// Routine entity
interface Routine {
  id: string;
  projectId: string;
  name: string;
  type: 'function' | 'function_block' | 'procedure';
  content: string; // ST code
  parameters: Parameter[];
  returnType?: string;
  local: Variable[];
  description?: string;
}

// Data Type entity
interface DataType {
  id: string;
  projectId: string;
  name: string;
  type: 'struct' | 'enum' | 'alias';
  definition: DataTypeDefinition;
  description?: string;
}

// Tag entity
interface Tag {
  id: string;
  projectId: string;
  name: string;
  dataType: string;
  scope: 'controller' | 'program' | 'local';
  address?: string; // Physical I/O address
  initial?: any;
  description?: string;
  attributes: {
    min?: number;
    max?: number;
    units?: string;
    alarmConfig?: AlarmConfig;
  };
}

// AI Context
interface AIContext {
  sessionId: string;
  projectContext: Project;
  currentFile?: string;
  selectedCode?: CodeSelection;
  conversationHistory: Message[];
  mode: 'conversation' | 'feature' | 'debug';
}

// Specification documents
interface Specification {
  id: string;
  projectId: string;
  type: 'idea' | 'user-stories' | 'design' | 'plan';
  content: string; // Markdown
  createdAt: Date;
  updatedAt: Date;
}
```

## Component Architecture

### Layout Components

```typescript
// src/components/templates/IDELayout/
interface IDELayoutProps {
  leftPanel: React.ReactNode;  // Project Explorer
  rightPanelUpper: React.ReactNode;  // Code/Diagram Editor
  rightPanelLower: React.ReactNode;  // AI Terminal
  onLayoutChange?: (layout: LayoutConfig) => void;
}

// src/components/organisms/ProjectExplorer/
interface ProjectExplorerProps {
  solutions: Solution[];
  activeSolution?: string;
  activeProject?: string;
  activeFile?: string;
  onFileSelect: (file: FileNode) => void;
  onProjectCreate: (project: Partial<Project>) => void;
  onSolutionCreate: (solution: Partial<Solution>) => void;
}

// src/components/organisms/CodeEditor/
interface CodeEditorProps {
  file: Program | Routine;
  language: 'ST' | 'FBD' | 'LD';
  vendor?: 'rockwell' | 'siemens' | 'generic';
  onChange: (content: string) => void;
  onSave: () => void;
  aiSuggestions?: CodeSuggestion[];
}

// src/components/organisms/DiagramViewer/
interface DiagramViewerProps {
  code: string;
  type: 'FBD' | 'LD' | 'FLOW';
  interactive: boolean;
  onElementClick?: (element: DiagramElement) => void;
  onDiagramChange?: (diagram: DiagramData) => void;
}

// src/components/organisms/AITerminal/
interface AITerminalProps {
  context: AIContext;
  onSendMessage: (message: string) => void;
  onModeChange: (mode: AIContext['mode']) => void;
  suggestions?: AISuggestion[];
}
```

## State Management (Zustand)

```typescript
// src/store/SolutionStore.ts
interface SolutionStore {
  solutions: Solution[];
  activeSolution: string | null;
  activeProject: string | null;
  activeFile: string | null;
  
  // Actions
  loadSolutions: () => Promise<void>;
  createSolution: (solution: Partial<Solution>) => Promise<Solution>;
  updateSolution: (id: string, updates: Partial<Solution>) => Promise<void>;
  deleteSolution: (id: string) => Promise<void>;
  setActiveSolution: (id: string) => void;
  setActiveProject: (id: string) => void;
  setActiveFile: (path: string) => void;
}

// src/store/EditorStore.ts
interface EditorStore {
  openFiles: Map<string, EditorTab>;
  activeTab: string | null;
  isDirty: Map<string, boolean>;
  
  // Actions
  openFile: (file: FileNode) => void;
  closeFile: (path: string) => void;
  saveFile: (path: string) => Promise<void>;
  updateFileContent: (path: string, content: string) => void;
  setActiveTab: (path: string) => void;
}

// src/store/AIStore.ts
interface AIStore {
  sessions: Map<string, AISession>;
  activeSession: string | null;
  claudeCodeReady: boolean;
  
  // Actions
  initializeAI: () => Promise<void>;
  createSession: (projectId: string) => AISession;
  sendMessage: (sessionId: string, message: string) => Promise<AIResponse>;
  updateContext: (sessionId: string, context: Partial<AIContext>) => void;
  clearHistory: (sessionId: string) => void;
}
```

## Services Architecture

```typescript
// src/services/FileSystemService.ts
interface FileSystemService {
  // Solution operations
  loadSolutions(): Promise<Solution[]>;
  createSolution(path: string, solution: Partial<Solution>): Promise<Solution>;
  
  // Project operations
  loadProject(projectPath: string): Promise<Project>;
  saveProject(project: Project): Promise<void>;
  
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  
  // Watch operations
  watchDirectory(path: string, callback: (event: FileEvent) => void): () => void;
}

// src/services/AIService.ts
interface AIService {
  // Claude Code SDK integration
  initialize(config: AIConfig): Promise<void>;
  
  // Code generation
  generateCode(prompt: string, context: AIContext): Promise<CodeGeneration>;
  modifyCode(code: string, instruction: string): Promise<CodeModification>;
  
  // Documentation
  generateDocumentation(code: string, type: DocType): Promise<string>;
  generateSpecs(idea: string): Promise<SpecificationSet>;
  
  // Analysis
  analyzeCode(code: string): Promise<CodeAnalysis>;
  suggestOptimizations(code: string): Promise<Optimization[]>;
}

// src/services/VendorService.ts
interface VendorService {
  // Import/Export
  importProject(file: File, vendor: string): Promise<Project>;
  exportProject(project: Project, format: string): Promise<Blob>;
  
  // Validation
  validateCode(code: string, vendor: string): ValidationResult;
  
  // Templates
  getTemplates(vendor: string): Template[];
  applyTemplate(template: Template, params: any): string;
}
```

## File System Structure

```
workspace/
├── .code-foundry/              # IDE configuration
│   ├── settings.json           # User settings
│   ├── workspaces.json         # Workspace layouts
│   └── ai-sessions/            # AI conversation history
├── solutions/
│   ├── demo-factory/           # Sample solution
│   │   ├── solution.json       # Solution metadata
│   │   ├── rockwell-plc/       # Rockwell project
│   │   │   ├── project.json    # Project configuration
│   │   │   ├── programs/
│   │   │   │   ├── main.st
│   │   │   │   └── safety.st
│   │   │   ├── routines/
│   │   │   │   ├── motor_control.st
│   │   │   │   └── conveyor_logic.st
│   │   │   ├── data-types/
│   │   │   │   ├── motor_data.udt
│   │   │   │   └── conveyor_data.udt
│   │   │   ├── tags/
│   │   │   │   └── tags.json
│   │   │   └── specs/
│   │   │       ├── idea.md
│   │   │       ├── user-stories.md
│   │   │       ├── design.md
│   │   │       └── plan.md
│   │   └── siemens-hmi/
│   │       └── [similar structure]
│   └── [other solutions]/
```

## SCSS Design System

```scss
// src/styles/abstracts/_variables.scss
// Industrial-themed color palette
$color-primary: #1976d2;        // Industrial blue
$color-primary-dark: #115293;
$color-primary-light: #4fc3f7;
$color-accent: #ff6f00;         // Safety orange
$color-success: #4caf50;        // Running/active
$color-warning: #ff9800;        // Warning/caution
$color-error: #f44336;          // Error/stop
$color-info: #2196f3;           // Information

// Surface colors
$color-surface: #1e1e1e;        // Dark theme default
$color-surface-elevated: #252526;
$color-background: #121212;

// Text colors
$color-text-primary: #ffffff;
$color-text-secondary: #cccccc;
$color-text-tertiary: #808080;

// Editor colors
$color-editor-bg: #1e1e1e;
$color-editor-line: #2d2d30;
$color-editor-selection: #264f78;
$color-editor-cursor: #aeafad;

// Syntax highlighting
$color-keyword: #569cd6;
$color-string: #ce9178;
$color-number: #b5cea8;
$color-comment: #6a9955;
$color-function: #dcdcaa;
$color-variable: #9cdcfe;
```

## Key Technical Decisions

### 1. Code Editor
- Use Monaco Editor (VS Code engine) for ST code editing
- Custom language definitions for IEC 61131-3 languages
- Real-time syntax validation using industrial standards

### 2. Diagram Generation
- ReactFlow for interactive diagram rendering
- Custom nodes for industrial components (motors, valves, sensors)
- SVG-based visualization for high-quality graphics

### 3. File System Integration
- Node.js File System API for local file operations
- File watchers for real-time synchronization
- JSON-based project metadata for fast loading

### 4. AI Integration
- Claude Code SDK for natural language processing
- Streaming responses for real-time feedback
- Context window management for large projects

### 5. State Management
- Zustand for global state (simple, TypeScript-friendly)
- Local component state for UI interactions
- Persistent storage for user preferences

### 6. Internationalization
- Next.js built-in i18n routing
- JSON-based translation files
- Context API for language switching

## Performance Considerations

1. **Code Splitting**
   - Lazy load diagram components
   - Dynamic imports for vendor-specific modules
   - Split AI features into separate chunks

2. **Optimization**
   - Virtual scrolling for large file lists
   - Debounced auto-save
   - Web Workers for syntax validation

3. **Caching**
   - Local storage for user preferences
   - IndexedDB for project metadata
   - Service Worker for offline capabilities

## Security Measures

1. **Code Validation**
   - Sanitize user inputs
   - Validate ST code before execution
   - Sandbox diagram interactions

2. **File System Access**
   - Restricted to workspace directory
   - No execution of arbitrary code
   - File type validation

3. **AI Integration**
   - Rate limiting for API calls
   - Context sanitization
   - No exposure of sensitive data