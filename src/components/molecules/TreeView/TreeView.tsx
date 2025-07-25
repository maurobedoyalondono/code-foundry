'use client'

import React from 'react'
import { TreeNode } from '@/components/atoms/TreeNode'
import { FileNode } from '@/types/project.types'
import styles from './TreeView.module.scss'

interface TreeViewProps {
  nodes: FileNode[]
  activeNodeId?: string
  onNodeSelect: (node: FileNode) => void
  onNodeToggle: (nodeId: string) => void
  expandedNodes: Set<string>
  searchQuery?: string
  level?: number
}

export const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  activeNodeId,
  onNodeSelect,
  onNodeToggle,
  expandedNodes,
  searchQuery = '',
  level = 0,
}) => {
  const filterNodes = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes

    return nodes.reduce<FileNode[]>((acc, node) => {
      const nodeMatches = node.name.toLowerCase().includes(query.toLowerCase())
      const filteredChildren = node.children ? filterNodes(node.children, query) : []

      if (nodeMatches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        })
      }

      return acc
    }, [])
  }

  const filteredNodes = filterNodes(nodes, searchQuery)

  return (
    <div className={styles.treeView}>
      {filteredNodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          isActive={activeNodeId === node.id}
          isExpanded={expandedNodes.has(node.id)}
          onSelect={onNodeSelect}
          onToggle={onNodeToggle}
          level={level}
        >
          {node.children && expandedNodes.has(node.id) && (
            <TreeView
              nodes={node.children}
              activeNodeId={activeNodeId}
              onNodeSelect={onNodeSelect}
              onNodeToggle={onNodeToggle}
              expandedNodes={expandedNodes}
              searchQuery={searchQuery}
              level={level + 1}
            />
          )}
        </TreeNode>
      ))}
    </div>
  )
}