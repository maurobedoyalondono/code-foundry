'use client'

import React from 'react'
import { FileNode } from '@/types/project.types'
import styles from './TreeNode.module.scss'

interface TreeNodeProps {
  node: FileNode
  isActive: boolean
  isExpanded: boolean
  onSelect: (node: FileNode) => void
  onToggle: (nodeId: string) => void
  level: number
  children?: React.ReactNode
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  isActive,
  isExpanded,
  onSelect,
  onToggle,
  level,
  children,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type === 'file') {
      onSelect(node)
    } else {
      onToggle(node.id)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(node.id)
  }

  const hasChildren = node.children && node.children.length > 0

  return (
    <div className={styles.treeNode}>
      <div
        className={`${styles.treeNode__content} ${isActive ? styles['treeNode__content--active'] : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren && (
          <button
            className={`${styles.treeNode__toggle} ${isExpanded ? styles['treeNode__toggle--expanded'] : ''}`}
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <span className={styles.treeNode__spacer} />}
        
        <span className={styles.treeNode__icon}>{node.icon}</span>
        <span className={styles.treeNode__name}>{node.name}</span>
        
        {node.type === 'project' && node.metadata?.vendor && (
          <span className={styles.treeNode__badge}>
            {node.metadata.vendor}
          </span>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className={styles.treeNode__children}>
          {children}
        </div>
      )}
    </div>
  )
}