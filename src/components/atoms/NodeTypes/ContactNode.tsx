'use client'

/* eslint-disable react/prop-types */
import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import styles from './NodeTypes.module.scss'

export interface ContactNodeData {
  label: string
  state: boolean
  normally_closed?: boolean
}

export const ContactNode = memo<NodeProps<ContactNodeData>>(({ data, selected }) => {
  const isActive = data.state
  const symbol = data.normally_closed ? '-|/|-' : '-| |-'

  return (
    <div className={`${styles.contact} ${selected ? styles['contact--selected'] : ''} ${isActive ? styles['contact--active'] : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={styles.contact__handle}
      />
      
      <div className={styles.contact__symbol}>{symbol}</div>
      <div className={styles.contact__label}>{data.label}</div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles.contact__handle}
      />
    </div>
  )
})

ContactNode.displayName = 'ContactNode'