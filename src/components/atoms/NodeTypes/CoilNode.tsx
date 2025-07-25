'use client'

/* eslint-disable react/prop-types */
import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import styles from './NodeTypes.module.scss'

export interface CoilNodeData {
  label: string
  state: boolean
  normally_open?: boolean
}

export const CoilNode = memo<NodeProps<CoilNodeData>>(({ data, selected }) => {
  const isActive = data.state
  const symbol = data.normally_open === false ? '(/)' : '( )'

  return (
    <div className={`${styles.coil} ${selected ? styles['coil--selected'] : ''} ${isActive ? styles['coil--active'] : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.coil__handle}
      />
      
      <div className={styles.coil__symbol}>{symbol}</div>
      <div className={styles.coil__label}>{data.label}</div>
      
      <Handle
        type="source"
        position={Position.Right}
        className={styles.coil__handle}
      />
    </div>
  )
})

CoilNode.displayName = 'CoilNode'