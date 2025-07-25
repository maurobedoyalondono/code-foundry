# Industrial Automation AI-First IDE

## Core Concept
A web-based IDE specifically designed for industrial automation programming that places AI at the center of the development workflow. The system enables programming entire factories through natural language interactions with AI, supporting SCADA/MES systems, PLCs, and industrial communication protocols.

## Key Requirements

### Technology Stack
- Frontend: Next.js 14+ with TypeScript
- Architecture: Clean Architecture with 7+1 folder structure (following Museo corporate pattern)
- Styling: SCSS only (NO Tailwind CSS)
- State Management: Zustand
- Internationalization: Multi-locale support (i18n)
- AI Integration: Claude Code SDK for code generation and modification
- File System: Local file system integration for project management

### UI Layout
1. **Left Panel - Project Explorer**
   - Three-tier hierarchy: Solutions > Projects > Vendors
   - Vendor-specific organization (Rockwell/Allen-Bradley, Siemens, etc.)
   - Project structure: Programs, Routines, Data Types, Tags, Specifications

2. **Right Panel - Dual-Mode Interface**
   - Upper Section: Code/Diagram Viewer
     - Structured Text (ST) editor with syntax highlighting
     - Visual diagram generation from ST code
     - Function Block Diagrams (FBD) and Ladder Logic visualization
   - Lower Section: AI Terminal
     - ChatGPT-style conversation interface
     - Natural language to code translation
     - New feature workflow with guided documentation

### Industrial Programming Support
- IEC 61131-3 Standards compliance
- Multi-vendor support (Rockwell, Siemens, Generic)
- Safety programming features
- Motion control and process control capabilities
- HMI integration support

### AI-Powered Features
- Intelligent code completion
- Real-time bug detection
- Code optimization suggestions
- Automated documentation generation
- Natural language to ST code conversion
- Feature development workflow automation

### File System Structure
```
workspace/
├── solutions/
│   ├── factory-line-1/
│   │   ├── rockwell-plc/
│   │   │   ├── programs/
│   │   │   ├── routines/
│   │   │   ├── data-types/
│   │   │   ├── tags/
│   │   │   └── specs/
│   │   │       ├── idea.md
│   │   │       ├── user-stories.md
│   │   │       ├── design.md
│   │   │       └── plan.md
│   │   └── siemens-hmi/
```

### Development Approach
- Manual file creation followed by npm install
- SCSS-based styling system (no Tailwind)
- Component structure following Museo patterns
- Hooks, services, and store organization
- Graphics and filesystem patterns from process-designer

## Questions for Clarification

1. **AI Integration Details**
   - Should we integrate with Claude Code SDK directly or create an abstraction layer?
   - What level of context should be provided to the AI (full project, current file, selected code)?
   - Should AI have write permissions by default or require user confirmation?

2. **Industrial Standards**
   - Which specific IEC 61131-3 languages should be prioritized (ST, FBD, LD, IL, SFC)?
   - Should we support vendor-specific extensions to the standards?
   - What level of simulation/testing capabilities are needed?

3. **File System Integration**
   - Should the IDE work with existing PLC project files (e.g., .ACD for Rockwell)?
   - How should version control (Git) be integrated?
   - Should we support import/export to vendor-specific formats?

4. **Security and Compliance**
   - What security measures are needed for industrial environments?
   - Should we implement role-based access control?
   - Are there specific compliance requirements (e.g., FDA 21 CFR Part 11)?

5. **Performance Requirements**
   - Expected project sizes (number of programs, routines, tags)?
   - Real-time collaboration features needed?
   - Offline mode support required?

## Initial Assumptions
- Focus on Structured Text (ST) as primary language with visual representations
- Local file system storage with potential for future cloud integration
- English as primary language with Spanish and German support
- Demo content will include basic motor control and conveyor examples
- AI will have full project context for intelligent suggestions