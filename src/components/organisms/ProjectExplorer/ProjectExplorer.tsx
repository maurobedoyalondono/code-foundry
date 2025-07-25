'use client'

import React, { useState } from 'react'
import { TreeView } from '@/components/molecules/TreeView'
import { FileNode, Solution } from '@/types/project.types'
import styles from './ProjectExplorer.module.scss'

interface ProjectExplorerProps {
  solutions: Solution[]
  activeSolution?: string
  activeProject?: string
  activeFile?: string
  onFileSelect: (file: FileNode) => void
  onProjectCreate: () => void
  onSolutionCreate: () => void
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  solutions,
  activeSolution: _activeSolution,
  activeProject: _activeProject,
  activeFile,
  onFileSelect,
  onProjectCreate,
  onSolutionCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const convertToFileNodes = (solutions: Solution[]): FileNode[] => {
    return solutions.map(solution => ({
      id: solution.id,
      name: solution.name,
      type: 'solution' as const,
      path: `/solutions/${solution.name}`,
      icon: '📁',
      expanded: expandedNodes.has(solution.id),
      children: solution.projects.map(project => ({
        id: project.id,
        name: project.name,
        type: 'project' as const,
        path: `/solutions/${solution.name}/${project.name}`,
        icon: getVendorIcon(project.vendor),
        expanded: expandedNodes.has(project.id),
        metadata: { vendor: project.vendor },
        children: [
          {
            id: `${project.id}-programs`,
            name: 'Programs',
            type: 'folder' as const,
            path: `/solutions/${solution.name}/${project.name}/programs`,
            icon: '📄',
            expanded: expandedNodes.has(`${project.id}-programs`),
            children: project.programs.map(program => ({
              id: program.id,
              name: `${program.name}.st`,
              type: 'file' as const,
              path: `/solutions/${solution.name}/${project.name}/programs/${program.name}.st`,
              icon: '📝',
            })),
          },
          {
            id: `${project.id}-routines`,
            name: 'Routines',
            type: 'folder' as const,
            path: `/solutions/${solution.name}/${project.name}/routines`,
            icon: '📂',
            expanded: expandedNodes.has(`${project.id}-routines`),
            children: project.routines.map(routine => ({
              id: routine.id,
              name: `${routine.name}.st`,
              type: 'file' as const,
              path: `/solutions/${solution.name}/${project.name}/routines/${routine.name}.st`,
              icon: '⚙️',
            })),
          },
          {
            id: `${project.id}-data-types`,
            name: 'Data Types',
            type: 'folder' as const,
            path: `/solutions/${solution.name}/${project.name}/data-types`,
            icon: '🔷',
            expanded: expandedNodes.has(`${project.id}-data-types`),
            children: project.dataTypes.map(dataType => ({
              id: dataType.id,
              name: `${dataType.name}.udt`,
              type: 'file' as const,
              path: `/solutions/${solution.name}/${project.name}/data-types/${dataType.name}.udt`,
              icon: '📊',
            })),
          },
          {
            id: `${project.id}-tags`,
            name: 'Tags',
            type: 'folder' as const,
            path: `/solutions/${solution.name}/${project.name}/tags`,
            icon: '🏷️',
            expanded: expandedNodes.has(`${project.id}-tags`),
            children: [],
          },
          {
            id: `${project.id}-specs`,
            name: 'Specifications',
            type: 'folder' as const,
            path: `/solutions/${solution.name}/${project.name}/specs`,
            icon: '📋',
            expanded: expandedNodes.has(`${project.id}-specs`),
            children: project.specifications.map(spec => ({
              id: spec.id,
              name: `${spec.type}.md`,
              type: 'file' as const,
              path: `/solutions/${solution.name}/${project.name}/specs/${spec.type}.md`,
              icon: '📃',
            })),
          },
        ],
      })),
    }))
  }

  const getVendorIcon = (vendor: string): string => {
    switch (vendor) {
      case 'rockwell':
        return '🔴'
      case 'siemens':
        return '🔵'
      default:
        return '⚪'
    }
  }

  const handleNodeToggle = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const fileNodes = convertToFileNodes(solutions)

  return (
    <div className={styles.projectExplorer}>
      <div className={styles.projectExplorer__header}>
        <h3 className={styles.projectExplorer__title}>Explorer</h3>
        <div className={styles.projectExplorer__actions}>
          <button
            className={styles.projectExplorer__actionBtn}
            onClick={onSolutionCreate}
            title="New Solution"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className={styles.projectExplorer__actionBtn}
            onClick={onProjectCreate}
            title="New Project"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.projectExplorer__search}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.projectExplorer__searchInput}
        />
      </div>

      <div className={styles.projectExplorer__tree}>
        {fileNodes.length > 0 ? (
          <TreeView
            nodes={fileNodes}
            activeNodeId={activeFile}
            onNodeSelect={onFileSelect}
            onNodeToggle={handleNodeToggle}
            expandedNodes={expandedNodes}
            searchQuery={searchQuery}
          />
        ) : (
          <div className={styles.projectExplorer__empty}>
            <p>No solutions found</p>
            <button
              className={styles.projectExplorer__createBtn}
              onClick={onSolutionCreate}
            >
              Create New Solution
            </button>
          </div>
        )}
      </div>
    </div>
  )
}