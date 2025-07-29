'use client'

import { useEffect, useState } from 'react'
import { IDELayout } from '@/components/templates/IDELayout'
import { ProjectExplorer } from '@/components/organisms/ProjectExplorer'
import { CodeEditor } from '@/components/organisms/CodeEditor'
import { DiagramViewer, createDemoDiagram } from '@/components/organisms/DiagramViewer'
import { AITerminal } from '@/components/organisms/AITerminal'
import { useSolutionStore, useEditorStore, useAIStore } from '@/store'
import { FileNode } from '@/types/project.types'
import { diagramGenerationService } from '@/services/DiagramGenerationService'

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'code' | 'diagram'>('code')
  const [currentDiagram, setCurrentDiagram] = useState(createDemoDiagram())
  const { 
    solutions, 
    activeSolution, 
    activeProject, 
    activeFile,
    loadSolutions,
    setActiveFile,
    createSolution,
  } = useSolutionStore()

  const { openTab } = useEditorStore()
  const { initializeAI } = useAIStore()

  // Load solutions on mount
  useEffect(() => {
    loadSolutions()
    initializeAI()
  }, [loadSolutions, initializeAI])

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file.path)
      
      // Find the content based on file type
      let content = '// File content'
      let language = 'text'
      
      if (file.name.endsWith('.st')) {
        language = 'st'
        // Get content from the appropriate source based on file path
        if (file.path.includes('MotorControl')) {
          const routine = solutions[0]?.projects?.[0]?.routines?.find(r => r.name === 'MotorControl')
          content = routine?.content || '// Motor control routine'
        } else if (file.path.includes('ConveyorLogic')) {
          const routine = solutions[0]?.projects?.[0]?.routines?.find(r => r.name === 'ConveyorLogic')
          content = routine?.content || '// Conveyor logic routine'
        } else if (file.path.includes('Main')) {
          const program = solutions[0]?.projects?.[0]?.programs?.find(p => p.name === 'Main')
          content = program?.content || '// Main program'
        } else if (file.path.includes('Safety')) {
          const program = solutions[0]?.projects?.[0]?.programs?.find(p => p.name === 'Safety')
          content = program?.content || '// Safety program'
        }
      }
      
      openTab({
        id: file.id,
        path: file.path,
        name: file.name,
        content,
        language,
      })
    }
  }

  const handleProjectCreate = () => {
    // TODO: Implement project creation dialog
    if (typeof globalThis.window !== 'undefined') {
      globalThis.alert('Project creation will be implemented in a future step')
    }
  }

  const handleSolutionCreate = async () => {
    if (typeof globalThis.window !== 'undefined') {
      const name = globalThis.prompt('Enter solution name:')
      if (name) {
        await createSolution(name)
      }
    }
  }


  const handleCodeInsertFromAI = (code: string) => {
    // Insert code at cursor position in active editor
    const activeTab = useEditorStore.getState().openTabs.find(
      tab => tab.id === useEditorStore.getState().activeTabId
    )
    if (activeTab) {
      // In a real implementation, this would insert at cursor position
      // For now, append to existing content
      useEditorStore.getState().updateTabContent(
        activeTab.id,
        activeTab.content + '\n\n' + code
      )
    }
  }

  return (
    <IDELayout
      leftPanel={
        <ProjectExplorer
          solutions={solutions}
          activeSolution={activeSolution || undefined}
          activeProject={activeProject || undefined}
          activeFile={activeFile || undefined}
          onFileSelect={handleFileSelect}
          onProjectCreate={handleProjectCreate}
          onSolutionCreate={handleSolutionCreate}
        />
      }
      rightPanelUpper={
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '8px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setViewMode('code')}
              style={{
                padding: '4px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: viewMode === 'code' ? '#2563eb' : 'white',
                color: viewMode === 'code' ? 'white' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              Code View
            </button>
            <button
              onClick={() => {
                setViewMode('diagram')
                // Generate diagram from current code
                const activeTab = useEditorStore.getState().openTabs.find(
                  tab => tab.id === useEditorStore.getState().activeTabId
                )
                if (activeTab && activeTab.language === 'st') {
                  const diagram = diagramGenerationService.generateDiagramFromST(activeTab.content)
                  setCurrentDiagram(diagram)
                }
              }}
              style={{
                padding: '4px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: viewMode === 'diagram' ? '#2563eb' : 'white',
                color: viewMode === 'diagram' ? 'white' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              Diagram View
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', width: '100%', display: 'flex' }}>
            {viewMode === 'code' ? (
              <CodeEditor />
            ) : (
              <DiagramViewer diagram={currentDiagram} />
            )}
          </div>
        </div>
      }
      rightPanelLower={
        <AITerminal 
          projectId={activeSolution || 'default'}
          onCodeInsert={handleCodeInsertFromAI}
        />
      }
    />
  )
}